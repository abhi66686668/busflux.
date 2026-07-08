const fs = require('fs'); 
const files = fs.readdirSync('.'); 
files.filter(f => f.endsWith('.html') || f.endsWith('.js')).forEach(f => { 
  const content = fs.readFileSync(f, 'utf8'); 
  if(content.includes('L.map(')) 
    console.log(f); 
});
