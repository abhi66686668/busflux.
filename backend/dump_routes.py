import os, re

d = 'c:/Users/HP/Documents/busflux2-master/busflux2-master/backend/routes'
with open('c:/Users/HP/Documents/busflux2-master/busflux2-master/backend/routes_summary.txt', 'w', encoding='utf-8') as out:
    for f in os.listdir(d):
        if f.endswith('.js'):
            out.write(f'\n--- {f} ---\n')
            with open(os.path.join(d, f), 'r', encoding='utf-8') as file:
                content = file.read()
                matches = re.findall(r'router\.(get|post|put|delete|patch)\((["\'].*?["\'])', content)
                for m in matches:
                    out.write(f'{m[0].upper()} {m[1]}\n')
