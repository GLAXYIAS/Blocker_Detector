const WORKER_URL = "https://blockchecker.sparefornow2026.workers.dev/";

async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('resultsOutput');
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");

    if (urls.length === 0) {
        output.innerHTML = "<strong>Please enter URLs.</strong>";
        return;
    }

    output.innerHTML = "<strong>Analyzing Filter Response...</strong>";
    let resultsHTML = "<ul>";

    for (let url of urls) {
        let formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            // 1. Worker Check: Does the site exist on the real internet?
            const workerReq = await fetch(`${WORKER_URL}?url=${encodeURIComponent(formattedUrl)}`);
            const workerData = await workerReq.json();

            // 2. Linewize Detection: 
            // We try to "fetch" the block page directly. 
            // If this succeeds OR the timing is instant, it's a block.
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            
            let isBlocked = false;
            try {
                // We check if we can reach the Linewize block server from your Chromebook
                const lwCheck = await fetch("https://blocked.syd-1.linewize.net/favicon.ico", { 
                    mode: 'no-cors', 
                    signal: controller.signal 
                });
                
                // If the worker says the site is fine, but our local request 
                // to the target URL behaves strangely, we flag it.
                const localStart = performance.now();
                await fetch(formattedUrl, { mode: 'no-cors', signal: controller.signal });
                const duration = performance.now() - localStart;

                // If the response is faster than 100ms, it's a local intercept
                if (duration < 100) isBlocked = true;
                
            } catch (e) {
                // If the request fails but the worker says it's up, it's blocked
                if (workerData.reachable) isBlocked = true;
            }
            clearTimeout(timeout);

            // 3. Final Result Logic
            if (isBlocked || (workerData.finalUrl && workerData.finalUrl.includes("linewize.net"))) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">🛑 BLOCKED (Linewize)</span></li>`;
            } else if (workerData.reachable) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #1a7f37;">✅ ACCESSIBLE</span></li>`;
            } else {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #bc8c00;">⚠️ DOWN/OFFLINE</span></li>`;
            }

        } catch (err) {
            resultsHTML += `<li><strong>${url}</strong>: <span style="color: gray;">❌ Error Checking Site</span></li>`;
        }
    }
    output.innerHTML = resultsHTML + "</ul>";
}
