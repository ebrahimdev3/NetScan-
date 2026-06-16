import os
import asyncio
import aiohttp
import time
import logging
import smtplib
import base64
from email.mime.text import MIMEText

logging.basicConfig(
    filename='monitor.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

VT_API_KEY = os.environ.get("VIRUSTOTAL_API_KEY", "YOUR_VIRUSTOTAL_API_KEY_HERE")
EMAIL_SENDER = os.environ.get("ALERT_EMAIL_SENDER", "your_email@gmail.com")
EMAIL_PASSWORD = os.environ.get("ALERT_EMAIL_PASSWORD", "your_app_password")
EMAIL_RECEIVER = os.environ.get("ALERT_EMAIL_RECEIVER", "admin@example.com")

def send_email_alert(url, status):
    msg = MIMEText(f"Security Alert! The website {url} returned status: {status} or is completely unreachable.")
    msg['Subject'] = f"🚨 ALERT: Website Down! [{url}]"
    msg['From'] = EMAIL_SENDER
    msg['To'] = EMAIL_RECEIVER

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, EMAIL_RECEIVER, msg.as_string())
        logging.info(f"Email alert sent successfully for: {url}")
    except Exception as e:
        logging.error(f"Failed to send email alert: {e}")

async def check_virustotal(session, url):
    if VT_API_KEY == "YOUR_VIRUSTOTAL_API_KEY_HERE":
        return "Not Checked (No API Key)"
    
    try:
        url_bytes = url.encode('utf-8')
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
                    return f"⚠️ SUSPICIOUS ({malicious} engines flagged)"
                return "✅ CLEAN"
            elif response.status == 404:
                return "❓ UNKNOWN (Never Scanned)"
            else:
                return "Unknown (API Error)"
    except Exception:
        return "Error connecting to VirusTotal"

async def check_url(session, url):
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    start_time = time.time()
    try:
        async with session.get(url, timeout=5) as response:
            end_time = time.time()
            response_time = round((end_time - start_time) * 1000)
            status_code = response.status
            
            security_status = await check_virustotal(session, url)

            if 200 <= status_code < 300:
                color = GREEN
            elif 300 <= status_code < 400:
                color = YELLOW
            else:
                color = RED
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, send_email_alert, url, status_code)

            log_msg = f"URL: {url} | Status: {status_code} | Time: {response_time}ms | Security: {security_status}"
            print(f"{color}[+] {log_msg}{RESET}")
            logging.info(log_msg)

    except Exception:
        security_status = await check_virustotal(session, url)
        log_error = f"URL: {url} | Status: DOWN/FAILED | Security: {security_status}"
        print(f"{RED}[-] {log_error}{RESET}")
        logging.error(log_error)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, send_email_alert, url, "DOWN")

def display_menu():
    print("=" * 65)
    print("🌐  Advanced URL Monitor & Security Checker (Async)  🌐")
    print("=" * 65)
    print("1. Check Single URL")
    print("2. Fast Async File Check (urls.txt)")
    print("3. Exit")
    print("=" * 65)

async def main_async():
    async with aiohttp.ClientSession() as session:
        while True:
            display_menu()
            loop = asyncio.get_running_loop()
            
            choice = await loop.run_in_executor(None, input, "Enter your choice (1-3): ")
            choice = choice.strip()

            if choice == '1':
                url = await loop.run_in_executor(None, input, "Enter URL (e.g., google.com): ")
                url = url.strip()
                if url:
                    print("\nScanning...")
                    await check_url(session, url)
                    print()
                else:
                    print("Invalid input. Please enter a valid URL.\n")

            elif choice == '2':
                file_name = 'urls.txt'
                if not os.path.exists(file_name):
                    with open(file_name, 'w') as f:
                        f.write("google.com\ngithub.com\nhttpstat.us/500\n")
                    print(f"⚠️ '{file_name}' not found. Created a default file for you. Please add your URLs.")
                
                with open(file_name, 'r') as f:
                    urls = [line.strip() for line in f if line.strip()]
                
                if not urls:
                    print("The file is empty! Please add some URLs first.\n")
                    continue

                print(f"\n🚀 Scanning {len(urls)} URLs concurrently...")
                start_perf = loop.time()
                
                tasks = [check_url(session, url) for url in urls]
                await asyncio.gather(*tasks)
                
                end_perf = loop.time()
                print(f"\n✨ Async scan finished in {round(end_perf - start_perf, 2)} seconds!")
                print("📝 Logs have been saved to 'monitor.log'\n")

            elif choice == '3':
                print("Exiting tool. Goodbye!")
                break
            else:
                print("Invalid choice. Please try again.\n")

if __name__ == "__main__":
    asyncio.run(main_async())
