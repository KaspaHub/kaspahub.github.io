'use strict';

const validators = {
  invalidFormet: (query) => {
    if (query.length === 0) return true;
    if (query.length > 104) return true;
    if (/[^a-z0-9.:-]/.test(query)) return true;
    return false;
  },

  isDomainName: (query) => {
    const pattern = /^([a-z0-9-]+\.)+[a-z0-9]{2,}$/;
    if (!pattern.test(query)) return false;
    if (query.length < 3) return false;
    return true;
  },

  containsDots: (query) => query.includes("."),

  isKaspaAddress: (query) => query.startsWith('kaspa:') && query.length > 65 && query.length < 70,

  isKns: (query) => query.endsWith('.kas'),

  isAlphanumeric: (query) => /^[a-z0-9]+$/.test(query),

  isKrc20Token: (query) => query.length >= 1 && query.length <= 6,

  isTxOrBlock: (query) => query.length === 64,

  isEvmAddress: (query) => query.startsWith('0x') && query.length === 42
};

function setLoading(value) {

    if (value) {
        results.innerHTML = '<div id="fetching" class="loading-2"><div class="loading-dots dot-1"></div><div class="loading-dots dot-2"></div><div class="loading-dots dot-3"></div></div>';
    } else {
        results.innerHTML = '';
        console.log("[setLoading] It's " + value + "!");
    }

}

function setStatus(value) {
  if (value === false) {
    msg.classList.add('hidden');
    msg.innerHTML = '';
  } else if (typeof value === "string") {
    msg.innerHTML = `<div class="error">${value}</div>`;
    msg.classList.remove('hidden');
  }
}



async function loadReviews(searchQuery) {
    if (!/^([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,}$/.test(searchQuery)) {
        document.getElementById("results").innerHTML = `<span style="margin: 10px;">Invalid domain. Use example.com</span>`;
        return;
    }
    document.getElementById("results").innerHTML = `<div class="fade-in" id="loading"><span class="spinner"></span><span>Fetching data…</span></div>`;
    async function loadReviewerData(url, name) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (typeof data !== "object" || data === null || Array.isArray(data)) {
                console.error(`Reviewer ${name} JSON is invalid (should be an object map)`);
                return null;
            }
            return data;
        } catch (err) {
            console.error(`Failed to load reviewer ${name}:`, err);
            return null;
        }
    }
    const allResults = [];
    for (let reviewer of [{ name: "Kaspa Hub", url: "https://kaspahub.github.io/directory/reviews.json" }, { name: "test 1", url: "https://kaspahub.github.io/directory/reviews-test.json" }]) {
        const data = await loadReviewerData(reviewer.url, reviewer.name);
        let entry = data ? data[searchQuery] : undefined;
        if (entry === undefined) {
            allResults.push({ name: reviewer.name, review: null, comment: null });
            continue;
        }
        let rating = null, comment = null;
        if (Array.isArray(entry)) {
            rating = entry[0];
            comment = entry[1] ?? null;
        } else {
            rating = entry;
        }
        rating = Math.min(5, Math.max(0, rating));
        allResults.push({ name: reviewer.name, review: rating, comment });
    }
    const validReviews = allResults.filter(r => r.review !== null);
    let average = "N/A";
    if (validReviews.length > 0) {
        const rawAvg = validReviews.reduce((acc, r) => acc + r.review, 0) / validReviews.length;
        average = parseFloat(rawAvg).toFixed(1);
    }
    function renderStars(rating) {
        if (rating === null || rating === undefined) return `<span class="neutral">N/A</span>`;
        const clamped = Math.min(5, Math.max(0, rating));
        let stars = "";
        for (let i = 1; i <= 5; i++) {
            const cls = i <= clamped ? "" : "empty";
            stars += `<span class="star ${cls}"></span>`;
        }
        return stars;
    }
    let html = `<h2 style="margin: 30px; text-align:center;">${searchQuery} — <span>${average}</span></h2>`;
    html += `<table cellspacing="0" cellpadding="6" style="margin-top:10px;">
        <tr><th>Source</th><th></th><th>Rating</th></tr>`;
    for (let r of allResults) {
        let infoCell = r.comment ? `<span class="info-bubble" title="${r.comment}">💬</span>` : "";
        let status = renderStars(r.review);
        html += `<tr><td>${r.name}</td><td style="text-align:center;">${infoCell}</td><td>${status}</td></tr>`;
    }
    html += `</table>`;
    document.getElementById("results").innerHTML = html;
}

// ADDRESS
async function loadAddress(searchQuery) {
  'use strict';
  const results = document.getElementById("results");
  if (!results) return;
  const addr = String(searchQuery || "").trim();
  if (!addr.startsWith("kaspa:")) {
    results.innerHTML = '<div class="muted">Please enter a valid Kaspa address starting with \'kaspa:\'.</div>';
    return;
  }
  const API_BASE = "https://api.kaspa.org";
  const NAMES_API = "https://api.kaspa.org/addresses/names";
  const KRC_API_BASE = "https://api.kasplex.org";
  const KNS_API_BASE = "https://api.knsdomains.org/mainnet/api/v1";
  const TRANSACTION_BASE = "/explorer/?query=";
  const WALLET_BASE = "/explorer/?query=";
  const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
  let currentAddr = addr;
  let kasPrice = null;
  let tokens = null;
  let domains = null;
  let txOffset = 0;
  const txLimit = 20;
  function withSeparators(numStr) {
    const s = String(numStr ?? "").replace(/^0+(?=\d)/, "");
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function formatKas(amountSomes) {
    if (amountSomes == null) return "-";
    const n = Number(amountSomes) / 1e8;
    const fixed = n.toFixed(8);
    const [int, dec] = fixed.split('.');
    return withSeparators(int) + '.' + (dec || '00000000') + " KAS";
  }
  function formatUsd(x) {
    if (x == null || !isFinite(x)) return "-";
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(x);
  }
  function ageFromMs(ms) {
    const t = Number(ms);
    if (!isFinite(t)) return "-";
    const diff = Date.now() - t;
    if (diff < 0) return "-";
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }
  function shortenMiddle(str, head = 12, tail = 10) {
    const s = String(str ?? "");
    if (s.length <= head + tail + 3) return s;
    return s.slice(0, head) + "..." + s.slice(-tail);
  }
  function shortenHash(hash) {
    const h = String(hash ?? "");
    return h.length > 16 ? h.slice(0, 14) + "..." : h;
  }
  function walletUrl(addr) {
    const a = String(addr ?? "").trim();
    return a ? WALLET_BASE + a : "#";
  }
  function transactionUrl(hash) {
    const h = String(hash ?? "").trim();
    return h ? TRANSACTION_BASE + h : "#";
  }
  function linkAddress(addr, label) {
    const a = String(addr ?? "").trim();
    const text = escHtml(label != null ? label : a);
    if (!a) return "-";
    return `<a class="explorerLink" href="${walletUrl(a)}">${text}</a>`;
  }
  function linkTx(hash, label) {
    const h = String(hash ?? "").trim();
    const text = escHtml(label != null ? label : h);
    if (!h) return "-";
    return `<a class="explorerLink" href="${transactionUrl(h)}">${text}</a>`;
  }
  async function fetchKasPrice() {
    const res = await fetch(`${COINGECKO_BASE}/simple/price?ids=kaspa&vs_currencies=usd`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json?.kaspa?.usd ?? null;
  }
  async function fetchBalance(addr) {
    const res = await fetch(`${API_BASE}/addresses/${addr}/balance`);
    if (res.status === 404) return 0;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json?.balance ?? 0;
  }
  async function fetchTxCount(addr) {
    const res = await fetch(`${API_BASE}/addresses/${addr}/transactions-count`);
    if (res.status === 404) return 0;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json?.total ?? 0;
  }
  async function fetchAddressLabel(addr) {
    const res = await fetch(NAMES_API);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const match = data.find(item => item.address === addr);
    return match?.name || null;
  }
  async function fetchTransactions(addr, offset, limit) {
    const url = `${API_BASE}/addresses/${addr}/full-transactions?offset=${offset}&limit=${limit}&resolve_previous_outpoints=light`;
    const res = await fetch(url);
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  }
  async function fetchAllTokens(addr) {
    let all = [];
    let start = '';
    const seen = new Set();
    do {
      const param = start ? `?start=${start}` : '';
      const url = `${KRC_API_BASE}/v1/krc20/address/${addr}/tokenlist${param}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.message !== 'successful') throw new Error(json.message || 'Failed');
      const newResult = json.result || [];
      let isNew = false;
      for (const t of newResult) {
        if (!seen.has(t.tick)) {
          seen.add(t.tick);
          all.push(t);
          isNew = true;
        }
      }
      start = json.next || '';
      if (!isNew && newResult.length > 0) break;
    } while (start);
    return all;
  }
  async function fetchAllDomains(addr) {
    let all = [];
    let page = 1;
    const pageSize = 100;
    while (true) {
      const url = `${KNS_API_BASE}/assets?owner=${addr}&page=${page}&pageSize=${pageSize}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      const assets = json.data.assets || [];
      all.push(...assets.filter(a => a.isDomain));
      const pagination = json.data.pagination || {};
      if (page >= pagination.totalPages) break;
      page++;
    }
    return all;
  }
  function getNetChange(tx, addr) {
    let net = 0n;
    if (Array.isArray(tx.outputs)) {
      for (const out of tx.outputs) {
        if (out.script_public_key_address === addr) {
          net += BigInt(out.amount || 0);
        }
      }
    }
    if (Array.isArray(tx.inputs)) {
      for (const inp of tx.inputs) {
        const amt = inp.previous_outpoint_amount || 0;
        if (inp.previous_outpoint_address === addr) {
          net -= BigInt(amt);
        }
      }
    }
    return net;
  }
  function getFromTo(tx, addr, net) {
    let from = [];
    let to = [];
    if (Array.isArray(tx.inputs)) {
      tx.inputs.forEach(inp => {
        const inpAddr = inp.previous_outpoint_address;
        if (inpAddr && !from.includes(inpAddr)) {
          from.push(inpAddr);
        }
      });
    }
    if (Array.isArray(tx.outputs)) {
      tx.outputs.forEach(out => {
        const outAddr = out.script_public_key_address;
        if (outAddr && !to.includes(outAddr)) {
          to.push(outAddr);
        }
      });
    }
    const type = tx.inputs && tx.inputs.length === 0 ? "coinbase" : "transfer";
    let fromStr, toStr;
    if (net > 0n) {
      from = from.filter(a => a !== addr);
      fromStr = from.length > 1 ? "Multiple" : (from.length === 1 ? from[0] : (from.length === 0 && tx.inputs?.length > 0 ? "Unresolved inputs" : (type === "coinbase" ? "Block reward" : addr)));
      toStr = addr;
    } else if (net < 0n) {
      fromStr = addr;
      to = to.filter(a => a !== addr);
      toStr = to.length > 1 ? "Multiple" : (to.length === 1 ? to[0] : (to.length === 0 ? addr : "-"));
    } else {
      fromStr = addr;
      toStr = addr;
    }
    return { from: fromStr, to: toStr };
  }
  function formatAmount(net) {
    const n = Number(net) / 1e8;
    const sign = n > 0 ? "+" : "";
    const color = n > 0 ? "color:#2ee59d" : (n < 0 ? "color:#ff6b6b" : "");
    return `<span style="${color}">${sign}${n.toFixed(8)} KAS</span>`;
  }
  function formatTokenAmount(amount, dec) {
    if (!amount) return "0";
    const n = BigInt(amount);
    const decimals = Number(dec) || 0;
    const div = 10n ** BigInt(decimals);
    const int = n / div;
    let frac = ((n % div).toString()).padStart(decimals, '0').replace(/0+$/, '');
    if (frac) frac = '.' + frac;
    return withSeparators(int.toString()) + frac;
  }

  function renderTransactions(txs, addr) {
    if (!txs.length) {
      return `<tr><td colspan="5" class="muted">No transactions found.</td></tr>`;
    }
    return txs.map(tx => {
      const hash = String(tx.transaction_id || "-");
      const age = tx.block_time ? formatDate(new Date(Number(tx.block_time))) : "-";
      const net = getNetChange(tx, addr);
      const { from, to } = getFromTo(tx, addr, net);
      const amt = formatAmount(net);
      const shortHash = shortenHash(hash);
      const shortFrom = shortenMiddle(from, 12, 7);
      const shortTo = shortenMiddle(to, 12, 7);
      const fromHtml = (typeof from === 'string' && from.startsWith('kaspa:') && from !== addr) ? linkAddress(from, shortFrom) : `<span class="muted">${escHtml(shortFrom)}</span>`;
      const toHtml = (typeof to === 'string' && to.startsWith('kaspa:') && to !== addr) ? linkAddress(to, shortTo) : `<span class="muted">${escHtml(shortTo)}</span>`;
      return `
        <tr>
          <td>${linkTx(hash, shortHash)}</td>
          <td>${age}</td>
          <td>${fromHtml}</td>
          <td>${toHtml}</td>
          <td class="right">${amt}</td>
        </tr>
      `;
    }).join("");
  }
  function renderTokens(toks) {
    if (!toks.length) {
      return `<tr><td colspan="4" class="muted">No tokens found.</td></tr>`;
    }
    return toks.map(t => {
      const bal = formatTokenAmount(t.balance, t.dec);
      const lock = formatTokenAmount(t.locked, t.dec);
      const tick = escHtml(t.tick);
      const tokenUrl = `/krc20/?q=${t.tick}`;
      return `
        <tr>
          <td><a class="explorerLink" href="${tokenUrl}">${tick}</a></td>
          <td>${bal}</td>
          <td>${lock}</td>
          <td>${escHtml(t.dec)}</td>
        </tr>
      `;
    }).join("");
  }
  function renderDomains(doms) {
    if (!doms.length) {
      return `<tr><td colspan="4" class="muted">No domains found.</td></tr>`;
    }
    return doms.map(d => {
      const name = escHtml(d.asset);
      const created = d.creationBlockTime ? formatDate(new Date(d.creationBlockTime)) : "-";
      const status = escHtml(d.status);
      const shortTx = shortenHash(d.transactionId);
      return `
        <tr>
          <td>${name}</td>
          <td>${created}</td>
          <td>${status}</td>
          <td>${linkTx(d.transactionId, shortTx)}</td>
        </tr>
      `;
    }).join("");
  }
  try {
    kasPrice = await fetchKasPrice();
  } catch {}
  let balanceSomes = 0;
  try {
    balanceSomes = await fetchBalance(addr);
  } catch {}
  let txCountVal = 0;
  try {
    txCountVal = await fetchTxCount(addr);
  } catch {}
  let label = "-";
  try {
    label = await fetchAddressLabel(addr) || "-";
  } catch {}
  let txs = [];
  try {
    txs = await fetchTransactions(addr, txOffset, txLimit + 1);
  } catch {}
  const hasNext = txs.length > txLimit;
  if (hasNext) txs = txs.slice(0, txLimit);
  let firstSeenStr = "-";
  let lastSeenStr = "-";
  if (txs.length > 0) {
    const times = txs.map(t => Number(t.block_time)).filter(isFinite).sort((a, b) => a - b);
    if (times.length > 0) {
      firstSeenStr = ageFromMs(times[0]) + " ago";
      lastSeenStr = ageFromMs(times[times.length - 1]) + " ago";
    }
  }
  const balanceKasStr = formatKas(balanceSomes);
  const balanceUsdStr = kasPrice != null ? formatUsd((balanceSomes / 1e8) * kasPrice) : "-";
  const txCountStr = withSeparators(txCountVal);
  const labelStr = label;
  const txRowsHtml = renderTransactions(txs, addr);
  const prevDisabled = txOffset > 0 ? '' : 'disabled';
  const nextDisabled = hasNext ? '' : 'disabled';
  const txCursorStr = (txOffset > 0 || hasNext) ? `Page offset: ${txOffset}` : "";
  const html = `
    <div class="grid-1" aria-label="Summary">
      <div class="theme-1">
        <h3>Balance</h3>
        <div class="big" id="balanceKas">${balanceKasStr}</div>
        <div class="muted" id="balanceUsd">${balanceUsdStr}</div>
      </div>
      <div class="theme-1">
        <h3>Overview</h3>
        <div class="rows">
          <div class="row"><div class="k">Label</div><div class="v" id="label">${labelStr}</div></div>
          <div class="row"><div class="k">Transactions</div><div class="v" id="txCount">${txCountStr}</div></div>
          <div class="row"><div class="k">First transaction</div><div class="v" id="firstSeen">${firstSeenStr}</div></div>
          <div class="row"><div class="k">Last transaction</div><div class="v" id="lastSeen">${lastSeenStr}</div></div>
        </div>
      </div>
    </div>
    <div class="tabs" role="tablist" aria-label="Wallet tabs">
      <button class="tab active" data-tab="tabTransactions">Transactions</button>
      <button class="tab" data-tab="tabKRC20">Tokens</button>
      <button class="tab" data-tab="tabKNS">Domains</button>
    </div>
    <div id="tabTransactions" class="tabPanel active" aria-label="Transactions panel">
      <div class="theme-1" style="border-radius: 0px 20px 20px 20px;">
        <h3>Transactions</h3>
        <div id="txLoading" class="muted loading hidden"><span class="spinner"></span><span>Loading…</span></div>
        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                <th>TxID</th>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody id="txRows">
              ${txRowsHtml}
            </tbody>
          </table>
        </div>
        <div class="miniBtns">
          <button class="btn" id="prevTx" ${prevDisabled}>Prev</button>
          <button class="btn" id="nextTx" ${nextDisabled}>Next</button>
          <span class="muted" style="margin: auto 0;" id="txCursor">${txCursorStr}</span>
        </div>
      </div>
    </div>
    <div id="tabKRC20" class="tabPanel" aria-label="KRC20 Tokens panel">
      <div class="theme-1" style="border-radius: 0px 20px 20px 20px;">
        <h3>KRC20 Tokens</h3>
        <div id="tokenLoading" class="muted loading hidden"><span class="spinner"></span><span>Loading…</span></div>
        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Balance</th>
                <th>Locked</th>
                <th>Decimals</th>
              </tr>
            </thead>
            <tbody id="tokenRows">
              <tr><td colspan="4" class="muted">-</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div id="tabKNS" class="tabPanel" aria-label="KNS Domains panel">
      <div class="theme-1" style="border-radius: 0px 20px 20px 20px;">
        <h3>KNS Domains</h3>
        <div id="domainLoading" class="muted loading hidden"><span class="spinner"></span><span>Loading…</span></div>
        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Mint date</th>
                <th>Status</th>
                <th>TxID</th>
              </tr>
            </thead>
            <tbody id="domainRows">
              <tr><td colspan="4" class="muted">-</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  results.innerHTML = html;
  const tabs = results.querySelectorAll('.tabs .tab');
  const tabPanels = results.querySelectorAll('.tabPanel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      tabPanels.forEach(p => p.classList.remove('active'));
      document.getElementById(tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'tabKRC20') {
        if (tokens === null) {
          loadTokens();
        }
      } else if (tab.dataset.tab === 'tabKNS') {
        if (domains === null) {
          loadDomains();
        }
      }
    });
  });
  document.getElementById("prevTx").addEventListener("click", () => {
    if (txOffset > 0) {
      txOffset -= txLimit;
      loadTransactions(txOffset);
    }
  });
  document.getElementById("nextTx").addEventListener("click", () => {
    txOffset += txLimit;
    loadTransactions(txOffset);
  });
  async function loadTransactions(offset) {
    const txLoading = document.getElementById("txLoading");
    txLoading.classList.remove("hidden");
    let txs = [];
    let hasMore = false;
    try {
      txs = await fetchTransactions(currentAddr, offset, txLimit + 1);
      hasMore = txs.length > txLimit;
      if (hasMore) txs.pop();
      document.getElementById("txRows").innerHTML = renderTransactions(txs, currentAddr);
      setTxPaging(offset > 0, hasMore);
    } catch {
      document.getElementById("txRows").innerHTML = `<tr><td colspan="5" class="muted">Failed to load transactions.</td></tr>`;
      setTxPaging(false, false);
    } finally {
      txLoading.classList.add("hidden");
    }
  }
  function setTxPaging(hasPrev, hasNext) {
    document.getElementById("prevTx").disabled = !hasPrev;
    document.getElementById("nextTx").disabled = !hasNext;
    document.getElementById("txCursor").textContent = (hasPrev || hasNext) ? `Page offset: ${txOffset}` : "";
  }
  async function loadTokens() {
    const tokenLoading = document.getElementById("tokenLoading");
    tokenLoading.classList.remove("hidden");
    try {
      tokens = await fetchAllTokens(currentAddr);
      tokens.sort((a, b) => {
        const diff = BigInt(b.balance) - BigInt(a.balance);
        if (diff > 0n) return 1;
        if (diff < 0n) return -1;
        return 0;
      });
      document.getElementById("tokenRows").innerHTML = renderTokens(tokens);
    } catch {
      document.getElementById("tokenRows").innerHTML = `<tr><td colspan="4" class="muted">Failed to load tokens.</td></tr>`;
    } finally {
      tokenLoading.classList.add("hidden");
    }
  }
  async function loadDomains() {
    const domainLoading = document.getElementById("domainLoading");
    domainLoading.classList.remove("hidden");
    try {
      domains = await fetchAllDomains(currentAddr);
      document.getElementById("domainRows").innerHTML = renderDomains(domains);
    } catch {
      document.getElementById("domainRows").innerHTML = `<tr><td colspan="4" class="muted">Failed to load domains.</td></tr>`;
    } finally {
      domainLoading.classList.add("hidden");
    }
  }
}