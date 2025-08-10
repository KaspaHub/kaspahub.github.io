'use strict';

const schemaTag = document.getElementById("schema");
if (schemaTag) {
  try {
    const schema = JSON.parse(schemaTag.textContent.trim());

    const author = schema.author?.name || "Unknown";
    const authorUrl = schema.author?.url || "#";
    const authorImg = schema.author?.image || schema.author?.logo || "";
    const thumbnailImg = schema?.image || "";

    const pubDate = schema.datePublished ? new Date(schema.datePublished) : null;
    const pubISO = pubDate ? pubDate.toISOString().split("T")[0] : "";
    const pubLong = pubDate ? pubDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

    const modDate = schema.dateModified ? new Date(schema.dateModified) : null;
    const modLong = modDate ? modDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

    const thumbnailHtml = thumbnailImg ? `<img alt="thumbnail image" id="thumbnail" src="${thumbnailImg}" data-enlargeable>` : "";

    const editSpan = modDate ? ` <span title="Edited: ${modLong}">✏️</span>` : "";

    const imgHtml = authorImg ? `<img id="postAvatar" src="${authorImg}" alt="PFP">` : "";

    const html = `${thumbnailHtml}<div id="postInfo"><div>${imgHtml}<div><a href="${authorUrl}" rel="author" target="_blank">${author}</a><br><time datetime="${pubISO}">${pubLong}</time>${editSpan}</div></div><button id="share" onclick="share()">Share 🔁</button></div>`;

    const introEl = document.getElementById("intro");
    if (introEl) {
      introEl.innerHTML = html;
      enlargeImages();
    }
  } catch (err) {
    console.error("Invalid JSON-LD schema:", err);
  }
}

function enlargeImages() {

  const images = document.querySelectorAll('img[data-enlargeable]');

  images.forEach((img) => {
    if (img.dataset.enlargeable === 'false') return;

    img.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.className = 'enlarged-image';
      modal.style.backgroundImage = `url(${img.src})`;

      const removeModal = () => {
        modal.remove();
        document.removeEventListener('keyup', escHandler);
      };

      const escHandler = (e) => {
        if (e.key === 'Escape') removeModal();
      };

      modal.addEventListener('click', removeModal);
      document.addEventListener('keyup', escHandler);

      document.body.appendChild(modal);
    });
  });
}
