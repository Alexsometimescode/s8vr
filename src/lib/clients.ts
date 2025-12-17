import { supabase } from './supabase';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  website?: string;
  contact_person?: string;
  active: boolean;
  created_at: string;
}

// Fetch all clients for current user
export const fetchClients = async (userId: string): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create new client
export const createClient = async (client: Omit<Client, 'id' | 'user_id' | 'created_at'>, userId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...client,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update client
export const updateClient = async (clientId: string, updates: Partial<Client>) => {
  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId);

  if (error) throw error;
};

// Delete client
export const deleteClient = async (clientId: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) throw error;
};

