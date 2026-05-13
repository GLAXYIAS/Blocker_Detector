const BACKEND_URL = "https://web-filter-auditor.onrender.com/check";

async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('resultsOutput');
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");

    if (urls.length === 0) {
        output.innerHTML = "<strong>Please enter some URLs.</strong>";
        return;
    }

    output.innerHTML = "<strong>Auditing...</strong> (First run may take 60s to 'wake up' Render)";
    let resultsHTML = "<ul>";

    for (let url of urls) {
        let formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            // Requesting our Render backend
            const response = await fetch(`${BACKEND_URL}?url=${encodeURIComponent(formattedUrl)}`);
            const data = await response.json();

            // DETECTION logic based on your Linewize screenshot
            const isBlocked = data.finalUrl && (
                data.finalUrl.includes("linewize.net") || 
                data.finalUrl.includes("rule=") ||
                data.finalUrl.includes("blocked")
            );

            if (isBlocked) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">BLOCKED (Linewize)</span></li>`;
            } else if (data.reachable) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #1a7f37;">ACCESSIBLE</span></li>`;
            } else {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #bc8c00;">DOWN/OFFLINE</span></li>`;
            }

        } catch (err) {
            // If Render is still waking up, this might catch an error
            resultsHTML += `<li><strong>${url}</strong>: <span style="color: #6e7781;">❌ Connection Error (Is Render Live?)</span></li>`;
        }
    }

    resultsHTML += "</ul>";
    output.innerHTML = resultsHTML;
}
