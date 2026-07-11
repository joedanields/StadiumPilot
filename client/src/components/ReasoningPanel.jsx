export default function ReasoningPanel({ lastMessage }) {
  if (!lastMessage || lastMessage.role !== 'assistant') {
    return (
      <div className="reasoning-panel">
        <h2 className="reasoning-title">Why This Route?</h2>
        <p className="reasoning-empty">
          Ask a question to see AI reasoning and explainability (XAI).
        </p>
      </div>
    );
  }

  const msg = lastMessage;

  return (
    <div className={`reasoning-panel ${msg.alert_level === 'emergency' ? 'reasoning--emergency' : ''}`}>
      <div className="reasoning-header">
        <h2 className="reasoning-title">Why This Route?</h2>
        {msg.language_detected && (
          <span className="language-badge">{msg.language_detected}</span>
        )}
      </div>

      <div className="reasoning-body">
        <div className="reasoning-section">
          <h3 className="reasoning-section-label">AI Reasoning</h3>
          <div className="reasoning-text">{msg.reasoning || 'No reasoning provided.'}</div>
        </div>

        {msg.route && msg.route.length > 0 && (
          <div className="reasoning-section">
            <h3 className="reasoning-section-label">Recommended Route</h3>
            <ol className="route-list">
              {msg.route.map((step, i) => (
                <li key={i} className="route-list-item">
                  <span className="route-step">{i + 1}</span>
                  <span className="route-step-label">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="reasoning-section">
          <h3 className="reasoning-section-label">Alert Level</h3>
          <span className={`alert-badge ${msg.alert_level}`}>
            {msg.alert_level?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="reasoning-footer">
        <small>AI-generated reasoning based on live stadium conditions.</small>
      </div>
    </div>
  );
}
