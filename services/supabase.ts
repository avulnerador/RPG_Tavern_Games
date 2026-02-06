import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// --- MOCK IMPLEMENTATION FOR OFFLINE MODE ---
class MockChannel {
  topic: string;
  listeners: { event: string; callback: Function }[] = [];

  constructor(topic: string) {
    this.topic = topic;
  }

  on(type: string, filter: { event: string }, callback: Function) {
    this.listeners.push({ event: filter.event, callback });
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    if (callback) setTimeout(() => callback('SUBSCRIBED'), 100);
    return this;
  }

  send(message: { type: string; event: string; payload?: any }) {
    // In local mode, we don't broadcast to "others", we just handle logic locally in the component.
    return Promise.resolve();
  }

  unsubscribe() {
    return Promise.resolve();
  }
}

const mockSupabase = {
  channel: (topic: string) => new MockChannel(topic),
  removeChannel: () => { },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: { message: "MODO OFFLINE: Banco de dados indisponível (Verifique chaves no .env)" } }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({
          data: { id: uuidv4(), ...data },
          error: null
        }),
      }),
      then: (onfulfilled: any) => Promise.resolve({ error: null }).then(onfulfilled)
    }),
    update: () => ({
      eq: () => Promise.resolve({ error: null })
    })
  }),
};

// --- REAL SUPABASE INIT ---

const getEnv = (key: string) => {
  // @ts-ignore
  return typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
};

const getStoredCredentials = () => {
  const url = localStorage.getItem('sb_url') || getEnv('VITE_SUPABASE_URL') || '';
  const key = localStorage.getItem('sb_key') || getEnv('VITE_SUPABASE_ANON_KEY') || '';
  return { url, key };
};

const { url, key } = getStoredCredentials();
const isValidUrl = (u: string) => u && (u.startsWith('https://') || u.startsWith('http://'));
export const isConfigured = isValidUrl(url) && !!key;

if (isConfigured) {
  console.log('🔌 Supabase Configured:', url);
} else {
  console.log('⚠️ Supabase NOT Configured. Running in Offline Mode.');
}

// Export either the real client or the mock client
export const supabase = (isConfigured
  ? createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } })
  : mockSupabase) as unknown as SupabaseClient;

export const saveCredentials = (newUrl: string, newKey: string) => {
  localStorage.setItem('sb_url', newUrl);
  localStorage.setItem('sb_key', newKey);
  window.location.reload();
};

export const clearCredentials = () => {
  localStorage.removeItem('sb_url');
  localStorage.removeItem('sb_key');
  window.location.reload();
};
