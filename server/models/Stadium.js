const mongoose = require('mongoose');

const stadiumSchema = new mongoose.Schema({
  name: { type: String, default: 'StadiumPilot Arena' },
  gates: [{
    id: String,
    name: String,
    location: { x: Number, y: Number },
    status: { type: String, enum: ['open', 'closed', 'crowded'], default: 'open' },
    accessible: { type: Boolean, default: true },
  }],
  sections: [{
    id: String,
    name: String,
    zone: String,
    location: { x: Number, y: Number },
    hasStairsOnly: { type: Boolean, default: false },
  }],
  amenities: [{
    id: String,
    type: { type: String, enum: ['food', 'restroom', 'medical', 'security', 'beverage', 'merchandise'] },
    name: String,
    location: { x: Number, y: Number },
    tags: [String],
    accessible: { type: Boolean, default: true },
  }],
  zones: [{
    id: String,
    name: String,
    crowdDensity: { type: String, enum: ['low', 'medium', 'high', 'very_high'], default: 'medium' },
  }],
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Stadium', stadiumSchema);
