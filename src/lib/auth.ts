import { supabase, isSupabaseConfigured } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Registers a new user with Supabase Auth and creates their profile
 * @param data - Sign up data including email, password, and name
 * @returns The auth data containing user and session
 * @throws Error if registration fails
 */
export const signUp = async (data: SignUpData) => {
  // Sign up with Supabase Auth including user metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name, // Store name in user metadata
      },
      emailRedirectTo: window.location.origin, // Redirect after email verification
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  // Create user profile in public.users table
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      plan: 'free',
      role: 'user',
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });

  if (profileError) {
    // Log error but don't fail - profile can be created later
    console.error('Profile creation error:', profileError);
    // The App.tsx will create the profile using upsert when needed
  }

  return authData;
};

/**
 * Authenticates an existing user with email and password
 * @param data - Sign in credentials
 * @returns The auth data containing user and session
 * @throws Error if authentication fails
 */
export const signIn = async (data: SignInData) => {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) throw error;
  return authData;
};

/**
 * Signs out the current user and clears the session
 * @throws Error if sign out fails
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Gets the current authentication session
 * @returns The current session or null if not authenticated
 */
export const getSession = async () => {
  if (!isSupabaseConfigured) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Subscribes to authentication state changes
 * @param callback - Function called when auth state changes
 * @returns Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback: (user: any) => void) => {
  if (!isSupabaseConfigured) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
};

