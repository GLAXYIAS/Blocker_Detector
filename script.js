async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('resultsOutput');
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");

    output.innerHTML = "<strong>Final Audit...</strong>";
    let resultsHTML = "<ul>";

    for (let url of urls) {
        let domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
        let testUrl = `https://${domain}/favicon.ico`;
        
        const isBlocked = await new Promise((resolve) => {
            const img = new Image();
            const start = performance.now();
            
            // If the image loads, the site is likely open
            img.onload = () => resolve(false);
            
            // If the image fails, it's either down OR blocked
            img.onerror = () => {
                const duration = performance.now() - start;
                // If it fails EXTREMELY fast (under 50ms), Linewize killed it locally.
                if (duration < 50) resolve(true);
                else resolve("down"); 
            };
            
            img.src = testUrl + "?t=" + Date.now(); // Bypass cache
            setTimeout(() => resolve("timeout"), 2500);
        });

        if (isBlocked === true) {
            resultsHTML += `<li>${domain}: <span style="color:#cf222e">🛑 BLOCKED</span></li>`;
        } else if (isBlocked === false) {
            resultsHTML += `<li>${domain}: <span style="color:#1a7f37">✅ ACCESSIBLE</span></li>`;
        } else {
            resultsHTML += `<li>${domain}: <span style="color:#bc8c00">⚠️ UNCERTAIN (Down/Timeout)</span></li>`;
        }
    }
    output.innerHTML = resultsHTML + "</ul>";
}
