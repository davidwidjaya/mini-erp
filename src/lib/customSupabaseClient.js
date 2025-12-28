import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouncueduyfakphisarzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmN1ZWR1eWZha3BoaXNhcnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTk1NTQsImV4cCI6MjA4MDIzNTU1NH0.HCTXpslHuTFUqxJgLGee86F8F4bDYUveaMmvDoSj5uw';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
