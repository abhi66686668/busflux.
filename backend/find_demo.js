const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const collections = await mongoose.connection.db.collections();
  let found = false;
  for (let c of collections) {
    const name = c.collectionName;
    const docs = await c.find().toArray();
    docs.forEach(d => {
      for (let key in d) {
        if (typeof d[key] === 'string' && d[key].toLowerCase().includes('demo')) {
          console.log(`Found demo in ${name} (ID: ${d._id}), key: ${key}, value: ${d[key]}`);
          found = true;
        }
      }
    });
  }
  if (!found) console.log('No demo data found');
  process.exit(0);
}).catch(console.error);
