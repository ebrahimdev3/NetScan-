async function runScan() {
    const urlInput = document.getElementById('urlInput').value;
    const scanBtn = document.getElementById('scanBtn');
    const loading = document.getElementById('loading');
    const table = document.getElementById('resultsTable');
    const tbody = document.getElementById('resultsBody');

    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    if (urls.length === 0) {
        alert("Please enter at least one URL!");
        return;
    }

    scanBtn.disabled = true;
    loading.classList.remove('hidden');
    table.classList.add('hidden');
    tbody.innerHTML = '';

    try {
        const response = await fetch('http://127.0.0.1:8000/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: urls })
        });

        const data = await response.json();

        data.results.forEach(res => {
            const row = document.createElement('tr');
            
            // تحصين شامل ضد ثغرات XSS بإنشاء نصوص محمية (Safe Text Nodes)
            const tdUrl = document.createElement('td');
            const strongUrl = document.createElement('strong');
            strongUrl.textContent = res.url;
            tdUrl.appendChild(strongUrl);

            const tdStatus = document.createElement('td');
            tdStatus.textContent = res.status;
            tdStatus.className = res.alive ? 'status-up' : 'status-down';

            const tdTime = document.createElement('td');
            tdTime.textContent = res.time;

            const tdSecurity = document.createElement('td');
            tdSecurity.textContent = res.security;

            row.appendChild(tdUrl);
            row.appendChild(tdStatus);
            row.appendChild(tdTime);
            row.appendChild(tdSecurity);
            
            tbody.appendChild(row);
        });

        table.classList.remove('hidden');
    } catch (error) {
        alert("Failed to connect to the backend server. Make sure FastAPI is running!");
    } finally {  // Fixed: changed from 'military' to 'finally'
        scanBtn.disabled = false;
        loading.classList.add('hidden');
    }
}
