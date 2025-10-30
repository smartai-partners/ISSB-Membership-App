import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lsyimggqennkyxgajzvn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing authentication...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testadmin@issb.org',
      password: 'AdminTest123!'
    });
    
    if (error) {
      console.error('Auth error:', error);
      return;
    }
    
    console.log('Login successful:', data.user.email);
    
    // Test profile loading
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Profile loading error:', profileError);
      return;
    }
    
    console.log('Profile loaded:', profile);
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testAuth();
