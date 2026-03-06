import React, { useEffect } from 'react';
import { trackGiftDownload } from '../utils/supabase';

const GiftsStep = ({ onGiftsClaimed, onBack, theme }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (onGiftsClaimed) {
      onGiftsClaimed();
    }
  }, [onGiftsClaimed]);

  const handleEbookClick = async () => {
    const submissionId = localStorage.getItem('tn_submissionId');
    if (submissionId && theme) {
      await trackGiftDownload(submissionId, 'travel_ebook', theme.slug);
    }
  };

  // eBook download link — update this with the real Supabase Storage or Google Drive URL
  const ebookLink = 'https://ncnhxugldoskqlvpwrrs.supabase.co/storage/v1/object/public/ebooks/tinynomad-travel-guide.pdf';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="text-6xl mb-4">{theme?.accentEmoji || '🎉'}</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-wide mb-3 text-gray-900">
            Congratulations!
          </h2>
          <p className="text-lg text-gray-600">
            Here's your exclusive gift:
          </p>
        </div>

        {/* eBook Gift Card */}
        <div
          className={`border-2 ${theme?.borderColor || 'border-gray-200'} bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-xl animate-fade-in`}
        >
          {/* Icon */}
          <div className={`flex justify-center mb-6 ${theme?.textPrimary || 'text-blue-700'}`}>
            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
            </svg>
          </div>

          {/* Badge */}
          <div className="text-center mb-3">
            <span className={`inline-block px-4 py-1 text-xs font-bold tracking-wider uppercase rounded-full ${theme?.bgLight || 'bg-blue-50'} ${theme?.textSecondary || 'text-blue-600'}`}>
              Free eBook
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold tracking-wide text-center mb-3 text-gray-900">
            The Ultimate Family Travel Guide
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center mb-8 leading-relaxed">
            Tips, hacks, and fun activities to make every family trip unforgettable. From airport survival tips to kid-friendly destinations — everything you need for stress-free travel with your little nomad!
          </p>

          {/* Download Button */}
          <a
            href={ebookLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleEbookClick}
            className={`block w-full px-6 py-4 ${theme?.btnClass || 'bg-blue-600 hover:bg-blue-700 text-white'} text-center text-lg font-semibold tracking-wide
                     rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
                     focus:outline-none ${theme?.ringColor || 'focus:ring-blue-400'} focus:ring-offset-2`}
          >
            Download eBook
          </a>
        </div>

        {/* Thank You */}
        <div className="text-center space-y-3 pt-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <p className="text-lg text-gray-700 leading-relaxed font-semibold">
            Thank you for being part of the TinyNomad family!
          </p>
          <p className="text-base text-gray-600 leading-relaxed">
            We hope your little one loves their scooter suitcase as much as we loved making it.
          </p>
          <p className="text-sm text-gray-500 pt-2">
            Check your email for additional download links.
          </p>
        </div>
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2
                     w-12 h-12 rounded-full bg-white border border-gray-300
                     flex items-center justify-center
                     hover:bg-gray-100 transition-all duration-200
                     shadow-md"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default GiftsStep;
