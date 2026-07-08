require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Bus = require('./models/Bus');
const OwnerTransaction = require('./models/OwnerTransaction');

async function seedData() {
  await connectDB();
  
  try {
    const buses = await Bus.find();
    if (buses.length === 0) {
      console.log("No buses found to seed data for.");
      process.exit(0);
    }
    
    console.log(`Found ${buses.length} buses. Seeding transactions...`);
    
    // Clear old transactions for testing purposes
    await OwnerTransaction.deleteMany({});
    
    const transactionsToInsert = [];
    
    for (const bus of buses) {
      // Create 3 to 7 random transactions for each bus
      const numTx = Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < numTx; i++) {
        // Random ticket amount between 100 and 1000
        const ticketAmount = Math.floor(Math.random() * 90) * 10 + 100;
        const commissionAmount = Math.round(ticketAmount * 0.10);
        const ownerAmount = ticketAmount - commissionAmount;
        
        // Random date within the last 30 days
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() - randomDaysAgo);
        
        transactionsToInsert.push({
          bookingId: new mongoose.Types.ObjectId(), // Fake booking ID
          busId: bus._id,
          ticketAmount,
          commissionAmount,
          ownerAmount,
          status: 'Pending Settlement',
          bookingDate
        });
      }
    }
    
    await OwnerTransaction.insertMany(transactionsToInsert);
    console.log(`Successfully inserted ${transactionsToInsert.length} test OwnerTransactions.`);
    
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seedData();
