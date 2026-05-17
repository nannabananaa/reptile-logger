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

// Only the columns the home/quick-log lists actually render. Photos are
// deliberately excluded — each photo is a multi-KB base64 blob and pulling
// dozens of them for a list view is the dominant cause of slow home loads.
// The detail page fetches the full row (including photo) via fetchReptileById.
const REPTILE_LIST_COLUMNS = 'id, name, species, category, logs(created_at)';

export async function fetchReptiles() {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('reptiles')
    .select(REPTILE_LIST_COLUMNS)
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
    .select(REPTILE_LIST_COLUMNS)
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
  const row = {
    user_id: userId,
    name,
    species: species || '',
    dob: dob || null,
    photo: photo || null,
  };
  // Only include category if the caller supplied one. Avoids tripping any
  // leftover CHECK constraint from the pre-simplification schema (which only
  // permitted the old plural values like 'snakes', 'geckos', 'other', etc.).
  if (category) row.category = category;

  let { data, error } = await supabase.from('reptiles').insert(row).select().single();

  // Fallback: if the category column has a CHECK constraint that rejects the
  // new singular values (23514 = check_violation), retry without category so
  // the reptile still saves. The user can correct it from the edit screen.
  if (error && error.code === '23514' && 'category' in row) {
    console.warn('reptiles.category rejected by CHECK constraint; retrying without category. Run supabase/relax-reptile-category.sql to fix permanently.');
    const { category: _omit, ...without } = row;
    ({ data, error } = await supabase.from('reptiles').insert(without).select().single());
  }

  if (error) {
    console.error('createReptile insert failed:', error);
    throw error;
  }
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
  if (updates.dual_sides !== undefined) updateObj.dual_sides = updates.dual_sides;

  // If the dual_sides column doesn't exist yet, throw a clear error pointing
  // at the SQL to run. (Previously this was silently stripped, which meant
  // the toggle "saved" successfully but the value never persisted.)
  function isMissingColumn(error, column) {
    if (!error) return false;
    if (error.code === '42703' && new RegExp(`column "?${column}"? of relation "reptiles" does not exist`, 'i').test(error.message || '')) return true;
    // PostgREST schema-cache miss
    if (error.code === 'PGRST204' && new RegExp(`'${column}' column`, 'i').test(error.message || '')) return true;
    return false;
  }

  const { data, error } = await supabase
    .from('reptiles')
    .update(updateObj)
    .eq('id', id)
    .select()
    .single();

  if (error && isMissingColumn(error, 'dual_sides') && 'dual_sides' in updateObj) {
    throw new Error(
      "The 'dual_sides' column is missing from the reptiles table. Run this SQL in the Supabase SQL Editor: " +
      "ALTER TABLE reptiles ADD COLUMN IF NOT EXISTS dual_sides boolean DEFAULT false;"
    );
  }
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
  const baseRow = {
    reptile_id: reptileId,
    user_id: userId,
    temperature: log.temperature,
    humidity: log.humidity,
    weight: log.weight,
    fed: log.fed,
    vitamins: log.vitamins,
    notes: log.notes,
  };
  // vet_notes and enclosure_cleaned_date live inside category_fields rather
  // than as dedicated columns — keeps logs writeable without running any
  // schema migration on the logs table.
  const cf = { ...(log.category_fields || {}) };
  if (log.vet_notes) cf.vet_notes = log.vet_notes;
  if (log.enclosure_cleaned_date) cf.enclosure_cleaned_date = log.enclosure_cleaned_date;
  const hasCategoryFields = Object.keys(cf).length > 0;
  const fullRow = hasCategoryFields ? { ...baseRow, category_fields: cf } : baseRow;

  // Tries the insert. On a 42703 (undefined column) error from any of the
  // newer columns, drops that column from the row and retries. Lets logs
  // still save before the schema migration has been run.
  async function tryInsert(row) {
    const { data, error } = await supabase.from('logs').insert(row).select().single();
    if (!error) return { data };
    if (error.code !== '42703') return { error };
    // Identify the missing column from the error message and retry without it.
    const match = /column "?([a-z_]+)"? of relation "logs" does not exist/i.exec(error.message || '');
    const missing = match?.[1];
    if (missing && missing in row) {
      console.warn(`logs.${missing} column missing — retrying without it. Run supabase/add-feature-batch.sql to add it.`);
      const { [missing]: _omit, ...rest } = row;
      return tryInsert(rest);
    }
    return { error };
  }

  const { data, error } = await tryInsert(fullRow);
  if (error) throw error;

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
