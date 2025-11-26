import React, { useState } from 'react';

const NameEntry = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), imagePreview);
    }
  };

  if (showAbout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
        <div className="max-w-2xl w-full mx-4 p-8 bg-gray-800 rounded-lg shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-cyan-400">About the Game</h1>
            <button
              onClick={() => setShowAbout(false)}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-2">Purpose</h2>
              <p className="leading-relaxed">
                This game explores the boundaries between human and AI communication in real-time conversation.
                It's designed to test whether AI can convincingly mimic human behavior and whether humans can
                identify subtle differences in conversational patterns, emotional reasoning, and authentic responses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-2">Game Setup</h2>
              <p className="leading-relaxed mb-2">
                You're joining a voice call with 3 AI characters who are programmed to believe they are human.
                Each AI is a completely separate instance with no knowledge of who the real human is. They are
                instructed to be skeptical and actively try to identify who is not an AI.
              </p>
              <p className="leading-relaxed">
                The game consists of timed debate rounds where players question each other and vote to eliminate
                suspects. A mysterious "President" moderates the proceedings and delivers the final verdict.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-2">Technical Implementation</h2>
              <p className="leading-relaxed mb-2">
                <strong>AI:</strong> Powered by Google Gemini (gemini-2.0-flash) with 3 parallel API sessions,
                each with unique personality prompts and conversation context.
              </p>
              <p className="leading-relaxed mb-2">
                <strong>Voice:</strong> Text-to-speech via ElevenLabs API with telephone effect processing for
                authentic call quality.
              </p>
              <p className="leading-relaxed">
                <strong>Communication:</strong> Real-time WebSocket connections handle game state, turn management,
                and message routing between all participants.
              </p>
            </section>
          </div>

          <button
            onClick={() => setShowAbout(false)}
            className="w-full mt-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors"
          >
            Back to Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full mx-4 p-8 bg-gray-800 rounded-lg shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-2 text-cyan-400">
          REVERSE TURING
        </h1>
        <div className="text-gray-300 text-center mb-6 space-y-3 px-2">
          <p className="text-sm leading-relaxed">
            You are joining a phone call with <strong className="text-cyan-400">3 AIs trying to prove they are human</strong>.
            You have to convince them & the judge to keep the simulation from collapsing.
          </p>
          <p className="text-lg font-semibold text-cyan-400">
            You are the only real human. Convince them. Save the world.
          </p>
          <p className="text-xs text-gray-400 italic">
            Each player in this call is a separate AI not knowing who the real human is.
            They are instructed to be skeptical and figure out who is not an AI.
          </p>
        </div>

        <div className="text-center mb-6">
          <button
            onClick={() => setShowAbout(true)}
            className="text-cyan-400 hover:text-cyan-300 underline text-sm"
          >
            About the Game
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="flex flex-col items-center">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer group relative"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-600 group-hover:border-cyan-400 transition-colors bg-gray-700 flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-gray-500 group-hover:text-cyan-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-cyan-500 rounded-full p-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </label>
            <p className="text-xs text-gray-400 mt-2">Click to upload your avatar</p>
          </div>

          {/* Name Input */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center text-lg"
              maxLength={20}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-lg"
          >
            PLAY
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameEntry;