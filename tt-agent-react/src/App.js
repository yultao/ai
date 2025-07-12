import React, { useState, useRef, useEffect } from 'react'; // <-- useRef & useEffect
import ReactMarkdown from "react-markdown";

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null); // 👈 用于滚动到底部

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput('');

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
              updated[updated.length - 1].content = fullResponse;
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
        <div ref={bottomRef} /> {/* 👈 用于滚动到底部 */}
      </div>


      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
        <div
          style={{
            flex: 1,
            backgroundColor: "#d2eafc", // 与用户消息统一
            padding: "10px 14px",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <textarea
            rows={2}
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
            placeholder="Type your message..."
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              resize: "none",
              background: "transparent",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            height: '40px',
            minWidth: '60px',
            padding: '0 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s ease-in-out',
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;
