import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import * as XLSX from 'xlsx';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [giftStats, setGiftStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAmazonStatsExpanded, setIsAmazonStatsExpanded] = useState(false);
  const [isFunnelAmazonExpanded, setIsFunnelAmazonExpanded] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('all');

  // Review verification state
  const [amazonReviews, setAmazonReviews] = useState(null);
  const [reviewMatches, setReviewMatches] = useState(null);

  useEffect(() => {
    fetchCustomersAndAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  const exportToCSV = () => {
    if (customers.length === 0) {
      alert('No customers to export');
      return;
    }

    const headers = [
      'ID', 'Created At', 'First Name', 'Last Name', 'Email',
      'Product', 'Opt-in Surveys', 'Review Generated', 'Review Stars',
      'Review Tone', 'Review Text', 'Went to Amazon', 'Claimed Gifts'
    ];

    const rows = customers.map(c => [
      c.id,
      new Date(c.created_at).toISOString(),
      c.first_name, c.last_name, c.email,
      c.product_slug || 'unknown',
      c.opt_in_surveys ? 'Yes' : 'No',
      c.review_generated ? 'Yes' : 'No',
      c.review_stars || '',
      c.review_tone || '',
      c.review_text ? `"${c.review_text.replace(/"/g, '""')}"` : '',
      c.went_to_amazon ? 'Yes' : 'No',
      c.claimed_gifts ? 'Yes' : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `tinynomad_customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    setSelectedCustomers(
      selectedCustomers.length === customers.length ? [] : customers.map(c => c.id)
    );
  };

  const deleteSelectedCustomers = async () => {
    if (selectedCustomers.length === 0) return;
    if (!window.confirm(`Delete ${selectedCustomers.length} customer(s)? They will be moved to trash.`)) return;

    try {
      if (!supabase) { alert('Supabase not configured'); return; }

      for (const customerId of selectedCustomers) {
        const { data: customerData, error: fetchError } = await supabase
          .from('tn_customer_submissions')
          .select('*')
          .eq('id', customerId)
          .single();

        if (fetchError) continue;

        await supabase.from('tn_deleted_customer_submissions').insert({
          original_id: customerData.id,
          created_at: customerData.created_at,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          email: customerData.email,
          opt_in_surveys: customerData.opt_in_surveys,
          review_generated: customerData.review_generated,
          review_stars: customerData.review_stars,
          review_tone: customerData.review_tone,
          review_text: customerData.review_text,
          went_to_amazon: customerData.went_to_amazon,
          claimed_gifts: customerData.claimed_gifts,
          product_slug: customerData.product_slug
        });

        await supabase.from('tn_gift_downloads').delete().eq('customer_id', customerId);
        await supabase.from('tn_customer_submissions').delete().eq('id', customerId);
      }

      setSelectedCustomers([]);
      await fetchCustomersAndAnalytics();
      alert(`${selectedCustomers.length} customer(s) deleted successfully`);
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  const fetchCustomersAndAnalytics = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!supabase) {
        const mock = generateMockData();
        setCustomers(mock);
        setAnalytics(calculateAnalytics(mock));
        setGiftStats({ travel_ebook: { total: 5, unique: 4 } });
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('tn_customer_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedProduct !== 'all') {
        query = query.eq('product_slug', selectedProduct);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setCustomers(data || []);
      setAnalytics(calculateAnalytics(data || []));
      await fetchGiftStats();
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load data. ' + err.message);
      const mock = generateMockData();
      setCustomers(mock);
      setAnalytics(calculateAnalytics(mock));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGiftStats = async () => {
    if (!supabase) {
      setGiftStats({ travel_ebook: { total: 5, unique: 4 } });
      return;
    }

    try {
      let query = supabase.from('tn_gift_downloads').select('gift_type, customer_id');
      if (selectedProduct !== 'all') {
        query = query.eq('product_slug', selectedProduct);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = { travel_ebook: { total: 0, unique: 0 } };
      const uniqueUsers = { travel_ebook: new Set() };

      data.forEach(d => {
        if (stats[d.gift_type]) {
          stats[d.gift_type].total++;
          if (d.customer_id) uniqueUsers[d.gift_type].add(d.customer_id);
        }
      });

      Object.keys(stats).forEach(type => {
        stats[type].unique = uniqueUsers[type].size;
      });

      setGiftStats(stats);
    } catch (err) {
      setGiftStats({ travel_ebook: { total: 0, unique: 0 } });
    }
  };

  // Review verification helpers
  const normalizeText = (text) =>
    (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

  const jaccardSimilarity = (text1, text2) => {
    const words1 = new Set(normalizeText(text1).split(' ').filter(w => w.length > 2));
    const words2 = new Set(normalizeText(text2).split(' ').filter(w => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return 0;
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  const parseFullCSV = (text) => {
    const rows = [];
    let remaining = text.replace(/^\uFEFF/, '');
    const lines = remaining.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
      rows.push(obj);
    }
    return rows;
  };

  const processReviewRows = (parsed) => {
    if (!parsed || parsed.length === 0) { alert('No data found in file.'); return; }
    const keys = Object.keys(parsed[0] || {});
    const reviewCol = keys.find(k =>
      k.toLowerCase().includes('reviewdescription') || k.toLowerCase().includes('review_text') ||
      k.toLowerCase().includes('body') || k.toLowerCase().includes('content')
    );
    const ratingCol = keys.find(k => k.toLowerCase().includes('ratingscore') || k.toLowerCase().includes('rating') || k.toLowerCase().includes('stars'));
    const titleCol = keys.find(k => k.toLowerCase().includes('reviewtitle') || k.toLowerCase().includes('title'));
    if (!reviewCol) { alert('Review column not found. Expected: reviewDescription, review_text, body, or content.\n\nColumns found: ' + keys.join(', ')); return; }
    const reviews = parsed
      .filter(row => row[reviewCol] && String(row[reviewCol]).trim().length > 0)
      .map(row => ({ text: String(row[reviewCol]), rating: ratingCol ? parseInt(row[ratingCol]) : null, title: titleCol ? String(row[titleCol] || '') : '' }));
    setAmazonReviews(reviews);
    matchReviews(reviews);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        processReviewRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => processReviewRows(parseFullCSV(e.target.result));
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const matchReviews = (amzReviews) => {
    const candidates = customers.filter(c => c.review_text && c.went_to_amazon);
    const matches = candidates.map(customer => {
      let bestMatch = null, bestScore = 0;
      amzReviews.forEach(r => {
        const score = jaccardSimilarity(customer.review_text, r.text);
        if (score > bestScore) { bestScore = score; bestMatch = r; }
      });
      let status = 'not_found';
      if (bestScore >= 0.7) status = 'confirmed';
      else if (bestScore >= 0.4) status = 'probable';
      return { customer, bestMatch, score: bestScore, status, starsMatch: bestMatch?.rating ? customer.review_stars === bestMatch.rating : null };
    });
    setReviewMatches(matches);
  };

  const calculateAnalytics = (data) => {
    const total = data.length;
    if (total === 0) {
      return { total: 0, optInRate: 0, reviewRate: 0, amazonRate: 0, giftsRate: 0, avgStars: 0, starDistribution: {}, toneDistribution: {}, conversionFunnel: {}, productDistribution: {} };
    }

    const optIn = data.filter(c => c.opt_in_surveys).length;
    const reviewed = data.filter(c => c.review_generated).length;
    const amazon = data.filter(c => c.went_to_amazon).length;
    const gifts = data.filter(c => c.claimed_gifts).length;
    const withStars = data.filter(c => c.review_stars);
    const avgStars = withStars.length > 0 ? withStars.reduce((s, c) => s + c.review_stars, 0) / withStars.length : 0;

    const starDist = {};
    withStars.forEach(c => { starDist[c.review_stars] = (starDist[c.review_stars] || 0) + 1; });

    const toneDist = {};
    data.filter(c => c.review_tone).forEach(c => { toneDist[c.review_tone] = (toneDist[c.review_tone] || 0) + 1; });

    const productDist = {};
    data.forEach(c => { const slug = c.product_slug || 'unknown'; productDist[slug] = (productDist[slug] || 0) + 1; });

    return {
      total, optInRate: ((optIn / total) * 100).toFixed(1),
      reviewRate: ((reviewed / total) * 100).toFixed(1),
      amazonRate: ((amazon / total) * 100).toFixed(1),
      giftsRate: ((gifts / total) * 100).toFixed(1),
      avgStars: avgStars.toFixed(1),
      starDistribution: starDist,
      toneDistribution: toneDist,
      productDistribution: productDist,
      conversionFunnel: {
        submissions: total, reviewGenerated: reviewed,
        wentToAmazon: amazon, claimedGifts: gifts
      }
    };
  };

  const generateMockData = () => {
    const names = ['Emma', 'Liam', 'Olivia', 'Noah', 'Sophia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
    const slugs = ['dino', 'unicorn'];
    return Array.from({ length: 8 }, (_, i) => ({
      id: `mock-${i}`,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      first_name: names[i % names.length],
      last_name: lastNames[i % lastNames.length],
      email: `${names[i % names.length].toLowerCase()}@example.com`,
      opt_in_surveys: i % 2 === 0,
      review_generated: i < 5,
      review_stars: i < 5 ? 4 + (i % 2) : null,
      review_tone: i < 5 ? ['Enthusiastic', 'Fun', 'Detailed'][i % 3] : null,
      review_text: i < 5 ? 'Great scooter suitcase! My kid loves it.' : null,
      went_to_amazon: i < 4,
      claimed_gifts: i < 6,
      product_slug: slugs[i % 2]
    }));
  };

  const COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">TinyNomad Dashboard</h1>
            <p className="text-gray-500 mt-1">Insert Card Campaign Analytics</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {/* Product Filter */}
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium"
            >
              <option value="all">All Products</option>
              <option value="dino">Dinosaur (Blue)</option>
              <option value="unicorn">Unicorn (Pink)</option>
            </select>

            <button onClick={fetchCustomersAndAnalytics} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Refresh
            </button>
            <button onClick={exportToCSV} className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Submissions', value: analytics.total, color: 'blue' },
              { label: 'Opt-in Rate', value: `${analytics.optInRate}%`, color: 'green' },
              { label: 'Review Rate', value: `${analytics.reviewRate}%`, color: 'purple' },
              { label: 'Amazon Rate', value: `${analytics.amazonRate}%`, color: 'amber' },
              { label: 'Gifts Claimed', value: `${analytics.giftsRate}%`, color: 'pink' },
              { label: 'Avg Stars', value: analytics.avgStars, color: 'indigo' }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Product Distribution + Funnel */}
        {analytics && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Product Distribution */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Product Distribution</h3>
              {analytics.productDistribution && Object.keys(analytics.productDistribution).length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.productDistribution).map(([name, value]) => ({ name: name === 'dino' ? 'Dinosaur' : name === 'unicorn' ? 'Unicorn' : name, value }))}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(analytics.productDistribution).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-500">No data yet</p>}
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Conversion Funnel</h3>
              {analytics.conversionFunnel && (
                <div className="space-y-3">
                  {[
                    { label: 'Submissions', val: analytics.conversionFunnel.submissions, color: 'bg-blue-500' },
                    { label: 'Reviews Generated', val: analytics.conversionFunnel.reviewGenerated, color: 'bg-purple-500' },
                    { label: 'Went to Amazon', val: analytics.conversionFunnel.wentToAmazon, color: 'bg-amber-500' },
                    { label: 'Claimed Gifts', val: analytics.conversionFunnel.claimedGifts, color: 'bg-green-500' }
                  ].map((step, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{step.label}</span>
                        <span className="text-gray-900 font-bold">{step.val}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`${step.color} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${analytics.total > 0 ? (step.val / analytics.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gift Download Stats */}
        {giftStats && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Gift Downloads</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-semibold text-blue-900">Travel eBook</p>
                  <p className="text-sm text-blue-700">The Ultimate Family Travel Guide</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{giftStats.travel_ebook?.total || giftStats.travel_ebook || 0}</p>
                  <p className="text-xs text-blue-500">{giftStats.travel_ebook?.unique || 0} unique</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Verification */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Review Verification</h3>
          <div className="flex items-center gap-4 mb-4">
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors">
              Upload Amazon Reviews (CSV/XLSX)
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
            {amazonReviews && <span className="text-sm text-gray-500">{amazonReviews.length} reviews loaded</span>}
          </div>

          {reviewMatches && (
            <div className="space-y-3">
              <div className="flex gap-3 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">
                  Confirmed: {reviewMatches.filter(m => m.status === 'confirmed').length}
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">
                  Probable: {reviewMatches.filter(m => m.status === 'probable').length}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                  Not Found: {reviewMatches.filter(m => m.status === 'not_found').length}
                </span>
              </div>
              {reviewMatches.map((match, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  match.status === 'confirmed' ? 'border-green-300 bg-green-50' :
                  match.status === 'probable' ? 'border-yellow-300 bg-yellow-50' :
                  'border-red-300 bg-red-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{match.customer.first_name} {match.customer.last_name}</p>
                      <p className="text-xs text-gray-500">{match.customer.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        match.status === 'confirmed' ? 'bg-green-200 text-green-800' :
                        match.status === 'probable' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {match.status.toUpperCase()} ({(match.score * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">
              Customers ({customers.length})
            </h3>
            {selectedCustomers.length > 0 && (
              <button
                onClick={deleteSelectedCustomers}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete Selected ({selectedCustomers.length})
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={selectedCustomers.length === customers.length && customers.length > 0} onChange={toggleAllCustomers} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Stars</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Amazon</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Gifts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{customer.first_name} {customer.last_name}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        customer.product_slug === 'unicorn' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {customer.product_slug === 'unicorn' ? 'Unicorn' : 'Dino'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{customer.review_stars || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {customer.went_to_amazon ? (
                        <span className="text-green-600 font-bold">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {customer.claimed_gifts ? (
                        <span className="text-green-600 font-bold">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customers.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg font-medium">No customers yet</p>
                <p className="text-sm mt-1">Submissions will appear here once customers scan their QR codes</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
            <div className="fixed inset-0 bg-black bg-opacity-50"></div>
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedCustomer(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedCustomer.first_name} {selectedCustomer.last_name}</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedCustomer.email}</span></p>
                <p><span className="text-gray-500">Product:</span> <span className={`px-2 py-1 rounded-full text-xs font-bold ${selectedCustomer.product_slug === 'unicorn' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{selectedCustomer.product_slug === 'unicorn' ? 'Unicorn' : 'Dinosaur'}</span></p>
                <p><span className="text-gray-500">Opt-in:</span> {selectedCustomer.opt_in_surveys ? 'Yes' : 'No'}</p>
                <p><span className="text-gray-500">Review Generated:</span> {selectedCustomer.review_generated ? 'Yes' : 'No'}</p>
                {selectedCustomer.review_stars && <p><span className="text-gray-500">Stars:</span> {'*'.repeat(selectedCustomer.review_stars)} ({selectedCustomer.review_stars}/5)</p>}
                {selectedCustomer.review_tone && <p><span className="text-gray-500">Tone:</span> {selectedCustomer.review_tone}</p>}
                {selectedCustomer.review_text && (
                  <div>
                    <p className="text-gray-500 mb-1">Review Text:</p>
                    <p className="p-3 bg-gray-50 rounded-lg text-gray-800 leading-relaxed">{selectedCustomer.review_text}</p>
                  </div>
                )}
                <p><span className="text-gray-500">Went to Amazon:</span> {selectedCustomer.went_to_amazon ? 'Yes' : 'No'}</p>
                <p><span className="text-gray-500">Claimed Gifts:</span> {selectedCustomer.claimed_gifts ? 'Yes' : 'No'}</p>
                <p><span className="text-gray-500">Date:</span> {new Date(selectedCustomer.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
