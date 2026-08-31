const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdminAccount = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/utilix';
    
    await mongoose.connect(mongoUri);
    console.log('Seed worker connected to database successfully.');

    const existingAdmin = await User.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('System Note: Admin account profile already exists in the collection.');
    } else {
      // Create a fresh default admin document
      const masterAdmin = new User({
        name: 'Utility Control Director',
        email: 'admin@utilix.com',
        phone: '+8801700000000',
        username: 'admin',
        password: '123',
        role: 'admin',
        employeeId: '',
        auditorId: ''
      });

      await masterAdmin.save();
      console.log('Success: Central Command Manager account seeded successfully!');
    }

    await mongoose.disconnect();
    console.log('Seed worker disconnected cleanly.');

  } catch (error) {
    console.error('Critical failure running admin seed payload:', error);
    process.exit(1);
  }
};

seedAdminAccount();