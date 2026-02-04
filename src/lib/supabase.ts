// src/lib/supabase.ts
// Ce fichier initialise un client Supabase réutilisable.
// On l'utilise côté serveur (dans les pages ou API routes) pour fetcher des données sécurisées.
// Importe-le où tu en as besoin.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);