export type SevaTypeKey = 'ALL' | 'NITYA_POOJA' | 'NAVARATRI' | 'SONARATHI' | 'ANNADANA';

export interface TempleRegistration {
  id: string;
  serial_number: string;
  devotee_name: string;
  phone: string;
  address: string;
  place?: string; // Village / Grama / Locality
  seva_type: 'NITYA_POOJA' | 'NAVARATRI' | 'SONARATHI' | 'ANNADANA';
  seva_date?: string; // YYYY-MM-DD
  seva_month?: number; // 1 to 12
  festival_day?: number; // 1 to 10 for Navaratri, 1 to 30 for Sonarathi
  agreed_fee: number;
  paid_amount: number;
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GramaMoktesara {
  id: string;
  name: string;
  phone_primary: string;
  phone_secondary?: string;
  grama: string; // Village e.g. Barkur, Kachoor, Bennekudru, Hanehalli, Heradi
  address: string;
  designation?: string;
  notes?: string;
  created_at: string;
}

export interface KanikeItem {
  id: string;
  year: number;
  festival_event: string; // Deepotsava, Prathishta Mahotsava, Kalakanike, Rathotsava, Custom
  moktesara_id?: string; // ID of the Grama Moktesara who collected/submitted
  moktesara_name: string; // Name of Grama Moktesara
  grama: string; // Village e.g. Barkur, Kachoor, Bennekudru
  phone?: string;
  people_count: number; // Number of people/families who contributed in this batch
  kanike_type: string; // Arati Kanike, Guru Kanike, Vivaha Kanike, Deepotsava, Custom
  amount: number; // Total amount collected
  receipt_number?: string;
  date: string;
  notes?: string;
}

export interface KanikeCategorySummary {
  category: string;
  people_count: number; // Total people who contributed under this category
  collection_count: number; // Number of Moktesara remittance entries
  total_amount: number;
}

export type ThemeColor = 'forest' | 'saffron' | 'crimson' | 'indigo';
