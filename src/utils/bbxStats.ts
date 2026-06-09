import * as XLSX from "xlsx";

export type BbxPlayerStats = {
  playerId: string;
  playerName: string;
  xtreme: number;
  over: number;
  burst: number;
  spin: number;
  warning: number;
  dq: number;
  totalPoints: number;
  matchesPlayed: number;
  lastSavedAt: string;
};

export type BbxSideStats = {
  xtreme: number;
  over: number;
  burst: number;
  spin: number;
  warning: number;
  dq: number;
  total: number;
};

const emptySide = (): BbxSideStats => ({
  xtreme: 0,
  over: 0,
  burst: 0,
  spin: 0,
  warning: 0,
  dq: 0,
  total: 0,
});

export const createEmptyBbxStats = () => ({
  p1: emptySide(),
  p2: emptySide(),
});

const key = (tournamentId: string) => `bbx_player_stats_${tournamentId}`;

export const getSavedBbxPlayerStats = (
  tournamentId: string
): BbxPlayerStats[] => {
  try {
    const raw = localStorage.getItem(key(tournamentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveBbxPlayerMatchStats = (
  tournamentId: string,
  players: {
    playerId: string;
    playerName: string;
    stats: BbxSideStats;
  }[]
) => {
  const current = getSavedBbxPlayerStats(tournamentId);
  const map = new Map(current.map((p) => [p.playerId, p]));

  players.forEach(({ playerId, playerName, stats }) => {
    const existing =
      map.get(playerId) || {
        playerId,
        playerName,
        xtreme: 0,
        over: 0,
        burst: 0,
        spin: 0,
        warning: 0,
        dq: 0,
        totalPoints: 0,
        matchesPlayed: 0,
        lastSavedAt: "",
      };

    map.set(playerId, {
      ...existing,
      playerName,
      xtreme: existing.xtreme + stats.xtreme,
      over: existing.over + stats.over,
      burst: existing.burst + stats.burst,
      spin: existing.spin + stats.spin,
      warning: existing.warning + stats.warning,
      dq: existing.dq + stats.dq,
      totalPoints: existing.totalPoints + stats.total,
      matchesPlayed: existing.matchesPlayed + 1,
      lastSavedAt: new Date().toISOString(),
    });
  });

  localStorage.setItem(key(tournamentId), JSON.stringify([...map.values()]));
};

export const exportBbxStatsToExcel = (
  tournamentId: string,
  tournamentName: string
) => {
  const rows = getSavedBbxPlayerStats(tournamentId).map((p) => ({
    Tournament: tournamentName,
    Player: p.playerName,
    Xtreme: p.xtreme,
    Over: p.over,
    Burst: p.burst,
    Spin: p.spin,
    Warning: p.warning,
    DQ: p.dq,
    "Total Points": p.totalPoints,
    "Matches Played": p.matchesPlayed,
    "Last Saved": p.lastSavedAt,
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(book, sheet, "Player Stats");
  XLSX.writeFile(book, `bbx_player_stats_${tournamentId}.xlsx`);
};