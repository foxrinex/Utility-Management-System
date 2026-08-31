const mongoose = require('mongoose');
const User = require('./models/User');

const seedResidentAccount = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/utilix';
    
    await mongoose.connect(mongoUri);
    console.log('Seed worker connected to database successfully.');

    const existingResident = await User.findOne({ username: 'resident' });

    if (existingResident) {
      console.log('Resident account already exists.');
    } else {
      const defaultResident = new User({
        name: 'Default Resident',
        email: 'resident@utilix.com',
        phone: '+8801712345678',
        username: 'resident',
        password: '123',
        role: 'resident',
        address: 'Sector 10, Dhaka, Bangladesh'
      });

      await defaultResident.save();
      console.log('Success: Default Resident account created!');
    }

    await mongoose.disconnect();
    console.log('Done.');

  } catch (error) {
    console.error('Failure seeding resident payload:', error);
    process.exit(1);
  }
};

seedResidentAccount();
