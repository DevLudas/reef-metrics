import { defineMiddleware } from "astro:middleware";

import { supabaseClient, createSupabaseServerInstance } from "../db/supabase.client";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Set the basic supabase client for non-auth operations
  context.locals.supabase = supabaseClient;

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(context.url.pathname)) {
    return next();
  }

  // Create SSR-enabled Supabase client for auth operations
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    context.locals.user = {
      email: user.email ?? "",
      id: user.id,
    };
  } else if (!PUBLIC_PATHS.includes(context.url.pathname)) {
    // Redirect to login for protected routes
    return context.redirect("/login");
  }

  return next();
});
