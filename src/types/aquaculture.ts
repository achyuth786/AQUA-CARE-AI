export type Language = 'en' | 'te';

export type PondStatus = 'active' | 'nursery' | 'harvesting' | 'fallow';

export interface Farm {
  id: string;
  name: string;
  name_te: string;
  owner_name: string;
  district: string;
  mandal: string;
  state: string;
  total_area_ha: number;
  total_ponds: number;
}

export interface Pond {
  id: string;
  farm_id: string;
  name: string;
  name_te: string;
  area_ha: number;
  depth_m: number;
  water_source: string;
  aerator_count: number;
  aerator_hp: number;
  status: PondStatus;
  // Culture cycle details
  active_cycle_id?: string;
  doc: number; // Days of Culture
  stocking_date: string;
  species: string;
  seed_quantity: number;
  stocking_density_per_sqm: number;
  initial_abw_g: number;
  current_abw_g: number;
  estimated_count: number;
  estimated_survival_pct: number;
  estimated_biomass_kg: number;
  cumulative_feed_kg: number;
  fcr: number;
  health_score: number;
}

export interface WaterQualityRecord {
  id: string;
  pond_id: string;
  timestamp: string;
  time_of_day: 'AM' | 'PM';
  do_ppm: number;
  ph: number;
  salinity_ppt: number;
  temperature_c: number;
  alkalinity_ppm: number;
  ammonia_ppm: number;
  nitrite_ppm: number;
  transparency_cm: number;
  notes?: string;
  recorded_by?: string;
}

export interface FeedRecord {
  id: string;
  pond_id: string;
  date: string;
  meal_number: 1 | 2 | 3 | 4;
  meal_time: string;
  feed_brand: string;
  pellet_size_mm: number;
  protein_pct: number;
  feed_quantity_kg: number;
  // Tray 1 to 4 observation: 0 = completely finished (clean), 1 = 10-20% left, 2 = 50% left, 3 = untouched
  tray_observations: {
    tray_1: 'clean' | 'slight_left' | 'half_left' | 'untouched';
    tray_2: 'clean' | 'slight_left' | 'half_left' | 'untouched';
    tray_3: 'clean' | 'slight_left' | 'half_left' | 'untouched';
    tray_4?: 'clean' | 'slight_left' | 'half_left' | 'untouched';
  };
  feed_adjustment_notes?: string;
}

export interface SamplingRecord {
  id: string;
  pond_id: string;
  date: string;
  doc: number;
  sample_size_count: number;
  total_sample_weight_g: number;
  abw_g: number;
  count_per_kg: number;
  weekly_gain_g: number;
  growth_rate_g_day: number;
  gut_condition: 'full' | 'half' | 'empty' | 'broken';
  shell_condition: 'hard' | 'soft' | 'molting';
  recorded_by?: string;
}

export interface MortalityRecord {
  id: string;
  pond_id: string;
  date: string;
  mortality_count: number;
  estimated_mortality_kg: number;
  cause_suspected: string;
  cause_suspected_te: string;
  action_taken?: string;
}

export interface MarketPriceRecord {
  id: string;
  date: string;
  count_per_kg: number;
  price_inr: number;
  region: string;
}

export interface HealthScanItem {
  id: string;
  pond_id: string;
  timestamp: string;
  image_url: string;
  focal_area: 'whole_body' | 'gills' | 'hepatopancreas' | 'gut' | 'muscle';
  focal_area_te: string;
  visible_observations: string[];
  visible_observations_te: string[];
  potential_conditions: {
    name: string;
    name_te: string;
    risk_level: 'low' | 'moderate' | 'high' | 'critical';
    confidence_note: string;
    confidence_note_te: string;
  }[];
  scientific_safety_note: string;
  scientific_safety_note_te: string;
  suggested_actions: string[];
  suggested_actions_te: string[];
  lab_test_recommended: string;
  lab_test_recommended_te: string;
}

export interface Alert {
  id: string;
  pond_id: string;
  pond_name: string;
  pond_name_te: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  title_te: string;
  description: string;
  description_te: string;
  parameter?: string;
  value?: string;
  recommendation: string;
  recommendation_te: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface WhatIfScenario {
  target_count: number;
  expected_price_inr: number;
  estimated_harvest_doc: number;
  additional_days: number;
  estimated_final_biomass_kg: number;
  estimated_additional_feed_kg: number;
  estimated_additional_expenses_inr: number;
  projected_gross_revenue_inr: number;
  projected_net_profit_inr: number;
  risk_level: 'low' | 'moderate' | 'high';
}
