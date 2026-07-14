import { useState, useEffect } from 'react';
import StadiumMap from './components/StadiumMap';
import ChatPanel from './components/ChatPanel';
import ReasoningPanel from './components/ReasoningPanel';

const DIETARY_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'nut-free', label: 'Nut-Free' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

export default function App() {
  const [stadiumData, setStadiumData] = useState(null);
  const [liveState, setLiveState] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentRoute, setCurrentRoute] = useState([]);
  const [alertLevel, setAlertLevel] = useState('normal');
  const [isThinking, setIsThinking] = useState(false);
  const [profile, setProfile] = useState({
    accessibility: 'none',
    dietary: [],
    location: 'Section 101',
  });

  const fetchLiveState = async () => {
    try {
      const res = await fetch('/api/stadium/live');
      const data = await res.json();
      setLiveState(data);
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    let retryTimer;

    const fetchStadiumData = async () => {
      try {
        const res = await fetch('/api/stadium');
        const data = await res.json();
        if (cancelled) return;
        setStadiumData(data.stadium);
        setLiveState(data.liveState);
      } catch {
        if (!cancelled) retryTimer = setTimeout(fetchStadiumData, 3000);
      }
    };

    fetchStadiumData();
    const interval = setInterval(fetchLiveState, 5000);
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearInterval(interval);
    };
  }, []);

  const sendMessage = async (message) => {
    if (isThinking) return;
    const userMsg = { role: 'user', content: message, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

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
    } catch (err) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I could not process your request. Please try again in a moment.',
        reasoning: err.message || 'API connection failed.',
        route: [],
        alert_level: 'normal',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleDietary = (value) => {
    setProfile(p => ({
      ...p,
      dietary: p.dietary.includes(value)
        ? p.dietary.filter(d => d !== value)
        : [...p.dietary, value],
    }));
  };

  return (
    <div className={`app ${alertLevel === 'emergency' ? 'emergency-active' : ''}`}>
      <header className="header">
        <div className="header-brand">
          <h1 className="header-title">StadiumPilot</h1>
          <span className="header-tagline">AI Stadium Concierge</span>
        </div>
        <div className="profile-bar">
          <div className="control-group">
            <label className="control-label">Location</label>
            <input
              className="control-input"
              value={profile.location}
              onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
              placeholder="Section 101"
            />
          </div>
          <div className="control-group">
            <label className="control-label">Accessibility</label>
            <select
              className="control-select"
              value={profile.accessibility}
              onChange={e => setProfile(p => ({ ...p, accessibility: e.target.value }))}
            >
              <option value="none">None</option>
              <option value="wheelchair">Wheelchair</option>
              <option value="visual_impairment">Visual Impairment</option>
              <option value="hearing_impairment">Hearing Impairment</option>
            </select>
          </div>
          <div className="control-group">
            <label className="control-label">Dietary</label>
            <div className="dietary-pills">
              {DIETARY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`dietary-pill ${profile.dietary.includes(opt.value) ? 'active' : ''}`}
                  onClick={() => toggleDietary(opt.value)}
                  type="button"
                  aria-pressed={profile.dietary.includes(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="main">
        <div className="map-section">
          <StadiumMap
            stadiumData={stadiumData}
            liveState={liveState}
            currentRoute={currentRoute}
            currentLocation={profile.location}
          />
        </div>
        <div className="side-panel">
          <ChatPanel
            chatHistory={chatHistory}
            onSend={sendMessage}
            alertLevel={alertLevel}
            isThinking={isThinking}
          />
          <ReasoningPanel
            lastMessage={chatHistory[chatHistory.length - 1]}
          />
        </div>
      </main>
    </div>
  );
}
