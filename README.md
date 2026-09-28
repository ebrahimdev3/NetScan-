NetScan

NetScan is a Python-based URL monitoring and security scanning tool that checks multiple web targets concurrently, measures response latency, detects availability, and optionally checks domains against the VirusTotal API.

The project provides two interfaces:

- CLI version for terminal-based monitoring
- Web version with a FastAPI backend and browser dashboard

Features

- Concurrent URL scanning
- HTTP availability checks
- Response-time measurement
- Multi-target monitoring
- Automatic email alerts
- VirusTotal security checks
- FastAPI backend
- Web dashboard
- Command-line interface
- Asynchronous processing with "asyncio" and "aiohttp"
- Configurable targets
- Environment-based configuration

Architecture

                         ┌────────────────────┐
                         │      Targets       │
                         │                    │
                         │ google.com         │
                         │ github.com         │
                         │ example.com        │
                         └─────────┬──────────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │      NetScan       │
                         │                    │
                         │ Async Scanner      │
                         │ Availability       │
                         │ Latency            │
                         │ Security Checks    │
                         └─────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
               Availability     Latency      VirusTotal
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │      Results       │
                         └─────────┬──────────┘
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                         ▼                   ▼
                  CLI Interface       Web Dashboard
                                         │
                                         ▼
                                      FastAPI

Web Version

The web version provides a browser-based interface for scanning multiple URLs.

Stack

- Python
- FastAPI
- aiohttp
- asyncio
- HTML
- Tailwind CSS
- JavaScript
- VirusTotal API

The web backend exposes:

POST /api/scan

Example request:

{
  "urls": [
    "google.com",
    "github.com"
  ]
}

Example response:

{
  "results": [
    {
      "url": "google.com",
      "status": "200",
      "time": "45ms",
      "security": "CLEAN",
      "alive": true
    }
  ]
}

CLI Version

The CLI version provides terminal-based monitoring and scanning.

It is intended for users who prefer to monitor URLs without using the web interface.

The CLI can:

- Check target availability
- Measure connection latency
- Monitor multiple targets
- Trigger alerts when a target becomes unavailable
- Perform security checks

Concurrent Scanning

NetScan uses asynchronous I/O to process multiple URLs without waiting for each request to finish sequentially.

Conceptually:

Sequential

URL 1 ────────►
               URL 2 ────────►
                              URL 3 ────────►


Concurrent

URL 1 ────────►
URL 2 ─────────────►
URL 3 ───────►
URL 4 ────────────────►

This approach is useful for monitoring a larger number of HTTP endpoints where network I/O is the primary bottleneck.

Availability Monitoring

For each target, NetScan determines whether the URL is reachable and records the response information.

A result can include:

- Target URL
- HTTP status
- Availability state
- Response time
- Security status

Latency Measurement

NetScan measures how long a request takes to complete.

Example:

Target: github.com
Status: 200
Latency: 45ms
Available: yes

Latency measurements can be used to identify slow or unavailable endpoints.

Security Scanning

NetScan can integrate with the VirusTotal API to check domains against VirusTotal's available security intelligence.

The security check is separate from the basic availability check:

URL
 │
 ├── HTTP request ──────► Availability
 │
 └── VirusTotal ────────► Security result

A VirusTotal API key is required for this functionality.

Email Alerts

The monitoring functionality can send email notifications when a monitored target becomes unavailable.

Typical workflow:

Monitor target
      │
      ▼
Target unavailable
      │
      ▼
Detection
      │
      ▼
Email notification

Email configuration should be supplied through environment variables rather than hard-coded credentials.

Project Structure

NetScan-/
│
├── CLI_Version/
│   └── ...
│
├── Web_Version/
│   ├── backend/
│   │   └── ...
│   │
│   ├── frontend/
│   │   └── ...
│   │
│   └── requirements.txt
│
├── README.md
└── gitignore

The project intentionally keeps the CLI and Web implementations separate.

Requirements

General

- Python 3
- pip

Web Version

The Web version requires the Python dependencies listed in:

Web_Version/requirements.txt

The application is designed to work with modern Python environments, including Python 3.13.

Optional

- VirusTotal API key
- SMTP/email account for email alerts

Installation

Clone the repository:

git clone https://github.com/ebrahimdev3/NetScan-.git
cd NetScan-

Web Version Setup

Install the dependencies:

pip install -r Web_Version/requirements.txt

Start the FastAPI backend:

uvicorn Web_Version.backend.main:app --host 0.0.0.0 --port 8000

Start the frontend:

cd Web_Version/frontend
python -m http.server 8080

Open:

http://localhost:8080

The backend API will be available on:

http://localhost:8000

Termux

The Web version can also be run in Termux.

Install the dependencies:

pip install -r ~/NetScan-/Web_Version/requirements.txt

Start the backend:

uvicorn Web_Version.backend.main:app --host 0.0.0.0 --port 8000

In another terminal, start the frontend:

cd ~/NetScan-/Web_Version/frontend
python -m http.server 8080

Then open:

http://localhost:8080

Environment Variables

Sensitive configuration such as API keys and email credentials should be supplied through environment variables.

Example:

VIRUSTOTAL_API_KEY=your_api_key

For email monitoring, configure the SMTP-related variables required by the implementation.

Do not commit API keys, passwords, or SMTP credentials to GitHub.

API

Scan URLs

POST /api/scan

Request:

{
  "urls": [
    "google.com",
    "github.com"
  ]
}

The endpoint processes the supplied URLs and returns their monitoring/security results.

Performance

NetScan uses asynchronous network operations to allow multiple URL checks to be in progress simultaneously.

Performance depends on:

- Number of targets
- Network latency
- Target response time
- Concurrency configuration
- Local system resources
- VirusTotal API response time
- External rate limits

The project should not be interpreted as guaranteeing that hundreds of URLs will complete in a fixed number of milliseconds. Actual performance depends on the environment and targets.

Security Considerations

NetScan is intended for monitoring and checking URLs that you own or are authorized to monitor.

Do not use the tool to access or test systems without permission.

API keys and email credentials should never be committed to the repository.

For public deployment, additional controls should be considered, including:

- Authentication
- HTTPS
- API rate limiting
- Input validation
- CORS restrictions
- Secure secret management
- Request timeouts
- Logging and monitoring

Limitations

Current limitations include:

- Internet-dependent security checks when VirusTotal is enabled
- External API rate limits
- Network conditions affect latency measurements
- Email delivery depends on SMTP configuration
- Security results depend on VirusTotal's available data
- No persistent database is required for the basic scanner

Development Goals

The project was built to explore:

- Asynchronous Python
- Concurrent network I/O
- FastAPI
- HTTP APIs
- CLI application design
- Monitoring systems
- External API integration
- Email notification systems
- Environment-based configuration
- Basic security monitoring

Roadmap

Potential future improvements:

- Persistent monitoring history
- Historical latency charts
- Configurable scan intervals
- Better alert deduplication
- Additional notification channels
- Authentication for the Web API
- API rate limiting
- Docker deployment
- Automated tests
- CI/CD
- More detailed security reports
- Better structured logging
- Configuration files for large target lists

License

No open-source license is currently specified.

Author

ebrahimdev3

GitHub:

https://github.com/ebrahimdev3