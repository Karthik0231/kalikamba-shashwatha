import { supabase, isSupabaseConfigured } from './supabase';
import { TempleRegistration, GramaMoktesara, KanikeItem } from '../types/database';

export const SEVA_CATEGORIES = [
  {
    key: 'NITYA_POOJA' as const,
    name_en: 'Shashwatha Nitya Pooja',
    name_kn: 'ಶಾಶ್ವತ ನಿತ್ಯ ಪೂಜೆ',
    prefix: 'SNP',
    defaultFee: 1500,
    type: 'date' as const,
  },
  {
    key: 'NAVARATRI' as const,
    name_en: 'Shashwatha Navaratri',
    name_kn: 'ಶಾಶ್ವತ ನವರಾತ್ರಿ',
    prefix: 'SNV',
    defaultFee: 2000,
    type: 'day_10' as const,
  },
  {
    key: 'SONARATHI' as const,
    name_en: 'Shashwatha Sonarathi',
    name_kn: 'ಶಾಶ್ವತ ಸೋನಾರತಿ',
    prefix: 'SNR',
    defaultFee: 2500,
    type: 'day_30' as const,
  },
  {
    key: 'ANNADANA' as const,
    name_en: 'Shashwatha Annadana',
    name_kn: 'ಶಾಶ್ವತ ಅನ್ನದಾನ',
    prefix: 'SSA',
    defaultFee: 5000,
    type: 'date' as const,
  },
];

export const STANDARD_GRAMAS = [
  'Barkur (ಬಾರಕೂರು)',
  'Kachoor (ಕಚೂರು)',
  'Bennekudru (ಬೆಣ್ಣೆಕುದ್ರು)',
  'Hanehalli (ಹನೆಹಳ್ಳಿ)',
  'Heradi (ಹೇರಾಡಿ)',
  'Moodahadu (ಮೂಡಹಾಡು)',
  'Shiriyara (ಶಿರಿಯಾರ)',
  'Pandeshwara (ಪಾಂಡೇಶ್ವರ)',
  'Brahmavara (ಬ್ರಹ್ಮಾವರ)',
  'Kota (ಕೋಟ)',
  'Mabukala (ಮಬುಕಳ)',
  'Sasthan (ಸಾಸ್ತಾನ)',
];

export const KANIKE_CATEGORIES_PRESET = [
  'Arati Kanike (ಆರತಿ ಕಾಣಿಕೆ)',
  'Guru Kanike (ಗುರು ಕಾಣಿಕೆ)',
  'Vivaha Kanike (ವಿವಾಹ ಕಾಣಿಕೆ)',
  'Deepotsava Kanike (ದೀಪೋತ್ಸವ ಕಾಣಿಕೆ)',
  'Prathishta Kanike (ಪ್ರತಿಷ್ಠಾ ಕಾಣಿಕೆ)',
  'Anna Santarpana Kanike (ಅನ್ನ ಸಂತರ್ಪಣೆ ಕಾಣಿಕೆ)',
  'Samarpana Kanike (ಸಮರ್ಪಣಾ ಕಾಣಿಕೆ)',
];

const KEYS = {
  REGISTRATIONS: 'kalikamba_barkur_registrations',
  MOKTESARARU: 'kalikamba_barkur_moktesararu',
  KANIKE: 'kalikamba_barkur_kanike',
  INITIALIZED: 'kalikamba_barkur_initialized',
};

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage write error', e);
  }
}

export const repository = {
  // Check if connected to Supabase
  isCloudConnected(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  // Clear all local mock/test data to start fresh
  clearAllLocalData(): void {
    localStorage.removeItem(KEYS.REGISTRATIONS);
    localStorage.removeItem(KEYS.MOKTESARARU);
    localStorage.removeItem(KEYS.KANIKE);
    localStorage.setItem(KEYS.INITIALIZED, 'true');
    setLocal(KEYS.REGISTRATIONS, []);
    setLocal(KEYS.MOKTESARARU, []);
    setLocal(KEYS.KANIKE, []);
  },

  // 1. REGISTRATIONS (PERMANENT SEVAS)
  async getAll(): Promise<TempleRegistration[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            serial_number: d.serial_number,
            devotee_name: d.devotee_name,
            phone: d.phone || '',
            address: d.address || '',
            place: d.place || 'Barkur (ಬಾರಕೂರು)',
            seva_type: d.seva_type as any,
            seva_date: d.seva_date || undefined,
            seva_month: d.seva_date ? parseInt(d.seva_date.split('-')[1], 10) : undefined,
            festival_day: d.festival_day || undefined,
            agreed_fee: Number(d.agreed_fee || 0),
            paid_amount: Number(d.paid_amount || 0),
            payment_status: d.payment_status || (Number(d.paid_amount) >= Number(d.agreed_fee) ? 'PAID' : 'PARTIAL'),
            notes: d.notes || '',
            created_at: d.created_at,
            updated_at: d.updated_at,
          }));
        }
        if (error) {
          console.warn('Supabase fetch error, falling back to local:', error.message);
        }
      } catch (err) {
        console.warn('Supabase offline or unreachable:', err);
      }
    }

    return getLocal<TempleRegistration[]>(KEYS.REGISTRATIONS, []);
  },

  async generateSerial(sevaType: TempleRegistration['seva_type']): Promise<string> {
    const found = SEVA_CATEGORIES.find(s => s.key === sevaType);
    const prefix = found ? found.prefix : 'SKB';
    const all = await this.getAll();
    const count = all.filter(r => r.serial_number.startsWith(prefix)).length + 1;
    return `${prefix}-${String(count).padStart(5, '0')}`;
  },

  async create(item: Omit<TempleRegistration, 'id' | 'created_at' | 'updated_at'>): Promise<TempleRegistration> {
    const id = 'reg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const status = item.paid_amount >= item.agreed_fee ? 'PAID' : item.paid_amount > 0 ? 'PARTIAL' : 'UNPAID';
    const month = item.seva_date ? parseInt(item.seva_date.split('-')[1], 10) : undefined;
    const now = new Date().toISOString();

    const record: TempleRegistration = {
      ...item,
      id,
      seva_month: month,
      payment_status: status,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('registrations').insert({
          id: record.id,
          serial_number: record.serial_number,
          devotee_name: record.devotee_name,
          phone: record.phone,
          address: record.address,
          place: record.place,
          seva_type: record.seva_type,
          seva_date: record.seva_date || null,
          festival_day: record.festival_day || null,
          agreed_fee: record.agreed_fee,
          paid_amount: record.paid_amount,
          payment_status: record.payment_status,
          notes: record.notes || null,
          created_at: record.created_at,
          updated_at: record.updated_at,
        });
        if (error) console.error('Supabase insert error:', error);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }

    const current = getLocal<TempleRegistration[]>(KEYS.REGISTRATIONS, []);
    current.unshift(record);
    setLocal(KEYS.REGISTRATIONS, current);
    return record;
  },

  async update(id: string, updates: Partial<TempleRegistration>): Promise<TempleRegistration> {
    const current = await this.getAll();
    const index = current.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Record not found');

    const updated = {
      ...current[index],
      ...updates,
      seva_month: updates.seva_date ? parseInt(updates.seva_date.split('-')[1], 10) : current[index].seva_month,
      updated_at: new Date().toISOString(),
    };

    if (updated.paid_amount >= updated.agreed_fee) {
      updated.payment_status = 'PAID';
    } else if (updated.paid_amount > 0) {
      updated.payment_status = 'PARTIAL';
    } else {
      updated.payment_status = 'UNPAID';
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('registrations')
          .update({
            devotee_name: updated.devotee_name,
            phone: updated.phone,
            address: updated.address,
            place: updated.place,
            seva_type: updated.seva_type,
            seva_date: updated.seva_date || null,
            festival_day: updated.festival_day || null,
            agreed_fee: updated.agreed_fee,
            paid_amount: updated.paid_amount,
            payment_status: updated.payment_status,
            notes: updated.notes || null,
            updated_at: updated.updated_at,
          })
          .eq('id', id);
      } catch (e) {
        console.error('Supabase update error:', e);
      }
    }

    const localList = getLocal<TempleRegistration[]>(KEYS.REGISTRATIONS, []);
    const localIdx = localList.findIndex(r => r.id === id);
    if (localIdx !== -1) {
      localList[localIdx] = updated;
      setLocal(KEYS.REGISTRATIONS, localList);
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('registrations').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase delete error:', e);
      }
    }
    const current = getLocal<TempleRegistration[]>(KEYS.REGISTRATIONS, []).filter(r => r.id !== id);
    setLocal(KEYS.REGISTRATIONS, current);
  },

  async bulkImport(records: Omit<TempleRegistration, 'id' | 'created_at' | 'updated_at'>[]): Promise<number> {
    const now = new Date().toISOString();
    const prepared = records.map((r, i) => {
      const status = r.paid_amount >= r.agreed_fee ? 'PAID' : r.paid_amount > 0 ? 'PARTIAL' : 'UNPAID';
      const month = r.seva_date ? parseInt(r.seva_date.split('-')[1], 10) : undefined;
      return {
        ...r,
        id: 'reg-bulk-' + Date.now() + '-' + i,
        seva_month: month,
        payment_status: status as any,
        created_at: now,
        updated_at: now,
      };
    });

    if (isSupabaseConfigured && supabase && prepared.length > 0) {
      try {
        const payload = prepared.map(p => ({
          id: p.id,
          serial_number: p.serial_number,
          devotee_name: p.devotee_name,
          phone: p.phone,
          address: p.address,
          place: p.place,
          seva_type: p.seva_type,
          seva_date: p.seva_date || null,
          festival_day: p.festival_day || null,
          agreed_fee: p.agreed_fee,
          paid_amount: p.paid_amount,
          payment_status: p.payment_status,
          notes: p.notes || null,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        await supabase.from('registrations').insert(payload);
      } catch (e) {
        console.error('Supabase bulk insert error:', e);
      }
    }

    const current = getLocal<TempleRegistration[]>(KEYS.REGISTRATIONS, []);
    current.unshift(...prepared);
    setLocal(KEYS.REGISTRATIONS, current);
    return prepared.length;
  },

  // 2. GRAMA MOKTESARARU (VILLAGE HEADS)
  async getMoktesararu(): Promise<GramaMoktesara[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('grama_moktesararu')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            phone_primary: d.phone_primary,
            phone_secondary: d.phone_secondary || undefined,
            grama: d.grama,
            address: d.address,
            designation: d.designation || 'ಮೊಕ್ತೇಸರರು',
            created_at: d.created_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase moktesararu error:', e);
      }
    }

    return getLocal<GramaMoktesara[]>(KEYS.MOKTESARARU, []);
  },

  async createMoktesara(item: Omit<GramaMoktesara, 'id' | 'created_at'>): Promise<GramaMoktesara> {
    const id = 'mok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    const now = new Date().toISOString();
    const newMok: GramaMoktesara = {
      ...item,
      id,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('grama_moktesararu').insert({
          id: newMok.id,
          name: newMok.name,
          phone_primary: newMok.phone_primary,
          phone_secondary: newMok.phone_secondary || null,
          grama: newMok.grama,
          address: newMok.address,
          designation: newMok.designation || 'ಮೊಕ್ತೇಸರರು',
          created_at: newMok.created_at,
        });
      } catch (e) {
        console.error('Supabase moktesara insert error:', e);
      }
    }

    const list = getLocal<GramaMoktesara[]>(KEYS.MOKTESARARU, []);
    list.unshift(newMok);
    setLocal(KEYS.MOKTESARARU, list);
    return newMok;
  },

  async updateMoktesara(id: string, updates: Partial<GramaMoktesara>): Promise<GramaMoktesara> {
    const list = await this.getMoktesararu();
    const index = list.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Moktesara not found');
    list[index] = { ...list[index], ...updates };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('grama_moktesararu')
          .update({
            name: list[index].name,
            phone_primary: list[index].phone_primary,
            phone_secondary: list[index].phone_secondary || null,
            grama: list[index].grama,
            address: list[index].address,
            designation: list[index].designation,
          })
          .eq('id', id);
      } catch (e) {
        console.error('Supabase moktesara update error:', e);
      }
    }

    const localList = getLocal<GramaMoktesara[]>(KEYS.MOKTESARARU, []);
    const localIdx = localList.findIndex(m => m.id === id);
    if (localIdx !== -1) {
      localList[localIdx] = list[index];
      setLocal(KEYS.MOKTESARARU, localList);
    }

    return list[index];
  },

  async deleteMoktesara(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('grama_moktesararu').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase moktesara delete error:', e);
      }
    }
    const list = getLocal<GramaMoktesara[]>(KEYS.MOKTESARARU, []).filter(m => m.id !== id);
    setLocal(KEYS.MOKTESARARU, list);
  },

  async bulkImportMoktesararu(items: Omit<GramaMoktesara, 'id' | 'created_at'>[]): Promise<number> {
    const now = new Date().toISOString();
    const prepared = items.map((it, i) => ({
      ...it,
      id: 'mok-bulk-' + Date.now() + '-' + i,
      created_at: now,
    }));

    if (isSupabaseConfigured && supabase && prepared.length > 0) {
      try {
        const payload = prepared.map(m => ({
          id: m.id,
          name: m.name,
          phone_primary: m.phone_primary,
          phone_secondary: m.phone_secondary || null,
          grama: m.grama,
          address: m.address,
          designation: m.designation || 'ಮೊಕ್ತೇಸರರು',
          created_at: m.created_at,
        }));
        await supabase.from('grama_moktesararu').insert(payload);
      } catch (e) {
        console.error('Supabase moktesararu bulk insert error:', e);
      }
    }

    const list = getLocal<GramaMoktesara[]>(KEYS.MOKTESARARU, []);
    list.unshift(...prepared);
    setLocal(KEYS.MOKTESARARU, list);
    return prepared.length;
  },

  // 3. ANNUAL KANIKE & FESTIVAL DONATION LEDGER
  async getKanikeItems(year?: number, event?: string): Promise<KanikeItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('annual_kanike').select('*').order('date', { ascending: false });
        if (year) query = query.eq('year', year);
        if (event) query = query.eq('festival_event', event);

        const { data, error } = await query;
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            year: d.year,
            festival_event: d.festival_event,
            moktesara_id: d.moktesara_id,
            moktesara_name: d.moktesara_name,
            grama: d.grama,
            phone: d.phone,
            people_count: Number(d.people_count || 1),
            kanike_type: d.kanike_type,
            amount: Number(d.amount || 0),
            receipt_number: d.receipt_number,
            date: d.date,
            notes: d.notes,
          }));
        }
      } catch (e) {
        console.warn('Supabase kanike error:', e);
      }
    }

    const all = getLocal<KanikeItem[]>(KEYS.KANIKE, []);
    return all.filter(k => {
      if (year && k.year !== year) return false;
      if (event && k.festival_event !== event) return false;
      return true;
    });
  },

  async getAvailableKanikeYears(): Promise<number[]> {
    const all = await this.getKanikeItems();
    const years = Array.from(new Set(all.map(k => k.year))).sort((a, b) => b - a);
    const currYear = new Date().getFullYear();
    if (!years.includes(currYear)) {
      years.unshift(currYear);
    }
    return years;
  },

  async getAvailableKanikeEvents(year?: number): Promise<string[]> {
    const all = await this.getKanikeItems(year);
    const events = Array.from(new Set(all.map(k => k.festival_event)));
    if (events.length === 0) {
      return ['Deepotsava (ದೀಪೋತ್ಸವ)', 'Prathishta Mahotsava (ಪ್ರತಿಷ್ಠಾ ಮಹೋತ್ಸವ)', 'Kalakanike (ಕಾಲಕಾಣಿಕೆ)'];
    }
    return events;
  },

  async addKanikeItem(item: Omit<KanikeItem, 'id'>): Promise<KanikeItem> {
    const id = 'kan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    const newItem: KanikeItem = {
      ...item,
      id,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('annual_kanike').insert({
          id: newItem.id,
          year: newItem.year,
          festival_event: newItem.festival_event,
          moktesara_id: newItem.moktesara_id || null,
          moktesara_name: newItem.moktesara_name,
          grama: newItem.grama,
          phone: newItem.phone || null,
          people_count: newItem.people_count,
          kanike_type: newItem.kanike_type,
          amount: newItem.amount,
          receipt_number: newItem.receipt_number || null,
          date: newItem.date,
          notes: newItem.notes || null,
        });
      } catch (e) {
        console.error('Supabase kanike insert error:', e);
      }
    }

    const all = getLocal<KanikeItem[]>(KEYS.KANIKE, []);
    all.unshift(newItem);
    setLocal(KEYS.KANIKE, all);
    return newItem;
  },

  async deleteKanikeItem(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('annual_kanike').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase kanike delete error:', e);
      }
    }
    const all = getLocal<KanikeItem[]>(KEYS.KANIKE, []).filter(k => k.id !== id);
    setLocal(KEYS.KANIKE, all);
  },
};
