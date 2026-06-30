export type MatchStatus = "upcoming" | "live" | "finished" | "replay";

export interface Match {
  id: string;
  sport_key: string;
  competition: string | null;
  home_team: string;
  away_team: string;
  home_flag: string | null;
  away_flag: string | null;
  kickoff_at: string;
  venue: string | null;
  city: string | null;
  referee: string | null;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  minute: number | null;
  possession_home: number | null;
  shots_home: number | null;
  shots_away: number | null;
  corners_home: number | null;
  corners_away: number | null;
  yellow_home: number | null;
  yellow_away: number | null;
  red_home: number | null;
  red_away: number | null;
  stream_url: string | null;
  replay_url: string | null;
  viewer_count: number | null;
}

export interface Sport {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  sort_order: number;
}