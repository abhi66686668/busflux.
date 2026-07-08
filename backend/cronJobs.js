const cron = require('node-cron');
const User = require('./models/User');
const Notification = require('./models/Notification');

function startCronJobs(io) {
  // Run every day at 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cron job for monthly pass expiry...');
    try {
      const now = new Date();
      const in3Days = new Date(now);
      in3Days.setDate(in3Days.getDate() + 3);
      
      const in1Day = new Date(now);
      in1Day.setDate(in1Day.getDate() + 1);

      const startOf3Days = new Date(in3Days.setHours(0, 0, 0, 0));
      const endOf3Days = new Date(in3Days.setHours(23, 59, 59, 999));

      const startOf1Day = new Date(in1Day.setHours(0, 0, 0, 0));
      const endOf1Day = new Date(in1Day.setHours(23, 59, 59, 999));

      const users3Days = await User.find({
        monthlyPassExpiry: { $gte: startOf3Days, $lte: endOf3Days }
      });

      const users1Day = await User.find({
        monthlyPassExpiry: { $gte: startOf1Day, $lte: endOf1Day }
      });

      for (const user of users3Days) {
        const notif = await Notification.create({
          title: 'Monthly Pass Expiring Soon',
          message: 'Your monthly pass will expire in 3 days. Renew now to carry over your balance!',
          type: 'warning',
          targetRole: 'user',
          targetUser: user._id
        });
        if (io) {
          io.to(user._id.toString()).emit('new_notification', notif);
          io.to(user._id.toString()).emit('user_data_updated');
        }
      }

      for (const user of users1Day) {
        const notif = await Notification.create({
          title: 'Monthly Pass Expiring Tomorrow',
          message: 'Your monthly pass expires tomorrow! Renew immediately to keep your balance.',
          type: 'warning',
          targetRole: 'user',
          targetUser: user._id
        });
        if (io) {
          io.to(user._id.toString()).emit('new_notification', notif);
          io.to(user._id.toString()).emit('user_data_updated');
        }
      }

      console.log(`Cron complete: Notified ${users3Days.length} users (3 days) and ${users1Day.length} users (1 day).`);
    } catch (error) {
      console.error('Error in pass expiry cron job:', error);
    }
  });
}

module.exports = { startCronJobs };
