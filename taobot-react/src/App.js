import React, { useState, useRef, useEffect } from 'react'; // <-- useRef & useEffect
import ReactMarkdown from "react-markdown";
// import { useParams } from 'react-router-dom';
const chatId = Date.now();
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

    const res = await fetch('http://localhost:3001/chat/'+chatId, {
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


      

      <div style={{ marginTop: '10px', position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
  <div
    style={{
      flex: 1,
      backgroundColor: "#d2eafc",
      padding: "10px 14px",
      borderRadius: "12px",
      position: "relative",
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
        paddingRight: "60px", // 给按钮留空间
        boxSizing: "border-box",
      }}
    />

    {/* 按钮嵌在右下角 */}
    <button
      onClick={handleSend}
      disabled={loading}
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        height: '30px',
        padding: '0 12px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      {loading ? '...' : 'Send'}
    </button>
  </div>
</div>

 {/* 发送 */}
    </div>
  );
}

export default App;
