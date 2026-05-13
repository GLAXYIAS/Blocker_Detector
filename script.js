async function checkURLs() {
    const input = document.getElementById('urlInput').value;
    const blockerKey = document.getElementById('blockerSelect').value;
    const output = document.getElementById('resultsOutput');

    // Load blocker data
    const responseJson = await fetch('blockers.json');
    const blockerData = await responseJson.json();
    const activeBlocker = blockerData[blockerKey];

    // Split input URLs
    const urls = input
        .split(/[,\n]/)
        .map(u => u.trim())
        .filter(u => u !== "");

    if (urls.length === 0) {
        output.innerHTML = "Please enter at least one URL.";
        return;
    }

    output.innerHTML = "Checking links...";
    let resultsHTML = "<ul>";

    for (let url of urls) {
        let formattedUrl = url.startsWith('http')
            ? url
            : `https://${url}`;

        try {
            // NOTE: no-cors cannot reliably detect blocking
            await fetch(formattedUrl, { mode: 'no-cors' });

            resultsHTML += `
                <li>
                    <strong>${url}</strong>:
                    <span class="available">Reached</span>
                </li>
            `;
        } catch (error) {

            let extraHTML = "";

            // If this blocker supports a generator (like Linewize)
            if (activeBlocker.generator) {
                const blockedLink = generateBlockURL(url, activeBlocker);

                extraHTML = `
                    <br>
                    <small>Simulated Block Page:</small><br>
                    <a href="${blockedLink}" target="_blank">
                        Open Block Page
                    </a>
                `;
            }

            resultsHTML += `
                <li>
                    <strong>${url}</strong>:
                    <span class="blocked">
                        Potentially Blocked by ${activeBlocker.name}
                    </span>
                    ${extraHTML}
                </li>
            `;
        }
    }

    resultsHTML += "</ul>";
    output.innerHTML = resultsHTML;
}


/**
 * Generic blocker URL generator (currently Linewize-style)
 * Can be extended later for GoGuardian/Securly/etc.
 */
function generateBlockURL(site, blocker) {

    // LINEWIZE GENERATOR
    if (blocker.name === "Linewize") {

        const categories = blocker.generator.categories;

        const category =
            categories[Math.floor(Math.random() * categories.length)];

        const encodedRule = btoa(`${category} | All`);

        return `${blocker.generator.base}` +
            `?url=${encodeURIComponent(site)}` +
            `&deviceid=${blocker.generator.deviceid}` +
            `&user=${blocker.generator.user}` +
            `&rule=${encodeURIComponent(encodedRule)}` +
            `&ruleid=fake-rule-id` +
            `&path=` +
            `&method=${blocker.generator.method}` +
            `&cid=${Date.now()}`;
    }

    // Future blockers can go here:
    // if (blocker.name === "GoGuardian") { ... }

    return "#";
}
