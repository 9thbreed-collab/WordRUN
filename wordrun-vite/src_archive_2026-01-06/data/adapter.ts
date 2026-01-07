import { ThemeSwitch, localTheme } from '../config/stylePack';
import { MapGraphLocal } from '../config/mapGraph';
// import { supabase } from '../supabase'; // keep commented for now

type FlagRow={value_json:any};

export async function getTheme(){ return localTheme(); }

export async function getWheelMode():Promise<'baseline'|'aligned'>{ return 'aligned'; } // default to corrected

export async function getMapGraph(){ return MapGraphLocal; }