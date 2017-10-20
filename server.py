from http.server import HTTPServer
from http.server import BaseHTTPRequestHandler
from http import HTTPStatus
import os

class MyHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(HTTPStatus.OK)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'Hello, Python!')
        return


def run(server_class=HTTPServer, handler_class=MyHandler):
    port = int(os.environ.get("PORT", 8000))
    server_address = ('localhost', port)
    httpd = server_class(server_address, handler_class)
    try:
        print("Server running on port "+str(port))
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Stop the server on port "+str(port))
        httpd.socket.close()


if __name__ == '__main__':
    run()