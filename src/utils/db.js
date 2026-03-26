import { supabase } from './supabase';

async function getUserId() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

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

export async function fetchReptileById(id) {
  const { data, error } = await supabase
    .from('reptiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchLogs(reptileId) {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('reptile_id', reptileId)
    .order('created_at', { ascending: false });

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
    .select()
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
