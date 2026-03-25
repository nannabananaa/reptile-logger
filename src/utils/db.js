import { supabase } from './supabase';

export async function fetchReptiles() {
  const { data, error } = await supabase
    .from('reptiles')
    .select('*, logs(created_at)')
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
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('reptiles')
    .insert({
      user_id: user.id,
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
    .update(updates)
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
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('logs')
    .insert({
      reptile_id: reptileId,
      user_id: user.id,
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
