//////////////////
//ordinary JS file
var _start=null;
console.log("simple.js loaded");
function myfetch(url) {
  _start=performance.now();
  fetch(url)
  .then(function(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }).then(function(response) {
    appendMessage(`fetch ok url:${url}..waiting for data...`);
    return response.arrayBuffer();
  }).then(function(buf) {
    let t=performance.now()-_start;
    appendMessage(`data ready url:${url},len:${buf.byteLength},time:${t}`);
  })
  .catch(function(error) {
    appendMessage(`fetch error url:${url},error:${error}`);
  });
}

myfetch("https://kaspahub.org/app/calculator/offline.html");

function appendMessage(msg) {
  console.log(msg);
  var divStr = `<div>${msg}</div>`;
  document.getElementsByTagName('body')[0].innerHTML += divStr;
}
/////


let _isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
console.log(">>>service worker loading,isSafari:"+_isSafari);

self.addEventListener('activate', function (event) {
  console.log("!!!!!sw activate");
  event.waitUntil(self.clients.claim());
});

self.addEventListener('install', function(event) {
  console.log("!!!!!!sw install");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', function (event) {
  console.info('!!!!sw fetch :' + event.request.url + ",mode:" +event.request.mode);
  if (_isSafari) {
    event.respondWith(fetch(event.request));
  }
});