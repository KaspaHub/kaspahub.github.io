'use strict';

const reviewers = [
    { name: "Kaspa Hub", url: "https://kaspahub.github.io/directory/reviews.json" },
    { name: "test 1", url: "https://kaspahub.github.io/directory/reviews-test.json" }
];
let dataReady = false;

async function preloadReviewers() {
    for (let reviewer of reviewers) {
        reviewer.cache = await loadReviewerData(reviewer.url, reviewer.name);
    }
    dataReady = true;
}

function sanitizeDomain(input) {
    try {
        const normalized = input.startsWith("http://") || input.startsWith("https://")
            ? input
            : `https://${input}`;
        const url = new URL(normalized);
        let hostname = url.hostname.replace(/^www\./i, "");
        return hostname.toLowerCase();
    } catch {
        return "";
    }
}

function validateDomain(input) {
    const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,}$/;
    if (!domainPattern.test(input)) {
        return { valid: false, reason: "Invalid domain. Use example.com" };
    }
    return { valid: true };
}

async function loadReviewerData(url, name) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
            console.error(`Reviewer ${name} JSON is invalid (should be an object map)`);
            return null;
        }
        return data;
    } catch (err) {
        console.error(`Failed to load reviewer ${name}:`, err);
        return null;
    }
}

function renderStars(rating) {
    if (rating === null || rating === undefined) return `<span class="neutral">N/A</span>`;
    const clamped = Math.min(5, Math.max(0, rating));
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        const cls = i <= clamped ? "" : "empty";
        stars += `<span class="star ${cls}"></span>`;
    }
    return stars;
}

function formatAverage(avg) {
    if (avg === "N/A") return avg;
    return parseFloat(avg).toFixed(1);
}

async function showReviews(input) {
    if (!dataReady) await preloadReviewers();

    let query = sanitizeDomain(input);

    const validation = validateDomain(query);
    if (!validation.valid) {
        document.getElementById("results").innerHTML = `<span style="margin: 10px;">${validation.reason}</span>`;
        document.getElementById("results").hidden = false;
        return;
    }

    document.getElementById("results").innerHTML = "Loading...";
    const allResults = [];

    for (let reviewer of reviewers) {
        const data = reviewer.cache;
        if (!data) {
            allResults.push({ name: reviewer.name, review: null, comment: null });
            continue;
        }

        let entry = data[query];
        if (entry === undefined) {
            allResults.push({ name: reviewer.name, review: null, comment: null });
            continue;
        }

        let rating = null, comment = null;
        if (Array.isArray(entry)) {
            rating = entry[0];
            comment = entry[1] ?? null;
        } else {
            rating = entry;
        }

        rating = Math.min(5, Math.max(0, rating));
        allResults.push({ name: reviewer.name, review: rating, comment });
    }

    const validReviews = allResults.filter(r => r.review !== null);
    let average = "N/A";
    if (validReviews.length > 0) {
        const rawAvg = validReviews.reduce((acc, r) => acc + r.review, 0) / validReviews.length;
        average = formatAverage(rawAvg);
    }

    let html = `<h2 style="margin: 30px; text-align:center;">${query} — <span>${average}</span></h2>`;
    html += `<table cellspacing="0" cellpadding="6" style="margin-top:10px;">
        <tr><th>Source</th><th></th><th>Rating</th></tr>`;

    for (let r of allResults) {
        let infoCell;
        if (r.comment) {
            infoCell = `<span class="info-bubble" title="${r.comment}">💬</span>`;
        }
        let status = renderStars(r.review);
        html += `<tr><td>${r.name}</td><td style="text-align:center;">${infoCell || ""}</td><td>${status}</td></tr>`;
    }

    html += `</table>`;

    document.getElementById("results").innerHTML = html;
    document.getElementById("results").hidden = false;
}