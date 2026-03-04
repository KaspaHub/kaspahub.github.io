'use strict';

const isLightTheme = localStorage.getItem('light') !== null;
// document.documentElement.id = isLightTheme ? 'dark' : 'light';

const checkbox = document.getElementById('theme');
checkbox.checked = isLightTheme;

function escHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
  const copyBtn = dialog.querySelector('[data-copy]');
  const qrContainer = dialog.querySelector('[data-qr]');

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
    // if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {closeDialog();}
  });

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDialog();
  });

  copyBtn.addEventListener('click', () => {
    copyToClipboard(wallet);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied to clipboard';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 1500);
  });



  new QRCode(qrContainer, {
    text: wallet,
    width: 200,
    height: 200
  });



//for fun
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
