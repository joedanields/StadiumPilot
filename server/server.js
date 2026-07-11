require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chat');
const stadiumRoutes = require('./routes/stadium');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/stadium', stadiumRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stadiumpilot');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.log('MongoDB not available, running without persistence');
  }

  app.listen(PORT, () => {
    console.log(`StadiumPilot server running on port ${PORT}`);
  });
};

start();
