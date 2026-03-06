const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || 'sk-f0a56900628c49d3b6ea5d6e0b3378c8';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

/**
 * Generate a review using DeepSeek AI
 * @param {number} stars - Number of stars (1-5)
 * @param {string} tone - Review tone
 * @param {string} productSlug - 'dino' or 'unicorn'
 */
export async function generateReview(stars, tone, productSlug = 'dino') {
  const toneInstructions = {
    'Enthusiastic': 'enthusiastic and excited',
    'Practical': 'practical and helpful',
    'Fun': 'fun and lighthearted',
    'Detailed': 'thorough and detailed'
  };

  const toneStyle = toneInstructions[tone] || 'genuine and honest';

  const productDesc = productSlug === 'unicorn'
    ? 'a pink unicorn-themed kids scooter suitcase (a carry-on suitcase that converts into a scooter with LED wheels)'
    : 'a blue dinosaur-themed kids scooter suitcase (a carry-on suitcase that converts into a scooter with LED wheels)';

  const systemPrompt = `You write authentic Amazon product reviews as a real parent who bought ${productDesc} for their child. Write like you're texting a friend - casual, natural, genuine. Keep it SHORT (200-400 characters max). No marketing language, just real thoughts. Write in ENGLISH.`;

  const userPrompt = `Write a ${stars}-star Amazon review for ${productDesc}. Be ${toneStyle}. Write VERY SHORT - just 2-4 sentences max (200-400 characters total). Sound like a real parent typing on their phone, not a professional critic. ${stars <= 3 ? 'Mention what could be improved.' : 'Share what your kid loved about it.'} Don't overuse exclamation marks. Be natural and casual.`;

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('No review generated');
    }
  } catch (error) {
    console.error('Error generating review:', error);
    throw new Error('Failed to generate review. Please try again.');
  }
}
