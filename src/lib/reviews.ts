import { supabase } from '@/integrations/supabase/client';
import { REVIEW_ROUTING } from './constants';

export interface ReviewRequestPrefill {
  bookingId: string;
  firstName: string;
  activity: string;
  sessionDate: string;
  isExpired: boolean;
}

export const fetchReviewRequestPrefill = async (
  token: string,
): Promise<ReviewRequestPrefill | null> => {
  const { data, error } = await supabase.rpc('get_review_request_public', { p_token: token });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    bookingId: row.booking_id,
    firstName: row.customer_first_name,
    activity: row.activity,
    sessionDate: row.session_date,
    isExpired: row.is_expired,
  };
};

export const markReviewRequestOpened = (token: string) =>
  supabase.rpc('mark_review_request_opened', { p_token: token });

export type ReviewRoutedTo = 'google' | 'tripadvisor' | 'internal';

export interface SubmitReviewParams {
  rating: number;
  routedTo: ReviewRoutedTo;
  token?: string | null;
  feedbackText?: string;
  contactName?: string;
  contactPhone?: string;
}

export const submitReview = async (params: SubmitReviewParams) => {
  const { rating, routedTo, token, feedbackText, contactName, contactPhone } = params;
  const { error } = await supabase.rpc('submit_review', {
    p_rating: rating,
    p_routed_to: routedTo,
    p_token: token ?? null,
    p_feedback_text: feedbackText || null,
    p_contact_name: contactName || null,
    p_contact_phone: contactPhone || null,
  });
  return { error };
};

export const isPositiveRating = (rating: number) => rating >= REVIEW_ROUTING.positiveThreshold;
