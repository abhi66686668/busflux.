import re

with open('frontend/admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject statusDot into renderConductorsGrid
old_render = '''      const busHtml = assignedBus 
        ? `<span class="badge badge-teal" style="margin-top:6px"><i class="fas fa-bus" style="font-size:.65rem;margin-right:4px"></i>${assignedBus.busName}</span>`
        : `<span class="badge badge-orange" style="margin-top:6px"><i class="fas fa-bus" style="font-size:.65rem;margin-right:4px"></i>No Assigned Bus</span>`;

      return `
        <div class="user-card">
          ${c.userPhoto
            ? `<img class="uc-avatar" src="${getImageUrl(c.userPhoto)}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'" alt="">`
            : `<div class="uc-avatar" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;background:rgba(168,85,247,.15);color:#a855f7">${(c.name||'C')[0].toUpperCase()}</div>`}
          <div class="uc-info">'''

new_render = '''      const busHtml = assignedBus 
        ? `<span class="badge badge-teal" style="margin-top:6px"><i class="fas fa-bus" style="font-size:.65rem;margin-right:4px"></i>${assignedBus.busName}</span>`
        : `<span class="badge badge-orange" style="margin-top:6px"><i class="fas fa-bus" style="font-size:.65rem;margin-right:4px"></i>No Assigned Bus</span>`;

      const isOnline = window.onlineUserIds && window.onlineUserIds.has(c._id);
      const statusDot = isOnline 
        ? `<div style="position:absolute;bottom:0;right:0;width:14px;height:14px;background:var(--success);border:2px solid var(--card-bg);border-radius:50%;z-index:2;" title="Online (${c._id})"></div>`
        : `<div style="position:absolute;bottom:0;right:0;width:14px;height:14px;background:var(--danger);border:2px solid var(--card-bg);border-radius:50%;z-index:2;" title="Offline (${c._id})"></div>`;

      return `
        <div class="user-card">
          <div style="position:relative;display:inline-block;flex-shrink:0;">
            ${c.userPhoto
              ? `<img class="uc-avatar" src="${getImageUrl(c.userPhoto)}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'" alt="">`
              : `<div class="uc-avatar" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;background:rgba(168,85,247,.15);color:#a855f7">${(c.name||'C')[0].toUpperCase()}</div>`}
            ${statusDot}
          </div>
          <div class="uc-info">'''

content = content.replace(old_render, new_render)

# 2. Inject Socket.IO logic at the end of the file
old_bottom = '''// ── Init ──
checkAuth();

// ================= THEME TOGGLE ================='''

new_bottom = '''// ── Init ──
checkAuth();

// WebSocket connection for real-time notifications
const SOCKET_URL = API.replace('/api', '');
const socket = io(SOCKET_URL);

socket.on('connect', () => {
  const badge = document.getElementById('socketStatusBadge');
  if(badge) {
    badge.className = "topbar-badge";
    badge.innerHTML = `<i class="fas fa-check-circle" style="font-size:.7rem"></i> Connected`;
  }
});

socket.on('disconnect', () => {
  const badge = document.getElementById('socketStatusBadge');
  if(badge) {
    badge.className = "topbar-badge offline";
    badge.innerHTML = `<i class="fas fa-times-circle" style="font-size:.7rem"></i> Offline`;
  }
});

if (adminToken) {
  fetchAdminNotifications();
  
  socket.on('new_admin_notification', (notif) => {
    toast("New Alert: " + notif.message, notif.type || "info");
    fetchAdminNotifications();
  });
  
  socket.on('admin_data_updated', () => {
    loadDashboard();
    loadTransactions();
    loadBookings();
  });
  
  window.onlineUserIds = new Set();
  socket.on('online_users_update', (usersArray) => {
    window.onlineUserIds = new Set(usersArray);
    renderConductorsGrid();
  });
}

// ================= THEME TOGGLE ================='''

content = content.replace(old_bottom, new_bottom)

with open('frontend/admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
