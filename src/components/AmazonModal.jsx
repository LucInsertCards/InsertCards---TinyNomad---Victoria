import React from 'react';

const AmazonModal = ({ isOpen, onClose, onConfirm, theme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="relative bg-white w-full max-w-md p-8 md:p-10 rounded-2xl animate-fade-in shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div className="text-center space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold tracking-wide text-gray-900">
              Ready to submit!
            </h3>

            {/* Copy Confirmation */}
            <div className={`${theme?.bgLight || 'bg-blue-50'} border ${theme?.borderColor || 'border-blue-200'} rounded-xl p-5 space-y-2`}>
              <div className={`flex items-center justify-center space-x-2 ${theme?.textPrimary || 'text-blue-700'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-lg font-bold">Your review is copied!</p>
              </div>
              <p className="text-sm text-gray-600">
                On Amazon, simply paste your review in the text field
              </p>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <span className="text-amber-500 text-xl flex-shrink-0">!</span>
                <p className="text-sm text-gray-800 leading-relaxed text-left">
                  <strong>Important:</strong> Come back to this page after submitting to claim your free gifts!
                </p>
              </div>
            </div>

            {/* Confirm */}
            <button
              onClick={onConfirm}
              className={`w-full mt-6 px-8 py-4 ${theme?.btnClass || 'bg-blue-600 hover:bg-blue-700 text-white'} text-lg font-semibold tracking-wide
                       rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
                       focus:outline-none ${theme?.ringColor || 'focus:ring-blue-400'} focus:ring-offset-2
                       flex items-center justify-center space-x-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy & Open Amazon</span>
            </button>

            <button
              onClick={onClose}
              className="w-full px-8 py-3 text-gray-500 text-base font-medium hover:text-gray-700 transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmazonModal;
