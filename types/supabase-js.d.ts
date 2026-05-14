declare module "@supabase/supabase-js" {
  export type AuthChangeEvent = string;

  export type Session = {
    user: {
      id: string;
      email?: string | null;
    };
  } | null;

  export type SupabaseClient = {
    auth: {
      getSession: () => Promise<{ data: { session: Session | null } }>;
      onAuthStateChange: (
        callback: (event: AuthChangeEvent, session: Session | null) => void
      ) => { data: { subscription: { unsubscribe: () => void } } };
      signInWithOtp: (options: {
        email: string;
        options?: { emailRedirectTo?: string };
      }) => Promise<{ error: { message: string } | null }>;
      signOut: () => Promise<void>;
    };
    from: (table: string) => {
      select: (columns: string) => any;
      eq: (column: string, value: string) => any;
      single: () => any;
      upsert: (values: Record<string, unknown>) => Promise<unknown>;
    };
  };

  export function createClient(url: string, key: string): SupabaseClient;
}
