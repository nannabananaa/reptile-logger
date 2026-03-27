import { supabase } from './supabase';

async function getUserId() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

async function fetchProfilesByIds(ids) {
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', ids);
  if (error) throw error;
  const map = {};
  for (const p of data) map[p.id] = p;
  return map;
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

export async function upsertProfile({ display_name, email }) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, display_name, email })
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

  // Step 1: get shared_reptiles rows
  const { data: shares, error } = await supabase
    .from('shared_reptiles')
    .select('*')
    .eq('shared_with_id', userId)
    .eq('status', 'accepted');

  if (error) throw error;
  if (shares.length === 0) return [];

  // Step 2: fetch the reptiles with their logs
  const reptileIds = [...new Set(shares.map((s) => s.reptile_id))];
  const { data: reptiles, error: rErr } = await supabase
    .from('reptiles')
    .select('*, logs(created_at)')
    .in('id', reptileIds);
  if (rErr) throw rErr;
  const reptileMap = {};
  for (const r of reptiles) reptileMap[r.id] = r;

  // Step 3: fetch owner profiles
  const ownerIds = [...new Set(shares.map((s) => s.owner_id))];
  const profileMap = await fetchProfilesByIds(ownerIds);

  // Combine
  return shares.map((s) => ({
    ...s,
    reptile: reptileMap[s.reptile_id] || null,
    owner: profileMap[s.owner_id] || null,
  }));
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

export async function createReptile({ name, species, dob, photo, category }) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('reptiles')
    .insert({
      user_id: userId,
      name,
      species: species || '',
      dob: dob || null,
      photo: photo || null,
      category: category || 'other',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReptileById(id, updates) {
  const updateObj = {
    name: updates.name,
    species: updates.species,
    dob: updates.dob,
    photo: updates.photo,
  };
  if (updates.category !== undefined) updateObj.category = updates.category;
  const { data, error } = await supabase
    .from('reptiles')
    .update(updateObj)
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
  const { data: logs, error } = await supabase
    .from('logs')
    .select('*')
    .eq('reptile_id', reptileId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch display names for all log authors
  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))];
  const profileMap = await fetchProfilesByIds(userIds);

  return logs.map((l) => ({
    ...l,
    profile: profileMap[l.user_id] || null,
  }));
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
      category_fields: log.category_fields || {},
    })
    .select()
    .single();

  if (error) throw error;

  // Attach profile
  const profileMap = await fetchProfilesByIds([userId]);
  return { ...data, profile: profileMap[userId] || null };
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

export async function shareReptile(reptileId, sharedWithId, sharedWithEmail) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('shared_reptiles')
    .insert({
      reptile_id: reptileId,
      owner_id: userId,
      shared_with_id: sharedWithId,
      shared_with_email: sharedWithEmail,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Attach shared_with profile
  const profileMap = await fetchProfilesByIds([sharedWithId]);
  return { ...data, shared_with: profileMap[sharedWithId] || null };
}

export async function fetchSharesForReptile(reptileId) {
  const { data: shares, error } = await supabase
    .from('shared_reptiles')
    .select('*')
    .eq('reptile_id', reptileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (shares.length === 0) return [];

  // Fetch shared_with profiles
  const sharedWithIds = [...new Set(shares.map((s) => s.shared_with_id))];
  const profileMap = await fetchProfilesByIds(sharedWithIds);

  return shares.map((s) => ({
    ...s,
    shared_with: profileMap[s.shared_with_id] || null,
  }));
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

  const { data: invites, error } = await supabase
    .from('shared_reptiles')
    .select('*')
    .eq('shared_with_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  if (invites.length === 0) return [];

  // Fetch reptile names
  const reptileIds = [...new Set(invites.map((i) => i.reptile_id))];
  const { data: reptiles, error: rErr } = await supabase
    .from('reptiles')
    .select('id, name, photo')
    .in('id', reptileIds);
  if (rErr) throw rErr;
  const reptileMap = {};
  for (const r of reptiles) reptileMap[r.id] = r;

  // Fetch owner profiles
  const ownerIds = [...new Set(invites.map((i) => i.owner_id))];
  const profileMap = await fetchProfilesByIds(ownerIds);

  return invites.map((i) => ({
    ...i,
    reptile: reptileMap[i.reptile_id] || null,
    owner: profileMap[i.owner_id] || null,
  }));
}

export async function deleteAccount() {
  const userId = await getUserId();

  // Delete shared_reptiles where user is owner or shared_with
  await supabase.from('shared_reptiles').delete().eq('owner_id', userId);
  await supabase.from('shared_reptiles').delete().eq('shared_with_id', userId);

  // Get all reptile IDs owned by user
  const { data: reptiles } = await supabase
    .from('reptiles')
    .select('id')
    .eq('user_id', userId);

  if (reptiles && reptiles.length > 0) {
    const reptileIds = reptiles.map((r) => r.id);
    // Delete all logs for user's reptiles
    await supabase.from('logs').delete().in('reptile_id', reptileIds);
    // Delete reptiles
    await supabase.from('reptiles').delete().eq('user_id', userId);
  }

  // Delete logs the user created on shared reptiles
  await supabase.from('logs').delete().eq('user_id', userId);

  // Delete profile
  await supabase.from('profiles').delete().eq('id', userId);

  // Delete auth user (via RPC or admin — fallback: just sign out)
  // Supabase client-side can't delete auth users, so we sign out.
  // The auth user record remains but all data is gone.
  await supabase.auth.signOut();
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
