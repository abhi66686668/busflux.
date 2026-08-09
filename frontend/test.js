const fs = require('fs');
let code = fs.readFileSync('../backend/routes/conductorRoutes.js', 'utf8');

// Replace all instances of the specific select string
const oldSelect = 'select("name email phone userPhoto balance ageGroup age")';
const newSelect = 'select("name email phone userPhoto balance ageGroup age monthlyPassBalance monthlyPassExpiry")';

code = code.split(oldSelect).join(newSelect);

// Handle the populate for bookings
const oldPopulate = 'populate("userId", "name email phone userPhoto balance ageGroup age")';
const newPopulate = 'populate("userId", "name email phone userPhoto balance ageGroup age monthlyPassBalance monthlyPassExpiry")';

code = code.split(oldPopulate).join(newPopulate);

fs.writeFileSync('../backend/routes/conductorRoutes.js', code);
console.log('Fixed /search-passenger to return monthly pass data');
