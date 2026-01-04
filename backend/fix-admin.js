import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDhineshRole() {
    console.log("Searching for user 'Dhinesh'...");

    // 1. Find the profile for "Dhinesh"
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'Dhinesh')
        .single();

    if (pError || !profile) {
        console.error("Could not find profile for 'Dhinesh'.", pError);
        return;
    }

    console.log(`Found 'Dhinesh' (ID: ${profile.user_id})`);

    // 2. Check existing role
    const { data: roleData, error: rError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

    if (roleData) {
        console.log(`Current role in DB: ${roleData.role}`);
        if (roleData.role !== 'admin') {
            console.log("Updating role to 'admin'...");
            const { error: updateError } = await supabase
                .from('user_roles')
                .update({ role: 'admin' })
                .eq('user_id', profile.user_id);

            if (updateError) console.error("Update failed:", updateError);
            else console.log("Successfully updated role to 'admin'.");
        } else {
            console.log("User is already an admin.");
        }
    } else {
        console.log("No role entry found. Creating 'admin' role entry...");
        const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: profile.user_id, role: 'admin' });

        if (insertError) console.error("Insert failed:", insertError);
        else console.log("Successfully created 'admin' role.");
    }
}

fixDhineshRole();
