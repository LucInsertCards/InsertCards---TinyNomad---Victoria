/**
 * Theme configuration for each product variant
 */
const themes = {
  dino: {
    name: 'Dinosaur Explorer',
    slug: 'dino',
    primary: '#2563EB',       // blue-600
    primaryHover: '#1D4ED8',  // blue-700
    primaryLight: '#DBEAFE',  // blue-100
    primaryBg: '#EFF6FF',     // blue-50
    gradient: 'from-blue-500 to-blue-700',
    gradientLight: 'from-blue-50 to-blue-100',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    btnOutlineClass: 'border-blue-600 text-blue-700 hover:bg-blue-50',
    btnSecondaryClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    starColor: 'text-blue-500',
    starFillClass: 'text-blue-500 fill-current',
    textPrimary: 'text-blue-700',
    textSecondary: 'text-blue-600',
    borderColor: 'border-blue-200',
    bgLight: 'bg-blue-50',
    ringColor: 'focus:ring-blue-400',
    checkboxColor: '#2563EB',
    accentEmoji: '🦖',
    productName: 'Dinosaur Scooter Suitcase',
    amazonReviewUrl: process.env.REACT_APP_AMAZON_REVIEW_URL_DINO || 'https://amazon.com/review/create-review?asin=B0DNKC2SG5',
  },
  unicorn: {
    name: 'Unicorn Dream',
    slug: 'unicorn',
    primary: '#DB2777',       // pink-600
    primaryHover: '#BE185D',  // pink-700
    primaryLight: '#FCE7F3',  // pink-100
    primaryBg: '#FDF2F8',     // pink-50
    gradient: 'from-pink-500 to-pink-700',
    gradientLight: 'from-pink-50 to-pink-100',
    btnClass: 'bg-pink-600 hover:bg-pink-700 text-white',
    btnOutlineClass: 'border-pink-600 text-pink-700 hover:bg-pink-50',
    btnSecondaryClass: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    starColor: 'text-pink-500',
    starFillClass: 'text-pink-500 fill-current',
    textPrimary: 'text-pink-700',
    textSecondary: 'text-pink-600',
    borderColor: 'border-pink-200',
    bgLight: 'bg-pink-50',
    ringColor: 'focus:ring-pink-400',
    checkboxColor: '#DB2777',
    accentEmoji: '🦄',
    productName: 'Unicorn Scooter Suitcase',
    amazonReviewUrl: process.env.REACT_APP_AMAZON_REVIEW_URL_UNICORN || 'https://amazon.com/review/create-review',
  }
};

export function getTheme(slug) {
  return themes[slug] || themes.dino;
}

export default themes;
