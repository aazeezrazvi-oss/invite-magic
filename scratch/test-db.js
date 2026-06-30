// Diagnostic: check if authenticated user is recognized as admin
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envFile = fs.readFileSync('.env.local', 'utf-8');
  envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  console.log("=== Diagnostic: Admin RLS Check ===\n");

  // Use service role to bypass RLS and inspect users table
  if (supabaseServiceKey) {
    console.log("--- Using SERVICE ROLE key to inspect users ---");
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: users, error } = await adminClient
      .from('users')
      .select('id, email, role')
      .limit(10);
    
    if (error) {
      console.error("Error querying users with service role:", error);
    } else {
      console.log("Users in database:");
      users.forEach(u => console.log(`  ${u.email} -> role: "${u.role}" (type: ${typeof u.role})`));
    }

    // Check if is_admin() function works
    console.log("\n--- Testing is_admin() via RPC ---");
    // Try inserting with service role (should always work)
    const testCode = 'DIAGTEST_' + Math.random().toString(36).substring(2, 5).toUpperCase();
    const { error: insertErr } = await adminClient
      .from('referral_codes')
      .insert({ code: testCode, discount_percent: 5 });
    
    if (insertErr) {
      console.error("Service role insert failed:", insertErr);
    } else {
      console.log("Service role insert succeeded for code:", testCode);
      // Clean up
      await adminClient.from('referral_codes').delete().eq('code', testCode);
      console.log("Cleaned up test code.");
    }

    // Check the is_admin function definition
    console.log("\n--- Checking is_admin() function existence ---");
    const { data: fnData, error: fnErr } = await adminClient.rpc('is_admin');
    console.log("is_admin() RPC result:", fnData, "error:", fnErr);

  } else {
    console.log("No SUPABASE_SERVICE_ROLE_KEY found in .env.local");
    console.log("Using anon key only...");
    
    const client = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: refCodes, error: refErr } = await client
      .from('referral_codes')
      .select('*');
    console.log("Anon select referral_codes:", refCodes?.length, "rows, error:", refErr);
    
    const testCode = 'ANONTEST_' + Math.random().toString(36).substring(2, 5).toUpperCase();
    const { error: insertErr } = await client
      .from('referral_codes')
      .insert({ code: testCode, discount_percent: 5 });
    console.log("Anon insert result error:", insertErr);
  }
}

run();
