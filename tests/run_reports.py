"""Run the actual embedded application code in an isolated headless Edge profile."""
from pathlib import Path
import re
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
edge = Path('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
source = (root / 'index.html').read_text(encoding='utf-8')
scripts = re.findall(r'<script>(.*?)</script>', source, re.S)
assert len(scripts) == 4, 'Unexpected script layout'
scripts[1] = scripts[1].replace('db.init();', '')
scripts[3] = scripts[3].replace('    app.init();', '')
tests = (root / 'tests/reports.js').read_text(encoding='utf-8')
with tempfile.TemporaryDirectory(prefix='zone-report-tests-') as temp:
    folder = Path(temp)
    page = folder / 'tests.html'
    page.write_text('<!doctype html><meta charset="utf-8"><body>' +
                    ''.join('<script>' + s + '</script>' for s in scripts) +
                    '<script>' + tests + '</script>', encoding='utf-8')
    result = subprocess.run([str(edge), '--headless', '--disable-gpu', '--disable-gpu-sandbox', '--no-sandbox', '--no-first-run',
                             '--no-default-browser-check', '--disable-extensions',
                             '--user-data-dir=' + str(folder / 'profile'),
                             '--dump-dom', page.as_uri()], capture_output=True, timeout=45)
    output = result.stdout.decode('utf-8', errors='replace')
    match = re.search(r'<pre id="results">(.*?)</pre>', output, re.S)
    if not match:
        print(result.stderr.decode('utf-8', errors='replace')[-2000:])
        raise SystemExit('Browser did not return test results')
    print(match[1])
    if 'FAIL ' in match[1]:
        raise SystemExit(1)
