import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
    // However, if we wanted to simulate network events, we could trigger listeners here.
    // For this specific app architecture, the optimistic UI updates handle the local player,
    // so we mainly need this to not crash.
    return Promise.resolve();
  }

  unsubscribe() {
    return Promise.resolve();
  }
}

const mockSupabase = {
  channel: (topic: string) => new MockChannel(topic),
  removeChannel: () => { },
};

// --- REAL SUPABASE INIT ---

const getEnv = (key: string) => {
  // @ts-ignore
  return typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
};

const getStoredCredentials = () => {
  const url = localStorage.getItem('sb_url') || getEnv('SUPABASE_URL') || '';
  const key = localStorage.getItem('sb_key') || getEnv('SUPABASE_ANON_KEY') || '';
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
// We cast mockSupabase to any to bypass strict typing for now
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
