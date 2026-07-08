const fs = require('fs');
const html = fs.readFileSync('c:/Users/HP/Documents/busflux2-master/busflux2-master/frontend/admin.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  fs.writeFileSync('c:/Users/HP/Documents/busflux2-master/busflux2-master/frontend/test_admin.js', scriptMatch[1]);
  console.log('Extracted JS to test_admin.js');
} else {
  console.log('No script found');
}
