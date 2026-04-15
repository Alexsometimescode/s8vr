const PROFILE_KEY = 's8vr_profile';
const OWNER_KEY   = 's8vr_owner_id';

export interface Profile {
  id: string;
  name: string;
  email: string;
  logo_url?: string;
  avatar_url?: string;
  currency: string;
  invoice_number_format: string;
  email_notifications: boolean;
  created_at: string;
}

/** Returns the stable local owner UUID, generating one on first call */
export const getOwnerId = (): string => {
  let id = localStorage.getItem(OWNER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(OWNER_KEY, id);
  }
  return id;
};

export const getProfile = (): Profile | null => {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  const p = JSON.parse(raw);
  p.id = getOwnerId();
  return p;
};

export const saveProfile = (profile: Omit<Profile, 'id'>): Profile => {
  const full: Profile = { ...profile, id: getOwnerId() };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(full));
  return full;
};
