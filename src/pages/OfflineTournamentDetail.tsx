import {
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonPage,
  } from "@ionic/react";
  import { useEffect, useMemo, useState } from "react";
  import { useHistory, useParams } from "react-router-dom";
  import {
    getOfflineTournament,
    updateOfflineTournament,
    OfflineTournament,
  } from "../utils/offlineTournaments";
  import * as XLSX from "xlsx";
  import "../theme/bbx.css";
  
  type BbxSideStats = {
    xtreme: number;
    over: number;
    burst: number;
    spin: number;
    warning: number;
    dq: number;
  };
  
  type BbxStats = {
    p1: BbxSideStats;
    p2: BbxSideStats;
  };
  
  type HistoryAction = {
    side: "p1" | "p2";
    type: keyof BbxSideStats;
    points: number;
  };
  
  type OfflineMatch = {
    id: string;
    round: number;
    player1Id: string;
    player2Id: string;
    player1Score: number;
    player2Score: number;
    winnerId: string | null;
    state: "pending" | "complete";
    bbxStats?: BbxStats;
  };
  
  const emptyBbxStats = (): BbxStats => ({
    p1: { xtreme: 0, over: 0, burst: 0, spin: 0, warning: 0, dq: 0 },
    p2: { xtreme: 0, over: 0, burst: 0, spin: 0, warning: 0, dq: 0 },
  });
  
  const getPlayerRecord = (tournament: OfflineTournament, playerId: string) => {
    const matches = (tournament.matches || []) as OfflineMatch[];
  
    let wins = 0;
    let losses = 0;
    let pointsScored = 0;
    let pointsAgainst = 0;
    const opponents: string[] = [];
  
    matches.forEach((m) => {
      if (m.state !== "complete") return;
  
      if (m.player1Id === playerId) {
        opponents.push(m.player2Id);
        pointsScored += m.player1Score;
        pointsAgainst += m.player2Score;
  
        if (m.winnerId === playerId) wins += 1;
        else losses += 1;
      }
  
      if (m.player2Id === playerId) {
        opponents.push(m.player1Id);
        pointsScored += m.player2Score;
        pointsAgainst += m.player1Score;
  
        if (m.winnerId === playerId) wins += 1;
        else losses += 1;
      }
    });
  
    return {
      playerId,
      wins,
      losses,
      pointsScored,
      pointsAgainst,
      diff: pointsScored - pointsAgainst,
      opponents,
    };
  };
  
  const generateNextSwissRound = (
    tournament: OfflineTournament
  ): OfflineMatch[] => {
    const matches = (tournament.matches || []) as OfflineMatch[];
  
    const hasUnfinished = matches.some((m) => m.state !== "complete");
    if (hasUnfinished) {
      return matches;
    }
  
    const nextRound =
      matches.length > 0
        ? Math.max(...matches.map((m) => Number(m.round) || 1)) + 1
        : 1;
  
    const records = tournament.players
      .map((p) => ({
        player: p,
        record: getPlayerRecord(tournament, p.id),
      }))
      .sort(
        (a, b) =>
          b.record.wins - a.record.wins ||
          b.record.diff - a.record.diff ||
          b.record.pointsScored - a.record.pointsScored ||
          a.player.seed - b.player.seed
      );
  
    const unpaired = [...records];
    const newMatches: OfflineMatch[] = [];
  
    while (unpaired.length >= 2) {
      const current = unpaired.shift();
      if (!current) break;
  
      let opponentIndex = unpaired.findIndex(
        (candidate) => !current.record.opponents.includes(candidate.player.id)
      );
  
      if (opponentIndex === -1) opponentIndex = 0;
  
      const opponent = unpaired.splice(opponentIndex, 1)[0];
  
      newMatches.push({
        id: `m_${Date.now()}_${nextRound}_${current.player.id}_${opponent.player.id}`,
        round: nextRound,
        player1Id: current.player.id,
        player2Id: opponent.player.id,
        player1Score: 0,
        player2Score: 0,
        winnerId: null,
        state: "pending",
      });
    }
  
    return [...matches, ...newMatches];
  };
  
  const generateRoundRobin = (tournament: OfflineTournament): OfflineMatch[] => {
    const players = [...tournament.players];
  
    const matches: OfflineMatch[] = [];
    let round = 1;
  
    const matchesPerRound = Math.max(1, Math.floor(players.length / 2));
  
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          id: `m_${Date.now()}_${i}_${j}`,
          round,
          player1Id: players[i].id,
          player2Id: players[j].id,
          player1Score: 0,
          player2Score: 0,
          winnerId: null,
          state: "pending",
        });
  
        if (matches.length % matchesPerRound === 0) {
          round += 1;
        }
      }
    }
  
    return matches;
  };
  
  const OfflineTournamentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
  
    const [tournament, setTournament] = useState<OfflineTournament | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<OfflineMatch | null>(null);
    const [p1Score, setP1Score] = useState(0);
    const [p2Score, setP2Score] = useState(0);
  
    const [activeScorer, setActiveScorer] = useState<"p1" | "p2">("p1");
    const [historyActions, setHistoryActions] = useState<HistoryAction[]>([]);
    const [bbxStats, setBbxStats] = useState<BbxStats>(emptyBbxStats());
  
    const load = () => {
      setTournament(getOfflineTournament(id));
    };
  
    useEffect(() => {
      load();
    }, [id]);
  
    const playerName = (playerId: string) => {
      return (
        tournament?.players.find((p) => p.id === playerId)?.name || "Unknown"
      );
    };
  
    const matches = (tournament?.matches || []) as OfflineMatch[];
  
    const undoLastAction = () => {
      const last = historyActions[historyActions.length - 1];
      if (!last) return;
  
      setHistoryActions((prev) => prev.slice(0, -1));
  
      setBbxStats((prev) => ({
        ...prev,
        [last.side]: {
          ...prev[last.side],
          [last.type]: Math.max(0, prev[last.side][last.type] - 1),
        },
      }));
  
      if (last.side === "p1") {
        setP1Score((v) => Math.max(0, v - last.points));
      } else {
        setP2Score((v) => Math.max(0, v - last.points));
      }
    };
  
    const closeScoreModal = () => {
      setSelectedMatch(null);
      setHistoryActions([]);
      setP1Score(0);
      setP2Score(0);
      setBbxStats(emptyBbxStats());
    };
  
    const standings = useMemo(() => {
      if (!tournament) return [];
  
      const rows = tournament.players.map((p) => ({
        id: p.id,
        name: p.name,
        wins: 0,
        losses: 0,
        pointsScored: 0,
        pointsAgainst: 0,
      }));
  
      const map = new Map(rows.map((r) => [r.id, r]));
  
      matches.forEach((m) => {
        if (m.state !== "complete") return;
  
        const p1 = map.get(m.player1Id);
        const p2 = map.get(m.player2Id);
  
        if (!p1 || !p2) return;
  
        p1.pointsScored += m.player1Score;
        p1.pointsAgainst += m.player2Score;
  
        p2.pointsScored += m.player2Score;
        p2.pointsAgainst += m.player1Score;
  
        if (m.winnerId === m.player1Id) {
          p1.wins += 1;
          p2.losses += 1;
        }
  
        if (m.winnerId === m.player2Id) {
          p2.wins += 1;
          p1.losses += 1;
        }
      });
  
      return [...map.values()].sort(
        (a, b) =>
          b.wins - a.wins ||
          b.pointsScored - b.pointsAgainst - (a.pointsScored - a.pointsAgainst) ||
          b.pointsScored - a.pointsScored
      );
    }, [tournament, matches]);
  
    const playerStats = useMemo(() => {
      if (!tournament) return [];
  
      const base = tournament.players.map((p) => ({
        id: p.id,
        name: p.name,
        xtreme: 0,
        over: 0,
        burst: 0,
        spin: 0,
        warning: 0,
        dq: 0,
        totalPoints: 0,
      }));
  
      const map = new Map(base.map((p) => [p.id, p]));
  
      matches.forEach((m) => {
        if (m.state !== "complete" || !m.bbxStats) return;
  
        const p1 = map.get(m.player1Id);
        const p2 = map.get(m.player2Id);
  
        if (p1 && m.bbxStats.p1) {
          p1.xtreme += m.bbxStats.p1.xtreme || 0;
          p1.over += m.bbxStats.p1.over || 0;
          p1.burst += m.bbxStats.p1.burst || 0;
          p1.spin += m.bbxStats.p1.spin || 0;
          p1.warning += m.bbxStats.p1.warning || 0;
          p1.dq += m.bbxStats.p1.dq || 0;
          p1.totalPoints += m.player1Score || 0;
        }
  
        if (p2 && m.bbxStats.p2) {
          p2.xtreme += m.bbxStats.p2.xtreme || 0;
          p2.over += m.bbxStats.p2.over || 0;
          p2.burst += m.bbxStats.p2.burst || 0;
          p2.spin += m.bbxStats.p2.spin || 0;
          p2.warning += m.bbxStats.p2.warning || 0;
          p2.dq += m.bbxStats.p2.dq || 0;
          p2.totalPoints += m.player2Score || 0;
        }
      });
  
      return [...map.values()].sort(
        (a, b) =>
          b.xtreme - a.xtreme ||
          b.totalPoints - a.totalPoints ||
          b.over - a.over ||
          b.burst - a.burst
      );
    }, [tournament, matches]);
  
    const generateMatches = () => {
      if (!tournament) return;
  
      let nextMatches: OfflineMatch[] = [];
  
      const isSwissFormat =
        tournament.format === "swiss" ||
        tournament.format === "swiss_single_elim";
  
      const isRoundRobinFormat =
        tournament.format === "round_robin" ||
        tournament.format === "round_robin_single_elim";
  
      if (isRoundRobinFormat) {
        nextMatches =
          tournament.matches.length > 0
            ? (tournament.matches as OfflineMatch[])
            : generateRoundRobin(tournament);
      }
  
      if (isSwissFormat) {
        nextMatches = generateNextSwissRound(tournament);
      }
  
      if (tournament.format === "single_elim") {
        nextMatches =
          tournament.matches.length > 0
            ? (tournament.matches as OfflineMatch[])
            : generateRoundRobin(tournament);
      }
  
      const updated = {
        ...tournament,
        matches: nextMatches,
      };
  
      updateOfflineTournament(updated);
      setTournament(updated);
    };
  
    const addBbxPoints = (
      type: "xtreme" | "over" | "burst" | "spin" | "warning",
      points: number
    ) => {
      const side = activeScorer === "p1" ? "p1" : "p2";
  
      setBbxStats((prev) => ({
        ...prev,
        [side]: {
          ...prev[side],
          [type]: prev[side][type] + 1,
        },
      }));
  
      setHistoryActions((prev) => [
        ...prev,
        {
          side,
          type,
          points,
        },
      ]);
  
      if (side === "p1") {
        setP1Score((v) => v + points);
      } else {
        setP2Score((v) => v + points);
      }
    };
  
    const applyDq = () => {
      const side = activeScorer === "p1" ? "p1" : "p2";
  
      setBbxStats((prev) => ({
        ...prev,
        [side]: {
          ...prev[side],
          dq: prev[side].dq + 1,
        },
      }));
  
      setHistoryActions((prev) => [
        ...prev,
        {
          side,
          type: "dq",
          points: side === "p1" ? p1Score - 4 : p2Score - 4,
        },
      ]);
  
      if (side === "p1") {
        setP1Score(4);
        setP2Score(0);
      } else {
        setP1Score(0);
        setP2Score(4);
      }
    };
  
    const openScore = (match: OfflineMatch) => {
      setSelectedMatch(match);
      setP1Score(match.player1Score || 0);
      setP2Score(match.player2Score || 0);
      setActiveScorer("p1");
      setHistoryActions([]);
      setBbxStats(match.bbxStats || emptyBbxStats());
    };
  
    const saveScore = () => {
      if (!tournament || !selectedMatch) return;
  
      const winnerId =
        p1Score >= p2Score ? selectedMatch.player1Id : selectedMatch.player2Id;
  
      const updatedMatches = matches.map((m) =>
        m.id === selectedMatch.id
          ? {
              ...m,
              player1Score: p1Score,
              player2Score: p2Score,
              winnerId,
              state: "complete" as const,
              bbxStats,
            }
          : m
      );
  
      let finalMatches = updatedMatches;
  
      const isSwissFormat =
        tournament.format === "swiss" ||
        tournament.format === "swiss_single_elim";
  
      if (isSwissFormat) {
        const currentRound = selectedMatch.round;
  
        const roundMatches = updatedMatches.filter(
          (m) => m.round === currentRound
        );
  
        const roundFinished = roundMatches.every((m) => m.state === "complete");
  
        const highestRound = Math.max(
          ...updatedMatches.map((m) => Number(m.round) || 1)
        );
  
        const nextRoundAlreadyExists = updatedMatches.some(
          (m) => m.round === highestRound + 1
        );
  
        if (roundFinished && !nextRoundAlreadyExists) {
          const tempTournament = {
            ...tournament,
            matches: updatedMatches,
          };
  
          finalMatches = generateNextSwissRound(tempTournament);
        }
      }
  
      const updated = {
        ...tournament,
        matches: finalMatches,
      };
  
      updateOfflineTournament(updated);
      setTournament(updated);
      closeScoreModal();
    };
  
    const exportOfflineTournament = () => {
      if (!tournament) return;
  
      const standingsRows = standings.map((p, index) => ({
        Rank: index + 1,
        Player: p.name,
        Wins: p.wins,
        Losses: p.losses,
        "Points Scored": p.pointsScored,
        "Points Against": p.pointsAgainst,
        "Point Diff": p.pointsScored - p.pointsAgainst,
      }));
  
      const statsRows = playerStats.map((p) => ({
        Player: p.name,
        Xtreme: p.xtreme,
        Over: p.over,
        Burst: p.burst,
        Spin: p.spin,
        Warning: p.warning,
        DQ: p.dq,
        "Total Points": p.totalPoints,
      }));
  
      const matchRows = matches.map((m, index) => ({
        Match: index + 1,
        Round: m.round,
        "Player 1": playerName(m.player1Id),
        "Player 1 Score": m.player1Score,
        "Player 2": playerName(m.player2Id),
        "Player 2 Score": m.player2Score,
        Winner: m.winnerId ? playerName(m.winnerId) : "",
        State: m.state,
      }));
  
      const book = XLSX.utils.book_new();
  
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.json_to_sheet(standingsRows),
        "Standings"
      );
  
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.json_to_sheet(statsRows),
        "BBX Stats"
      );
  
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.json_to_sheet(matchRows),
        "Matches"
      );
  
      XLSX.writeFile(
        book,
        `${tournament.name.replace(/\s+/g, "_")}_offline.xlsx`
      );
    };
  
    if (!tournament) {
      return (
        <IonPage>
          <IonContent fullscreen>
            <main className="bbx-page">
              <p>Offline tournament not found.</p>
            </main>
          </IonContent>
        </IonPage>
      );
    }
  
    const lastAction = historyActions[historyActions.length - 1];
  
    return (
      <IonPage>
        <IonContent fullscreen>
          <main className="bbx-page">
            <div className="bbx-back-row">
              <button
                className="bbx-back-button"
                onClick={() => history.push("/offline")}
              >
                ← Offline
              </button>
            </div>
  
            <section className="bbx-hero">
              <div className="bbx-hero-main">
                <span className="bbx-kicker">Offline Battle Room</span>
                <h1 className="bbx-title" style={{ fontSize: 34 }}>
                  {tournament.name}
                </h1>
                <p className="bbx-subtitle">
                  {tournament.format} · {tournament.players.length} players
                </p>
              </div>
            </section>
  
            <div className="bbx-action-row">
              <button className="bbx-button primary" onClick={generateMatches}>
                {tournament.format === "swiss" ||
                tournament.format === "swiss_single_elim"
                  ? "➕ Generate Next Round"
                  : "⚔️ Generate Matches"}
              </button>
  
              <button
                className="bbx-button ghost"
                onClick={exportOfflineTournament}
              >
                📊 Export Excel
              </button>
            </div>
  
            <div className="bbx-offline-panels">
              <section className="bbx-offline-panel">
                <div className="bbx-section-title">
                  <h2>Standings</h2>
                </div>
  
                <div className="bbx-card-list">
                  {standings.map((p, index) => (
                    <div key={p.id} className="bbx-tournament-card">
                      <div>
                        <h3 className="bbx-tournament-name">
                          #{index + 1} {p.name}
                        </h3>
                        <div className="bbx-tournament-meta">
                          <span className="bbx-chip">Wins {p.wins}</span>
                          <span className="bbx-chip">
                            Diff {p.pointsScored - p.pointsAgainst}
                          </span>
                          <span className="bbx-chip">Pts {p.pointsScored}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
  
              <section className="bbx-offline-panel">
                <div className="bbx-section-title">
                  <h2>BBX Stats</h2>
                </div>
  
                <div className="bbx-card-list">
                  {playerStats.map((p) => (
                    <div key={p.id} className="bbx-tournament-card">
                      <div>
                        <h3 className="bbx-tournament-name">{p.name}</h3>
  
                        <div className="bbx-tournament-meta">
                          <span className="bbx-chip">Xtreme {p.xtreme}</span>
                          <span className="bbx-chip">Over {p.over}</span>
                          <span className="bbx-chip">Burst {p.burst}</span>
                          <span className="bbx-chip">Spin {p.spin}</span>
                          <span className="bbx-chip">Warn {p.warning}</span>
                          <span className="bbx-chip">DQ {p.dq}</span>
                          <span className="bbx-chip">Pts {p.totalPoints}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
  
            <div className="bbx-section-title">
              <h2>Matches</h2>
              <span>{matches.length}</span>
            </div>
  
            <div className="bbx-card-list">
              {matches.map((m, index) => (
                <button
                  key={m.id}
                  className="bbx-tournament-card"
                  onClick={() => openScore(m)}
                >
                  <div>
                    <h3 className="bbx-tournament-name">
                      Match {index + 1} · Round {m.round}
                    </h3>
                    <div className="bbx-tournament-meta">
                      <span className="bbx-chip">{playerName(m.player1Id)}</span>
                      <span className="bbx-chip">
                        {m.player1Score}-{m.player2Score}
                      </span>
                      <span className="bbx-chip">{playerName(m.player2Id)}</span>
                      <span className="bbx-chip">{m.state}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </main>
  
          <IonModal isOpen={!!selectedMatch} onDidDismiss={closeScoreModal}>
            <IonContent className="ion-padding">
              <main className="bbx-page" style={{ maxWidth: 560 }}>
                <h1 className="bbx-title" style={{ padding: 10, fontSize: 28 }}>
                  Edit Score
                </h1>
  
                {selectedMatch && (
                  <div
                    className="bbx-tournament-card"
                    style={{ display: "block" }}
                  >
                    <div className="bbx-versus" style={{ marginBottom: 16 }}>
                      <button
                        type="button"
                        className={`bbx-player-pill ${
                          activeScorer === "p1" ? "active" : ""
                        }`}
                        onClick={() => setActiveScorer("p1")}
                      >
                        {playerName(selectedMatch.player1Id)}
                      </button>
  
                      <div className="bbx-score">
                        {p1Score}-{p2Score}
                      </div>
  
                      <button
                        type="button"
                        className={`bbx-player-pill ${
                          activeScorer === "p2" ? "active" : ""
                        }`}
                        onClick={() => setActiveScorer("p2")}
                      >
                        {playerName(selectedMatch.player2Id)}
                      </button>
                    </div>
  
                    {lastAction && (
                      <div
                        style={{
                          marginBottom: 12,
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span className="bbx-chip">
                          Last: {lastAction.type.toUpperCase()}{" "}
                          {lastAction.side === "p1"
                            ? playerName(selectedMatch.player1Id)
                            : playerName(selectedMatch.player2Id)}
                        </span>
  
                        <button
                          type="button"
                          className="bbx-mini-button"
                          onClick={undoLastAction}
                        >
                          ↶ Undo
                        </button>
                      </div>
                    )}
  
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      <button
                        className="bbx-button ghost"
                        onClick={() => addBbxPoints("xtreme", 3)}
                      >
                        Xtreme +3
                      </button>
                      <button
                        className="bbx-button ghost"
                        onClick={() => addBbxPoints("over", 2)}
                      >
                        Over +2
                      </button>
                      <button
                        className="bbx-button ghost"
                        onClick={() => addBbxPoints("burst", 2)}
                      >
                        Burst +2
                      </button>
                      <button
                        className="bbx-button ghost"
                        onClick={() => addBbxPoints("spin", 1)}
                      >
                        Spin +1
                      </button>
                      <button
                        className="bbx-button ghost"
                        onClick={() => addBbxPoints("warning", 1)}
                      >
                        Warning +1
                      </button>
                      <button className="bbx-button danger" onClick={applyDq}>
                        DQ 4-0
                      </button>
                    </div>
  
                    <div className="bbx-action-row" style={{ marginTop: 14 }}>
                      <button
                        className="bbx-button ghost"
                        onClick={closeScoreModal}
                      >
                        Cancel
                      </button>
  
                      <button className="bbx-button primary" onClick={saveScore}>
                        Save Score
                      </button>
                    </div>
                  </div>
                )}
              </main>
            </IonContent>
          </IonModal>
        </IonContent>
      </IonPage>
    );
  };
  
  export default OfflineTournamentDetail;