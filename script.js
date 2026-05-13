async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const blockerKey = document.getElementById('blockerSelect').value;
    const output = document.getElementById('resultsOutput');
    
    // Load the signatures from your JSON file
    const responseJson = await fetch('blockers.json');
    const blockerData = await responseJson.json();
    const activeBlocker = blockerData[blockerKey];

    // Split by comma OR newline, trim whitespace, and remove empty entries
    const urls = input.split(/[,\n]/).map(u => u.trim()).filter(u => u !== "");
    
    if (urls.length === 0) {
        output.innerHTML = "Please enter at least one URL.";
        return;
    }

    output.innerHTML = "Checking links... <br><small>Note: Browser security (CORS) may limit accuracy.</small>";
    let resultsHTML = "<ul>";

    for (let url of urls) {
        let formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            // 'no-cors' allows the request to fire even if the target site doesn't allow it,
            // which is usually enough to see if a network filter intercepts the request.
            const res = await fetch(formattedUrl, { mode: 'no-cors' });
            
            resultsHTML += `<li><strong>${url}</strong>: <span class="available">Reached</span></li>`;
        } catch (error) {
            resultsHTML += `<li><strong>${url}</strong>: <span class="blocked">Potentially Blocked by ${activeBlocker.name}</span></li>`;
        }
    }

    resultsHTML += "</ul>";
    output.innerHTML = resultsHTML;
}
