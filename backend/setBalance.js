const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    const User = require('./models/User');
    await User.updateMany({}, { $set: { monthlyPassBalance: 40 } });
    console.log("Updated all users pass balance to 40");
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
