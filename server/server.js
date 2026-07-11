require('dotenv').config();
const path = require('path');
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

// In production (e.g. Render) the built client is served from this same server,
// so the browser hits /api on the same origin — no CORS or proxy needed.
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

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

  app.listen(PORT, () => {
    console.log(`StadiumPilot server running on port ${PORT}`);
  });
};

start();
