const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const collections = await mongoose.connection.db.collections();
  let totalDeleted = 0;
  
  for (let c of collections) {
    const name = c.collectionName;
    const docs = await c.find().toArray();
    let deletedInCollection = 0;
    
    for (let d of docs) {
      let isFake = false;
      for (let key in d) {
        if (typeof d[key] === 'string' && d[key].toLowerCase().includes('fake')) {
          isFake = true;
          break;
        }
      }
      
      if (isFake) {
        await c.deleteOne({ _id: d._id });
        deletedInCollection++;
        totalDeleted++;
      }
    }
    
    if (deletedInCollection > 0) {
      console.log(`Deleted ${deletedInCollection} fake entries from ${name}`);
    }
  }
  
  console.log(`Finished. Total fake entries deleted: ${totalDeleted}`);
  process.exit(0);
}).catch(console.error);
