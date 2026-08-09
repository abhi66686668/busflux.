import re
with open('c:/Users/HP/Documents/busflux2-master/busflux2-master/frontend/admin.html', 'r', encoding='utf-8') as f:
    c = f.read()

print('Sign in text:', re.findall(r'<.*?Sign In as Admin.*?>', c, re.IGNORECASE))
