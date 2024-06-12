document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['lastScan', 'vulnerabilities'], data => {
        const scanned = data.vulnerabilities ? data.vulnerabilities.length : 0;
        const vulnerable = data.vulnerabilities ? data.vulnerabilities.filter(v => v.data.positives > 0).length : 0;

        document.getElementById('scanned').textContent = scanned;
        document.getElementById('vulnerable').textContent = vulnerable;

        const details = document.getElementById('details');
        if (data.vulnerabilities) {
            data.vulnerabilities.forEach(v => {
                const div = document.createElement('div');
                div.className = 'vulnerability';
                div.innerHTML = `<p><strong>URL:</strong> ${v.url}</p><p><strong>Positives:</strong> ${v.data.positives}</p>`;
                details.appendChild(div);
            });
        }
    });

    chrome.storage.local.get('isLoading', function (result) {
        const loadingElement = document.getElementById('loading');
        if (result.isLoading) {
            loadingElement.style.display = 'block';
        } else {
            loadingElement.style.display = 'none';
        }
    });

    chrome.runtime.onMessage.addListener(function (message) {
        const loadingElement = document.getElementById('loading');
        if (message.isLoading) {
            loadingElement.style.display = 'block';
        } else {
            loadingElement.style.display = 'none';
        }
    });
});
