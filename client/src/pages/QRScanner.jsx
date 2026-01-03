import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QRScanner() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');

  const handleOpen = () => {
    if (!input.trim()) {
      setMessage('Paste the QR link or hospital code');
      return;
    }
    setMessage('Opening hospital page…');
    if (input.includes('h=')) {
      const url = new URL(input);
      const hospId = url.searchParams.get('h');
      if (hospId) navigate(`/hospital/${hospId}`);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="panel-header" style={{ marginBottom: '1rem' }}>
        <div>
          <p className="eyebrow">QR Scan</p>
          <h2>Offline → Online booking</h2>
        </div>
      </div>
      <p className="muted">Scan with your phone camera, or paste the QR URL/code below.</p>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>QR URL / Code</label>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="https://app/qr?h=HOSP123" />
      </div>
      <button onClick={handleOpen}>Open Hospital Page</button>
      {message && <div className="muted" style={{ marginTop: '0.5rem' }}>{message}</div>}
    </div>
  );
}
