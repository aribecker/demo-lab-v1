"""Verify two packaged Spring Boot processes through real REST requests."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json, os, subprocess, threading, time, urllib.request

root = Path(__file__).resolve().parents[1]
class Provider(BaseHTTPRequestHandler):
    calls = 0
    def do_GET(self):
        Provider.calls += 1
        body = json.dumps({'current': {'time': '2026-10-06T20:00', 'temperature_2m': 18,
            'apparent_temperature': 17, 'relative_humidity_2m': 60, 'wind_speed_10m': 12,
            'weather_code': 0}}).encode()
        self.send_response(200); self.end_headers(); self.wfile.write(body)
    def log_message(self, *args): pass

def get(url):
    return urllib.request.urlopen(url, timeout=5).read()

def ready(port, process):
    for _ in range(120):
        if process.poll() is not None: raise RuntimeError('Spring Boot exited before health check')
        try:
            if get(f'http://localhost:{port}/health') == b'ok': return
        except OSError: pass
        time.sleep(.25)
    raise TimeoutError('Spring Boot health check')

provider = ThreadingHTTPServer(('127.0.0.1', 0), Provider)
threading.Thread(target=provider.serve_forever, daemon=True).start()
processes = []
try:
    for module, artifact, port, extra in [
        ('weather-service', 'weather-service', 18081, {'WEATHER_PRIMARY_URL': f'http://127.0.0.1:{provider.server_port}/primary'}),
        ('java-backend', 'weather-java', 18080, {'WEATHER_SERVICE_URL': 'http://127.0.0.1:18081/api/weather'})]:
        env = dict(os.environ, PORT=str(port), **extra)
        log = open(root / module / 'target' / 'smoke.log', 'w')
        process = subprocess.Popen(['java', '-jar', str(root / module / 'target' / f'{artifact}-0.0.8.jar')], env=env, stdout=log, stderr=subprocess.STDOUT)
        processes.append((process, log)); ready(port, process)
    for _ in range(2):
        data = json.loads(get('http://localhost:18080/api/hello'))
        assert data['version'] == '0.0.8'
        assert data['weather']['temperature'] == 18
        assert 'Weather microservice' in data['architecture']
    assert Provider.calls == 2, Provider.calls
    print('PASS: main API → independent weather process → provider; two fresh REST requests')
finally:
    for process, log in reversed(processes):
        process.terminate()
        try: process.wait(timeout=10)
        except subprocess.TimeoutExpired: process.kill(); process.wait()
        log.close()
    provider.shutdown(); provider.server_close()
