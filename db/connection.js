const mongoose = require('mongoose');
require('dotenv').config();
console.log(process.env.MONGODB_URL);
mongoose.connect(process.env.MONGODB_URL, {});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('connected to db');
});
