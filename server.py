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
    # ON_HEROKU = os.environ.get('ON_HEROKU')
    # if ON_HEROKU:
    #     # get the heroku port 
    #     port = int(os.environ.get("PORT", 17995))  # as per OP comments default is 17995
    # else:
    #     port = 3000

    server_address = ('localhost', 8000)
    httpd = server_class(server_address, handler_class)
    try:
        print("Server works on http://localhost:8000")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Stop the server on http://localhost:8000")
        httpd.socket.close()


if __name__ == '__main__':
    run()