require('dotenv').config();
const mongoose = require('mongoose');
const { createApp } = require('./app');

const PORT = process.env.PORT || 5000;

const start = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to MongoDB');
    } catch (err) {
      console.log('MongoDB not available, running without persistence');
    }
  } else {
    console.log('MONGODB_URI not set, running without persistence');
  }

  createApp().listen(PORT, () => {
    console.log(`StadiumPilot server running on port ${PORT}`);
  });
};

start();
