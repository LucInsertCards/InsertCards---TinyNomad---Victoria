import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const DEFAULT_CONFIG = {
  ebook_url: '',
  amazon_review_url_dino: 'https://amazon.com/review/create-review?asin=B0DNKC2SG5',
  amazon_review_url_unicorn: 'https://amazon.com/review/create-review',
  welcome_message: 'Thank you for your purchase!',
  welcome_subtitle: "We're so glad your little adventurer is ready to explore the world with their new scooter suitcase!",
  gift_title: 'The Ultimate Family Travel Guide',
  gift_description: 'Tips, hacks, and fun activities to make every family trip unforgettable. From airport survival tips to kid-friendly destinations — everything you need for stress-free travel with your little nomad!',
};

const AdminConfig = ({ onBack }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    if (!supabase) {
      setConfig(DEFAULT_CONFIG);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tn_config')
        .select('key, value')
        .order('key');

      if (error) throw error;

      if (data && data.length > 0) {
        const loaded = { ...DEFAULT_CONFIG };
        data.forEach(row => {
          if (row.key in loaded) {
            loaded[row.key] = row.value;
          }
        });
        setConfig(loaded);
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Failed to load config: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    if (!supabase) {
      setError('Supabase not configured');
      setIsSaving(false);
      return;
    }

    try {
      for (const [key, value] of Object.entries(config)) {
        const { error } = await supabase
          .from('tn_config')
          .upsert({ key, value }, { onConflict: 'key' });

        if (error) throw error;
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'ebook_url', label: 'eBook Download URL', placeholder: 'https://... (Supabase Storage or Google Drive link)', type: 'url' },
    { key: 'amazon_review_url_dino', label: 'Amazon Review URL — Dinosaur', placeholder: 'https://amazon.com/review/create-review?asin=...', type: 'url' },
    { key: 'amazon_review_url_unicorn', label: 'Amazon Review URL — Unicorn', placeholder: 'https://amazon.com/review/create-review?asin=...', type: 'url' },
    { key: 'welcome_message', label: 'Welcome Message (Step 1)', placeholder: 'Thank you for your purchase!', type: 'text' },
    { key: 'welcome_subtitle', label: 'Welcome Subtitle (Step 1)', placeholder: 'Description text...', type: 'textarea' },
    { key: 'gift_title', label: 'Gift Title (Step 4)', placeholder: 'eBook title', type: 'text' },
    { key: 'gift_description', label: 'Gift Description (Step 4)', placeholder: 'Description of the eBook...', type: 'textarea' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Configure your TinyNomad funnel</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            Settings saved successfully!
          </div>
        )}

        {/* Config Fields */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={config[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm resize-none"
                />
              ) : (
                <input
                  type={field.type}
                  value={config[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              )}
            </div>
          ))}

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full px-8 py-4 text-lg font-semibold tracking-wide rounded-xl transition-all duration-300 shadow-lg ${
                isSaving
                  ? 'bg-gray-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Help */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-bold text-blue-900 mb-2">How to set up the eBook</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to Supabase &gt; Storage &gt; Create bucket "ebooks" (set to public)</li>
            <li>Upload your PDF file</li>
            <li>Copy the public URL and paste it in the "eBook Download URL" field above</li>
            <li>Click Save Settings</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AdminConfig;
