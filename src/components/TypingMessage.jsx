import React, { useState, useEffect } from 'react';

const TypingMessage = ({ message, onComplete, speed = 50 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!message) return;

    let currentIndex = 0;
    setDisplayedText('');
    setIsComplete(false);

    const typeNextChar = () => {
      if (currentIndex < message.length) {
        setDisplayedText(message.substring(0, currentIndex + 1));
        currentIndex++;

        // Variable delay: faster for common chars, slower for punctuation and spaces
        const char = message[currentIndex - 1];
        let delay = speed;

        if (char === '.' || char === '!' || char === '?') {
          delay = speed * 4; // Long pause after sentence end
        } else if (char === ',' || char === ';') {
          delay = speed * 2.5; // Medium pause after comma
        } else if (char === ' ') {
          delay = speed * 0.8; // Slightly faster for spaces
        } else {
          // Add natural randomness to typing speed
          delay = speed + (Math.random() * speed * 0.6 - speed * 0.3);
        }

        setTimeout(typeNextChar, delay);
      } else {
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    };

    // Start typing after a brief delay
    const startTimeout = setTimeout(typeNextChar, 300);

    return () => clearTimeout(startTimeout);
  }, [message, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▋</span>}
    </span>
  );
};

export default TypingMessage;
