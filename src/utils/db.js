import { supabase } from './supabase';

async function getUserId() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

/* ── Profile ── */

export async function fetchProfile() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data;
}

export async function createProfile({ display_name, email }) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, display_name, email })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile({ display_name }) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ── Reptiles ── */

export async function fetchReptiles() {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('reptiles')
    .select('*, logs(created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchSharedReptiles() {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('shared_reptiles')
    .select('*, reptile:reptiles(*, logs(created_at)), owner:profiles!shared_reptiles_owner_id_fkey(display_name, email)')
    .eq('shared_with_id', userId)
    .eq('status', 'accepted');

  if (error) throw error;
  return data;
}

export async function fetchReptileById(id) {
  const { data, error } = await supabase
    .from('reptiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createReptile({ name, species, dob, photo }) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('reptiles')
    .insert({
      user_id: userId,
      name,
      species: species || '',
      dob: dob || null,
      photo: photo || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReptileById(id, updates) {
  const { data, error } = await supabase
    .from('reptiles')
    .update({
      name: updates.name,
      species: updates.species,
      dob: updates.dob,
      photo: updates.photo,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReptileById(id) {
  const { error } = await supabase
    .from('reptiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/* ── Logs ── */

export async function fetchLogs(reptileId) {
  const { data, error } = await supabase
    .from('logs')
    .select('*, profile:profiles(display_name)')
    .eq('reptile_id', reptileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createLog(reptileId, log) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('logs')
    .insert({
      reptile_id: reptileId,
      user_id: userId,
      temperature: log.temperature,
      humidity: log.humidity,
      weight: log.weight,
      fed: log.fed,
      vitamins: log.vitamins,
      notes: log.notes,
    })
    .select('*, profile:profiles(display_name)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLogById(logId) {
  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', logId);

  if (error) throw error;
}

/* ── Sharing ── */

export async function lookupProfileByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

export async function shareReptile(reptileId, sharedWithId) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('shared_reptiles')
    .insert({
      reptile_id: reptileId,
      owner_id: userId,
      shared_with_id: sharedWithId,
      status: 'pending',
    })
    .select('*, shared_with:profiles!shared_reptiles_shared_with_id_fkey(display_name, email)')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSharesForReptile(reptileId) {
  const { data, error } = await supabase
    .from('shared_reptiles')
    .select('*, shared_with:profiles!shared_reptiles_shared_with_id_fkey(display_name, email)')
    .eq('reptile_id', reptileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function removeShare(shareId) {
  const { error } = await supabase
    .from('shared_reptiles')
    .delete()
    .eq('id', shareId);

  if (error) throw error;
}

export async function fetchPendingInvites() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('shared_reptiles')
    .select('*, reptile:reptiles(name, photo), owner:profiles!shared_reptiles_owner_id_fkey(display_name)')
    .eq('shared_with_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  return data;
}

export async function respondToInvite(shareId, accept) {
  if (accept) {
    const { error } = await supabase
      .from('shared_reptiles')
      .update({ status: 'accepted' })
      .eq('id', shareId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('shared_reptiles')
      .delete()
      .eq('id', shareId);
    if (error) throw error;
  }
}
