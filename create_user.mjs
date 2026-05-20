import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@admin.com',
    password: 'Ad1234',
    options: {
        data: { full_name: 'Admin Test' }
    }
  });
  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("User created successfully:", data.user?.id);
  }
}
run();
