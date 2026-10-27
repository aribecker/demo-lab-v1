#!/usr/bin/env python3
"""Start the packaged JAR and exercise real HTTP with local weather providers."""
import json
import os
from pathlib import Path
import socket
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
JAR = ROOT / 'weather-service/target/weather-service-2.0.0.jar'
ORIGIN = 'http://localhost:5173'
mode = {'fail': False, 'calls': 0}


class Provider(BaseHTTPRequestHandler):
    def do_GET(self):
        mode['calls'] += 1
        payload = {'current': {'time': '2026-10-20T09:00', 'temperature_2m': 21.4,
                   'apparent_temperature': 20.1, 'relative_humidity_2m': 64, 'wind_speed_10m': 12.3}}
        encoded = json.dumps(payload).encode()
        self.send_response(503 if mode['fail'] else 200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, *_args):
        pass


def get(base, path):
    request = Request(base + path, headers={'Accept': 'application/json', 'Origin': ORIGIN})
    try:
        response = urlopen(request, timeout=5)
    except HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, json.load(response)


def main():
    assert JAR.is_file(), f'Run mvn package first: {JAR}'
    fixture = ThreadingHTTPServer(('127.0.0.1', 0), Provider)
    threading.Thread(target=fixture.serve_forever, daemon=True).start()
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        app_port = listener.getsockname()[1]
    base = f'http://127.0.0.1:{app_port}'
    provider = f'http://127.0.0.1:{fixture.server_port}/weather'
    log_path = JAR.parent / 'smoke-java.log'
    with log_path.open('w') as log:
        process = subprocess.Popen(['java', '-jar', str(JAR), f'--server.port={app_port}',
                                    f'--weather.primary-url={provider}', f'--weather.fallback-url={provider}',
                                    f'--app.allowed-origins={ORIGIN}'], stdout=log, stderr=subprocess.STDOUT,
                                   cwd=ROOT, env=os.environ.copy())
        try:
            deadline = time.monotonic() + 30
            while True:
                try:
                    status, headers, body = get(base, '/health')
                    assert status == 200 and body == {'status': 'UP', 'version': '2.0.0'}
                    assert headers['Cache-Control'] == 'no-store'
                    assert mode['calls'] == 0
                    break
                except (URLError, ConnectionError):
                    if time.monotonic() >= deadline or process.poll() is not None:
                        raise RuntimeError(f'JAR did not start; see {log_path}') from None
                    time.sleep(.2)
            ids = []
            for _ in range(2):
                status, headers, body = get(base, '/api/weather')
                assert status == 200 and body['temperatureC'] == 21.4
                assert body['observedAt'] == '2026-10-20T12:00:00Z'
                assert body['provider'] == 'Open-Meteo'
                assert headers['Access-Control-Allow-Origin'] == ORIGIN
                assert headers['X-Request-Id'] == body['requestId']
                assert headers['Cache-Control'] == 'no-store'
                ids.append(body['requestId'])
            assert ids[0] != ids[1]
            mode['fail'] = True
            status, _headers, body = get(base, '/api/weather')
            assert status == 502 and body['code'] == 'PROVIDER_UNAVAILABLE' and body['retryable'] is False
            print(json.dumps({'jar': JAR.name, 'health': 'UP', 'weather': '200 twice',
                              'uniqueRequestIds': True, 'cors': 'exact origin', 'providerFailure': 502}))
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            fixture.shutdown()
            fixture.server_close()


if __name__ == '__main__':
    main()
