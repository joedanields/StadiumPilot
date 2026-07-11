const Stadium = require('../models/Stadium');

const STADIUM_DATA = {
  name: 'StadiumPilot Arena',
  gates: [
    { id: 'G1', name: 'North Gate', location: { x: 50, y: 0 }, status: 'open', accessible: true },
    { id: 'G2', name: 'South Gate', location: { x: 50, y: 100 }, status: 'open', accessible: true },
    { id: 'G3', name: 'East Gate', location: { x: 100, y: 50 }, status: 'open', accessible: false },
    { id: 'G4', name: 'West Gate', location: { x: 0, y: 50 }, status: 'open', accessible: true },
    { id: 'G5', name: 'VIP Entrance', location: { x: 75, y: 25 }, status: 'open', accessible: true },
  ],
  sections: [
    { id: 'S101', name: 'Section 101', zone: 'north', location: { x: 30, y: 15 }, hasStairsOnly: false },
    { id: 'S102', name: 'Section 102', zone: 'north', location: { x: 50, y: 15 }, hasStairsOnly: false },
    { id: 'S103', name: 'Section 103', zone: 'north', location: { x: 70, y: 15 }, hasStairsOnly: false },
    { id: 'S114', name: 'Section 114', zone: 'east', location: { x: 80, y: 40 }, hasStairsOnly: true },
    { id: 'S201', name: 'Section 201', zone: 'south', location: { x: 30, y: 85 }, hasStairsOnly: false },
    { id: 'S202', name: 'Section 202', zone: 'south', location: { x: 50, y: 85 }, hasStairsOnly: false },
    { id: 'S203', name: 'Section 203', zone: 'south', location: { x: 70, y: 85 }, hasStairsOnly: false },
    { id: 'S214', name: 'Section 214', zone: 'east', location: { x: 85, y: 60 }, hasStairsOnly: true },
    { id: 'S301', name: 'Section 301', zone: 'west', location: { x: 15, y: 40 }, hasStairsOnly: false },
    { id: 'S302', name: 'Section 302', zone: 'west', location: { x: 15, y: 60 }, hasStairsOnly: false },
    { id: 'S401', name: 'Section 401 - VIP', zone: 'north', location: { x: 75, y: 30 }, hasStairsOnly: false },
  ],
  amenities: [
    { id: 'A1', type: 'food', name: 'Burger Palace', location: { x: 25, y: 30 }, tags: ['burgers', 'american'], accessible: true },
    { id: 'A2', type: 'food', name: 'Taco Fiesta', location: { x: 75, y: 70 }, tags: ['mexican', 'spicy'], accessible: true },
    { id: 'A3', type: 'food', name: 'Green Bowl', location: { x: 40, y: 50 }, tags: ['vegan', 'vegetarian', 'gluten-free', 'healthy'], accessible: true },
    { id: 'A4', type: 'food', name: 'Nut-Free Kitchen', location: { x: 60, y: 45 }, tags: ['nut-free', 'allergy-friendly', 'safe'], accessible: true },
    { id: 'A5', type: 'food', name: 'Pizza Corner', location: { x: 20, y: 70 }, tags: ['pizza', 'italian'], accessible: true },
    { id: 'A6', type: 'food', name: 'Halal Grill', location: { x: 55, y: 20 }, tags: ['halal', 'middle-eastern'], accessible: true },
    { id: 'A7', type: 'beverage', name: 'Smoothie Bar', location: { x: 35, y: 65 }, tags: ['drinks', 'smoothies', 'non-alcoholic'], accessible: true },
    { id: 'A8', type: 'beverage', name: 'Beer Garden', location: { x: 65, y: 35 }, tags: ['beer', 'alcohol'], accessible: true },
    { id: 'R1', type: 'restroom', name: 'Restroom Block A', location: { x: 20, y: 25 }, tags: ['accessible', 'family'], accessible: true },
    { id: 'R2', type: 'restroom', name: 'Restroom Block B', location: { x: 80, y: 75 }, tags: ['accessible'], accessible: true },
    { id: 'R3', type: 'restroom', name: 'Restroom Block C', location: { x: 40, y: 80 }, tags: [], accessible: false },
    { id: 'M1', type: 'medical', name: 'First Aid Station North', location: { x: 45, y: 10 }, tags: ['emergency', 'first-aid'], accessible: true },
    { id: 'M2', type: 'medical', name: 'First Aid Station South', location: { x: 45, y: 90 }, tags: ['emergency', 'first-aid'], accessible: true },
    { id: 'SEC1', type: 'security', name: 'Security Post East', location: { x: 90, y: 50 }, tags: ['security', 'lost-and-found'], accessible: true },
    { id: 'SEC2', type: 'security', name: 'Security Post West', location: { x: 10, y: 50 }, tags: ['security'], accessible: true },
    { id: 'MER1', type: 'merchandise', name: 'Team Store', location: { x: 50, y: 40 }, tags: ['merchandise', 'jerseys', 'souvenirs'], accessible: true },
  ],
  zones: [
    { id: 'north', name: 'North Zone', crowdDensity: 'medium' },
    { id: 'south', name: 'South Zone', crowdDensity: 'low' },
    { id: 'east', name: 'East Zone', crowdDensity: 'high' },
    { id: 'west', name: 'West Zone', crowdDensity: 'medium' },
  ],
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stadiumpilot');
    console.log('Connected to MongoDB for seeding');

    await Stadium.findOneAndUpdate({}, STADIUM_DATA, { upsert: true });
    console.log('Stadium data seeded successfully');

    await mongoose.disconnect();
  } catch (err) {
    console.log('MongoDB not available — seed data will be used from memory');
    console.log('In-memory stadium data is ready for use');
  }
}

if (require.main === module) {
  seed();
}

module.exports = { STADIUM_DATA, seed };
