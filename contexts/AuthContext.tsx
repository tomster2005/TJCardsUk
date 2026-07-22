"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import getBrowserSupabase from "@/lib/supabase/client";

type AppRole = "user" | "admin";

type AuthState = {
  user: any | null;
  session: any | null;
  loading: boolean;
  role: AppRole | null;
  isAdmin: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  fetchRole: (userId: string) => Promise<AppRole | null>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    const supabase = getBrowserSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return data.role as AppRole;
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        setLoading(false);
        setProfileLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user?.id) {
        setProfileLoading(true);
        const userRole = await fetchRole(session.user.id);
        if (mounted) {
          setRole(userRole);
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user?.id) {
          setProfileLoading(true);
          const userRole = await fetchRole(currentSession.user.id);
          if (mounted) {
            setRole(userRole);
            setProfileLoading(false);
          }
        } else {
          setRole(null);
          setProfileLoading(false);
        }
      });

      subscription = listener.subscription;
    };

    init();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { error: new Error("Supabase client not initialized") };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username || null } },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { error: new Error("Supabase client not initialized") };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const isAdmin = role === "admin";

  const value = useMemo(
    () => ({ user, session, loading, role, isAdmin, profileLoading, signUp, signIn, signOut, fetchRole }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, session, loading, role, isAdmin, profileLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
