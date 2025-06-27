const mongoose = require('mongoose');
require('dotenv').config();

const userName = process.env.DB_USERNAME || 'defaultUser';
const password = process.env.DB_PASSWORD || 'defaultPassword';
const databaseName = process.env.DB_NAME ;

const connectDB = async () => {
  try {
    await mongoose.connect(`mongodb+srv://${userName}:${password}@githubdatabase.jxqvj2y.mongodb.net/${databaseName}?retryWrites=true&w=majority&appName=GithubDatabase`, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

//connectDB();

module.exports = connectDB;