import http.server
import socketserver
import urllib.parse
import sys

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/oauth/callback':
            query = urllib.parse.parse_qs(parsed.query)
            code = query.get('code', [None])[0]
            state = query.get('state', [None])[0]
            error = query.get('error', [None])[0]

            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()

            if error:
                self.wfile.write(f"""
                <html><body>
                <h1>OAuth error: {error}</h1>
                <p>You can close this window.</p>
                </body></html>
                """.encode())
                print(f"ERROR:{error}", flush=True)
            elif code:
                self.wfile.write(f"""
                <html><body>
                <h1>Authorization successful</h1>
                <p>You can close this window and return to Kimi Code.</p>
                </body></html>
                """.encode())
                print(f"CODE:{code}", flush=True)
                print(f"STATE:{state}", flush=True)
            else:
                self.wfile.write(b"""
                <html><body>
                <h1>No code received</h1>
                </body></html>
                """)
                print("ERROR:no_code", flush=True)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress default logging
        pass

with socketserver.TCPServer(("localhost", 3456), CallbackHandler) as httpd:
    httpd.handle_request()
