import { createClient } from '@supabase/supabase-js'

// Environment variables - provided by Gambo's auto-connect
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dxzayhugyjroseetvrye.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4emF5aHVneWpyb3NlZXR2cnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTEyMjMsImV4cCI6MjA3Nzk2NzIyM30.aydLyHrL62HO-yk4LFUPR7nU72Famcgcan5wcojzF54'

// Log connection status
console.log('Supabase connected to:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema types
export interface Asset {
  asset_key: string
  type: 'image' | 'sprite' | 'atlas' | 'audio' | 'font'
  uri: string
  version: number
}

export interface ArtPack {
  art_pack_key: string
  display_name: string
  ui_skin_key: string
  avatar_key: string
  tile_set_key: string
  bg_world_key: string
}

export interface MapNode {
  map_node_id: string
  world_id: string
  display_name: string
  x_pct: number
  y_pct: number
  enter_cutscene_id?: string
  leave_cutscene_id?: string
  unlock_rule: string
  icon_key: string
  bg_key_override?: string
}

export interface MapEdge {
  edge_id: string
  world_id: string
  from_node_id: string
  to_node_id: string
  path_style: string
  walk_duration_ms: number
}

export interface Level {
  level_id: string
  chapter: number
    // NEW:
    land_id?: number        // which Land this level belongs to
    season_id?: string | null  // null/undefined = default version

  world_id: string
  map_node_id: string
  puzzle_bank_id: string
  difficulty: 'easy' | 'medium' | 'hard'
  target_score: number
  time_limit_seconds: number
  powerups_allowed: string
  art_pack_key: string
  music_key: string
  next_level_id_on_win?: string
  next_level_id_on_fail?: string
  cutscene_id_pre?: string
  cutscene_id_post?: string
  feature_flag_keys?: string
  notes_admin?: string
}

export interface Season {
  season_id: string
  art_pack_key: string
  start_date: string
  end_date: string
  priority: number
  notes?: string
}

export interface FeatureFlag {
  flag_key: string
  default_value: boolean
  target_rule: string
  notes?: string
}

export interface Localization {
  string_key: string
  en: string
  es?: string
}

export interface PlayerState {
  player_id: string
  current_level_id: string
  current_node_id: string
  unlocked_nodes: string
  currency: number
  flags: Record<string, any>

  hearts?: number
  max_hearts?: number
  lives?: number
  max_lives?: number
  next_heart_at?: string | null
  next_life_at?: string | null
}

export interface Profile {
  id: string;                // auth user id
  display_name: string;
  avatar_url?: string | null;
  created_at: string;
  last_seen?: string | null;
  meta?: {
    name_locked?: boolean;      // true once the player has chosen a custom name
    has_custom_name?: boolean;  // true if this is not just the starter name
    [key: string]: any;
  } | null;
}


export interface InventoryItem {
  id: number;
  user_id: string;
  item_key: string;
  quantity: number;
  meta?: Record<string, any> | null;
  created_at: string;
}
