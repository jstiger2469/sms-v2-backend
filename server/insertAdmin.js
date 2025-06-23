require('./db/connection');
const Admin = require('./models/Admin');

const adminData = {
  auth0Id: 'auth0|6854cc9a327a8fb3e9f0054c',
  name: 'Jarred Stiger'
};

Admin.create(adminData)
  .then(doc => {
    console.log('Inserted admin:', doc);
    process.exit();
  })
  .catch(err => {
    console.error('Error inserting admin:', err);
    process.exit(1);
  }); 