import React, { useState } from 'react';
import ReactMarkdown from "react-markdown";

function App() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setResponse('');

    const res = await fetch('http://localhost:3001/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: input }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const matches = text.match(/data: (.*)/g);
      if (matches) {
        matches.forEach((line) => {
          const content = line.replace(/^data: /, '');
          setResponse((prev) => prev + content);
        });
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2>🧠 Taobot Chat</h2>
      <textarea
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Loading...' : 'Send'}
      </button>
      <div style={{ marginTop: 20, padding: 10, border: "1px solid #ccc" }}>
        <ReactMarkdown>{response}</ReactMarkdown>
      </div>
    </div>
  );
}

export default App;