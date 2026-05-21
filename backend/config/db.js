import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import seedDatabase from './seeder.js';

let mongoServer = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tinder-clone';
    let conn = null;

    // Check if connecting to a local MongoDB instance
    if (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
      console.log(`Attempting connection to local MongoDB: ${mongoUri}...`);
      try {
        // Try connecting with a short 2-second timeout
        conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`===============================================`);
        console.log(`✔ Connected successfully to local MongoDB instance!`);
        console.log(`Host: ${conn.connection.host}`);
        console.log(`===============================================`);
      } catch (err) {
        console.log(`\n[DATABASE WARNING] Local MongoDB not running on ${mongoUri}.`);
        console.log(`Starting dynamic, secure in-memory MongoDB server fallback...`);
        
        // Spin up MongoMemoryServer
        mongoServer = await MongoMemoryServer.create({
          instance: {
            launchTimeoutMS: 60000
          }
        });
        const memoryUri = mongoServer.getUri();
        
        conn = await mongoose.connect(memoryUri);
        
        console.log(`===============================================`);
        console.log(`✔ In-Memory MongoDB Started & Connected!`);
        console.log(`Connection URI: ${memoryUri}`);
        console.log(`===============================================`);
      }
    } else {
      // Connect to external DB (e.g. MongoDB Atlas) with a 5s timeout
      try {
        conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`===============================================`);
        console.log(`✔ Connected to external MongoDB Server!`);
        console.log(`Host: ${conn.connection.host}`);
        console.log(`===============================================`);
      } catch (err) {
        console.log(`\n[DATABASE WARNING] External MongoDB connection failed: ${err.message}`);
        console.log(`Starting dynamic, secure in-memory MongoDB server fallback...`);
        
        // Spin up MongoMemoryServer
        mongoServer = await MongoMemoryServer.create({
          instance: {
            launchTimeoutMS: 60000
          }
        });
        const memoryUri = mongoServer.getUri();
        
        conn = await mongoose.connect(memoryUri);
        
        console.log(`===============================================`);
        console.log(`✔ In-Memory MongoDB Started & Connected!`);
        console.log(`Connection URI: ${memoryUri}`);
        console.log(`===============================================`);
      }
    }

    // Seed the database with high-quality mock data
    await seedDatabase();

  } catch (error) {
    console.error(`CRITICAL DATABASE ERROR: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
