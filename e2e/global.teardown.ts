import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

teardown("cleanup database", async () => {
  // eslint-disable-next-line no-console
  console.log("Cleaning up test database...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const e2eUsername = process.env.E2E_USERNAME;
  const e2ePassword = process.env.E2E_PASSWORD;
  const e2eUsernameId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl?.includes("cdvbaxzortzxhugfcrav")) {
    throw new Error("Cannot run teardown on non-test database!");
  }

  if (!supabaseUrl || !supabaseKey || !e2eUsername || !e2ePassword || !e2eUsernameId) {
    throw new Error("Missing required environment variables for teardown");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Sign in with test user credentials to avoid issues with RLS
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: e2eUsername,
      password: e2ePassword,
    });

    if (signInError) {
      // eslint-disable-next-line no-console
      console.error("Error signing in:", signInError);
      throw signInError;
    }

    const { error } = await supabase.from("aquariums").delete().eq("user_id", e2eUsernameId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error cleaning up aquariums:", error);
      throw error;
    }

    // eslint-disable-next-line no-console
    console.log("Successfully cleaned up aquariums for E2E test user");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to clean up database:", error);
    throw error;
  }
});
