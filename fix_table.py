import sys
import re

with open('frontend/conductor.html', 'r', encoding='utf-8') as f:
    content = f.read()

# The replace_file_content tool left this mess:
broken_block = '''          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>'''

# We need to replace it with the correct table structure:
fixed_block = '''          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Passenger</th>
                  <th>Route</th>
                  <th>Date & Time</th>
                  <th>Ticket ID</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="historyTableBody">
                <tr>
                  <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 6px;"></i> Loading logs...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>'''

if broken_block in content:
    content = content.replace(broken_block, fixed_block)
    with open('frontend/conductor.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed header and tbody')
else:
    print('Broken block not found. Trying regex...')
    # fallback
    pass

