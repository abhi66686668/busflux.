const fs = require('fs');
const lines = fs.readFileSync('frontend/conductor.html', 'utf8').split('\n');

const newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (i < 666 || i > 860) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('frontend/conductor.html', newLines.join('\n'));
console.log('Fixed conductor.html!');
