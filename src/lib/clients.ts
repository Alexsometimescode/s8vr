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

/**
 * Fetches all clients for a user
 * @param userId - The user's UUID
 * @returns Array of client records
 * @throws Error if database query fails
 */
export const fetchClients = async (userId: string): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Creates a new client for a user
 * @param client - Client data (name, email, etc.)
 * @param userId - The user's UUID
 * @returns The created client record
 * @throws Error if creation fails
 */
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

/**
 * Updates an existing client with partial data
 * @param clientId - The client UUID
 * @param updates - Partial client data to update
 * @throws Error if update fails
 */
export const updateClient = async (clientId: string, updates: Partial<Client>) => {
  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId);

  if (error) throw error;
};

/**
 * Deletes a client
 * @param clientId - The client UUID to delete
 * @throws Error if deletion fails
 */
export const deleteClient = async (clientId: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) throw error;
};

