const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/busflux').then(async () => {
    const Transaction = require('./models/Transaction');
    const User = require('./models/User');
    const txs = await Transaction.find({});
    let c = 0;
    for(let t of txs){
        if (!t.userId) {
            await Transaction.findByIdAndDelete(t._id);
            c++;
            continue;
        }
        const u = await User.findById(t.userId);
        if(!u || !u.name) {
            await Transaction.findByIdAndDelete(t._id);
            c++;
        }
    }
    console.log("Deleted", c);
    mongoose.disconnect();
});
