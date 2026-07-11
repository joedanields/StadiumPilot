const mongoose = require('mongoose');

const liveStateSchema = new mongoose.Schema({
  zoneCrowdDensity: { type: Map, of: String },
  gateStatus: { type: Map, of: String },
  timestamp: { type: Date, default: Date.now },
});

liveStateSchema.index({ timestamp: -1 });

module.exports = mongoose.model('LiveState', liveStateSchema);
