require('dotenv').config();
const mongoose = require('mongoose');
const Bus = require('./models/Bus');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB. Deleting SILVER bus...');
    const result = await Bus.deleteOne({ busName: /SILVER/i });
    console.log('Delete result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Connection Error:', err);
    process.exit(1);
  });
