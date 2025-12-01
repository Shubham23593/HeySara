import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('\n❌ ERROR: MONGODB_URI is not defined in environment variables');
      console.error('\n📝 Please follow these steps:');
      console.error('   1. Copy .env.example to .env');
      console.error('      Command: cp .env.example .env');
      console.error('   2. Edit .env file and set your MongoDB URI');
      console.error('   3. Restart the server\n');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
