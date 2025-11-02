import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdbkbrrnqwrwlxuasrlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYmticnJucXdyd2x4dWFzcmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzNTY2MTEsImV4cCI6MjA0NTkzMjYxMX0.LXi_lQ-2G7k2MNbzT88PZXT4gfHlPEXO1kSTlV-0bco';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing Phase 3C.2 APIs...\n');

// Test team members
const { data, error } = await supabase
  .from('team_members')
  .select('*')
  .limit(3);

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log(`✅ Team members: ${data.length} found`);
  if (data.length > 0) {
    console.log(`   Sample: ${data[0].name}`);
  }
}
