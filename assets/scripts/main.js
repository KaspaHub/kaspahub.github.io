'use strict';

const themeCheck = document.getElementById('themeCheck');

let THEME = document.documentElement.id;

if (THEME === "dark") {
  themeCheck.checked = true;
} else {
  themeCheck.checked = false;
}


let CURRENCY = localStorage.getItem("currency") || "usd";
const PRICEAPI = localStorage.getItem("priceApi") || "CG";
const RELAY = localStorage.getItem("relay") || "Damus";
let TESTING = false;


let KASVALUE = 0.035;
let KASPRICE = "$0.035";
let USDRATE = 1;

const CACHE_TIME = 5 * 60 * 1000;

const exchangeRates = {
  usd: 1,
  aed: 3.6725,
  cny: 6.90705,
  eur: 0.860845,
  gbp: 0.744962,
  rub: 78.25,
  zar: 16.3375
};

function getCache(key) {
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
      return price;
    }
  } catch (err) {
    console.log("Kaspa price fetch failed:", err.message || err);
  }

}

async function getExchangeRate(currency) {

  if (currency === "USD") return 1;

  const cacheKey = `kaspa_rate_${currency}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return cached;
  }

  const fallbackRate = exchangeRates[currency.toLowerCase()] || 1;

  (async () => {
    try {
      const res = await fetch(`https://hexarate.paikama.co/api/rates/USD/${currency}/latest`);
      if (!res.ok) throw new Error("API fetch failed");

      const data = await res.json();
      const rate = data?.data?.mid;

      if (!rate) throw new Error("Invalid rate");

      setCache(cacheKey, rate);
      console.info(`USD/${currency}: ${rate}`);
    } catch (err) {
      console.warn(`Background fetch failed for ${currency} (will retry next call):`, err);
    }
  })();

  return fallbackRate;
}

async function formatPrice(value = KASVALUE, toCurrency = "usd", amount = 1) {
  if (!isFinite(value) || !isFinite(amount)) return;

  const currencySymbols = {
    aed: "د.إ",
    cny: "¥",
    eur: "€",
    gbp: "£",
    rub: "₽",
    usd: "$",
    zar: "R",
  };

  const totalValue = value * amount;
  const converted = totalValue * USDRATE;

  const symbol = currencySymbols[toCurrency] || toCurrency;

  const formatted = Number(converted.toFixed(3)).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });

  return symbol + formatted;
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

function formatDate(ts, locale = 'en-US') {
  if (!ts) return "-";
  const d = new Date(Number(ts));
  if (!isFinite(d.getTime())) return "-";

  const now = new Date();
  const isToday = d.getFullYear() === now.getFullYear() &&
                  d.getMonth() === now.getMonth() &&
                  d.getDate() === now.getDate();

  const dateOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };

  const timeOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: locale === 'en-US'
  };

  const dateStr = isToday ? 'Today' : d.toLocaleDateString(locale, dateOptions);
  const timeStr = d.toLocaleTimeString(locale, timeOptions);

  return `${dateStr}, ${timeStr}`;
}

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

function shortenMiddle(str, head = 13, tail = 8) {
  const s = String(str ?? "");
  if (s.length <= head + tail + 3) return s;
  return s.slice(0, head) + "..." + s.slice(-tail);
}

function shortenEnd(str, maxLength = 13) {
  const s = String(str ?? "");
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength) + "...";
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
  navigator.clipboard.writeText(textToCopy)
  .then(() => {

  });
}


function generateQRCode(canvas, text, size, padding = 5) {
  new QRious({
    element: canvas,
    value: text,
    size: size,
    foreground: 'black',
    background: 'white',
    padding: padding
  });
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
<span>Kaspa address</span>
<span class="w-close" data-close></span>
</div>
<canvas id="qrcode-crypto" class="qrcode-crypto"></canvas>
<p class="w-message">Scan or copy the Kaspa address</p>
<pre class="w-data">${escHtml(wallet)}</pre>
<button class="button" data-copy>Copy</button>
</div></dialog>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const qrContainer = document.getElementById('qrcode-crypto');
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

  generateQRCode(qrContainer, wallet, 200);

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


// toggle menu

function menu(forceClose = false) {
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawer-overlay");
  const menuCheck = document.getElementById("menuCheck");
  if (!drawer || !overlay || !menuCheck) return;
  if (forceClose) menuCheck.checked = false;
  const isOpen = menuCheck.checked;
  drawer.classList.toggle("open", isOpen);
  overlay.classList.toggle("open", isOpen);
}

function populateMenu() {
  const items = [
    { name: "Home", icon: "🏠", href: "/" },
    { name: "Articles", icon: "📚", href: "/posts/" },
    { name: "News", icon: "📰", href: "/news/" },
    { name: "Explorer", icon: "🌐", href: "/explorer/" },
    { name: "Apps", icon: "✨", href: "/apps/" },
    { name: "Kaspa", icon: "⛓️", href: "/ecosystem/" },
    { name: "Linux", icon: "🐧", href: "/linux/distributions/" },
    { name: "Nostr", icon: "📡", href: "/nostr/" }
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
      <select id="currency-select" style="width:100%">
        <option value="" disabled selected hidden>Currency (${CURRENCY})</option>
        <option value="aed">AED</option>
        <option value="cny">CNY</option>
        <option value="eur">EUR</option>
        <option value="gbp">GBP</option>
        <option value="rub">RUB</option>
        <option value="usd">USD</option>
        <option value="zar">ZAR</option>
      </select>
    </div>

    <div class="drawer-item">
      💹
      <select id="price-api-select" style="width:100%" disabled>
        <option value="" disabled selected hidden>Price API (${PRICEAPI})</option>
        <option value="CG">CoinGecko</option>
        <option value="KO">Kaspa.org</option>
        <option value="LCW">LiveCoinWatch</option>
      </select>
    </div>

    <div class="drawer-item">
      📡
      <select id="relay-select" style="width:100%" disabled>
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
  USDRATE = await getExchangeRate(currency);
  KASVALUE = await updateKasValue();

  KASPRICE = await formatPrice(KASVALUE, currency);
  setPriceTag();
  console.log(KASPRICE);
}


initKasPrice(CURRENCY);
populateMenu();