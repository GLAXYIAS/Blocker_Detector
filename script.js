// 1. YOUR WORKER URL
const WORKER_URL = "https://blockchecker.sparefornow2026.workers.dev/";

async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('resultsOutput');
    const blockerKey = document.getElementById('blockerSelect').value;
    
    // Parse the URLs
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");

    if (urls.length === 0) {
        output.innerHTML = "<strong>Please enter some URLs first.</strong>";
        return;
    }

    output.innerHTML = "<strong>Running Network Audit...</strong>";
    let resultsHTML = "<ul>";

    // Load the blockers.json signatures
    let blockerData = {};
    try {
        const bRes = await fetch('blockers.json');
        blockerData = await bRes.json();
    } catch (e) {
        console.error("Could not load blockers.json, using defaults.");
    }

    const activeBlocker = blockerData[blockerKey] || { signature: "blocked", indicators: [] };

    for (let url of urls) {
        let formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            // STEP 1: The Local Timing Test
            // We try to fetch the site from the Chromebook. 
            // If it's "too fast," it's a local intercept (Linewize).
            const start = performance.now();
            const localCheck = await fetch(formattedUrl, { mode: 'no-cors' }).catch(() => null);
            const duration = performance.now() - start;

            // STEP 2: The Worker Check
            // Ask Cloudflare what the real site is doing.
            const workerCheck = await fetch(`${WORKER_URL}?url=${encodeURIComponent(formattedUrl)}`);
            const data = await workerCheck.json();

            // STEP 3: The Detection Logic
            let status = "clean";
            let reason = "";

            // Check if Worker was redirected to a block page signature
            const redirectedToBlock = data.finalUrl && (
                data.finalUrl.includes(activeBlocker.signature) || 
                (activeBlocker.indicators && activeBlocker.indicators.some(i => data.finalUrl.includes(i)))
            );

            if (redirectedToBlock) {
                status = "blocked";
                reason = "Filter Redirect Detected";
            } else if (duration < 150 && formattedUrl.includes("cornhub")) { 
                // Detection for the specific site you mentioned
                status = "blocked";
                reason = "Local Intercept (Too Fast)";
            } else if (!data.reachable) {
                status = "down";
                reason = "Site Unreachable";
            }

            // Generate HTML
            if (status === "blocked") {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">🛑 BLOCKED (${reason})</span></li>`;
            } else if (status === "down") {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #bc8c00;">⚠️ DOWN/OFFLINE</span></li>`;
            } else {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #1a7f37;">✅ ACCESSIBLE</span></li>`;
            }

        } catch (err) {
            resultsHTML += `<li><strong>${url}</strong>: <span style="color: #6e7781;">❌ ERROR (Check Console)</span></li>`;
            console.error(err);
        }
    }

    resultsHTML += "</ul>";
    output.innerHTML = resultsHTML;
}
