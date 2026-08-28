import { createClient } from "@supabase/supabase-js";
import type { Deal } from "./types";

export type Database = {
  public: {
    Tables: {
      deals: {
        Row: Deal;
        Insert: Partial<Omit<Deal, "created_at" | "updated_at">> & {
          id: string;
          user_id: string;
        };
        Update: Partial<Omit<Deal, "created_at" | "user_id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: "creator-deal-manager-auth",
      },
    })
  : null;

export const PRODUCT_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET || "deal-product-images";
