import React, { useState } from 'react';
import './index.css'; // Assuming you have TailwindCSS setup here

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // This is our default agent configuration. In a real app, users would create this.
  const agentConfig = {
    name: "Web Search Agent",
    system_prompt: "You are a helpful research assistant. When given information from a web search, summarize it for the user.",
    tools: ["web_search"]
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          agent_config: agentConfig,
          history: messages // Send previous messages for context
        }),
      });

      const data = await response.json();

      if (data.response) {
        const aiMessage = { role: 'assistant', content: data.response };
        setMessages([...newMessages, aiMessage]);
      } else {
        const errorMessage = { role: 'assistant', content: 'Sorry, something went wrong.' };
        setMessages([...newMessages, errorMessage]);
      }

    } catch (error) {
      console.error("Error fetching from backend:", error);
      const errorMessage = { role: 'assistant', content: 'Failed to connect to the backend.' };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold text-center mb-4">AI Agent Chat</h1>
      <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-center text-gray-400">AI is thinking...</div>}
      </div>
      <div className="mt-4 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 p-2 rounded-l-lg bg-gray-700 border-none outline-none"
          placeholder="Ask your agent anything... (try 'search the web for the latest AI news')"
        />
        <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-r-lg">
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
