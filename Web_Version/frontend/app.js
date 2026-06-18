async function runScan() {
    const urlInput = document.getElementById('urlInput').value.trim();
    const scanBtn = document.getElementById('btnScan'); 
    const tableBody = document.getElementById('resultsTableBody'); 
    const counter = document.getElementById('scanCounter'); 

    if (!urlInput) {
        alert("Please enter at least one URL!");
        return;
    }

    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);

    // تأمين تفعيل حالة الزر
    if (scanBtn) {
        scanBtn.disabled = true;
        scanBtn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> <span>Scanning targets...</span>`;
    }
    
    if (tableBody) tableBody.innerHTML = '';
    
    // تأمين تحديث العداد في حال عدم وجود المعرّف بالـ HTML
    if (counter) {
        counter.classList.remove('hidden');
        counter.innerText = `Scanning ${urls.length} targets...`;
    }

    try {
        const response = await fetch('https://netscan-bids.onrender.com/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: urls })
        });

        if (!response.ok) throw new Error('Server responded with an error');

        const data = await response.json();

        if (tableBody) {
            data.results.forEach(res => {
                const row = document.createElement('tr');
                row.className = "border-b border-slate-900 hover:bg-slate-900/30 transition duration-150";

                const tdUrl = document.createElement('td');
                tdUrl.className = "px-4 py-4 font-medium text-slate-200 tracking-wide max-w-xs truncate font-mono text-xs";
                tdUrl.textContent = res.url;

                const tdStatus = document.createElement('td');
                tdStatus.className = "px-4 py-4 text-center";
                if (res.alive) {
                    tdStatus.innerHTML = `<span class="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-semibold"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>${res.status} ONLINE</span>`;
                } else {
                    tdStatus.innerHTML = `<span class="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-md text-xs font-semibold"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>${res.status}</span>`;
                }

                const tdTime = document.createElement('td');
                tdTime.className = "px-4 py-4 text-center text-slate-400 font-mono text-xs";
                tdTime.textContent = res.time;

                const tdSecurity = document.createElement('td');
                tdSecurity.className = "px-4 py-4 text-center";
                
                const badgeSecurity = document.createElement('span');
                let securityBadgeClass = "px-2.5 py-1 rounded-md text-xs font-semibold text-slate-400 bg-slate-800/40";
                
                if (res.security.includes('CLEAN')) securityBadgeClass = "px-2.5 py-1 rounded-md text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20";
                if (res.security.includes('SUSPICIOUS')) securityBadgeClass = "px-2.5 py-1 rounded-md text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20";
                
                badgeSecurity.className = securityBadgeClass;
                badgeSecurity.textContent = res.security;
                tdSecurity.appendChild(badgeSecurity);

                row.appendChild(tdUrl);
                row.appendChild(tdStatus);
                row.appendChild(tdTime);
                row.appendChild(tdSecurity);
                
                tableBody.appendChild(row);
            });
        }

        if (counter) {
            counter.innerText = `Scan completed for ${urls.length} targets.`;
            counter.className = "text-xs text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-md border border-emerald-500/20";
        }

    } catch (error) {
        console.error(error);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-4 py-12 text-center text-rose-400 font-medium">
                        <i class="fa-solid fa-circle-exclamation text-xl mb-2 block animate-bounce"></i>
                        API connection wake-up in progress. If this is the first scan, the free cloud tier takes up to 50 seconds to spin up. Please try again in a moment!
                    </td>
                </tr>
            `;
        }
        if (counter) counter.classList.add('hidden');
    } finally {
        if (scanBtn) {
            scanBtn.disabled = false;
            scanBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Launch Concurrent Scan</span>`;
        }
    }
}
