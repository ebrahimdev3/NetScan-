from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import asyncio
import aiohttp
import ssl
import socket
import json
from datetime import datetime

# إعداد نظام الـ Rate Limiting (محدد معدل الطلبات)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class ScanRequest(BaseModel):
    urls: List[str]

def get_ssl_expiry_days(hostname: str) -> int:
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=2) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                expire_date = datetime.strptime(cert['notAfter'], "%b %d %H:%M:%S %Y %Z")
                remaining = expire_date - datetime.utcnow()
                return remaining.days
    except Exception:
        return -1

async def scan_and_stream_url(url: str):
    clean_url = url.replace("https://", "").replace("http://", "").split('/')[0]
    target_url = url if url.startswith(("http://", "https://")) else f"https://{url}"
    
    result = {
        "url": url, "alive": False, "status": "CRASHED", 
        "time": "0ms", "security": "UNKNOWN", 
        "ssl_status": "No SSL/Error", "headers_score": "UNSAFE"
    }
    
    start_time = asyncio.get_event_loop().time()
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(target_url, timeout=4, ssl=False) as response:
                latency = int((asyncio.get_event_loop().time() - start_time) * 1000)
                result.update({
                    "alive": True, "status": str(response.status), "time": f"{latency}ms"
                })
                
                headers = response.headers
                has_csp = "Content-Security-Policy" in headers
                has_xfo = "X-Frame-Options" in headers
                has_hsts = "Strict-Transport-Security" in headers
                
                if has_csp and has_xfo and has_hsts: result["headers_score"] = "SECURE"
                elif has_csp or has_xfo or has_hsts: result["headers_score"] = "WARNING"
                
                result["security"] = "CLEAN" if response.status < 400 else "SUSPICIOUS"
    except Exception:
        pass

    if result["alive"]:
        days_left = await asyncio.to_thread(get_ssl_expiry_days, clean_url)
        if days_left == -1: result["ssl_status"] = "No SSL"
        elif days_left < 0: result["ssl_status"] = "EXPIRED"
        elif days_left <= 30: result["ssl_status"] = f"EXPIRING ({days_left} Days)"
        else: result["ssl_status"] = f"VALID ({days_left} Days)"
            
    return f"data: {json.dumps(result)}\n\n"

# معالجة طلبات الـ OPTIONS المسبقة يدوياً وتأمين قبولها من أي متصفح (Brave / Kiwi / Chrome)
@app.options("/api/scan/stream")
async def options_handler(request: Request):
    return StreamingResponse(
        content=asyncio.sleep(0),
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
            "Access-Control-Max-Age": "86400"
        }
    )

@app.post("/api/scan/stream")
@limiter.limit("5 per minute")
async def start_streaming_scan(request: ScanRequest, r: Request):
    async def event_generator():
        tasks = [scan_and_stream_url(url) for url in request.urls]
        for future in asyncio.as_completed(tasks):
            row_data = await future
            yield row_data

    # حقن هيدرز الـ CORS والـ Streaming في قلب الاستجابة مباشرة لمنع سقوطها
    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
