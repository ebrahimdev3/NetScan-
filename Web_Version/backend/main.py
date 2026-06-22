from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio
import aiohttp
import ssl
import socket
from datetime import datetime

app = FastAPI()

# تفعيل الـ CORS لتسمح للواجهة بالاتصال بالـ API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    urls: List[str]

def get_ssl_expiry_days(hostname: str) -> int:
    """جلب عدد الأيام المتبقية لانتهاء شهادة SSL"""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=3) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                # تحويل تاريخ الانتهاء إلى كائن datetime
                expire_date = datetime.strptime(cert['notAfter'], "%b %d %H:%M:%S %Y %Z")
                remaining = expire_date - datetime.utcnow()
                return remaining.days
    except Exception:
        return -1  # تعني فشل جلب الشهادة أو لا توجد شهادة

async def scan_single_url(session: aiohttp.ClientSession, url: str) -> dict:
    # تنظيف الرابط واستخراج اسم النطاق (Hostname) لأجل فحص الـ SSL
    clean_url = url.replace("https://", "").replace("http://", "").split('/')[0]
    target_url = url if url.startswith(("http://", "https://")) else f"https://{url}"
    
    result = {
        "url": url,
        "alive": False,
        "status": "CRASHED",
        "time": "0ms",
        "security": "UNKNOWN",
        "ssl_status": "No SSL/Error",
        "headers_score": "UNSAFE"
    }
    
    start_time = asyncio.get_event_loop().time()
    try:
        async with session.get(target_url, timeout=5, ssl=False) as response:
            end_time = asyncio.get_event_loop().time()
            latency = int((end_time - start_time) * 1000)
            
            result["alive"] = True
            result["status"] = str(response.status)
            result["time"] = f"{latency}ms"
            
            # 1. فحص الـ Security Headers
            headers = response.headers
            has_csp = "Content-Security-Policy" in headers
            has_xfo = "X-Frame-Options" in headers
            has_hsts = "Strict-Transport-Security" in headers
            
            # تقييم أمن الهيدرز بناءً على الشروط المطلوبة
            if has_csp and has_xfo and has_hsts:
                result["headers_score"] = "SECURE"
            elif has_csp or has_xfo or has_hsts:
                result["headers_score"] = "WARNING"
            else:
                result["headers_score"] = "UNSAFE"

            # محاكاة بسيطة لـ VirusTotal (يمكن ربطها بالـ API لاحقاً)
            result["security"] = "CLEAN" if response.status < 400 else "SUSPICIOUS"

    except Exception:
        pass # سيبقى الموقع بالحالة الافتراضية أنه مغلق

    # 2. فحص شهادة الـ SSL (يتم بشكل منفصل لضمان الدقة)
    if result["alive"]:
        days_left = await asyncio.to_thread(get_ssl_expiry_days, clean_url)
        if days_left == -1:
            result["ssl_status"] = "No SSL"
        elif days_left < 0:
            result["ssl_status"] = "EXPIRED"
        elif days_left <= 30:
            result["ssl_status"] = f"EXPIRING ({days_left} Days)"
        else:
            result["ssl_status"] = f"VALID ({days_left} Days)"
            
    return result

@app.post("/api/scan")
async def start_scan(request: ScanRequest):
    async with aiohttp.ClientSession() as session:
        tasks = [scan_single_url(session, url) for url in request.urls]
        results = await asyncio.gather(*tasks)
        return {"results": results}
