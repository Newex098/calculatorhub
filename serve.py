#!/usr/bin/env python3
"""
CalculatorHub - Local HTTP Preview Server
Zero-dependency preview server for local development and mobile browser testing.
"""

import http.server
import socketserver
import sys
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def start_server():
    port = PORT
    for attempt in range(5):
        try:
            with socketserver.TCPServer(("0.0.0.0", port), CustomHandler) as httpd:
                print("=" * 60)
                print(" 🚀 CalculatorHub Local Preview Server Running")
                print("=" * 60)
                print(f" • Homepage:   http://localhost:{port}/index.html")
                print(f" • Age Calc:    http://localhost:{port}/calculators/age/index.html")
                print(f" • Percentage: http://localhost:{port}/calculators/percentage/index.html")
                print(f" • SIP Calc:   http://localhost:{port}/calculators/sip/index.html")
                print(f" • GST Calc:   http://localhost:{port}/calculators/gst/index.html")
                print(f" • EMI Calc:   http://localhost:{port}/calculators/emi/index.html")
                print(f" • Calculator: http://localhost:{port}/calculator.html")
                print("=" * 60)
                print(" Open either link above in your mobile browser (Chrome/Firefox).")
                print(" Press Ctrl+C in Termux to stop the server.")
                print("=" * 60)
                sys.stdout.flush()
                httpd.serve_forever()
        except OSError as e:
            if "Address already in use" in str(e):
                port += 1
            else:
                raise e

if __name__ == '__main__':
    try:
        start_server()
    except KeyboardInterrupt:
        print("\nServer stopped.")
