const fs = require('fs');
let html = fs.readFileSync('frontend/conductor.html', 'utf8');
html = html.replace(/\\`/g, '`');
html = html.replace(/\\\$/g, '$');
fs.writeFileSync('frontend/conductor.html', html);
console.log('Fixed escaped characters.');
