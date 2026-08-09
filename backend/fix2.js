const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://abhishek:Abhi123456789@cluster0.kis8mkj.mongodb.net/busflux?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}));
    const users = await User.find().sort({ createdAt: -1 }).limit(1);
    if(users.length) {
        console.log('Found user:', users[0]._id, 'Current Balance:', users[0].balance);
        await User.updateOne({_id: users[0]._id}, {$inc: {balance: 100}});
        console.log('Added 100 bonus!');
    } else {
        console.log('No users found');
    }
    process.exit();
}).catch(console.error);
