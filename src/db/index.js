import { DB_NAME } from '../constant.js';
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // console.log(process.env.MONGODB_URI)
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (err) {
    console.log(`MongoDB connection failed. ${err}`);
    process.exit(1);
  }
};

export default connectDB;
