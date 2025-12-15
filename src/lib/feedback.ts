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

// Submit feedback
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

// Fetch all feedback (admin only - will need to handle in app code)
export const fetchAllFeedback = async (): Promise<Feedback[]> => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update feedback status (admin only)
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

