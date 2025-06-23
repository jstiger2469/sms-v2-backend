require('./db/connection');
const Admin = require('./models/Admin');

Admin.find().then(admins => {
  console.log('Admins in the database:', admins);
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
}); 