import os
import asyncio
import aiohttp
import time
import base64
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

@asynccontextmanager
async def lifespan(app: FastAPI):
    timeout = aiohttp.ClientTimeout(total=10)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        app.state.http_session = session
        yield

app = FastAPI(title="Public NetScan API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

VT_API_KEY = os.environ.get("VIRUSTOTAL_API_KEY", "YOUR_VIRUSTOTAL_API_KEY_HERE")

class URLListInput(BaseModel):
    urls: List[str]

async def check_virustotal(session, url):
    if VT_API_KEY == "YOUR_VIRUSTOTAL_API_KEY_HERE":
        return "Not Checked"
    try:
        url_bytes = url.strip().encode('utf-8')
        base64_encoded = base64.urlsafe_b64encode(url_bytes).decode('utf-8')
        url_id = base64_encoded.rstrip('=')
        
        vt_url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
        headers = {"x-apikey": VT_API_KEY}
        
        async with session.get(vt_url, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                stats = result['data']['attributes']['last_analysis_stats']
                malicious = stats.get('malicious', 0)
                suspicious = stats.get('suspicious', 0)
                if malicious > 0 or suspicious > 0:
                    return f"⚠️ SUSPICIOUS ({malicious} flags)"
                return "✅ CLEAN"
            return "❓ UNKNOWN"
    except Exception:
        return "Error"

async def scan_single_url(session, url):
    display_url = url
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    start_time = time.time()
    try:
        async with session.get(url, timeout=5) as response:
            response_time = round((time.time() - start_time) * 1000)
            status_code = response.status
            security = await check_virustotal(session, url)
            return {"url": display_url, "status": str(status_code), "time": f"{response_time}ms", "security": security, "alive": True}
    except Exception:
        security = await check_virustotal(session, url)
        return {"url": display_url, "status": "DOWN", "time": "N/A", "security": security, "alive": False}

@app.post("/api/scan")
async def start_scan(input_data: URLListInput):
    session = app.state.http_session
    tasks = [scan_single_url(session, url) for url in input_data.urls]
    results = await asyncio.gather(*tasks)
    return {"results": results}
