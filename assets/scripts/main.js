'use strict';


const isLightTheme = localStorage.getItem('light') !== null;
// document.documentElement.id = isLightTheme ? 'dark' : 'light';

const checkbox = document.getElementById('theme-check');
checkbox.checked = isLightTheme;

let testing = true;


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
  if (checkbox.checked) {
    localStorage.setItem('light', '');
    document.documentElement.id = 'light';
  } else {
    localStorage.removeItem('light');
    document.documentElement.id = 'dark';
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


function generateQRCode(container, text, size) {
  new QRCode(container, {
    text: text,
    width: size,
    height: size
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

  if (testing === true) {
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
<div data-qr></div>
<p class="w-message">Scan or copy the Kaspa address</p>
<pre class="w-data">${escHtml(wallet)}</pre>
<button class="button" data-copy>Copy</button>
</div></dialog>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const dialog = document.getElementById('dialog');
  const closeBtn = dialog.querySelector('[data-close]');
  const copyButton = dialog.querySelector('[data-copy]');
  const qrContainer = dialog.querySelector('[data-qr]');

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

  if (testing === true) {
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
  const check = document.getElementById("menu-check");
  if (!drawer || !overlay || !check) return;
  if (forceClose) check.checked = false;
  const isOpen = check.checked;
  drawer.classList.toggle("open", isOpen);
  overlay.classList.toggle("open", isOpen);
}

function populateMenu() {
  const items = [
    { name: "Home", icon: "🏠", href: "/" },
    { name: "Apps", icon: "✨", href: "/apps/" },
    { name: "Kaspa", icon: "⛓️", href: "/ecosystem/" },
    { name: "Linux", icon: "🐧", href: "/linux/distributions/" },
    { name: "Nostr", icon: "📡", href: "/nostr/clients/" }
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
    <div class="drawer-item" id="toggle-experiments">⚙️ Beta Features</div>
    <div class="drawer-item" id="toggle-theme">☀️ Toggle Theme</div>
  `;

  const drawerList = document.getElementById("drawer-list");
  drawerList.innerHTML = html;

  document.getElementById("toggle-experiments").onclick = () => {
    testing = !testing;
    if (testing) {
      showDialog("Experimental features enabled.");
    } else {
      showDialog("Experimental features disabled.");
    }

    
  };

  document.getElementById("toggle-theme").onclick = () => {
    checkbox.click();
  };
}

populateMenu();