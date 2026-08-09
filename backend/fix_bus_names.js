const mongoose = require('mongoose');
require('dotenv').config();
const Bus = require('./models/Bus');

async function fixBusNames() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/busflux');
    const buses = await Bus.find({ 
      $or: [
        { busName: { $exists: false } }, 
        { busName: '' }, 
        { busName: null }
      ] 
    });
    
    console.log(`Found ${buses.length} buses with missing busName.`);
    
    let updatedCount = 0;
    for (let bus of buses) {
      if (bus.busNumber) {
        bus.busName = 'Bus ' + bus.busNumber;
        await bus.save();
        updatedCount++;
      } else if (bus.name) {
        bus.busName = bus.name;
        await bus.save();
        updatedCount++;
      }
    }
    
    console.log(`Successfully updated ${updatedCount} buses.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixBusNames();
