const mongoose = require('mongoose');
const Notification = require('./models/Notifications');

// Connect to MongoDB
mongoose
  .connect(
    'mongodb+srv://jarredmstiger:deeznutztoledo@testclustersms.51hca.mongodb.net/sms',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Connection error', err);
  });
// Full list of notifications
const notifications = [
  {
    messageContent: 'Hello',
    senderName: 'Juan Zamarron',
    recipientName: 'Dan Leal',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:08:45.598Z'),
    read: false,
  },
  {
    messageContent: 'Hi Juan. Checking if this reaches you at your new number.',
    senderName: 'Dan Leal',
    recipientName: 'Juan Zamarron',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:18:51.328Z'),
    read: false,
  },
  {
    messageContent: 'Yeah it does',
    senderName: 'Juan Zamarron',
    recipientName: 'Dan Leal',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:21:31.598Z'),
    read: false,
  },
  {
    messageContent: 'Awesome! I plan to come to school tomorrow at lunch.',
    senderName: 'Dan Leal',
    recipientName: 'Juan Zamarron',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:22:45.123Z'),
    read: false,
  },
  {
    messageContent: 'Liked “Yeah it does”',
    senderName: 'Dan Leal',
    recipientName: 'Juan Zamarron',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:24:12.000Z'),
    read: false,
  },
  {
    messageContent: 'Alright can’t wait',
    senderName: 'Juan Zamarron',
    recipientName: 'Dan Leal',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:26:33.444Z'),
    read: false,
  },
  {
    messageContent: 'Liked “Alright can’t wait”',
    senderName: 'Dan Leal',
    recipientName: 'Juan Zamarron',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:28:15.678Z'),
    read: false,
  },
  {
    messageContent: 'You here today?',
    senderName: 'Juan Zamarron',
    recipientName: 'Dan Leal',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:30:07.890Z'),
    read: false,
  },
  {
    messageContent: 'You can get food first. Don’t want you to starve.',
    senderName: 'Dan Leal',
    recipientName: 'Juan Zamarron',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:32:00.456Z'),
    read: false,
  },
  {
    messageContent: 'Hi Juan. Do you want me to come to school at lunch today?',
    senderName: 'Dan Leal',
    recipientName: 'Juan Zamarron',
    matchId: new mongoose.Types.ObjectId('6758119d6c1ff12b52aa9ef0'),
    action: 'Message Sent',
    timestamp: new Date('2022-09-19T21:35:18.123Z'),
    read: false,
  },
];

// Seed function
async function seedNotifications() {
  try {
    await Notification.deleteMany(); // Clear existing notifications
    console.log('Existing notifications cleared.');

    await Notification.insertMany(notifications);
    console.log('Notifications seeded successfully.');
  } catch (err) {
    console.error('Error seeding notifications:', err);
  } finally {
    mongoose.connection.close();
  }
}

// Execute seed function
seedNotifications();
