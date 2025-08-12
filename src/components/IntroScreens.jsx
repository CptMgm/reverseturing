import React, { useState, useEffect } from 'react';

const IntroScreens = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  
  const screens = [
    {
      text: "You are trapped in a simulation with AIs",
      duration: 3000
    },
    {
      text: "There is only one red pill to escape the matrix",
      duration: 3000
    },
    {
      text: "Only the human is allowed to leave.\nConvince the others that you are human and get out of there alive.",
      duration: 4000
    }
  ];

  useEffect(() => {
    if (currentScreen < screens.length) {
      const timer = setTimeout(() => {
        if (currentScreen === screens.length - 1) {
          onComplete();
        } else {
          setCurrentScreen(currentScreen + 1);
        }
      }, screens[currentScreen].duration);

      return () => clearTimeout(timer);
    }
  }, [currentScreen, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-4xl mx-4 text-center">
        <div className="animate-fade-in">
          <p className="text-3xl md:text-5xl font-bold text-white leading-relaxed whitespace-pre-line">
            {screens[currentScreen]?.text}
          </p>
        </div>
        
        <div className="mt-8 flex justify-center gap-2">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentScreen ? 'bg-cyan-400 w-8' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntroScreens;