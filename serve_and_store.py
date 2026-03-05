import http.server
import socketserver
import threading
import csv
import json
import os
from datetime import datetime

PORT = 8080
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.')
CSV_FILE = 'data.csv'
CSV_HEADERS = ['timestamp', 'ip', 'name', 'email', 'phone', 'subject', 'message']

# Create CSV with headers if it doesn't exist
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
        csv.writer(f).writerow(CSV_HEADERS)

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        super().do_GET()

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path != '/submit':
            self.send_error(404)
            return

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')

        try:
            data = json.loads(post_data)
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode())
            return

        row = [
            datetime.now().isoformat(),
            self.client_address[0],
            data.get('from_name', ''),
            data.get('from_email', ''),
            data.get('phone', ''),
            data.get('subject', ''),
            data.get('message', ''),
        ]

        with open(CSV_FILE, 'a', newline='', encoding='utf-8') as csvfile:
            csv.writer(csvfile).writerow(row)

        print(f'  -> Saved contact from {data.get("from_name", "?")} ({data.get("from_email", "?")})')

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'ok'}).encode())

os.chdir(WEB_DIR)

httpd = socketserver.TCPServer(("", PORT), RequestHandler)

print(f"Serving at http://localhost:{PORT}")
threading.Thread(target=httpd.serve_forever, daemon=True).start()

input("Press Enter to stop server...\n")
httpd.shutdown()
