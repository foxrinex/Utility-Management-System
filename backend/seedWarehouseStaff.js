const mongoose = require('mongoose');
const User = require('./models/user');

const seedWarehouseStaff = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/utilix';
    await mongoose.connect(mongoUri);
    console.log('Seed worker connected to MongoDB.');

    let user = await User.findOne({ username: 'warehouse' });

    if (user) {
      console.log('Warehouse account already exists: username="warehouse", password="123"');
    } else {
      user = new User({
        name: 'Sarah Connor (Depot Manager)',
        email: 'warehouse@utilix.com',
        phone: '+8801711112222',
        username: 'warehouse',
        password: '123',
        role: 'warehouse',
        employeeId: '',
        auditorId: 'AUD-9901'
      });
      await user.save();
      console.log('Successfully created Warehouse Staff account!');
      console.log('Credentials -> Username: warehouse | Password: 123');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding warehouse account:', error);
    process.exit(1);
  }
};

seedWarehouseStaff();
