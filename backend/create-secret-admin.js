import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const EMAIL = "6ixmindslabs@gmail.com";
const PASSWORD = "Dhn#9Qv!2Lp";
const USERNAME = "Dhinesh";

async function main() {
    console.log("Starting Admin Setup...");

    // 1. Get all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("List users failed:", listError);
        return;
    }

    // 2. Remove generic 'admin' user if exists
    const genericAdmin = users.find(u => u.user_metadata?.username === 'admin');
    if (genericAdmin) {
        console.log(`Found generic admin profile (ID: ${genericAdmin.id}). Deleting user...`);
        await supabase.auth.admin.deleteUser(genericAdmin.id);
        console.log("Generic admin deleted.");
    }

    // 3. Handle the Target User
    let targetUser = users.find(u => u.email === EMAIL);
    let userId;

    if (targetUser) {
        console.log(`User ${EMAIL} exists (ID: ${targetUser.id}). Updating password and metadata...`);
        userId = targetUser.id;

        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: PASSWORD,
            user_metadata: { username: USERNAME },
            email_confirm: true
        });

        if (updateError) console.error("Update failed:", updateError);
        else console.log("Password and metadata updated.");

    } else {
        console.log(`User ${EMAIL} not found. Creating...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: EMAIL,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { username: USERNAME }
        });

        if (createError) {
            console.error("Create failed:", createError);
            return;
        }
        userId = newUser.user.id;
        console.log(`User created (ID: ${userId}).`);
    }

    // 4. Update Profile (Handle username collisions)
    const { data: collisionProfile } = await supabase.from('profiles').select('*').eq('username', USERNAME).single();

    if (collisionProfile && collisionProfile.user_id !== userId) {
        console.log(`Username '${USERNAME}' currently taken by user ID ${collisionProfile.user_id}. Renaming collision...`);
        await supabase.from('profiles').update({ username: `${USERNAME}_old` }).eq('user_id', collisionProfile.user_id);
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            user_id: userId,
            username: USERNAME
        }, { onConflict: 'user_id' });

    if (profileError) console.error("Profile update failed:", profileError);
    else console.log("Profile updated.");

    // 5. Update Role
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

    if (roleError) console.error("Role assignment failed:", roleError);
    else console.log("Role 'admin' assigned.");

    console.log("DONE: Secret Admin configuration complete.");
}

main();
