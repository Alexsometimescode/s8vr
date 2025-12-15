import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Sign up new user
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

// Sign in existing user
export const signIn = async (data: SignInData) => {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) throw error;
  return authData;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Listen to auth changes
export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
};

