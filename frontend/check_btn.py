import re
with open('c:/Users/HP/Documents/busflux2-master/busflux2-master/frontend/admin.html', 'r', encoding='utf-8') as f:
    c = f.read()

print('Button HTML:', re.findall(r'<.*?id="adminLoginBtn".*?>', c))
print('Form tags:', re.findall(r'<form.*?>', c))
