import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./supabaseClient.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS
const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:5173",
    process.env.FRONTEND_URL,
    "https://taskflow-ten-mu.vercel.app"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "TaskFlow Backend API",
        version: "1.0.0",
        endpoints: [
            "GET /api/health",
            "GET /api/database-check",
            "POST /api/users/create",
            "PUT /api/users/:userId",
            "DELETE /api/users/:userId"
        ]
    });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running!" });
});

// Example endpoint to test Supabase connection
app.get("/api/database-check", async (req, res) => {
    try {
        if (supabase) {
            res.json({ status: "connected", message: "Supabase client initialized" });
        } else {
            throw new Error("Supabase client not initialized");
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user endpoint
app.post("/api/users/create", async (req, res) => {
    try {
        const { email, password, username, role } = req.body;

        // Validate input
        if (!email || !password || !username || !role) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if username already exists
        const { data: existingUser } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", username)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Create the user using admin API
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (createError) {
            console.error("Error creating user:", createError);
            return res.status(400).json({ error: createError.message });
        }

        // Create profile
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                user_id: newUser.user.id,
                username,
            });

        if (profileError) {
            console.error("Error creating profile:", profileError);
            // Clean up the created user
            await supabase.auth.admin.deleteUser(newUser.user.id);
            return res.status(500).json({ error: "Failed to create user profile" });
        }

        // Create role
        const { error: roleInsertError } = await supabase
            .from("user_roles")
            .insert({
                user_id: newUser.user.id,
                role,
            });

        if (roleInsertError) {
            console.error("Error creating role:", roleInsertError);
            return res.status(500).json({ error: "Failed to assign user role" });
        }

        console.log(`User ${username} created successfully with role ${role}`);

        res.json({ success: true, userId: newUser.user.id });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update user endpoint
app.put("/api/users/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, role, password } = req.body;

        // Update username in profile if provided
        if (username) {
            // Check if username is taken by another user
            const { data: existingUser } = await supabase
                .from("profiles")
                .select("user_id")
                .eq("username", username)
                .neq("user_id", userId)
                .single();

            if (existingUser) {
                return res.status(400).json({ error: "Username already exists" });
            }

            const { error: profileError } = await supabase
                .from("profiles")
                .update({ username })
                .eq("user_id", userId);

            if (profileError) {
                console.error("Error updating profile:", profileError);
                return res.status(500).json({ error: "Failed to update username" });
            }
        }

        // Update role if provided
        if (role) {
            await supabase.from("user_roles").delete().eq("user_id", userId);
            const { error: roleError } = await supabase
                .from("user_roles")
                .insert({ user_id: userId, role });

            if (roleError) {
                console.error("Error updating role:", roleError);
                return res.status(500).json({ error: "Failed to update role" });
            }
        }

        // Update password if provided
        if (password) {
            const { error: passwordError } = await supabase.auth.admin.updateUserById(
                userId,
                { password }
            );

            if (passwordError) {
                console.error("Error updating password:", passwordError);
                return res.status(500).json({ error: "Failed to update password" });
            }
        }

        console.log(`User ${userId} updated successfully`);
        res.json({ success: true });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete user endpoint
app.delete("/api/users/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Delete from auth (this will cascade to profiles and user_roles due to foreign keys)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error("Error deleting user:", deleteError);
            return res.status(500).json({ error: "Failed to delete user" });
        }

        console.log(`User ${userId} deleted successfully`);
        res.json({ success: true });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
