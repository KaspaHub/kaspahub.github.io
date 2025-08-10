const isDarkTheme = localStorage.getItem('dark') !== null;
document.documentElement.id = isDarkTheme ? 'dark' : 'light';

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
    alert("Sharing not supported in this browser.");
  }
}