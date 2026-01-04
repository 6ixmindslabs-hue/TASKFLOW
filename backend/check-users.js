import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
    console.log("Fetching users and roles...");

    // Fetch profiles
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*');

    if (pError) {
        console.error("Error fetching profiles:", pError);
        return;
    }

    // Fetch roles
    const { data: roles, error: rError } = await supabase
        .from('user_roles')
        .select('*');

    if (rError) {
        console.error("Error fetching roles:", rError);
        return;
    }

    console.log("\n--- USERS in Database ---");
    profiles.forEach(p => {
        const role = roles.find(r => r.user_id === p.user_id)?.role || 'member';
        console.log(`Username: "${p.username}"`);
        console.log(`  ID: ${p.user_id}`);
        console.log(`  Role: ${role}`);
        console.log("-------------------------");
    });
}

listUsers();
