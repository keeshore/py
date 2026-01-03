import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function FirstAidAI() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!prompt.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { response: text } = await api.firstAid({ userId: user?.id, prompt });
      setResponse(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="panel-header" style={{ marginBottom: '1rem' }}>
        <div>
          <p className="eyebrow">First Aid (Gemini)</p>
          <h2>Get immediate guidance</h2>
        </div>
      </div>

      {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="form-group">
        <label>Describe the problem</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., chest pain, dizziness" />
      </div>
      <button onClick={submit} disabled={loading}>{loading ? 'Asking Gemini…' : 'Get First Aid'}</button>

      {response && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 className="card-title">Suggested steps</h3>
          <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{response}</pre>
        </div>
      )}
    </div>
  );
}
