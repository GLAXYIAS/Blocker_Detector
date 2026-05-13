const BACKEND_URL = "https://web-filter-auditor.onrender.com/check";

async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('resultsOutput');
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");

    output.innerHTML = "<strong>Scanning for Linewize Signatures...</strong>";
    let resultsHTML = "<ul>";

    for (let url of urls) {
        let formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            // 1. ASK THE BACKEND: Is the site actually alive?
            const remoteReq = await fetch(`${BACKEND_URL}?url=${encodeURIComponent(formattedUrl)}`);
            const remoteData = await remoteReq.json();

            // 2. THE LOCAL PROBE: 
            // We try to fetch the site with 'no-cors'. 
            // If Linewize redirects us, the browser will block the 'redirect' 
            // but the timing will be "Instant" (usually < 50ms).
            const start = performance.now();
            let localBlocked = false;

            try {
                // This will fail (CORS error) if it's a real site, 
                // but if Linewize intercepts it, the browser treats it differently.
                await fetch(formattedUrl, { mode: 'no-cors', cache: 'no-store' });
                const duration = performance.now() - start;
                
                // If it "loaded" in under 60ms, it's a local intercept (Linewize).
                if (duration < 60) localBlocked = true;
            } catch (e) {
                // If it fails instantly, it's also a block.
                localBlocked = true;
            }

            // 3. THE "DATABASE" CHECK (The Linewize Fingerprint)
            // We try to ping the Linewize block page directly. 
            // If your Chromebook can "see" this favicon, you are behind Linewize.
            const lwDetection = await fetch("https://blocked.syd-1.linewize.net/favicon.ico", { mode: 'no-cors' })
                .then(() => true)
                .catch(() => false);

            // FINAL LOGIC
            if (remoteData.reachable && localBlocked && lwDetection) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">🛑 BLOCKED (Linewize Policy)</span></li>`;
            } else if (remoteData.reachable) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #1a7f37;">✅ ACCESSIBLE</span></li>`;
            } else {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #bc8c00;">⚠️ DOWN/OFFLINE</span></li>`;
            }

        } catch (err) {
            resultsHTML += `<li><strong>${url}</strong>: <span style="color: gray;">❌ Error</span></li>`;
        }
    }
    output.innerHTML = resultsHTML + "</ul>";
}
