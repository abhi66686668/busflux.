const fs = require('fs');
const path = 'conductor.html';
let content = fs.readFileSync(path, 'utf8');

const regex = /<aside id="sidebar">[\s\S]*?<\/aside>/;
const replacement = `<aside id="sidebar">
    <div class="sidebar-logo">
      <i class="fas fa-bus-alt"></i>
      <h2>BusFlux <span>Conductor</span></h2>
    </div>
    
    <div class="sidebar-menu">
      <div>
        <div class="menu-group-title">Analytics</div>
        <ul class="menu-links">
          <li>
            <button class="menu-link active" onclick="switchTab('dashboard', this)" id="linkDashboard">
              <i class="fas fa-chart-pie"></i>
              Dashboard
            </button>
          </li>
          <li>
            <button class="menu-link" onclick="switchTab('tracking', this)" id="linkTracking">
              <i class="fas fa-location-arrow"></i>
              Live Tracking
            </button>
          </li>
        </ul>
      </div>

      <div>
        <div class="menu-group-title">Operations</div>
        <ul class="menu-links">
          <li>
            <button class="menu-link" onclick="switchTab('billing', this)" id="linkBilling">
              <i class="fas fa-qrcode"></i>
              Issue Pass Ticket
            </button>
          </li>
          <li>
            <button class="menu-link" onclick="switchTab('history', this)" id="linkHistory">
              <i class="fas fa-clock-rotate-left"></i>
              History Log
            </button>
          </li>
        </ul>
      </div>

      <div>
        <div class="menu-group-title">Account</div>
        <ul class="menu-links">
          <li>
            <button class="menu-link" onclick="switchTab('profile', this)" id="linkProfile">
              <i class="fas fa-user-circle"></i>
              My Profile
            </button>
          </li>
          <li>
            <button class="menu-link" onclick="logout()" style="color: var(--danger);">
              <i class="fas fa-right-from-bracket"></i>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  </aside>`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log("Fixed!");
