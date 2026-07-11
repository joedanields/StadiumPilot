const express = require('express');
const { STADIUM_DATA } = require('../data/stadium');
const { getLiveState, forceRefresh } = require('../data/liveState');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ stadium: STADIUM_DATA, liveState: getLiveState() });
});

router.get('/live', (req, res) => {
  res.json(getLiveState());
});

router.post('/refresh', (req, res) => {
  res.json(forceRefresh());
});

module.exports = router;
