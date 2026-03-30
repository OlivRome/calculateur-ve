import { createClient } from '@supabase/supabase-js'

// On récupère les variables d'environnement via l'objet spécial de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// On crée et on exporte le "client" Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)