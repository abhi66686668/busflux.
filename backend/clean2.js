const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/busflux').then(async () => {
    const User = require('./models/User');
    const Transaction = require('./models/Transaction');
    
    // Find all users without a name
    const users = await User.find({});
    let noNameUsers = users.filter(u => !u.name || u.name.trim() === '');
    
    console.log("Users without name:", noNameUsers.length);
    let deletedTxs = 0;
    
    for (const u of noNameUsers) {
        // Delete their transactions
        const res = await Transaction.deleteMany({ userId: u._id });
        deletedTxs += res.deletedCount;
        
        // Also delete the user just in case
        await User.findByIdAndDelete(u._id);
    }
    
    console.log("Deleted transactions:", deletedTxs);
    mongoose.disconnect();
});
