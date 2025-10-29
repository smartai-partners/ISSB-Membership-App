import mongoose from 'mongoose';
import { logger } from './logger';

interface DatabaseConnection {
  connection: typeof mongoose;
  isConnected: boolean;
}

let db: DatabaseConnection = {
  connection: mongoose,
  isConnected: false,
};

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const options = {
      // Connection options for better reliability
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      // Authentication options
      authSource: 'admin', // Authentication database
      // SSL options (uncomment if needed)
      // ssl: true,
      // sslValidate: true,
      // SSL certificate options
      // sslCA: require('fs').readFileSync('./path/to/ca-cert.pem'),
    };

    logger.info('Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoUri, options);
    
    db.isConnected = true;
    
    logger.info(`MongoDB connected successfully`);
    logger.info(`Database: ${mongoose.connection.db.databaseName}`);
    logger.info(`Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
      db.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      logger.error('Mongoose connection error:', error);
      db.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      db.isConnected = false;
    });

    // Handle connection close
    mongoose.connection.on('close', () => {
      logger.info('Mongoose connection closed');
      db.isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await closeConnection();
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    db.isConnected = false;
    throw error;
  }
};

const closeConnection = async (): Promise<void> => {
  try {
    if (db.isConnected && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed gracefully');
      db.isConnected = false;
    }
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

const getConnectionStatus = (): DatabaseConnection => {
  return {
    connection: db.connection,
    isConnected: db.isConnected && mongoose.connection.readyState === 1,
  };
};

// Utility function to check if database is ready for operations
const isReady = (): boolean => {
  return db.isConnected && mongoose.connection.readyState === 1;
};

export {
  connectDB,
  closeConnection,
  getConnectionStatus,
  isReady,
};

export default {
  connect: connectDB,
  close: closeConnection,
  getStatus: getConnectionStatus,
  isReady,
};