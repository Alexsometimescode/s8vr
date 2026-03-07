import { supabase } from './supabase';

export interface Feedback {
  id: string;
  user_id: string | null;
  user_email: string | null;
  type: 'feedback' | 'bug' | 'feature';
  message: string;
  status: 'new' | 'read' | 'resolved' | 'archived';
  created_at: string;
  updated_at: string;
}

/**
 * Submits user feedback to the database
 * @param feedback - Feedback data with type and message
 * @param userId - Optional user UUID if authenticated
 * @param userEmail - Optional user email
 * @returns The created feedback record
 * @throws Error if submission fails
 */
export const submitFeedback = async (
  feedback: { type: Feedback['type']; message: string },
  userId?: string,
  userEmail?: string
): Promise<Feedback> => {
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: userId || null,
      user_email: userEmail || null,
      type: feedback.type,
      message: feedback.message,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Fetches all feedback records (admin only)
 * @returns Array of all feedback records
 * @throws Error if query fails
 */
export const fetchAllFeedback = async (): Promise<Feedback[]> => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Updates the status of a feedback record (admin only)
 * @param feedbackId - The feedback UUID
 * @param status - New status: 'new', 'read', 'resolved', or 'archived'
 * @throws Error if update fails
 */
export const updateFeedbackStatus = async (
  feedbackId: string,
  status: Feedback['status']
): Promise<void> => {
  const { error } = await supabase
    .from('feedback')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', feedbackId);

  if (error) throw error;
};

