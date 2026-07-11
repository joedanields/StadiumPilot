import { useState, useEffect } from 'react';
import StadiumMap from './components/StadiumMap';
import ChatPanel from './components/ChatPanel';
import ReasoningPanel from './components/ReasoningPanel';

export default function App() {
  const [stadiumData, setStadiumData] = useState(null);
  const [liveState, setLiveState] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentRoute, setCurrentRoute] = useState([]);
  const [alertLevel, setAlertLevel] = useState('normal');
  const [profile, setProfile] = useState({
    accessibility: 'none',
    dietary: [],
    location: 'Section 101',
  });

  useEffect(() => {
    fetchStadiumData();
    const interval = setInterval(fetchLiveState, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStadiumData = async () => {
    try {
      const res = await fetch('/api/stadium');
      const data = await res.json();
      setStadiumData(data.stadium);
      setLiveState(data.liveState);
    } catch {
      setStadiumData(getFallbackData());
      setLiveState(getFallbackLiveState());
    }
  };

  const fetchLiveState = async () => {
    try {
      const res = await fetch('/api/stadium/live');
      const data = await res.json();
      setLiveState(data);
    } catch {}
  };

  const sendMessage = async (message) => {
    const userMsg = { role: 'user', content: message, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, profile }),
      });
      const data = await res.json();

      const aiMsg = {
        role: 'assistant',
        content: data.answer,
        reasoning: data.reasoning,
        route: data.route || [],
        alert_level: data.alert_level || 'normal',
        clarifying_question: data.clarifying_question,
        language_detected: data.language_detected,
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, aiMsg]);
      setCurrentRoute(data.route || []);
      setAlertLevel(data.alert_level || 'normal');
      if (data.liveState) setLiveState(data.liveState);
    } catch {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I could not process your request. Please try again.',
        reasoning: 'API connection failed.',
        route: [],
        alert_level: 'normal',
        timestamp: Date.now(),
      }]);
    }
  };

  return (
    <div className={`app ${alertLevel === 'emergency' ? 'emergency-active' : ''}`}>
      <header className="header">
        <h1>StadiumPilot</h1>
        <p>AI Stadium Concierge</p>
        <div className="profile-bar">
          <label>
            Location:
            <input
              value={profile.location}
              onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Section 101"
            />
          </label>
          <label>
            Accessibility:
            <select
              value={profile.accessibility}
              onChange={e => setProfile(p => ({ ...p, accessibility: e.target.value }))}
            >
              <option value="none">None</option>
              <option value="wheelchair">Wheelchair</option>
              <option value="visual_impairment">Visual Impairment</option>
              <option value="hearing_impairment">Hearing Impairment</option>
            </select>
          </label>
          <label>
            Dietary:
            <select
              multiple
              value={profile.dietary}
              onChange={e => setProfile(p => ({
                ...p,
                dietary: Array.from(e.target.selectedOptions, o => o.value),
              }))}
            >
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="nut-free">Nut-Free</option>
              <option value="gluten-free">Gluten-Free</option>
              <option value="halal">Halal</option>
              <option value="kosher">Kosher</option>
            </select>
          </label>
        </div>
      </header>
      <main className="main">
        <div className="map-section">
          <StadiumMap
            stadiumData={stadiumData}
            liveState={liveState}
            currentRoute={currentRoute}
          />
        </div>
        <div className="side-panel">
          <ChatPanel
            chatHistory={chatHistory}
            onSend={sendMessage}
            alertLevel={alertLevel}
          />
          <ReasoningPanel
            lastMessage={chatHistory[chatHistory.length - 1]}
          />
        </div>
      </main>
    </div>
  );
}

function getFallbackData() {
  return {
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
      { id: 'S214', name: 'Section 214', zone: 'east', location: { x: 85, y: 60 }, hasStairsOnly: true },
      { id: 'S301', name: 'Section 301', zone: 'west', location: { x: 15, y: 40 }, hasStairsOnly: false },
      { id: 'S302', name: 'Section 302', zone: 'west', location: { x: 15, y: 60 }, hasStairsOnly: false },
    ],
    amenities: [
      { id: 'A1', type: 'food', name: 'Burger Palace', location: { x: 25, y: 30 }, tags: ['burgers'], accessible: true },
      { id: 'A3', type: 'food', name: 'Green Bowl', location: { x: 40, y: 50 }, tags: ['vegan', 'vegetarian'], accessible: true },
      { id: 'A4', type: 'food', name: 'Nut-Free Kitchen', location: { x: 60, y: 45 }, tags: ['nut-free'], accessible: true },
      { id: 'R1', type: 'restroom', name: 'Restroom Block A', location: { x: 20, y: 25 }, tags: ['accessible'], accessible: true },
      { id: 'M1', type: 'medical', name: 'First Aid Station North', location: { x: 45, y: 10 }, tags: ['emergency'], accessible: true },
      { id: 'M2', type: 'medical', name: 'First Aid Station South', location: { x: 45, y: 90 }, tags: ['emergency'], accessible: true },
      { id: 'SEC1', type: 'security', name: 'Security Post East', location: { x: 90, y: 50 }, tags: ['security'], accessible: true },
    ],
    zones: [
      { id: 'north', name: 'North Zone', crowdDensity: 'medium' },
      { id: 'south', name: 'South Zone', crowdDensity: 'low' },
      { id: 'east', name: 'East Zone', crowdDensity: 'high' },
      { id: 'west', name: 'West Zone', crowdDensity: 'medium' },
    ],
  };
}

function getFallbackLiveState() {
  return {
    crowdDensity: { north: 'medium', south: 'low', east: 'high', west: 'medium' },
    gateStatus: { G1: 'open', G2: 'open', G3: 'open', G4: 'open', G5: 'open' },
    timestamp: new Date().toISOString(),
  };
}
