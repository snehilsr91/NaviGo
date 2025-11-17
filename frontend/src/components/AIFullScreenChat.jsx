import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Layout/Navbar";
import { askBackend } from "../utils/askBackend";
import { parseMarkdown } from "../utils/parseMarkdown";
import { filterBuildingsWithCoordinates } from "../utils/buildingUtils";

export default function AIFullScreenChat() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) setTimeout(() => inputRef.current.focus(), 100);
  }, []);

  // Handle keyboard visibility (for mobile)
  useEffect(() => {
    const handleResize = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const send = async () => {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    try {
      const data = await askBackend(q);
      setHistory((h) => [...h, { q, data }]);
      setQuestion("");
    } catch (error) {
      console.error("AI Assistant error:", error);
      const errorMessage = error.message.includes("JSON")
        ? "Backend server is not responding. Please make sure the backend is running on port 5000."
        : error.message || "Failed to get response from server.";
      setHistory((h) => [
        ...h,
        {
          q,
          data: { reply: `Error: ${errorMessage}` },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden"
      style={{
        height: "calc(var(--vh, 1vh) * 100)", // use dynamic viewport height
      }}
    >
      {/* Purple accent lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
        <div className="absolute top-40 left-10 w-px h-64 bg-gradient-to-b from-purple-500/15 to-transparent"></div>
        <div className="absolute bottom-40 right-20 w-px h-80 bg-gradient-to-t from-purple-500/15 to-transparent"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-purple-500/10 rotate-45"></div>
      </div>

      <Navbar />

      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 pt-20 sm:pt-24 relative z-10"
        style={{
          paddingBottom: "7rem",
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {history.length === 0 && (
            <div className="text-center py-8 sm:py-12 px-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-purple-500/30">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.4-.322l-3.7 1.001.983-3.672A6.98 6.98 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 px-2">
                Hello! I'm the AI Assistant.
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                Ask me anything about the campus.
              </h3>
              <p className="text-gray-300 text-base sm:text-lg px-2 leading-relaxed">
                I'm here to help you find information about campus buildings,
                labs, rooms, and facilities. What would you like to know?
              </p>
            </div>
          )}

          {history.map((h, i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 max-w-[85%] sm:max-w-2xl shadow-xl border border-purple-500/40">
                  <p className="font-semibold mb-1.5 sm:mb-2 text-purple-200 text-xs sm:text-sm">
                    You
                  </p>
                  <p className="leading-relaxed text-sm sm:text-base">{h.q}</p>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-black/60 backdrop-blur-lg rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 max-w-[85%] sm:max-w-2xl shadow-xl border border-purple-500/30">
                  <p className="font-semibold text-purple-400 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                    Assistant
                  </p>
                  {h.data.matches ? (
                    <div className="space-y-3">
                      {h.data.matches.map((m, idx) => (
                        <div
                          key={idx}
                          className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-purple-500/20 hover:bg-black/80 transition-colors"
                        >
                          <div className="font-bold text-white mb-2">
                            {m.building}
                          </div>
                          <div className="text-gray-300 mb-3">{m.snippet}</div>
                          <button
                            onClick={() => {
                              const chatState = encodeURIComponent(
                                JSON.stringify(history)
                              );
                              const url = `/map?label=${encodeURIComponent(
                                m.label
                              )}&directions=true&chat=${chatState}`;
                              window.open(url, "_blank");
                            }}
                            className="text-sm text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg px-4 py-2 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
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
                        dangerouslySetInnerHTML={{
                          __html: parseMarkdown(h.data.reply),
                        }}
                      />
                      {h.data.buildings && h.data.buildings.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {filterBuildingsWithCoordinates(h.data.buildings).map(
                            (building, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const chatState = encodeURIComponent(
                                    JSON.stringify(history)
                                  );
                                  const url = `/map?label=${encodeURIComponent(
                                    building
                                  )}&directions=true&chat=${chatState}`;
                                  window.open(url, "_blank");
                                }}
                                className="text-sm text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg px-4 py-2 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                Get Directions to {building}
                              </button>
                            )
                          )}
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

      {/* ✅ Fixed Input Area */}
      <div
        className="border-t border-purple-500/20 bg-black/80 backdrop-blur-lg px-3 sm:px-4 md:px-6 pt-3 pb-3 sm:py-4 relative z-10 flex-shrink-0"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              ref={inputRef}
              id="ai-fullscreen-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-lg sm:rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-white placeholder-gray-500 text-sm sm:text-base leading-snug min-h-[44px]"
              rows="1"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !question.trim()}
              className={`flex items-center justify-center px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all duration-200 text-sm sm:text-base flex-shrink-0 min-h-[44px] min-w-[60px] touch-manipulation
                ${
                  loading || !question.trim()
                    ? "bg-purple-700/50 text-purple-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-purple-700 active:from-purple-500 active:to-purple-600 text-white shadow-lg active:shadow-xl active:scale-95"
                }`}
            >
              {loading ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
