import re
import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('c:/Users/HP/Documents/busflux2-master/busflux2-master/frontend/admin.html', 'r', encoding='utf-8') as f:
    c = f.read()
# Extract all script tags without src
scripts = re.findall(r'<script>(.*?)</script>', c, re.DOTALL | re.IGNORECASE)
for i, s in enumerate(scripts):
    with open(f'c:/Users/HP/Documents/busflux2-master/busflux2-master/frontend/test_script_{i}.js', 'w', encoding='utf-8') as sf:
        sf.write(s)
print(f'Extracted {len(scripts)} scripts')
