// 1. YOUR WORKER URL
const WORKER_URL = "https://blockchecker.sparefornow2026.workers.dev/";

async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('resultsOutput');
    const blockerKey = document.getElementById('blockerSelect').value;
    
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");

    if (urls.length === 0) {
        output.innerHTML = "<strong>Please enter some URLs first.</strong>";
        return;
    }

    output.innerHTML = "<strong>Auditing Network...</strong>";
    let resultsHTML = "<ul>";

    // Try to load blockers.json for signatures
    let blockerData = {};
    try {
        const bRes = await fetch('blockers.json');
        blockerData = await bRes.json();
    } catch (e) {
        console.warn("Using default signatures.");
    }

    const activeBlocker = blockerData[blockerKey] || { signature: "blocked", indicators: [] };

    for (let url of urls) {
        let formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            // STEP 1: Local Speed Test (To detect instant local filter redirects)
            const start = performance.now();
            await fetch(formattedUrl, { mode: 'no-cors' }).catch(() => null);
            const localDuration = performance.now() - start;

            // STEP 2: Worker Check (To see if the real internet can see it)
            const workerResponse = await fetch(`${WORKER_URL}?url=${encodeURIComponent(formattedUrl)}`);
            
            if (!workerResponse.ok) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: gray;">Worker Error</span></li>`;
                continue;
            }

            const data = await workerResponse.json();

            // STEP 3: Detection Logic
            // Check for the Linewize redirect in the Worker's final URL
            const hasBlockSignature = data.finalUrl && (
                data.finalUrl.includes(activeBlocker.signature) || 
                (activeBlocker.indicators && activeBlocker.indicators.some(i => data.finalUrl.includes(i)))
            );

            // A local block often responds in < 100ms. A real website over Wi-Fi rarely does.
            const isSuspiciouslyFast = localDuration < 100;

            if (hasBlockSignature || (isSuspiciouslyFast && !data.reachable)) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">🛑 BLOCKED</span></li>`;
            } else if (data.reachable) {
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #1a7f37;">✅ ACCESSIBLE</span></li>`;
            } else {
                // If the worker says it's not reachable AND the local check failed
                resultsHTML += `<li><strong>${url}</strong>: <span style="color: #bc8c00;">⚠️ DOWN/OFFLINE</span></li>`;
            }

        } catch (err) {
            resultsHTML += `<li><strong>${url}</strong>: <span style="color: #cf222e;">❌ WORKER BLOCKED</span></li>`;
        }
    }

    resultsHTML += "</ul>";
    output.innerHTML = resultsHTML;
}
