const mongoose = require('mongoose');
const Outage = require('./models/outage');

const sampleOutages = [
  {
    utilityType: 'Electricity',
    locationName: 'Sector 10, Road 4',
    latitude: 150,
    longitude: 200,
    description: 'Transformer explosion due to overload grid pressure.',
    status: 'REPORTED',
    estimatedRestoration: '2026-06-25 22:00'
  },
  {
    utilityType: 'Water',
    locationName: 'Sector 12, Block C',
    latitude: 350,
    longitude: 120,
    description: 'Main distribution pipe rupture causing local flooding.',
    status: 'ON_WAY',
    estimatedRestoration: '2026-06-25 19:30'
  },
  {
    utilityType: 'Internet',
    locationName: 'Sector 4, Main Avenue',
    latitude: 220,
    longitude: 450,
    description: 'Fiber optic backbone severed during road maintenance excavation.',
    status: 'ON_SITE',
    estimatedRestoration: '2026-06-26 02:00'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/utilix');
    console.log('Seed connection active...');
    
    // Clear out old residual records to start clean
    await Outage.deleteMany({});
    
    for (let i = 0; i < sampleOutages.length; i++) {
      const newIncident = new Outage(sampleOutages[i]);
      await newIncident.save();
    }
    
    console.log('Outage map infrastructure successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding matrix fault:', error);
    process.exit(1);
  }
};

seedDatabase();