const path = require('path');
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const stadiumRoutes = require('./routes/stadium');

/**
 * Build the Express app without binding a port — server.js starts it,
 * tests exercise it on an ephemeral port.
 */
function createApp() {
  const app = express();

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

  return app;
}

module.exports = { createApp };
