'use strict';

const isDarkTheme = localStorage.getItem('dark') !== null;
// document.documentElement.id = isDarkTheme ? 'dark' : 'light';

const checkbox = document.getElementById('theme');
checkbox.checked = isDarkTheme;

function theme() {
  if (checkbox.checked) {
    localStorage.setItem('dark', '');
    document.documentElement.id = 'dark';
  } else {
    localStorage.removeItem('dark');
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


function toggleBookmark(button) {
  const name = button.dataset.name;
  const link = button.dataset.link;

  const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
  const index = bookmarks.findIndex(b => b.link === link);
  let actionText = '';

  if (index === -1) {
    bookmarks.unshift({ name, link });
    if (bookmarks.length > 10) bookmarks.splice(10);
    actionText = 'Bookmarked!';
    // console.log(`Bookmarked: "${name}" -> ${link}`);
  } else {
    bookmarks.splice(index, 1);
    actionText = 'Removed!';
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
