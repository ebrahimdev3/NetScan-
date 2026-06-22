function renderTable(results) {
    const tableBody = document.getElementById('resultsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (results.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-4 py-12 text-center text-slate-500 text-xs font-mono">No matching records found.</td></tr>`;
        return;
    }

    results.forEach(res => {
        const row = document.createElement('tr');
        row.className = "border-b border-slate-900 hover:bg-slate-900/30 transition duration-150";

        // 1. عمود الرابط مع ميزة النسخ السريع
        const tdUrl = document.createElement('td');
        tdUrl.className = "px-4 py-4 font-medium text-slate-200 tracking-wide max-w-xs truncate font-mono text-xs flex items-center justify-between group/url";
        tdUrl.innerHTML = `
            <span class="truncate">${res.url}</span>
            <button onclick="navigator.clipboard.writeText('${res.url}'); alert('URL copied!');" class="text-slate-600 hover:text-indigo-400 opacity-0 group-hover/url:opacity-100 transition pl-2">
                <i class="fa-solid fa-copy text-[11px]"></i>
            </button>
        `;

        // 2. عمود الحالة العامة
        const tdStatus = document.createElement('td');
        tdStatus.className = "px-4 py-4 text-center";
        if (res.alive) {
            tdStatus.innerHTML = `<span class="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-semibold"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>${res.status} ONLINE</span>`;
        } else {
            tdStatus.innerHTML = `<span class="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-md text-xs font-semibold"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>${res.status}</span>`;
        }

        // 3. عمود زمن الاستجابة (Latency)
        const tdTime = document.createElement('td');
        tdTime.className = "px-4 py-4 text-center text-slate-400 font-mono text-xs";
        tdTime.textContent = res.time;

        // 4. [جديد] عمود حالة شهادة الأمان SSL
        const tdSSL = document.createElement('td');
        tdSSL.className = "px-4 py-4 text-center";
        let sslBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">${res.ssl_status}</span>`;
        
        if (res.ssl_status.includes('VALID')) {
            sslBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${res.ssl_status}</span>`;
        } else if (res.ssl_status.includes('EXPIRING')) {
            sslBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">${res.ssl_status}</span>`;
        }
        tdSSL.innerHTML = sslBadge;

        // 5. [جديد] عمود جدران الحماية بالهيدرز (Security Headers)
        const tdHeaders = document.createElement('td');
        tdHeaders.className = "px-4 py-4 text-center";
        let headerBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"><i class="fa-solid fa-shield text-[10px] mr-1"></i>UNSAFE</span>`;
        
        if (res.headers_score === 'SECURE') {
            headerBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20"><i class="fa-solid fa-shield-halved text-[10px] mr-1"></i>SECURE</span>`;
        } else if (res.headers_score === 'WARNING') {
            headerBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><i class="fa-solid fa-shield text-[10px] mr-1"></i>PARTIAL</span>`;
        }
        tdHeaders.innerHTML = headerBadge;

        // دمج الأعمدة بالصف
        row.appendChild(tdUrl);
        row.appendChild(tdStatus);
        row.appendChild(tdTime);
        row.appendChild(tdSSL);
        row.appendChild(tdHeaders);
        
        tableBody.appendChild(row);
    });
}

// دالة تحديث الإحصائيات مع إدراج التنبيهات الأمنية الجديدة
function updateMetrics(results) {
    document.getElementById('metricTotal').innerText = results.length;
    document.getElementById('metricOnline').innerText = results.filter(r => r.alive).length;
    
    // احتساب التنبيهات إذا كانت الشهادة قاربت على الانتهاء أو الهيدرز غير آمنة
    const unsafeCount = results.filter(r => r.ssl_status.includes('EXPIRING') || r.ssl_status.includes('EXPIRED') || r.headers_score === 'UNSAFE').length;
    document.getElementById('metricAlerts').innerText = unsafeCount;
}
