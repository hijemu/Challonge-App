export type OfflinePlayer = {
    id: string;
    name: string;
    seed: number;
  };
  
  export type OfflineTournament = {
    id: string;
    name: string;
    format:
      | "round_robin"
      | "swiss"
      | "single_elim"
      | "swiss_single_elim"
      | "round_robin_single_elim";
    createdAt: string;
    players: OfflinePlayer[];
    matches: any[];
  
    stage?: "qualifiers" | "finals" | "finished";
    swissRounds?: number;
    roundRobinRounds?: number;
    finalsCut?: number;
  };
  
  const KEY = "bbx_offline_tournaments";
  
  export const getOfflineTournaments = (): OfflineTournament[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  };
  
  export const saveOfflineTournament = (tournament: OfflineTournament) => {
    const current = getOfflineTournaments();
    localStorage.setItem(KEY, JSON.stringify([tournament, ...current]));
  };
  
  export const getOfflineTournament = (id: string) => {
    return getOfflineTournaments().find((t) => t.id === id) || null;
  };
  
  export const updateOfflineTournament = (updated: OfflineTournament) => {
    const current = getOfflineTournaments();
    localStorage.setItem(
      KEY,
      JSON.stringify(current.map((t) => (t.id === updated.id ? updated : t)))
    );
  };