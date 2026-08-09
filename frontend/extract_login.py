import re
with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()
matches = re.findall(r'async function handleAdminLogin.*?^}', content, re.DOTALL | re.MULTILINE)
if not matches:
    matches = re.findall(r'document\.getElementById\(\'adminLoginBtn\'\)\.addEventListener\(\'click\', async \(\) => \{.*?^\}\);', content, re.DOTALL | re.MULTILINE)
if not matches:
    matches = re.findall(r'(?:function adminLogin|async function adminLogin|const adminLogin = async).*?\{.*?(?:\n\s*\}|^\})', content, re.DOTALL | re.MULTILINE)
print('\n---\n'.join(matches))
