import os

d = 'c:/Users/HP/Documents/busflux2-master/busflux2-master/backend/models'
with open('c:/Users/HP/Documents/busflux2-master/busflux2-master/backend/models_summary.txt', 'w', encoding='utf-8') as out:
    for f in os.listdir(d):
        if f.endswith('.js'):
            out.write(f'\n--- {f} ---\n')
            with open(os.path.join(d, f), 'r', encoding='utf-8') as file:
                content = file.read()
                # Find the schema definition block
                import re
                schema_match = re.search(r'new mongoose\.Schema\(([\s\S]+?)\);\s*module\.exports', content)
                if schema_match:
                    out.write(schema_match.group(1).strip() + '\n')
                else:
                    out.write(content + '\n')
