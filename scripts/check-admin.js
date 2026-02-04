// Run this script to check if a user has admin privileges
// Usage: node scripts/check-admin.js
// Make sure you have .env.local with your Supabase credentials

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const email = process.argv[2] || "mike@johnson6.com";

async function checkAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, full_name")
    .eq("email", email);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log(`No user found with email: ${email}`);
    process.exit(1);
  }

  const user = data[0];
  console.log("\nUser Profile:");
  console.log("=============");
  console.log(`Email: ${user.email}`);
  console.log(`Name: ${user.full_name || "(not set)"}`);
  console.log(`Role: ${user.role}`);
  console.log(`Is Admin: ${user.role === "admin" ? "YES ✓" : "NO ✗"}`);

  if (user.role !== "admin") {
    console.log("\n⚠️  This user does NOT have admin privileges.");
    console.log("To grant admin access, run this SQL in Supabase:");
    console.log(`\n  UPDATE profiles SET role = 'admin' WHERE email = '${email}';\n`);
  }
}

checkAdmin();
