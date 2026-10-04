import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class RangeHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and Cache-Control
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        f = None
        if os.path.isdir(path):
            return super().send_head()

        ctype = self.guess_type(path)
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(f.fileno())
        total_len = fs.st_size
        range_header = self.headers.get('Range')

        if range_header:
            match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                start = int(match.group(1))
                end = int(match.group(2)) if match.group(2) else total_len - 1
                if start >= total_len:
                    self.send_error(416, "Requested Range Not Satisfiable")
                    f.close()
                    return None
                if end >= total_len:
                    end = total_len - 1
                length = end - start + 1
                self.send_response(206, "Partial Content")
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Range", f"bytes {start}-{end}/{total_len}")
                self.send_header("Content-Length", str(length))
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                self.end_headers()
                f.seek(start)
                return f

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(total_len))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        """Copy specific length if partial content, else full file"""
        range_header = self.headers.get('Range')
        if range_header and hasattr(self, '_headers_buffer'):
            # Check if this was a 206 response
            pass
        # SimpleHTTPRequestHandler defaults to copying until EOF
        # In partial range, we should only copy the requested length
        content_range = self.headers.get('Range')
        if content_range:
            match = re.match(r'bytes=(\d+)-(\d*)', content_range)
            if match:
                start = int(match.group(1))
                fs = os.fstat(source.fileno())
                total_len = fs.st_size
                end = int(match.group(2)) if match.group(2) else total_len - 1
                if end >= total_len:
                    end = total_len - 1
                length = end - start + 1
                bytes_left = length
                bufsize = 64 * 1024
                while bytes_left > 0:
                    read_size = min(bufsize, bytes_left)
                    chunk = source.read(read_size)
                    if not chunk:
                        break
                    outputfile.write(chunk)
                    bytes_left -= len(chunk)
                return

        super().copyfile(source, outputfile)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server_address = ('', port)
    httpd = ThreadingHTTPServer(server_address, RangeHTTPRequestHandler)
    print(f"High-Performance Range-Enabled HTTP Server listening on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
