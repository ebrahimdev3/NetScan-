# 🌐 Advanced Async URL Monitor & Security Checker

An enterprise-grade, high-performance command-line interface (CLI) tool written in Python. It continuously monitors a list of web servers for availability, measures connection latency, sends automated email alerts upon server failure, and performs live security scans against known malicious domains using the VirusTotal API.

Built entirely on **Asynchronous I/O**, this tool can inspect hundreds of links concurrently in just a fraction of a second.

---

## 🚀 Key Features

- **Blazing Fast Concurrency:** Utilizes `asyncio` and `aiohttp` to check hundreds of websites concurrently rather than sequentially.
- **Dynamic Threading for Blocking I/O:** Runs user inputs and SMTP mailing processes within thread executors (`run_in_executor`) to prevent blocking the async event loop.
- **Security Analysis (VirusTotal Integration):** Encodes target URLs into Base64 identifiers to securely query the VirusTotal v3 API and instantly pull security engine threat stats.
- **Automated SMTP Email Alerts:** Sends immediate SSL-encrypted email alerts to the administrator if a web server returns a failure code (4xx/5xx) or drops completely offline.
- **Production-Ready Security:** Implements `os.environ` to avoid hardcoding sensitive API keys, email credentials, or passwords into the source code.
- **Persistent Logging System:** Automatically formats and tracks all HTTP status reports, latency rates, and security data inside a local chronological `monitor.log` file.

---

## 🛠️ Tech Stack & Requirements

- **Runtime Environment:** Python 3.8+
- **Core Async Library:** `aiohttp` (Asynchronous HTTP Client/Server)
- **Built-in Modules Used:** `asyncio`, `os`, `time`, `logging`, `smtplib`, `base64`, `email`

To install the necessary asynchronous library, run:
```bash
pip install aiohttp

📂 Project Directory Structure
├── monitor.py       # Single-file production codebase containing UI and async engines
├── urls.txt         # Text file container holding URLs to scan (one per line, auto-generated if missing)
└── monitor.log      # Persistent logging repository recording automated session data
🚀 Getting Started & Configuration
​To protect your sensitive credentials from being exposed, this script reads keys directly from environment variables. Set them up before running the tool.
​1. Configuration (Set Environment Variables)
​On Linux / macOS / Git Bash:
  export VIRUSTOTAL_API_KEY="your_actual_virustotal_api_key"
export ALERT_EMAIL_SENDER="your_alert_sender_email@gmail.com"
export ALERT_EMAIL_PASSWORD="your_16_digit_gmail_app_password"
export ALERT_EMAIL_RECEIVER="admin_receiver@domain.com"

On Windows Command Prompt (CMD):
  set VIRUSTOTAL_API_KEY="your_actual_virustotal_api_key"
set ALERT_EMAIL_SENDER="your_alert_sender_email@gmail.com"
set ALERT_EMAIL_PASSWORD="your_16_digit_gmail_app_password"
set ALERT_EMAIL_RECEIVER="admin_receiver@domain.com"
2. Execution
​Run the script directly via your terminal:
  python monitor.py
  
🖥️ How It Looks (Sample Output)
​When running option 2 with multiple targets inside urls.txt:
  =================================================================
🌐  Advanced URL Monitor & Security Checker (Async)  🌐
=================================================================
1. Check Single URL
2. Fast Async File Check (urls.txt)
3. Exit
=================================================================
Enter your choice (1-3): 2

🚀 Scanning 3 URLs concurrently...
[+] URL: [https://google.com](https://google.com) | Status: 200 | Time: 45ms | Security: ✅ CLEAN
[+] URL: [https://github.com](https://github.com) | Status: 200 | Time: 120ms | Security: ✅ CLEAN
[-] URL: [https://httpstat.us/500](https://httpstat.us/500) | Status: 500 | Time: 210ms | Security: ✅ CLEAN
[-] URL: [https://malicious-test-site.cc](https://malicious-test-site.cc) | Status: DOWN/FAILED | Security: ⚠️ SUSPICIOUS (4 engines flagged)

✨ Async scan finished in 0.32 seconds!
📝 Logs have been saved to 'monitor.log'

📄 Logging Output Example
​Your monitor.log file will accurately structure entries as follows:
  2026-06-16 09:45:12 - INFO - URL: [https://google.com](https://google.com) | Status: 200 | Time: 45ms | Security: ✅ CLEAN
2026-06-16 09:45:12 - ERROR - URL: [https://malicious-test-site.cc](https://malicious-test-site.cc) | Status: DOWN/FAILED | Security: ⚠️ SUSPICIOUS (4 engines flagged)
2026-06-16 09:45:13 - INFO - Email alert sent successfully for: [https://malicious-test-site.cc](https://malicious-test-site.cc)

🔒 License
​This project is open-source and available under the MIT License.