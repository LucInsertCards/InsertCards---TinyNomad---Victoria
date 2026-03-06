import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import WelcomeStep from './components/WelcomeStep';
import InfoStep from './components/InfoStep';
import ReviewStep from './components/ReviewStep';
import GiftsStep from './components/GiftsStep';
import AmazonModal from './components/AmazonModal';
import AdminDashboard from './components/AdminDashboard';
import AdminConfig from './components/AdminConfig';
import { getTheme } from './utils/theme';
import {
  createSubmission,
  updateReviewData,
  trackAmazonVisit,
  trackGiftsClaimed,
  loadConfig
} from './utils/supabase';

/**
 * CustomerFlow - manages the 4-step funnel for a given product slug
 */
function CustomerFlow() {
  const { slug } = useParams();
  const theme = getTheme(slug || 'dino');

  const [currentStep, setCurrentStep] = useState(1);
  const [customerData, setCustomerData] = useState({
    firstName: '', lastName: '', email: '', optInSurveys: false
  });
  const [submissionId, setSubmissionId] = useState(null);
  const [showAmazonModal, setShowAmazonModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [siteConfig, setSiteConfig] = useState({});

  useEffect(() => {
    loadConfig().then(cfg => setSiteConfig(cfg));
  }, []);

  const handleWelcomeContinue = () => setCurrentStep(2);

  const handleInfoContinue = async (formData) => {
    setIsLoading(true);
    setCustomerData(formData);
    try {
      const id = await createSubmission(formData, theme.slug);
      setSubmissionId(id);
      localStorage.setItem('tn_submissionId', id);
      setCurrentStep(3);
    } catch (error) {
      alert('Error saving your information. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewGenerated = async (reviewData) => {
    if (submissionId) {
      try { await updateReviewData(submissionId, reviewData); } catch (e) { console.error(e); }
    }
  };

  const handleAmazonRedirect = () => setShowAmazonModal(true);

  const handleConfirmAmazonRedirect = async () => {
    const configKey = `amazon_review_url_${theme.slug}`;
    const amazonUrl = siteConfig[configKey] || theme.amazonReviewUrl;
    window.open(amazonUrl, '_blank');
    setShowAmazonModal(false);
    if (submissionId) {
      try { await trackAmazonVisit(submissionId); } catch (e) { console.error(e); }
    }
  };

  const handleClaimGifts = () => setCurrentStep(4);
  const handleSkipToGifts = () => setCurrentStep(4);
  const handleBack = () => setCurrentStep(prev => Math.max(1, prev - 1));

  const handleGiftsClaimed = async () => {
    if (submissionId) {
      try { await trackGiftsClaimed(submissionId); } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: theme.primary }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <WelcomeStep onContinue={handleWelcomeContinue} onSkipToGifts={handleSkipToGifts} theme={theme} config={siteConfig} />
      )}
      {currentStep === 2 && (
        <InfoStep onContinue={handleInfoContinue} onBack={handleBack} onSkipToGifts={handleSkipToGifts} initialData={customerData} theme={theme} />
      )}
      {currentStep === 3 && (
        <ReviewStep onAmazonRedirect={handleAmazonRedirect} onClaimGifts={handleClaimGifts} onReviewGenerated={handleReviewGenerated} onBack={handleBack} theme={theme} />
      )}
      {currentStep === 4 && (
        <GiftsStep onGiftsClaimed={handleGiftsClaimed} onBack={handleBack} theme={theme} config={siteConfig} />
      )}

      <AmazonModal
        isOpen={showAmazonModal}
        onClose={() => setShowAmazonModal(false)}
        onConfirm={handleConfirmAmazonRedirect}
        theme={theme}
      />
    </div>
  );
}

/**
 * AdminLogin - password-based admin access
 */
function AdminLogin({ page = 'dashboard' }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const navigate = useNavigate();

  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password');
    }
  };

  if (isAuthenticated) {
    if (currentPage === 'config') {
      return <AdminConfig onBack={() => setCurrentPage('dashboard')} />;
    }
    return <AdminDashboard onGoToConfig={() => setCurrentPage('config')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-3xl font-bold tracking-wide text-center mb-8 text-gray-900">
          Admin Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-semibold tracking-wide rounded-xl
                     hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full px-8 py-3 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg
                     hover:border-gray-400 transition-all duration-300"
          >
            Back to Main
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Landing page - redirects or shows product selection
 */
function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          TinyNomad
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          Welcome! Select your product to claim your free gifts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Dino Card */}
          <button
            onClick={() => navigate('/dino')}
            className="group p-8 bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-500 transition-all duration-300 hover:shadow-xl"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🦖</div>
            <h3 className="text-xl font-bold text-blue-700 mb-2">Dinosaur</h3>
            <p className="text-sm text-gray-500">Blue Scooter Suitcase</p>
          </button>

          {/* Unicorn Card */}
          <button
            onClick={() => navigate('/unicorn')}
            className="group p-8 bg-white rounded-2xl border-2 border-pink-200 hover:border-pink-500 transition-all duration-300 hover:shadow-xl"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🦄</div>
            <h3 className="text-xl font-bold text-pink-700 mb-2">Unicorn</h3>
            <p className="text-sm text-gray-500">Pink Scooter Suitcase</p>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main App with routing
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dino" element={<CustomerFlow />} />
      <Route path="/unicorn" element={<CustomerFlow />} />
      <Route path="/admin" element={<AdminLogin page="dashboard" />} />
      <Route path="/admin/config" element={<AdminLogin page="config" />} />
    </Routes>
  );
}

export default App;
