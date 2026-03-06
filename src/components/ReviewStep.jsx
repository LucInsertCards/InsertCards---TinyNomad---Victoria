import React, { useState, useEffect } from 'react';
import { generateReview } from '../utils/deepseek';

const ReviewStep = ({ onAmazonRedirect, onClaimGifts, onReviewGenerated, onBack, theme }) => {
  const [stars, setStars] = useState(5);
  const [tone, setTone] = useState('Enthusiastic');
  const [generatedReview, setGeneratedReview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [hoveredStar, setHoveredStar] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const tones = ['Enthusiastic', 'Practical', 'Fun', 'Detailed'];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGenerateReview = async () => {
    setIsGenerating(true);
    setError('');
    setCopySuccess(false);

    try {
      const review = await generateReview(stars, tone, theme.slug);
      setGeneratedReview(review);
      if (onReviewGenerated) {
        onReviewGenerated({ stars, tone, reviewText: review });
      }
    } catch (err) {
      setError(err.message || 'Unable to generate review. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAndRedirect = async () => {
    if (generatedReview) {
      try {
        await navigator.clipboard.writeText(generatedReview);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
    onAmazonRedirect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-wide mb-3 text-gray-900">
            Help us grow with a review
          </h2>
          <p className="text-lg text-gray-600">
            Use our AI assistant to write your review in seconds (optional)
          </p>
        </div>

        {/* Review Generator */}
        <div className="space-y-8 mb-10">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-semibold mb-4 text-gray-700 text-center">
              How would you rate your experience?
            </label>
            <div className="flex justify-center space-x-3 md:space-x-4">
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <button
                  key={starIndex}
                  type="button"
                  onClick={() => setStars(starIndex)}
                  onMouseEnter={() => setHoveredStar(starIndex)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-12 h-12 md:w-14 md:h-14 transition-colors ${
                      starIndex <= (hoveredStar || stars)
                        ? `${theme.starFillClass}`
                        : 'text-gray-300 fill-current'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-500 text-center">{stars} star{stars !== 1 ? 's' : ''}</p>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              Choose the tone of your review
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tones.map((toneOption) => (
                <button
                  key={toneOption}
                  type="button"
                  onClick={() => setTone(toneOption)}
                  className={`px-4 py-3 border rounded-lg transition-all duration-300 font-medium ${
                    tone === toneOption
                      ? `${theme.btnClass} border-transparent`
                      : `border-gray-300 bg-white text-gray-700 hover:${theme.borderColor}`
                  }`}
                >
                  {toneOption}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerateReview}
            disabled={isGenerating}
            className={`w-full px-8 py-4 text-lg font-semibold tracking-wide rounded-xl transition-all duration-300 shadow-lg ${
              isGenerating
                ? 'bg-gray-400 text-white cursor-wait'
                : `${theme.btnClass} hover:shadow-xl`
            } focus:outline-none ${theme.ringColor} focus:ring-offset-2`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating your review...
              </span>
            ) : (
              'Generate My Review'
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Generated Review */}
          {generatedReview && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                Your generated review (feel free to edit)
              </label>
              <textarea
                value={generatedReview}
                onChange={(e) => setGeneratedReview(e.target.value)}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-current transition-colors leading-relaxed resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">{generatedReview.length} characters</p>
                {copySuccess && (
                  <p className="text-sm text-green-600 animate-fade-in">Copied to clipboard!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 border-t border-gray-200 pt-8">
          {generatedReview && (
            <div className="space-y-3">
              <p className="text-center text-base text-gray-700">
                Would you like to share your review on Amazon? It helps us a lot!
              </p>
              <button
                type="button"
                onClick={handleCopyAndRedirect}
                className={`w-full px-8 py-4 ${theme.btnClass} text-lg font-semibold tracking-wide
                         rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
                         focus:outline-none ${theme.ringColor} focus:ring-offset-2`}
              >
                Submit My Review on Amazon
              </button>
              <p className="text-center text-sm text-gray-500 italic">
                (Optional, but very appreciated)
              </p>
            </div>
          )}

          <div className={generatedReview ? 'pt-6' : ''}>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-14 py-4 border border-gray-300 bg-white text-gray-600 rounded-lg
                         hover:bg-gray-100 transition-all duration-300
                         flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={onClaimGifts}
                className={`flex-1 px-6 py-4 ${theme.btnClass} text-base font-semibold tracking-wide
                         rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
                         focus:outline-none ${theme.ringColor} focus:ring-offset-2`}
              >
                Claim My Free Gifts
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 pt-3">
              No review required to receive your gifts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
