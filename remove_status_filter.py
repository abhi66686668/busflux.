import sys

with open('frontend/conductor.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove HTML dropdown
html_dropdown = '''              <!-- Status filter dropdown -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <label for="historyStatusFilter" style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Status:</label>
                <select id="historyStatusFilter" onchange="applyHistoryFilters()" style="width: auto; padding: 6px 12px; font-size: 0.88rem; border-radius: var(--radius); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); outline: none;">
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Declined</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>'''

content = content.replace(html_dropdown, '')

# 2. Fix applyHistoryFilters
old_apply = 'const statusVal = document.getElementById("historyStatusFilter").value;'
new_apply = 'const statusVal = "all";'
content = content.replace(old_apply, new_apply)

# 3. Fix clearHistoryFilters
old_clear = 'document.getElementById("historyStatusFilter").value = "all";'
new_clear = ''
content = content.replace(old_clear, new_clear)

with open('frontend/conductor.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done removing status filter")
