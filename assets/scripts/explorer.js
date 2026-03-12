'use strict';

let BUSY = false;
const QUERY = new URL(window.location.href).searchParams.get("q");


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

function sanitizeSearch(query) {
  query = query.trim().toLowerCase();

  if (validators.containsDots(query)) {
    if (query.startsWith("http://")) query = query.slice(7);
    if (query.startsWith("https://")) query = query.slice(8);
    if (query.startsWith("www.")) query = query.slice(4);
    if (query.indexOf('/') !== -1) query = query.slice(0, query.indexOf('/'));
    return query;
  }

  return query;
}

async function explorerSearch(query, source = '[unknown] ') {

  // searchQuerySubmit.disabled = true;
  // setStatus(false);

  // results.innerHTML = '';
  // results.style.opacity= "0";
  // setTimeout(function () {
  //   searchQuerySubmit.disabled = false;
  // }, 100);

  if (validators.invalidFormet(query)) {
    setStatus('Invalid search query.');
    return true;
  } else {
    searchQueryInput.value = query;
  }

  const handlers = {
    address: {
      validator: validators.isKaspaAddress,
      action: () => {
        window.location.href = '/address/?q=' + query;
        // return source + 'Kaspa Wallet address: ' + query;
      }
    },
    kns: {
      outerValidator: validators.containsDots,
      validator: validators.isKns,
      action: () => {
        setStatus('This feature is not yet supported.');
        // return source + 'Kaspa Name Service (.kas): ' + query;
      }
    },
    domain: {
      outerValidator: validators.containsDots,
      validator: validators.isDomainName,
      action: () => {
        window.location.href = '/domain/?q=' + query;
        // return source + 'Web domain: ' + query;
      }
    },
    krc20: {
      outerValidator: validators.isAlphanumeric,
      validator: validators.isKrc20Token,
      action: () => {
        window.location.href = '/krc20/?q=' + query;
        // return source + 'Kaspa KRC20 token ticker: ' + query;
      }
    },
    'txOrBlock': {
      outerValidator: validators.isAlphanumeric,
      validator: validators.isTxOrBlock,
      action: () => {
        window.location.href = '/transaction/?q=' + query;
        // return source + 'Kaspa Transaction ID or block hash: ' + query;
      }
    },
    evm: {
      outerValidator: validators.isAlphanumeric,
      validator: validators.isEvmAddress,
      action: () => {
        setStatus('This feature is not yet supported.');
        // return source + 'Igra and Kasplex Layer 2 are currently not supported: ' + query;
      }
    }
  };

  if (source !== '[unknown] ') {
    const check = handlers[source];
    if (check) {
      const valid = (check.outerValidator ? check.outerValidator(query) : true) && check.validator(query);
      if (valid) {
        check.action();
        return;
      } else {
        setStatus('Invalid query for the specified source.');
        return true;
      }
    }
  }

  // Fallback
  if (handlers.address.validator(query)) {
    handlers.address.action();
    return;
  }

  if (validators.containsDots(query)) {
    if (handlers.kns.validator(query)) {
      handlers.kns.action();
      return;
    }
    if (handlers.domain.validator(query)) {
      handlers.domain.action();
      return;
    }
  }

  if (validators.isAlphanumeric(query)) {
    if (handlers.krc20.validator(query)) {
      handlers.krc20.action();
      return;
    }
    if (handlers.txOrBlock.validator(query)) {
      handlers.txOrBlock.action();
      return;
    }
    if (handlers.evm.validator(query)) {
      handlers.evm.action();
      return;
    }
  }

  setStatus('No results found for this query.');
  return false;
}



let LABELS = null;

async function preloadNames() {
  try {
    const res = await fetch("/assets/data/labels.json");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        LABELS = data;
      }
    }
  } catch (err) {
    console.error("Labels failed to load:", err);
  }
}

function fetchAddressLabel(addr) {
  if (!LABELS) return null;
  const match = LABELS.find(item => item.address === addr);
  return match ? match.name : null;
}



document.getElementById('searchContainer').addEventListener('submit', (event) => {
  event.preventDefault();
  if (BUSY) return;
  BUSY = true;
  setTimeout(() => BUSY = false, 100);
  explorerSearch(sanitizeSearch(searchQueryInput.value), '[form] ');
});