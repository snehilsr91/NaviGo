import { useState } from 'react';

async function askBackend(q) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/assistant/ask?q=${encodeURIComponent(q)}`);
  return await res.json(); // { matches: [...] } or { reply: string }
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    const data = await askBackend(q);
    setHistory(h => [...h, { q, data }]);
    setQuestion('');
    setLoading(false);
  };

  return (
    <>
      {/* floating trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 flex items-center justify-center border-2 border-white"
        aria-label="Open AI assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.4-.322l-3.7 1.001.983-3.672A6.98 6.98 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
        </svg>
      </button>

      {/* chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9999] w-80 max-h-[28rem] bg-white rounded-xl shadow-2xl flex flex-col">
          <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Campus Assistant</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {history.length === 0 && (
              <p className="text-sm text-gray-500">Ask me anything about campus buildings, labs, rooms, or facilities.</p>
            )}
            {history.map((h, i) => (
              <div key={i} className="space-y-2">
                <div className="text-sm text-indigo-700 font-medium">You: {h.q}</div>
                {h.data.matches ? (
                  <div className="space-y-2">
                    {h.data.matches.map((m, idx) => (
                      <div key={idx} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="font-semibold">{m.building}</div>
                        <div>{m.snippet}</div>
                        <button
                          onClick={() => {
                            // Open map page and pass label via query param
                            window.open(`/map?label=${encodeURIComponent(m.label)}`, '_blank');
                          }}
                          className="mt-2 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded px-2 py-1"
                        >Show on map</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{h.data.reply}</div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={send}
              disabled={loading}
              className={`px-3 py-2 rounded-lg text-sm ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
            >{loading ? '…' : 'Send'}</button>
          </div>
        </div>
      )}
    </>
  );
}