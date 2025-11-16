import type { SupabaseClient } from "@/db/supabase.client";
import type { UserDTO } from "@/types";

/**
 * Authentication service for user management
 * Handles user sessions, sign out, and user data retrieval
 */
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the currently authenticated user
   * Returns null if no user is authenticated
   */
  async getCurrentUser(): Promise<UserDTO | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || "",
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Sign out the current user
   * Invalidates the session and clears local storage
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }
}

export default AuthService;

