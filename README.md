# ⚡ NetScan Pro - Concurrent URL Security & Status Scanner

An ultra-fast, lightweight, and modern web platform built with **FastAPI** (Python 3.13 optimized) and **Tailwind CSS** to scan and monitor multiple URLs simultaneously using asynchronous concurrency.

---

## 🚀 One-Click Installation & Launch (Quick Start)

Copy and paste this single command into your **Termux** terminal to install all dependencies, configure the project, and launch both the **Backend API** and **Frontend Web Server** at once:

cd ~ && pip install -r ~/NetScan/requirements.txt && (uvicorn NetScan.Web_Version.backend.main:app --host 0.0.0.0 --port 8000 --reload &) && cd ~/NetScan/Web_Version/frontend/ && python -m http.server 8080


​🌐 Accessing the Web Dashboard: Once executed, open your mobile or desktop browser and navigate to: http://localhost:8080
​✨ System Features
​🚀 Asynchronous Concurrency: Scans hundreds of URLs simultaneously in milliseconds via asyncio and aiohttp.
​🎨 Premium UI: Sleek, dynamic Dark Mode dashboard crafted with pure Tailwind CSS.
​🛡️ Security Check: Integrates with VirusTotal API to detect suspicious or malicious domains.
​🌐 Public & Local Ready: No heavy database required, works flawlessly completely offline or online.
​🐍 Python 3.13 Optimized: Includes custom patches for modern Python environments on Android/Termux.
​🛠️ Manual Step-by-Step Installation
​If you prefer to run and debug the components individually in separate terminal sessions:
​1. Install Dependencies
pip install -r requirements.txt

2. Start Backend Service (FastAPI)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

3. Start Frontend Server (HTML/CSS)
cd frontend
python -m http.server 8080

📊 API Endpoint Documentation
​POST /api/scan
​Evaluates an array of target domains.
​Request Body (application/json):
  {
  "urls": ["google.com", "github.com"]
}

Response Body (application/json):
  {
  "results": [
    {
      "url": "google.com",
      "status": "200",
      "time": "45ms",
      "security": "✅ CLEAN",
      "alive": true
    }
  ]
}

or if you don't like the terminal stuf then you can try the website
Developed with ❤️ for standalone and public network monitoring.
