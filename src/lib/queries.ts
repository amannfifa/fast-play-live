import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Match, MatchRedirect, Sport } from "./match-types";

export const sportsQuery = () =>
  queryOptions({
    queryKey: ["sports"],
    queryFn: async (): Promise<Sport[]> => {
      const { data, error } = await supabase
        .from("sports")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Sport[];
    },
  });

export const matchesQuery = (sportKey: string | "live") =>
  queryOptions({
    queryKey: ["matches", sportKey],
    queryFn: async (): Promise<Match[]> => {
      let q = supabase.from("matches").select("*").order("kickoff_at");
      if (sportKey === "live") q = q.eq("status", "live");
      else q = q.eq("sport_key", sportKey);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Match[];
    },
  });

export const matchQuery = (id: string) =>
  queryOptions({
    queryKey: ["match", id],
    queryFn: async (): Promise<Match | null> => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Match | null;
    },
  });

export const matchRedirectQuery = (matchId: string) =>
  queryOptions({
    queryKey: ["match-redirect", matchId],
    queryFn: async (): Promise<MatchRedirect | null> => {
      const { data, error } = await supabase
        .from("match_redirects")
        .select("*")
        .eq("match_id", matchId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as MatchRedirect | null;
    },
  });

export const allRedirectsQuery = () =>
  queryOptions({
    queryKey: ["match-redirects"],
    queryFn: async (): Promise<MatchRedirect[]> => {
      const { data, error } = await supabase
        .from("match_redirects")
        .select("*");
      if (error) throw error;
      return (data ?? []) as MatchRedirect[];
    },
  });