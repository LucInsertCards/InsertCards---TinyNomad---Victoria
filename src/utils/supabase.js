import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder_key';

const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Create initial customer submission
 */
export async function createSubmission(customerData, productSlug) {
  if (!supabase) {
    console.warn('Supabase not configured. Running in demo mode.');
    return 'demo-' + Math.random().toString(36).substr(2, 9);
  }

  const { data, error } = await supabase
    .from('tn_customer_submissions')
    .insert([
      {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        email: customerData.email,
        opt_in_surveys: customerData.optInSurveys || false,
        product_slug: productSlug || 'dino'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating submission:', error);
    throw new Error('Failed to save customer information');
  }

  return data.id;
}

/**
 * Update submission with review data
 */
export async function updateReviewData(id, reviewData) {
  if (!supabase) return;

  const { error } = await supabase
    .from('tn_customer_submissions')
    .update({
      review_generated: true,
      review_stars: reviewData.stars,
      review_tone: reviewData.tone,
      review_text: reviewData.reviewText || null
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating review data:', error);
    throw new Error('Failed to save review data');
  }
}

/**
 * Track when user goes to Amazon
 */
export async function trackAmazonVisit(id) {
  if (!supabase) return;

  const { error } = await supabase
    .from('tn_customer_submissions')
    .update({ went_to_amazon: true })
    .eq('id', id);

  if (error) {
    console.error('Error tracking Amazon visit:', error);
  }
}

/**
 * Track when user claims gifts
 */
export async function trackGiftsClaimed(id) {
  if (!supabase) return;

  const { error } = await supabase
    .from('tn_customer_submissions')
    .update({ claimed_gifts: true })
    .eq('id', id);

  if (error) {
    console.error('Error tracking gifts claimed:', error);
  }
}

/**
 * Track individual gift download
 */
export async function trackGiftDownload(customerId, giftType, productSlug) {
  if (!supabase) return;

  const { error } = await supabase
    .from('tn_gift_downloads')
    .insert({
      customer_id: customerId,
      gift_type: giftType,
      product_slug: productSlug || 'dino'
    });

  if (error) {
    console.error('Error tracking gift download:', error);
  }
}

/**
 * Load config from tn_config table
 * Returns an object { key: value }
 */
let configCache = null;

export async function loadConfig() {
  if (configCache) return configCache;
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('tn_config')
      .select('key, value');

    if (error) throw error;

    const config = {};
    (data || []).forEach(row => { config[row.key] = row.value; });
    configCache = config;
    return config;
  } catch (err) {
    console.error('Error loading config:', err);
    return {};
  }
}

export function clearConfigCache() {
  configCache = null;
}
