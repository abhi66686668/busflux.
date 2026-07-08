const fs = require('fs');
const path = require('path');
const dir = './frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Regex to remove the 'My Bookings' nav item
  const regex = /<a\s+href="bookings\.html"[^>]*id="sideNavBookings"[^>]*>[\s\S]*?<\/a>/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(filePath, content);
    console.log('Removed from ' + file);
  }
});
