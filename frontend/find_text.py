import os
import re

found = False
for file in os.listdir('.'):
    if file.endswith('.html') or file.endswith('.js'):
        try:
            with open(file, 'r', encoding='utf-8') as f:
                c = f.read()
                if re.search(r'Sign in to your administrator dashboard', c, re.IGNORECASE):
                    print(f'Found in {file}')
                    found = True
        except Exception as e:
            pass

if not found:
    print('Not found')
