// مصفوفة عامة لتخزين النتائج الحالية لتسهيل عمليات الفرز والتصدير والترتيب والـ LocalStorage
let currentScanResults = [];
let isAscendingSort = true;

// استدعاء البيانات المخزنة محلياً عند تشغيل الصفحة لأول مرة لحفظ جلسة العمل
document.addEventListener("DOMContentLoaded", () => {
    const cachedResults = localStorage.getItem("netscan_last_scan");
    if (cachedResults) {
        currentScanResults = JSON.parse(cachedResults);
        updateMetrics(currentScanResults);
        renderTable(currentScanResults);
        const controls = document.getElementById('tableControls');
        if (controls) controls.classList.remove('hidden');
    }
});

// الدالة الأساسية لإجراء الفحص المتزامن باستخدام تقنية SSE للمؤشر اللحظي
async function runScan() {
    const urlInput = document.getElementById('urlInput').value.trim();
    const scanBtn = document.getElementById('btnScan'); 
    const tableBody = document.getElementById('resultsTableBody'); 
    const counter = document.getElementById('scanCounter'); 
    const controls = document.getElementById('tableControls');

    if (!urlInput) {
        alert("Please enter at least one URL!");
        return;
    }

    // تنظيف المدخلات وتحويلها إلى مصفوفة
    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);

    // 1. تعطيل الزر فوراً وتغيير حالته حركياً ومنع النقرات العشوائية المزدوجة
    if (scanBtn) {
        scanBtn.disabled = true;
        scanBtn.style.pointerEvents = 'none'; 
        scanBtn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> <span>Streaming Live Scan...</span>`;
    }
    
    // تصفير مصفوفة النتائج وتجهيز الجدول لاستقبال البيانات الحية
    currentScanResults = [];
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-16 text-center text-slate-400 text-sm">
                    <i class="fa-solid fa-satellite-dish animate-pulse text-xl text-indigo-500 mb-2 block"></i>
                    Establishing Live Stream Connection...
                </td>
            </tr>
        `;
    }
    
    if (counter) {
        counter.classList.remove('hidden');
        counter.className = "text-xs text-indigo-400 bg-indigo-950/30 px-3 py-1 rounded-md border border-indigo-500/20";
        counter.innerText = `0 / ${urls.length} Targets Processed`;
    }

    try {
        // إرسال الطلب إلى السيرفر المطور الذي يدعم الـ Streaming (SSE)
        const response = await fetch('https://netscan-bids.onrender.com/api/scan/stream', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({ urls: urls })
        });

        // التعامل مع نظام تحديد معدل الطلبات (Rate Limiting) في حال تجاوزه
        if (response.status === 429) {
            throw new Error("Rate limit exceeded! 5 scans per minute allowed. Please wait 60s.");
        }

        if (!response.ok) throw new Error(`Server error: status ${response.status}`);

        // قراءة الاستجابة كـ Stream (سطر بسطر) عبر العميل
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        // تنظيف الجدول قبل بدء إسقاط البيانات الحية
        if (tableBody) tableBody.innerHTML = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            
            // الاحتفاظ بآخر سطر غير مكتمل في البافر
            buffer = lines.pop(); 

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const rawData = line.replace("data: ", "").trim();
                    if (!rawData) continue;

                    try {
                        const singleResult = JSON.parse(rawData);
                        
                        // إضافة النتيجة المنفردة فور وصولها للمصفوفة وتحديث الواجهة
                        currentScanResults.push(singleResult);
                        appendRowToTable(singleResult);
                        updateMetrics(currentScanResults);

                        if (counter) {
                            counter.innerText = `${currentScanResults.length} / ${urls.length} Targets Processed`;
                        }
                    } catch (e) {
                        console.error("Chunk parse skip");
                    }
                }
            }
        }

        // حفظ البيانات النهائية في الذاكرة المحلية وتفعيل أدوات التحكم
        localStorage.setItem("netscan_last_scan", JSON.stringify(currentScanResults));
        if (controls) controls.classList.remove('hidden');

        if (counter) {
            counter.innerText = `Scan completed successfully!`;
            counter.className = "text-xs text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-md border border-emerald-500/20";
        }

    } catch (error) {
        console.error("Scan Interrupted:", error);
        
        // 2. فك القفل فوراً عند حدوث خطأ أو حظر لمنع تجمد الواجهة والأزرار
        if (scanBtn) {
            scanBtn.disabled = false;
            scanBtn.style.pointerEvents = 'auto';
            scanBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Launch Concurrent Scan</span>`;
        }

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-12 text-center text-rose-400 font-medium text-sm">
                        <i class="fa-solid fa-circle-exclamation text-xl mb-2 block"></i>
                        ${error.message || "Connection Error. Please try again!"}
                    </td>
                </tr>
            `;
        }
        if (counter) counter.classList.add('hidden');
    } finally {
        // 3. ضمان نهائي لعودة الأزرار لحالتها الطبيعية عند انتهاء كل العمليات بنجاح
        if (scanBtn) {
            scanBtn.disabled = false;
            scanBtn.style.pointerEvents = 'auto';
            scanBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Launch Concurrent Scan</span>`;
        }
    }
}

// دالة ذكية لإضافة صف فرعي للجدول مباشرة أثناء الـ Streaming دون إعادة بناء الجدول بالكامل
function appendRowToTable(res) {
    const tableBody = document.getElementById('resultsTableBody');
    if (!tableBody) return;

    const row = document.createElement('tr');
    row.className = "border-b border-slate-900 hover:bg-slate-900/30 transition duration-150 data-row";
    
    row.setAttribute('data-alive', res.alive);
    row.setAttribute('data-suspicious', res.security.includes('SUSPICIOUS') || res.ssl_status.includes('EXPIRING') || res.headers_score === 'UNSAFE');

    // 1. عمود الرابط والنسخ السريع
    const tdUrl = document.createElement('td');
    tdUrl.className = "px-4 py-4 font-medium text-slate-200 tracking-wide max-w-xs truncate font-mono text-xs flex items-center justify-between group/url";
    tdUrl.innerHTML = `
        <span class="truncate">${res.url}</span>
        <button onclick="navigator.clipboard.writeText('${res.url}'); alert('URL copied!');" class="text-slate-600 hover:text-indigo-400 opacity-0 group-hover/url:opacity-100 transition pl-2" title="Copy URL">
            <i class="fa-solid fa-copy text-[11px]"></i>
        </button>
    `;

    // 2. عمود الحالة
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

    // 4. عمود شهادة الأمان SSL
    const tdSSL = document.createElement('td');
    tdSSL.className = "px-4 py-4 text-center";
    let sslBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">${res.ssl_status}</span>`;
    if (res.ssl_status.includes('VALID')) {
        sslBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${res.ssl_status}</span>`;
    } else if (res.ssl_status.includes('EXPIRING')) {
        sslBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">${res.ssl_status}</span>`;
    }
    tdSSL.innerHTML = sslBadge;

    // 5. عمود جدران الحماية بالهيدرز (Security Headers)
    const tdHeaders = document.createElement('td');
    tdHeaders.className = "px-4 py-4 text-center";
    let headerBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"><i class="fa-solid fa-shield text-[10px] mr-1"></i>UNSAFE</span>`;
    if (res.headers_score === 'SECURE') {
        headerBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20"><i class="fa-solid fa-shield-halved text-[10px] mr-1"></i>SECURE</span>`;
    } else if (res.headers_score === 'WARNING') {
        headerBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><i class="fa-solid fa-shield text-[10px] mr-1"></i>PARTIAL</span>`;
    }
    tdHeaders.innerHTML = headerBadge;

    row.appendChild(tdUrl);
    row.appendChild(tdStatus);
    row.appendChild(tdTime);
    row.appendChild(tdSSL);
    row.appendChild(tdHeaders);
    
    tableBody.appendChild(row);
}

// دالة إعادة رندرة الجدول بالكامل
function renderTable(results) {
    const tableBody = document.getElementById('resultsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (results.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-4 py-12 text-center text-slate-500 text-xs font-mono">No records available.</td></tr>`;
        return;
    }
    results.forEach(res => appendRowToTable(res));
}

// تحديث لوحة البيانات الإحصائية الرقمية (Metrics Counter)
function updateMetrics(results) {
    document.getElementById('metricTotal').innerText = results.length;
    document.getElementById('metricOnline').innerText = results.filter(r => r.alive).length;
    const unsafeCount = results.filter(r => r.ssl_status.includes('EXPIRING') || r.ssl_status.includes('EXPIRED') || r.headers_score === 'UNSAFE').length;
    document.getElementById('metricAlerts').innerText = unsafeCount;
}

// تصفية وفرز البيانات حسب الخيار المحدد (Show All / Online / Alerts)
function filterResults() {
    const filterValue = document.getElementById('filterSelect').value;
    let filtered = [...currentScanResults];

    if (filterValue === 'online') {
        filtered = filtered.filter(r => r.alive);
    } else if (filterValue === 'alerts') {
        filtered = filtered.filter(r => r.ssl_status.includes('EXPIRING') || r.ssl_status.includes('EXPIRED') || r.headers_score === 'UNSAFE');
    }
    
    renderTable(filtered);
}

// ترتيب عرض الجدول تصاعدياً وتنازلياً حسب الـ Latency
function toggleSortLatency() {
    isAscendingSort = !isAscendingSort;
    const sorted = [...currentScanResults].sort((a, b) => {
        const timeA = parseFloat(a.time) || 0;
        const timeB = parseFloat(b.time) || 0;
        return isAscendingSort ? timeA - timeB : timeB - timeA;
    });
    renderTable(sorted);
}

// تصدير نتائج فحص النظام الحالية إلى ملف CSV وتنزيله فوراً
function exportToCSV() {
    if (currentScanResults.length === 0) {
        alert("No data available to export!");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,Target URL,HTTP Status,Latency,SSL Certificate,Security Headers\n";
    currentScanResults.forEach(res => {
        csvContent += `"${res.url}","${res.status}","${res.time}","${res.ssl_status}","${res.headers_score}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NetScan_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// دالة التحكم في القائمة الجانبية للنظام
function toggleAbout(show) {
    const sidebar = document.getElementById('aboutSidebar');
    const overlay = document.getElementById('overlay');
    if (!sidebar || !overlay) return; 

    if (show) {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100', 'pointer-events-auto');
    } else {
        sidebar.classList.add('translate-x-full');
        overlay.classList.remove('opacity-100', 'pointer-events-auto');
        overlay.classList.add('opacity-0', 'pointer-events-none');
    }
}
