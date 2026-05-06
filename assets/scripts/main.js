'use strict';

const themeCheck = document.getElementById('themeCheck');

let THEME = document.documentElement.id;

if (THEME === "dark") {
  themeCheck.checked = true;
} else {
  themeCheck.checked = false;
}


let CURRENCY = localStorage.getItem("currency") || "USD";
const PRICEAPI = localStorage.getItem("priceApi") || "CG";
const RELAY = localStorage.getItem("relay") || "Damus";
let TESTING = false;

const exchangeRates = {
  AED: 3.6725,
  CNY: 6.90705,
  EUR: 0.860845,
  GBP: 0.744962,
  RUB: 78.25,
  USD: 1,
  ZAR: 16.3375
};

const MAXSUPPLY = 28704026601;
let CIRCSUPPLY = 27416713166;

let KASPRICE = "$0.035";
let USDRATE = 1;

let KASVALUE = getCache?.("kaspa_price_usd") ?? null;
let kasPricePromise = null;

async function getKaspaValue() {
  if (KASVALUE !== null) return KASVALUE;

  if (!kasPricePromise) {
    kasPricePromise = (async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd");
        const data = await res.json();
        KASVALUE = data?.kaspa?.usd;

        if (res.ok && Number.isFinite(KASVALUE)) {
          setCache("kaspa_price_usd", KASVALUE);
          console.log("%c[API] %s", "color: #9980FF;", KASVALUE);
        } else {
          KASVALUE = 0.034;
        }
      } catch (err) {
        console.log("Kaspa price fetch failed, using fallback:", err.message || err);
        KASVALUE = 0.033;
      }
      kasPricePromise = null;
      return KASVALUE;
    })();
  }
  return kasPricePromise;
}

function getCache(key) {

  const CACHE_TIME = 7 * 60 * 1000;

  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const parsed = JSON.parse(cached);

  if (Date.now() - parsed.time > CACHE_TIME) return null;

  return parsed.value;
}

function setCache(key, value) {
  localStorage.setItem(
    key,
    JSON.stringify({
      value,
      time: Date.now()
    })
  );
}

async function updateKasValue() {
  const cacheKey = "kaspa_price_usd";

  const cached = getCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd");
    if (!res.ok) return;

    const price = (await res.json())?.kaspa?.usd;

    if (Number.isFinite(price)) {
      setCache(cacheKey, price);
      console.log("%c[updateKasValue API] %s", "color: #9980FF;", price);
      return price;
    }
  } catch (err) {
    console.log("Kaspa price fetch failed:", err.message || err);
  }

}

async function getExchangeRate(userCurrency = CURRENCY) {

  if (userCurrency === "USD") return 1;

  const cacheKey = `kaspa_rate_${userCurrency}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return cached;
  }

  const fallbackRate = exchangeRates[userCurrency] || 1;

  userCurrency = userCurrency.toLowerCase();

  (async () => {
    try {
      const res = await fetch(`https://hexarate.paikama.co/api/rates/usd/${userCurrency}/latest`);
      if (!res.ok) throw new Error("API fetch failed");

      const data = await res.json();
      const rate = data?.data?.mid;

      if (!rate) throw new Error("Invalid rate");

      setCache(cacheKey, rate);
      console.log("%c[getExchangeRate API] %s", "color: #9980FF;", rate);
    } catch (err) {
      console.warn(`Background fetch failed for ${userCurrency} (will retry next call):`, err);
    }
  })();

  return fallbackRate;
}

const currencySymbols = {
  AED: "د.إ",
  CNY: "¥",
  EUR: "€",
  GBP: "£",
  RUB: "₽",
  USD: "$",
  ZAR: "R",
};

async function formatPrice(value = KASVALUE, toCurrency = "USD", amount = 1, decimals = 3) {
  if (!isFinite(value) || !isFinite(amount)) return;

  const totalValue = value * amount;
  const converted = totalValue * USDRATE;

  const symbol = currencySymbols[toCurrency] || toCurrency;

  const formatted = Number(converted.toFixed(decimals)).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return symbol + formatted;
}

async function formatShortPrice(value = KASVALUE, toCurrency = "USD", amount = 1) {
  if (!isFinite(value) || !isFinite(amount)) return;

  const totalValue = value * amount;
  const converted = totalValue * USDRATE;

  const symbol = currencySymbols[toCurrency] || toCurrency;

  if (converted >= 1000000000000) return symbol + (converted / 1000000000000).toFixed(2) + 'T';
  if (converted >= 1000000000) return symbol + (converted / 1000000000).toFixed(2) + 'B';
  if (converted >= 1000000) return symbol + (converted / 1000000).toFixed(2) + 'M';
  if (converted >= 1000) return symbol + (converted / 1000).toFixed(1) + 'K';
  
  return symbol + Number(converted.toFixed(2)).toLocaleString("en-US");
}

function formatKas(net, type = 1, wrap = false) {
  const n = Number(net) / 1e8;
  let result;

  if (type === 1) {
    result = n.toLocaleString("en-US", {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    });

  } else if (type === 2) {
    const absN = Math.abs(n);

    if (absN >= 1e12) result = (n / 1e12).toFixed(2) + 'T';
    else if (absN >= 1e9) result = (n / 1e9).toFixed(2) + 'B';
    else if (absN >= 1e6) result = (n / 1e6).toFixed(2) + 'M';
    else if (absN >= 1e3) result = (n / 1e3).toFixed(1) + 'K';
    else result = n;

  } else if (type === 3) {
    const absN = Math.abs(n);
    let decimals;

    if (absN >= 1_000_000) decimals = 2;
    else if (absN >= 10_000) decimals = 4;
    else if (absN >= 1_000) decimals = 5;
    else if (absN >= 100) decimals = 6;
    else if (absN >= 10) decimals = 7;
    else decimals = 8;

    result = n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  } else {
    result = String(n);
  }

  if (wrap) {

    let sign = "";
    let color = "";

      sign = n > 0 ? "+" : "";
      color = n > 0
        ? ' style="color:#2ee59d"'
        : (n < 0 ? ' style="color:#ff6b6b"' : "");

    return `<span${color}>${sign}${result} KAS</span>`;

  } else {
    return `${result} KAS`;
  }

}

async function setPriceTag() {
  KASPRICE = await formatPrice(KASVALUE, CURRENCY);
  document.querySelector("#priceTag").textContent = KASPRICE;
}

// function initServiceWorker() {
//     if (!('serviceWorker' in navigator)) {
//         console.log('%c[Main] Service workers are not supported in this browser.', 'color: #EC6A5E;');
//         return;
//     }

//     if (navigator.serviceWorker.controller) {
//         console.log('%c[Main] A service worker is already controlling this page.', 'color: #61C554;');
//     }

//     navigator.serviceWorker.register('/sw.js')
//         .then(function (registration) {
//             console.log('%c[Main] Service worker registered successfully.', 'color: #61C554;');
//         })
//         .catch(function (error) {
//             console.log('%c[Main] Service worker registration failed: ' + error, 'color: #EC6A5E;');
//         });

//     window.addEventListener('online', networkChange);
//     window.addEventListener('offline', networkChange);
// }

// function networkChange(event) {
//     if (navigator.onLine) {
//         console.log('[Main] Internet connection restored.');
//     } else {
//         console.log('[Main] No internet connection.');
//     }
// }

// initServiceWorker();
//sw ^

function escHtml(input) {
  return String(input).replace(/[&<>"'`]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
  })[char]);
}

function formatDate(ts, includeSeconds = false, locale = "en-US") {
  if (!ts) return "-";

  const d = new Date(Number(ts));
  if (!isFinite(d.getTime())) return "-";

  const now = new Date();

  const showSeconds =
    includeSeconds &&
    (typeof window === "undefined" || window.innerWidth > window.innerHeight);

  const isToday = d.toDateString() === now.toDateString();

  const dateStr = isToday
    ? "Today"
    : d.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
      });

  const timeOptions = {
    hour: "numeric",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" } : {}),
  };

  return `${dateStr}, ${d.toLocaleTimeString(locale, timeOptions)}`;
}

function addToast(title = "", msg = "") {

  let container = document.querySelector('.toast-container')
  if (!container) {
      container = document.createElement('div')
      container.className = 'toast-container'
      document.body.appendChild(container)
  }

  new Audio('/assets/sounds/notification.mp3').play();
  const notification = document.createElement('div')
  notification.className = 'toast'
  const messageContainer = document.createElement('div')
  messageContainer.className = 'm'
  messageContainer.textContent = escHtml(msg || '')
  notification.appendChild(messageContainer)
  
  container.appendChild(notification)
  
  setTimeout(() => notification.remove(), 5200)
}

function theme() {
  if (themeCheck.checked) {
    localStorage.setItem('theme', 'dark');
    document.documentElement.id = 'dark';
  } else {
    localStorage.setItem('theme', 'light');
    document.documentElement.id = 'light';
  }
}

function options() {
  document.getElementById("optionsCtn").classList.toggle("shown");
}

function share() {
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    }).catch(console.error);
  } else {
    alert("Sharing is not supported in this browser.");
  }
}

function copyToClipboard(textToCopy) {
  if (!textToCopy) return;
  navigator.clipboard.writeText(textToCopy)
  .then(() => {
    addToast("Copied!", "Copied to clipboard")
  });
}

function generateQRCode(container, text, size, padding = 3) {
  container.innerHTML = "";

const qr = new QRCodeStyling({
    type: "canvas",
    width: size,
    height: size,
    data: text,
    margin: padding,
    dotsOptions: {
      color: "#000",
      type: "square"
    },
    backgroundOptions: {
      color: "#fff"
    }
  });

  qr.append(container);
}

function showDialog(message) {
  if (!message) return;

  const html = `
<dialog id="dialog" class="theme-1" data-popup>
  <div class="w-container">
    <div class="w-header">
      <span>Message</span>
      <span class="w-close" data-close></span>
    </div>
    <p class="w-message">${escHtml(message)}</p>
  </div>
</dialog>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const dialog = document.getElementById('dialog');
  const closeBtn = dialog.querySelector('[data-close]');

  dialog.showModal();

  const closeDialog = () => {
    dialog.close();
    dialog.remove();
  };

  closeBtn.addEventListener('click', closeDialog);

  dialog.addEventListener('click', (e) => {
    if (!e.target.closest('.w-container')) {
      closeDialog();
    }
  });

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDialog();
  });

  if (TESTING === true) {
    enableDialogDrag();
  }
}

function showWalletPopup(wallet) {
  if (!wallet) return;

  const html = `
<dialog id="dialog" class="theme-1" data-popup>
<div class="w-container">
<div class="w-header">
<span>Address QR Code</span>
<span class="w-close" data-close></span>
</div>
<div id="qrContainer" class="qrContainer"></div>
<pre class="w-data">${escHtml(wallet)}</pre>
<button class="button" style="width: 100%;" data-copy>Copy</button>
</div></dialog>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const qrContainer = document.getElementById('qrContainer');
  const dialog = document.getElementById('dialog');
  const closeBtn = dialog.querySelector('[data-close]');
  const copyButton = dialog.querySelector('[data-copy]');

  dialog.showModal();

  const closeDialog = () => {
    dialog.close();
    dialog.remove();
  };

  closeBtn.addEventListener('click', closeDialog);

  dialog.addEventListener('click', (e) => {
// if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {closeDialog();}
    if (!e.target.closest('.w-container')) {
      closeDialog();
    }
  });

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDialog();
  });

  copyButton.addEventListener('click', () => {
    copyToClipboard(wallet);
    const originalText = copyButton.textContent;
    copyButton.textContent = 'Copied to clipboard';
    copyButton.disabled = true;
    setTimeout(() => {
      copyButton.textContent = originalText;
      copyButton.disabled = false;
    }, 1500);
  });

  generateQRCode(qrContainer, wallet, 310);

  if (TESTING === true) {
    enableDialogDrag();
  }
}

function enableDialogDrag() {
  if (window.innerWidth > window.innerHeight) {
    const d = document.getElementById('dialog');
    const h = d.querySelector('.w-header');

    h.onmousedown = e => {
      const rect = d.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;

      d.style.position = 'absolute';
      d.style.left = rect.left + 'px';
      d.style.top = rect.top + 'px';
      d.style.margin = 0;

      const move = e => {
        d.style.left = e.clientX - ox + 'px';
        d.style.top = e.clientY - oy + 'px';
      };

      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      };

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    };
  }
}

function toggleBookmark(button) {
  const name = button.dataset.name;
  const link = button.dataset.link;

  const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
  const index = bookmarks.findIndex(b => b.link === link);
  let actionText = '';

  if (index === -1) {
    bookmarks.unshift({ name, link });
    if (bookmarks.length > 10) bookmarks.splice(10);
    actionText = '✔';
    // console.log(`Bookmarked: "${name}" -> ${link}`);
  } else {
    bookmarks.splice(index, 1);
    actionText = '✖';
    // console.log(`Removed bookmark: "${name}"`);
  }

  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));

  const originalText = button.textContent;
  button.textContent = actionText;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 2000);
}

const drawer = document.getElementById("drawer");
const overlay = document.getElementById("drawer-overlay");
const menuCheck = document.getElementById("menuCheck");

function menu(forceClose = false) {
  if (!drawer || !overlay || !menuCheck) return;
  if (forceClose) menuCheck.checked = false;
  const isOpen = menuCheck.checked;
  drawer.classList.toggle("open", isOpen);
  overlay.classList.toggle("open", isOpen);

document.documentElement.style.overflow = isOpen ? "hidden" : "";
}

function populateMenu() {
  const items = [
    { name: "Home", icon: "🏠", href: "/" },
    { name: "Articles", icon: "📚", href: "/posts/" },
    { name: "News", icon: "📰", href: "/news/" },
    { name: "Explorer", icon: "🔍", href: "/explorer/" },
    { name: "Overview", icon: "📊", href: "/overview/" },
    { name: "Projects", icon: "💼", href: "/projects/" },
    { name: "Comparison", icon: "⚡", href: "/comparison/" },
    { name: "Donations", icon: "❤️", href: "https://tiptr.ee/KaspaHub" }
  ];

  let html = items.map(item => {
    if (item.href) {
      return `<a class="drawer-item" href="${item.href}" style="text-decoration:none;color:inherit;">${item.icon} ${item.name}</a>`;
    } else {
      return `<div class="drawer-item">${item.icon} ${item.name}</div>`;
    }
  }).join("");

  html += `
    <div class="drawer-divider"></div>
    <div class="drawer-section">Settings</div>

    <div class="drawer-item">
      💵
      <select id="currency-select" name="currency" aria-label="Choose currency">
        <option value="" disabled selected hidden>Currency (${CURRENCY})</option>
        <option value="AED">AED</option>
        <option value="CNY">CNY</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="RUB">RUB</option>
        <option value="USD">USD</option>
        <option value="ZAR">ZAR</option>
      </select>
    </div>

    <div class="drawer-item">
      💹
      <select id="price-api-select" name="price-api" aria-label="Select price API" disabled>
        <option value="" disabled selected hidden>Price API (${PRICEAPI})</option>
        <option value="CG">CoinGecko</option>
        <option value="KO">Kaspa.org</option>
        <option value="LCW">LiveCoinWatch</option>
      </select>
    </div>

    <div class="drawer-item" style="display: none;">
      📡
      <select id="relay-select" name="currency" aria-label="Choose Nostr Relay" disabled>
        <option value="" disabled selected hidden>Relay (${RELAY})</option>
        <option value="Damus">Damus</option>
        <option value="Nos">Nos</option>
        <option value="Primal">Primal</option>
      </select>
    </div>

    <div class="drawer-item" id="toggle-experiments">⚙️ Beta Features</div>
    <div class="drawer-item" id="toggle-theme">☀️ Toggle Theme</div>
    <div class="drawer-item" id="clear-cache">🗑️ Clear Cache</div>
  `;

  const drawerList = document.getElementById("drawer-list");
  drawerList.innerHTML = html;

  document.getElementById("currency-select").onchange = e => {
    localStorage.setItem("currency", e.target.value);
    CURRENCY = e.target.value;
    USDRATE = exchangeRates[e.target.value];
    setPriceTag();
  };

  document.getElementById("price-api-select").onchange = e => {
    localStorage.setItem("priceApi", e.target.value);
  };

  document.getElementById("relay-select").onchange = e => {
    localStorage.setItem("relay", e.target.value);
  };

  document.getElementById("toggle-experiments").onclick = () => {
    TESTING = !TESTING;
    if (TESTING) {
      showDialog("Experimental features enabled.");
    } else {
      showDialog("Experimental features disabled.");
    }
  };

  document.getElementById("toggle-theme").onclick = () => {
    themeCheck.click();
  };

  document.getElementById("clear-cache").onclick = async () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
    }
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    showDialog("Cache, local storage, session storage, and cookies cleared.");
  };
}



async function initKasPrice(currency) {
  USDRATE = await getExchangeRate();
  KASVALUE = await getKaspaValue();
  KASPRICE = await formatPrice(KASVALUE, CURRENCY);
  setPriceTag();
}


initKasPrice(CURRENCY);
populateMenu();