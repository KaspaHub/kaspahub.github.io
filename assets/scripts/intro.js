'use strict';

const schemaTag = document.getElementById("schema");
if (schemaTag) {
  try {
    const schema = JSON.parse(schemaTag.textContent.trim());

    const author = schema.author?.name || "Unknown";
    const authorUrl = schema.author?.url || "#";
    const authorImg = schema.author?.image || schema.author?.logo || "";

    const pubDate = schema.datePublished ? new Date(schema.datePublished) : null;
    const pubLong = pubDate ? pubDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

    const modDate = schema.dateModified ? new Date(schema.dateModified) : null;
    const modISO = modDate ? modDate.toISOString().split("T")[0] : "";
    const modLong = modDate ? modDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

    const editSpan = pubDate ? ` <span title="Originally posted: ${pubLong}">✏️</span>` : "";

    const imgHtml = authorImg ? `<img id="postAvatar" src="${authorImg}" alt="PFP">` : "";

    const html = `<div id="postInfo"><div>${imgHtml}<div><a href="${authorUrl}" rel="author" target="_blank">${author}</a><br><time datetime="${modISO}">${modLong}</time>${editSpan}</div></div><button id="share" onclick="share()">Share 🔁</button></div>`;

    const introEl = document.getElementById("intro");
    if (introEl) {
      introEl.innerHTML = html;
    }
  } catch (err) {
    console.error("Invalid JSON-LD schema:", err);
  }
}
