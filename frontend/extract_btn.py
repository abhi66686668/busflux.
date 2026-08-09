import re
import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('c:/Users/HP/Documents/busflux2-master/busflux2-master/frontend/admin.html', 'r', encoding='utf-8') as f:
    c = f.read()
m = re.search(r'<button[^>]*class="login-btn"[^>]*>.*?</button>', c, re.DOTALL | re.IGNORECASE)
if m:
    print(m.group(0))
else:
    print('Not found')
