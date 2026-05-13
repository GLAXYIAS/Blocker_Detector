const BACKEND_URL = "https://web-filter-auditor.onrender.com/check";

async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('resultsOutput');
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");

    output.innerHTML = "<strong>Auditing...</strong>";
    let resultsHTML = "<ul>";

    for (let url of urls) {
        let formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            const response = await fetch(`${BACKEND_URL}?url=${encodeURIComponent(formattedUrl)}`);
            const data = await response.json();

            // Logic: If Render found a filter signature OR the site is down
            if (data.isBlockedByFilter) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">🛑 BLOCKED (Filter Detected)</span></li>`;
            } else if (data.reachable) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #1a7f37;">✅ ACCESSIBLE</span></li>`;
            } else {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #bc8c00;">⚠️ DOWN/OFFLINE</span></li>`;
            }
        } catch (err) {
            resultsHTML += `<li><strong>${url}</strong>: <span style="color: gray;">❌ Backend Error</span></li>`;
        }
    }
    output.innerHTML = resultsHTML + "</ul>";
}
