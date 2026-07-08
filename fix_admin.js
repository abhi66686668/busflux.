const fs = require('fs');
let html = fs.readFileSync('frontend/admin.html', 'utf8');

// fix the listener
html = html.replace(
  '    if (document.getElementById(\'page-conductors\').classList.contains(\'active\')) {\r\n      renderConductorsGrid();\r\n    }',
  '    const dbg = document.getElementById(\'debugOnlineUsers\');\r\n    if (dbg) dbg.innerText = \'Online: \' + JSON.stringify(usersArray);\r\n    console.log(\"UPDATE:\", usersArray);\r\n    renderConductorsGrid();'
);

// add the debug text to the title
html = html.replace(
  '<div style=\"position:absolute;bottom:0;right:0;width:14px;height:14px;background:var(--success);border:2px solid var(--card-bg);border-radius:50%;z-index:2;\" title=\"Online\"></div>',
  '<div style=\"position:absolute;bottom:0;right:0;width:14px;height:14px;background:var(--success);border:2px solid var(--card-bg);border-radius:50%;z-index:2;\" title=\"Online (${c._id})\"></div>'
);

html = html.replace(
  '<div style=\"position:absolute;bottom:0;right:0;width:14px;height:14px;background:var(--danger);border:2px solid var(--card-bg);border-radius:50%;z-index:2;\" title=\"Offline\"></div>',
  '<div style=\"position:absolute;bottom:0;right:0;width:14px;height:14px;background:var(--danger);border:2px solid var(--card-bg);border-radius:50%;z-index:2;\" title=\"Offline (${c._id})\"></div>'
);

// add the debug header
html = html.replace(
  '<h2 style=\"margin-bottom:20px;\"><i class=\"fas fa-user-tie\"></i> Conductors Panel</h2>',
  '<h2 style=\"margin-bottom:20px;\"><i class=\"fas fa-user-tie\"></i> Conductors Panel <span id=\"debugOnlineUsers\" style=\"font-size:0.8rem;color:white;margin-left:20px\"></span></h2>'
);

fs.writeFileSync('frontend/admin.html', html);
console.log('done');
