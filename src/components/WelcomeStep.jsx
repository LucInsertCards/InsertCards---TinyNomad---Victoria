import React, { useState, useEffect } from 'react';

const WelcomeStep = ({ onContinue, onSkipToGifts, theme }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showAdditionalContent, setShowAdditionalContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const mainText = "Thank you for your purchase!";
  const typingSpeed = 45;

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < mainText.length) {
        setDisplayedText(mainText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setShowAdditionalContent(true);
          setTimeout(() => setShowButton(true), 500);
        }, 300);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full">
        {/* TinyNomad Logo / Brand */}
        <div className="flex justify-center mb-6">
          <div className={`text-5xl animate-bounce-slow`}>
            {theme.accentEmoji}
          </div>
        </div>

        <div className="text-center mb-4">
          <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${theme.bgLight} ${theme.textSecondary}`}>
            TinyNomad
          </span>
        </div>

        {/* Main typing text */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-6 md:mb-8 min-h-[80px] md:min-h-[100px] flex items-center justify-center px-4 text-gray-900">
            {displayedText}
            {displayedText.length < mainText.length && (
              <span className="animate-pulse ml-1">|</span>
            )}
          </h1>

          {/* Additional content */}
          <div
            className={`space-y-5 transition-all duration-700 ${
              showAdditionalContent
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-base md:text-lg text-gray-700 leading-relaxed px-4">
              We're so glad your little adventurer is ready to explore the world with their new {theme.productName}!
            </p>

            <p className="text-base md:text-lg text-gray-600 leading-relaxed px-4">
              We've prepared some exclusive free gifts just for you — claim them now!
            </p>

            <p className="text-sm md:text-base text-gray-500 italic pt-2">
              With love,<br />— The TinyNomad Team
            </p>
          </div>

          {/* Continue button */}
          {showButton && (
            <div className="mt-12 animate-fade-in">
              <button
                onClick={onContinue}
                className={`px-12 py-4 ${theme.btnClass} text-lg font-semibold tracking-wide
                         rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
                         focus:outline-none ${theme.ringColor} focus:ring-offset-2`}
              >
                Continue
              </button>
            </div>
          )}

          {/* Skip to Gifts */}
          {showButton && (
            <div className="mt-8 pt-8 border-t border-gray-200 animate-fade-in">
              <p className="text-sm text-gray-600 text-center mb-4">
                Want to go straight to your gifts?
              </p>
              <button
                type="button"
                onClick={onSkipToGifts}
                className={`w-full px-8 py-4 border-2 ${theme.btnOutlineClass} text-lg font-semibold tracking-wide
                         rounded-xl transition-all duration-300
                         focus:outline-none ${theme.ringColor} focus:ring-offset-2`}
              >
                Claim My Free Gifts
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Access your gifts instantly without sharing your information
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;
