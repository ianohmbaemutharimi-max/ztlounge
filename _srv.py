import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
os.chdir(r"D:\zt lounge\zt-lounge-demo\zt-lounge")
ThreadingHTTPServer(("127.0.0.1", 8011), SimpleHTTPRequestHandler).serve_forever()
