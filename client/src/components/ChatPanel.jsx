import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ chatHistory, onSend, alertLevel, isThinking }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSend(input.trim());
    setInput('');
  };

  const quickPrompts = [
    "Where's the nearest bathroom?",
    "I'm hungry, what food is available?",
    "How do I get to Section 214?",
    "I feel dizzy and need help",
    "I use a wheelchair, find me an accessible route",
  ];

  return (
    <div className={`chat-panel ${alertLevel === 'emergency' ? 'emergency' : ''}`}>
      <h2>Concierge Chat</h2>

      {alertLevel === 'emergency' && (
        <div className="emergency-banner" role="alert">
          EMERGENCY — Medical/security alert active
        </div>
      )}

      <div className="chat-messages" role="log" aria-live="polite" aria-label="Conversation with StadiumPilot">
        {chatHistory.length === 0 && (
          <div className="chat-empty">
            <p>Welcome to StadiumPilot! Ask me anything about navigating the stadium.</p>
            <div className="quick-prompts">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  className="quick-prompt"
                  onClick={() => onSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            <div className="msg-role">{msg.role === 'user' ? 'You' : 'StadiumPilot'}</div>
            <div className="msg-content">{msg.content}</div>
            {msg.clarifying_question && (
              <div className="clarifying-question">
                {msg.clarifying_question}
              </div>
            )}
            {msg.route && msg.route.length > 0 && (
              <div className="msg-route">
                <strong>Route:</strong> {msg.route.join(' → ')}
              </div>
            )}
            {msg.alert_level && msg.alert_level !== 'normal' && (
              <div className={`msg-alert ${msg.alert_level}`}>
                {msg.alert_level.toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div className="chat-msg assistant chat-msg--thinking">
            <div className="msg-role">StadiumPilot</div>
            <div className="msg-content">Thinking…</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about navigation, food, restrooms, accessibility..."
          aria-label="Message StadiumPilot"
          maxLength={1000}
          disabled={isThinking}
        />
        <button type="submit" disabled={isThinking}>{isThinking ? '…' : 'Send'}</button>
      </form>
    </div>
  );
}
