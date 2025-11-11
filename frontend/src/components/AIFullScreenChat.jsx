import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Layout/Navbar'; // Import the new Navbar
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 z-50 flex flex-col relative h-screen w-screen overflow-hidden">
      {/* Background Image with reduced opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
        style={{ backgroundImage: 'url(/unnamed.jpg)' }}
      ></div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-indigo-900/80"></div>
      
      <Navbar />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 pt-24 pb-6 relative z-10 min-h-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {history.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.4-.322l-3.7 1.001.983-3.672A6.98 6.98 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Welcome to Campus Assistant!</h3>
              <p className="text-gray-300 text-lg">I'm here to help you find information about campus buildings, labs, rooms, and facilities. What would you like to know?</p>
            </div>
          )}
          
          {history.map((h, i) => (
            <div key={i} className="space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl px-6 py-4 max-w-2xl shadow-xl border border-purple-400/30">
                  <p className="font-semibold mb-2 text-cyan-200">You</p>
                  <p className="leading-relaxed">{h.q}</p>
                </div>
              </div>
              
              {/* Bot Response */}
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 max-w-2xl shadow-xl border border-white/20">
                  <p className="font-semibold text-cyan-400 mb-2">Assistant</p>
                  {h.data.matches ? (
                    <div className="space-y-3">
                      {h.data.matches.map((m, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                          <div className="font-bold text-white mb-2">{m.building}</div>
                          <div className="text-gray-300 mb-3">{m.snippet}</div>
                          <button
                            onClick={() => {
                              const chatState = encodeURIComponent(JSON.stringify(history));
                              const url = `/map?label=${encodeURIComponent(m.label)}&directions=true&chat=${chatState}`;
                              console.log('🚀 Opening map with directions:', { label: m.label, url });
                              window.open(url, '_blank');
                            }}
                            className="text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg px-4 py-2 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            Get Directions
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div 
                        className="text-gray-200 whitespace-pre-wrap mb-3 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(h.data.reply) }}
                      />
                      {(h.data.buildings && h.data.buildings.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {filterBuildingsWithCoordinates(h.data.buildings).map((building, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const chatState = encodeURIComponent(JSON.stringify(history));
                                const url = `/map?label=${encodeURIComponent(building)}&directions=true&chat=${chatState}`;
                                console.log('🚀 Opening map with directions:', { building, url });
                                window.open(url, '_blank');
                              }}
                              className="text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg px-4 py-2 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              Get Directions to {building}
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
      <div className="border-t border-white/20 bg-white/5 backdrop-blur-lg px-6 py-4 relative z-10 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              id="ai-fullscreen-input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 text-white placeholder-gray-400"
              rows="2"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !question.trim()}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                loading || !question.trim() 
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
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