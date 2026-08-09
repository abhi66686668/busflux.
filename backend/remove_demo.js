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
      let isDemo = false;
      for (let key in d) {
        if (typeof d[key] === 'string' && d[key].toLowerCase().includes('demo')) {
          isDemo = true;
          break;
        }
      }
      
      if (isDemo) {
        await c.deleteOne({ _id: d._id });
        deletedInCollection++;
        totalDeleted++;
      }
    }
    
    if (deletedInCollection > 0) {
      console.log(`Deleted ${deletedInCollection} demo entries from ${name}`);
    }
  }
  
  console.log(`Finished. Total demo entries deleted: ${totalDeleted}`);
  process.exit(0);
}).catch(console.error);
