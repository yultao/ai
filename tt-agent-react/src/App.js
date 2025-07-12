import React, { useState } from 'react';
import ReactMarkdown from "react-markdown";

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  // const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput(''); // ⬅️ 发送后清空输入框

    let fullResponse = "";


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
          fullResponse += content;

          setMessages((prev) => {
            const updated = [...prev];
            if (
              updated.length === 0 ||
              updated[updated.length - 1].role !== "assistant"
            ) {
              updated.push({ role: "assistant", content: fullResponse });
            } else {
              updated[updated.length - 1].content = fullResponse; // ⬅️ 覆盖，不再追加
            }
            return updated;
          });
        });
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2>🧠 Taobot Chat</h2>

      <div
        style={{
          marginTop: 20,
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 8,
          height: "70vh",
          overflowY: "auto",
          background: "#f9f9f9",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                backgroundColor: msg.role === "user" ? "#d2eafc" : "#e2e2e2",
                padding: "10px 14px",
                borderRadius: 12,
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', width: '100%' }}>
        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.altKey) {
              e.preventDefault();
              handleSend();
            }
            if (e.key === 'Enter' && e.altKey) {
              e.preventDefault();
              setInput((prev) => prev + '\n');
            }
          }}
          style={{
            width: '100%',
            resize: 'none',
            marginBottom: '10px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            position: 'absolute',
            right: '10px',
            bottom: '16px',
            height: '30px',
            padding: '0 12px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;