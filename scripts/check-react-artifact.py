"""Check that the executable Java artifact contains the verified React build."""
from pathlib import Path
import json
import zipfile
from html.parser import HTMLParser

root = Path(__file__).resolve().parents[1]
artifact = root / 'java-backend/target/weather-java-0.0.8.jar'
dist = root / 'frontend/dist'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.root = False
        self.loading = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script':
            self.scripts.append(attrs)
        if attrs.get('id') == 'root':
            self.root = True
        if attrs.get('id') == 'weather-card' and attrs.get('aria-busy') == 'true':
            self.loading = True

with zipfile.ZipFile(artifact) as jar:
    names = jar.namelist()
    for path in dist.rglob('*'):
        if path.is_file():
            entry = 'BOOT-INF/classes/public/' + path.relative_to(dist).as_posix()
            assert jar.read(entry) == path.read_bytes(), entry
    for required in ['index.html', 'app.js', 'styles.css']:
        assert 'BOOT-INF/classes/public/' + required in names, required
    html = jar.read('BOOT-INF/classes/public/index.html').decode()
    page = Page()
    page.feed(html)
    assert page.root and page.loading
    assert 'Version 0.0.8' in html
    assert page.scripts == [{'type': 'module', 'crossorigin': None, 'src': '/app.js'}], page.scripts
    assert 'react-dom-client.development.js' not in jar.read('BOOT-INF/classes/public/app.js').decode()
    assert not any('node_modules/' in name or name.endswith('.jsx') for name in names)
print(json.dumps({
    'result': 'PASS',
    'artifact': str(artifact.relative_to(root)),
    'checks': ['exact React assets packaged', 'stable asset URLs', 'initial accessible loading shell',
               'version contract', 'module entry', 'production bundle', 'no JSX or Node runtime in JAR'],
}, indent=2))
