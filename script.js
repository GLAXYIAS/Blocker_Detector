// Your live Cloudflare Worker URL
const WORKER_URL = "https://blockchecker.sparefornow2026.workers.dev/";

async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('resultsOutput');
    
    // Split input by commas or new lines, clean up whitespace
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");

    if (urls.length === 0) {
        output.innerHTML = "<strong>Please enter at least one URL.</strong>";
        return;
    }

    output.innerHTML = "<strong>Auditing...</strong>";
    let resultsHTML = "<ul>";

    for (let url of urls) {
        // Ensure protocol exists
        let formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            // We append the URL as a query parameter
            const response = await fetch(`${WORKER_URL}?url=${encodeURIComponent(formattedUrl)}`);
            
            if (!response.ok) {
                resultsHTML += `<li><strong>${url}</strong>: <span class="error">Worker Error (${response.status})</span></li>`;
                continue;
            }

            const data = await response.json();

            // DETECTION LOGIC: Matching the Linewize signatures from your image
            const isBlocked = data.finalUrl && (
                data.finalUrl.includes("linewize.net") || 
                data.finalUrl.includes("rule=") || 
                data.finalUrl.includes("blocked")
            );

            if (isBlocked) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">🛑 BLOCKED</span></li>`;
            } else if (data.reachable === false) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #bc8c00;">⚠️ UNREACHABLE / TIMEOUT</span></li>`;
            } else {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #1a7f37;">✅ ACCESSIBLE</span></li>`;
            }

        } catch (err) {
            // This happens if the Chromebook blocks the connection to your Worker
            resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">❌ FILTER INTERFERENCE (Worker Blocked)</span></li>`;
        }
    }

    resultsHTML += "</ul>";
    output.innerHTML = resultsHTML;
}
