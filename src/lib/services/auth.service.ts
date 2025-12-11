import type { SupabaseClient } from "@/db/supabase.client";
import type { UserDTO, SignInCommand, AuthResponseDTO } from "@/types";

/**
 * Authentication service for user management
 * Handles user sessions, sign in, sign out, and user data retrieval
 */
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Sign up a new user with email and password
   * Returns user and session information
   */
  async signUp(command: SignInCommand): Promise<AuthResponseDTO> {
    const { email, password } = command;

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Failed to sign up");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
      },
    };
  }

  /**
   * Sign in a user with email and password
   * Returns user and session information
   */
  async signIn(command: SignInCommand): Promise<AuthResponseDTO> {
    const { email, password } = command;

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Failed to sign in");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
      },
    };
  }

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
    } catch {
      return null;
    }
  }

  /**
   * Sign out the current user
   * Invalidates the session and clears local storage
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}

export default AuthService;
