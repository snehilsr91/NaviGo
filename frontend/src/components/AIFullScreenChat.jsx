import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { askBackend } from '../utils/askBackend';
import { parseMarkdown, extractLocations } from '../utils/parseMarkdown';
import { filterBuildingsWithCoordinates } from '../utils/buildingUtils';

export default function AIFullScreenChat() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Focus on input when component mounts
    const input = document.querySelector('#ai-fullscreen-input');
    if (input) input.focus();
  }, []);

  const send = async () => {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    try {
      const data = await askBackend(q);
      setHistory(h => [...h, { q, data }]);
      setQuestion('');
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage = error.message.includes('JSON') 
        ? 'Backend server is not responding. Please make sure the backend is running on port 5000.'
        : error.message || 'Failed to get response from server.';
      setHistory(h => [...h, { 
        q, 
        data: { reply: `Error: ${errorMessage}` } 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.4-.322l-3.7 1.001.983-3.672A6.98 6.98 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Campus Assistant</h1>
            <p className="text-indigo-200 text-sm">Ask me anything about campus buildings, labs, rooms, or facilities</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
        >
          ✕ Close
        </button>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {history.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.4-.322l-3.7 1.001.983-3.672A6.98 6.98 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Campus Assistant!</h3>
              <p className="text-gray-600">I'm here to help you find information about campus buildings, labs, rooms, and facilities. What would you like to know?</p>
            </div>
          )}
          
          {history.map((h, i) => (
            <div key={i} className="space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-2xl px-6 py-3 max-w-2xl">
                  <p className="font-medium mb-1">You</p>
                  <p>{h.q}</p>
                </div>
              </div>
              
              {/* Bot Response */}
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-6 py-3 max-w-2xl">
                  <p className="font-medium text-indigo-600 mb-1">Assistant</p>
                  {h.data.matches ? (
                    <div className="space-y-3">
                      {h.data.matches.map((m, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="font-semibold text-gray-800 mb-2">{m.building}</div>
                          <div className="text-gray-700 mb-3">{m.snippet}</div>
                          <button
                            onClick={() => {
                              const chatState = encodeURIComponent(JSON.stringify(history));
                              window.open(`/map?label=${encodeURIComponent(m.label)}&chat=${chatState}`, '_blank');
                            }}
                            className="text-sm text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1 transition-colors"
                          >
                            Show on map
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div 
                        className="text-gray-700 whitespace-pre-wrap mb-3"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(h.data.reply) }}
                      />
                      {(h.data.buildings && h.data.buildings.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {filterBuildingsWithCoordinates(h.data.buildings).map((building, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const chatState = encodeURIComponent(JSON.stringify(history));
                                window.open(`/map?label=${encodeURIComponent(building)}&chat=${chatState}`, '_blank');
                              }}
                              className="text-sm text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1 transition-colors"
                            >
                              Show {building} on map
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              id="ai-fullscreen-input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="2"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !question.trim()}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                loading || !question.trim() 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}