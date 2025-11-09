import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqywfqehoziqxbobqxyl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxeXdmcWVob3ppcXhib2JxeHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTIzOTUsImV4cCI6MjA3ODA4ODM5NX0.g5AlXTl4UvltOZcDmDnlV8wPn0niFtvNEs1p4KyTpp8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
