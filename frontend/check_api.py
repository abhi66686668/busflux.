import re
with open('admin.html', 'r', encoding='utf-8') as f:
    c = f.read()
print('API definition:', re.findall(r'const API\s*=.*', c))
