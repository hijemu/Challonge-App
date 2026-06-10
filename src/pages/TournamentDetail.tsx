import {
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonPage,
  IonText,
  IonTextarea,
} from "@ionic/react";
import { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import api, {
  getMatches,
  getParticipants,
  getStandings,
  getTournament,
  addParticipant,
  addParticipantsBulk,
  shuffleParticipants,
  startTournament,
  enableJudgeAccess,
} from "../api/challonge";
import MatchCard from "../components/MatchCard";
import "../theme/bbx.css";
import {
  createEmptyBbxStats,
  exportBbxStatsToExcel,
  saveBbxPlayerMatchStats,
} from "../utils/bbxStats";

type BbxStats = ReturnType<typeof createEmptyBbxStats>;

type HistoryAction = {
  side: "p1" | "p2";
  type: "xtreme" | "over" | "burst" | "spin" | "warning" | "dq";
  points: number;
  prevP1Score: number;
  prevP2Score: number;
  prevStats: BbxStats;
};

const unwrapTournament = (data: any) =>
  data?.tournament || data?.data?.tournament || data?.data || data || {};

const listFrom = (data: any, key: string) =>
  Array.isArray(data) ? data : data?.[key] || data?.data || [];

const unwrapMatch = (row: any) => row?.match || row?.data || row || {};

const unwrapParticipant = (row: any) =>
  row?.participant || row?.data?.participant || row?.data || row || {};

const asId = (value: any) => {
  const raw = value?.id ?? value?.data?.id ?? value;
  if (raw === null || raw === undefined || raw === "") return null;
  return String(raw);
};

const prettyText = (value: any) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const cloneBbxStats = (stats: BbxStats): BbxStats =>
  JSON.parse(JSON.stringify(stats));

const getMatchPlayerId = (match: any, side: "player1" | "player2") => {
  const m = unwrapMatch(match);
  const attrs = m.attributes || {};

  return asId(
    m[`${side}_id`] ||
      m[`${side}_participant_id`] ||
      m[side]?.id ||
      m[side]?.participant_id ||
      m.relationships?.[side]?.data?.id ||
      attrs.relationships?.[side]?.data?.id ||
      attrs[`${side}_id`] ||
      attrs[`${side}_participant_id`]
  );
};

const getMatchEmbeddedName = (match: any, side: "player1" | "player2") => {
  const m = unwrapMatch(match);
  const attrs = m.attributes || {};

  return (
    m[`${side}_name`] ||
    m[`${side}_display_name`] ||
    m[side]?.name ||
    m[side]?.display_name ||
    attrs[`${side}_name`] ||
    attrs[`${side}_display_name`] ||
    attrs[side]?.name ||
    ""
  );
};

const participantId = (row: any) => asId(unwrapParticipant(row).id || row?.id);

const participantName = (row: any) => {
  const p = unwrapParticipant(row);

  return (
    p.name ||
    p.display_name ||
    p.username ||
    p.attributes?.name ||
    p.attributes?.display_name ||
    ""
  );
};

const parseScore = (score: string) => {
  const [a, b] = String(score || "0-0")
    .split("-")
    .map((n) => Number(String(n).trim()) || 0);

  return [a || 0, b || 0];
};

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [tab, setTab] = useState<"matches" | "players" | "standings">(
    "matches"
  );

  const [matchSearch, setMatchSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");

  const [message, setMessage] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [activeScorer, setActiveScorer] = useState<"p1" | "p2">("p1");
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [saving, setSaving] = useState(false);

  const [bbxStats, setBbxStats] = useState(createEmptyBbxStats());
  const [historyActions, setHistoryActions] = useState<HistoryAction[]>([]);

  const [newParticipantName, setNewParticipantName] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);

  const [bulkNames, setBulkNames] = useState("");
  const [addingBulk, setAddingBulk] = useState(false);

  const attrs = tournament?.attributes || tournament || {};

  const load = async () => {
    try {
      const [t, m, p, s] = await Promise.all([
        getTournament(id),
        getMatches(id),
        getParticipants(id),
        getStandings(id).catch(() => []),
      ]);

      setTournament(unwrapTournament(t));
      setMatches(listFrom(m, "matches"));
      setParticipants(listFrom(p, "participants"));
      setStandings(listFrom(s, "standings"));
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Could not load tournament.");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const participantMap = useMemo(() => {
    const map = new Map<string, string>();

    participants.forEach((row) => {
      const pid = participantId(row);
      const name = participantName(row);
      if (pid && name) map.set(pid, name);
    });

    return map;
  }, [participants]);

  const submitParticipant = async () => {
    try {
      if (!newParticipantName.trim()) return;

      setAddingParticipant(true);

      await addParticipant(id, {
        name: newParticipantName.trim(),
      });

      setNewParticipantName("");
      await load();
    } catch (err: any) {
      setMessage(
        err.response?.data?.error ||
          err.response?.data?.details?.errors?.[0]?.detail ||
          "Could not add participant."
      );
    } finally {
      setAddingParticipant(false);
    }
  };

  const submitBulkParticipants = async () => {
    try {
      const names = bulkNames
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter(Boolean);

      if (!names.length) {
        setMessage("Paste at least one player name.");
        return;
      }

      setAddingBulk(true);

      await addParticipantsBulk(id, names);

      setBulkNames("");
      await load();
    } catch (err: any) {
      setMessage(
        err.response?.data?.error ||
          err.response?.data?.details?.errors?.[0]?.detail ||
          "Could not add bulk participants."
      );
    } finally {
      setAddingBulk(false);
    }
  };

  const shuffleSeeds = async () => {
    try {
      await shuffleParticipants(id);
      setMessage("Participants shuffled.");
      await load();
    } catch (err: any) {
      setMessage(
        err.response?.data?.error || "Could not shuffle participants."
      );
    }
  };

  const startBracket = async () => {
    try {
      await startTournament(id);
      setMessage("Tournament started.");
      await load();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Could not start tournament.");
    }
  };

  const handleFinalizeGroupStage = async () => {
    try {
      await api.post(`/tournaments/${id}/finalize-group-stage`);
      await load();
      setMessage("Group stage finalized.");
    } catch (err: any) {
      setMessage(
        err.response?.data?.error || "Could not finalize group stage."
      );
    }
  };

  const handleEnableJudgeAccess = async () => {
    try {
      await enableJudgeAccess(id);

      setMessage(`Judge access enabled. Share Tournament ID: ${id}`);
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Could not enable judge access.");
    }
  };

  const getPlayerName = (match: any, side: "player1" | "player2") => {
    const embedded = getMatchEmbeddedName(match, side);
    if (embedded) return embedded;

    const pid = getMatchPlayerId(match, side);
    if (pid && participantMap.has(pid)) return participantMap.get(pid) || "TBD";

    const m = unwrapMatch(match);
    const prereq =
      side === "player1"
        ? m.player1_prereq_match_id
        : m.player2_prereq_match_id;

    if (prereq) return `Winner of Match ${prereq}`;

    return "TBD";
  };

  const getPlayerId = (match: any, side: "player1" | "player2") => {
    return getMatchPlayerId(match, side);
  };

  const closeScoreModal = () => {
    setSelectedMatch(null);
    setHistoryActions([]);
    setP1Score(0);
    setP2Score(0);
    setBbxStats(createEmptyBbxStats());
    setActiveScorer("p1");
  };

  const openScoreModal = (match: any) => {
    const m = unwrapMatch(match);
    const [a, b] = parseScore(m.scores_csv || m.scores || m.score || "0-0");

    setSelectedMatch(m);
    setP1Score(a);
    setP2Score(b);
    setActiveScorer("p1");
    setHistoryActions([]);
    setBbxStats(createEmptyBbxStats());
  };

  const addBbxPoints = (
    type: "xtreme" | "over" | "burst" | "spin" | "warning",
    points: number
  ) => {
    const side = activeScorer === "p1" ? "p1" : "p2";

    setHistoryActions((prev) => [
      ...prev,
      {
        side,
        type,
        points,
        prevP1Score: p1Score,
        prevP2Score: p2Score,
        prevStats: cloneBbxStats(bbxStats),
      },
    ]);

    setBbxStats((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [type]: prev[side][type] + 1,
        total: prev[side].total + points,
      },
    }));

    if (side === "p1") {
      setP1Score((v) => v + points);
    } else {
      setP2Score((v) => v + points);
    }
  };

  const applyDq = () => {
    const side = activeScorer === "p1" ? "p1" : "p2";

    setHistoryActions((prev) => [
      ...prev,
      {
        side,
        type: "dq",
        points: 0,
        prevP1Score: p1Score,
        prevP2Score: p2Score,
        prevStats: cloneBbxStats(bbxStats),
      },
    ]);

    setBbxStats((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        dq: prev[side].dq + 1,
        total: side === "p1" ? 4 : 0,
      },
      [side === "p1" ? "p2" : "p1"]: {
        ...prev[side === "p1" ? "p2" : "p1"],
        total: side === "p1" ? 0 : 4,
      },
    }));

    if (side === "p1") {
      setP1Score(4);
      setP2Score(0);
    } else {
      setP1Score(0);
      setP2Score(4);
    }
  };

  const undoLastAction = () => {
    const last = historyActions[historyActions.length - 1];
    if (!last) return;

    setHistoryActions((prev) => prev.slice(0, -1));
    setP1Score(last.prevP1Score);
    setP2Score(last.prevP2Score);
    setBbxStats(last.prevStats);
  };

  const resetScore = () => {
    setHistoryActions((prev) => [
      ...prev,
      {
        side: activeScorer,
        type: "warning",
        points: 0,
        prevP1Score: p1Score,
        prevP2Score: p2Score,
        prevStats: cloneBbxStats(bbxStats),
      },
    ]);

    setP1Score(0);
    setP2Score(0);
    setBbxStats(createEmptyBbxStats());
  };

  const saveScore = async () => {
    if (!selectedMatch) return;

    const player1Id = getPlayerId(selectedMatch, "player1");
    const player2Id = getPlayerId(selectedMatch, "player2");

    if (!player1Id || !player2Id) {
      setMessage("Cannot save yet: this match still has TBD player slots.");
      return;
    }

    const winnerId = p1Score >= p2Score ? player1Id : player2Id;

    setSaving(true);

    try {
      await api.put(`/tournaments/${id}/matches/${selectedMatch.id}`, {
        scores_csv: `${p1Score}-${p2Score}`,
        winner_id: winnerId,
        player1_id: player1Id,
        player2_id: player2Id,
        p1_score: p1Score,
        p2_score: p2Score,
      });

      saveBbxPlayerMatchStats(id, [
        {
          playerId: player1Id,
          playerName: getPlayerName(selectedMatch, "player1"),
          stats: {
            ...bbxStats.p1,
            total: p1Score,
          },
        },
        {
          playerId: player2Id,
          playerName: getPlayerName(selectedMatch, "player2"),
          stats: {
            ...bbxStats.p2,
            total: p2Score,
          },
        },
      ]);

      closeScoreModal();
      await load();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Could not save score.");
    } finally {
      setSaving(false);
    }
  };

  const title = tournament?.name || tournament?.title || "Tournament";
  const state = tournament?.state || attrs?.state || "ready";
  const type =
    tournament?.tournament_type || attrs?.tournament_type || "Beyblade X";

  const filteredMatches = useMemo(() => {
    const q = matchSearch.trim().toLowerCase();
    if (!q) return matches;

    const terms = q
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);

    return matches.filter((match) => {
      const m = unwrapMatch(match);

      const p1 = getPlayerName(match, "player1").toLowerCase();
      const p2 = getPlayerName(match, "player2").toLowerCase();

      const searchable = [
        p1,
        p2,
        `${p1} ${p2}`,
        `${p2} ${p1}`,
        String(m.identifier || "").toLowerCase(),
        String(m.round || "").toLowerCase(),
        String(m.state || "").toLowerCase(),
        String(m.scores_csv || m.scores || m.score || "").toLowerCase(),
      ].join(" ");

      return terms.every((term) => searchable.includes(term));
    });
  }, [matches, matchSearch, participantMap]);

  const stageGroups = useMemo(() => {
    const groupStage: any[] = [];
    const finalStage: any[] = [];

    let foundFinalStage = false;

    filteredMatches.forEach((match) => {
      const m = unwrapMatch(match);

      if (
        !foundFinalStage &&
        (m.state === "open" || m.state === "pending") &&
        Number(m.suggested_play_order || 0) <= 3
      ) {
        foundFinalStage = true;
      }

      if (foundFinalStage) {
        finalStage.push(match);
      } else {
        groupStage.push(match);
      }
    });

    const groupByRound = (items: any[]) => {
      const groups: Record<number, any[]> = {};

      items.forEach((match) => {
        const m = unwrapMatch(match);
        const round = Number(m.round || 1);

        if (!groups[round]) groups[round] = [];
        groups[round].push(match);
      });

      return Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]));
    };

    return {
      groupStage: groupByRound(groupStage),
      finalStage: groupByRound(finalStage),
    };
  }, [filteredMatches]);

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    if (!q) return participants;

    return participants.filter((item) => {
      const data = unwrapParticipant(item);
      return String(data.name || data.display_name || data.username || "")
        .toLowerCase()
        .includes(q);
    });
  }, [participants, playerSearch]);

  const standingDiff = (data: any) =>
    (Number(data?.pointsScored) || 0) - (Number(data?.pointsAgainst) || 0);

  const lastAction = historyActions[historyActions.length - 1];

  return (
    <IonPage>
      <IonContent fullscreen>
        <main className="bbx-page">
          <div className="bbx-back-row">
            <button
              className="bbx-back-button"
              onClick={() => history.push("/tournaments")}
            >
              ← Tournaments
            </button>
          </div>

          <section className="bbx-hero">
            <div className="bbx-hero-main">
              <span className="bbx-kicker">Battle room</span>
              <h1 className="bbx-title" style={{ fontSize: 36 }}>
                {title}
              </h1>
              <p className="bbx-subtitle">
                {prettyText(type)} · {prettyText(state)}
              </p>
            </div>

            <div className="bbx-stat-grid">
              <div className="bbx-stat">
                <strong>{matches.length}</strong>
                <span>Matches</span>
              </div>
              <div className="bbx-stat">
                <strong>{participants.length}</strong>
                <span>Players</span>
              </div>
              <div className="bbx-stat">
                <strong>{standings.length}</strong>
                <span>Ranks</span>
              </div>
            </div>
          </section>

          {message && (
            <IonText color="medium">
              <p>{message}</p>
            </IonText>
          )}

          <section
            className="bbx-card-buttons"
            style={{ padding: 5, marginBottom: 18 }}
          >
            <div className="bbx-action-row">
              <button
                className="bbx-button ghost"
                onClick={handleEnableJudgeAccess}
              >
                🧑‍⚖️ Enable Judges
              </button>

              <button className="bbx-button ghost" onClick={shuffleSeeds}>
                🔀 Shuffle Seeds
              </button>

              <button className="bbx-button primary" onClick={startBracket}>
                ▶ Start Tournament
              </button>

              <button
                className="bbx-button ghost"
                onClick={handleFinalizeGroupStage}
              >
                🏁 End Group Stage
              </button>

              <button
                className="bbx-button ghost"
                onClick={() => exportBbxStatsToExcel(id, title)}
              >
                📊 Export Stats
              </button>
            </div>
          </section>

          <div
            className="bbx-tabbar"
            style={{
              position: "static",
              width: "auto",
              transform: "none",
              margin: "0 0 18px",
            }}
          >
            <button
              className={tab === "matches" ? "active" : ""}
              onClick={() => setTab("matches")}
            >
              ⚔️
              <br />
              Matches
            </button>
            <button
              className={tab === "players" ? "active" : ""}
              onClick={() => setTab("players")}
            >
              👥
              <br />
              Players
            </button>
            <button
              className={tab === "standings" ? "active" : ""}
              onClick={() => setTab("standings")}
            >
              📊
              <br />
              Ranks
            </button>
          </div>

          {tab === "matches" && (
            <IonItem className="bbx-search">
              <IonInput
                placeholder="Search matches, players, round, state..."
                value={matchSearch}
                onIonInput={(e) => setMatchSearch(String(e.detail.value || ""))}
              />
            </IonItem>
          )}

          {tab === "players" && (
            <IonItem className="bbx-search">
              <IonInput
                placeholder="Search players..."
                value={playerSearch}
                onIonInput={(e) =>
                  setPlayerSearch(String(e.detail.value || ""))
                }
              />
            </IonItem>
          )}

          <div className="bbx-card-list">
            {tab === "matches" && (
              <>
                {!!stageGroups.groupStage.length && (
                  <>
                    <p className="bbx-stage-label">Group Stage</p>

                    <div className="bbx-rounds-scroll">
                      {stageGroups.groupStage.map(([round, roundMatches]) => (
                        <div
                          className="bbx-round-column"
                          key={`group-${round}`}
                        >
                          <div className="bbx-round-header">Round {round}</div>

                          {(roundMatches as any[]).map(
                            (match: any, index: number) => (
                              <MatchCard
                                key={
                                  match?.match?.id ||
                                  match?.id ||
                                  `group-${round}-${index}`
                                }
                                match={match}
                                participants={participants}
                                matchNumber={index + 1}
                                player1Name={getPlayerName(match, "player1")}
                                player2Name={getPlayerName(match, "player2")}
                                onClick={() => openScoreModal(match)}
                              />
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {!!stageGroups.finalStage.length && (
                  <>
                    <p className="bbx-stage-label">Final Stage</p>

                    <div className="bbx-rounds-scroll">
                      {stageGroups.finalStage.map(([round, roundMatches]) => (
                        <div
                          className="bbx-round-column"
                          key={`final-${round}`}
                        >
                          <div className="bbx-round-header">Round {round}</div>

                          {(roundMatches as any[]).map(
                            (match: any, index: number) => (
                              <MatchCard
                                key={
                                  match?.match?.id ||
                                  match?.id ||
                                  `final-${round}-${index}`
                                }
                                match={match}
                                participants={participants}
                                matchNumber={index + 1}
                                player1Name={getPlayerName(match, "player1")}
                                player2Name={getPlayerName(match, "player2")}
                                onClick={() => openScoreModal(match)}
                              />
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === "players" &&
              filteredPlayers.map((item: any, index: number) => {
                const data = unwrapParticipant(item);

                return (
                  <div key={data?.id || index} className="bbx-tournament-card">
                    <div>
                      <h3 className="bbx-tournament-name">
                        {data?.name ||
                          data?.display_name ||
                          data?.username ||
                          `Entry ${index + 1}`}
                      </h3>

                      <div className="bbx-tournament-meta">
                        <span className="bbx-chip">
                          Seed {data?.seed || index + 1}
                        </span>
                        {data?.final_rank && (
                          <span className="bbx-chip">
                            Final rank {data.final_rank}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {tab === "standings" &&
              standings.map((item: any, index: number) => {
                const data = item?.standing || item;

                return (
                  <div key={data?.id || index} className="bbx-tournament-card">
                    <div>
                      <h3 className="bbx-tournament-name">
                        #{index + 1}{" "}
                        {data?.name ||
                          data?.display_name ||
                          data?.username ||
                          `Entry ${index + 1}`}
                      </h3>

                      <div className="bbx-tournament-meta">
                        <span className="bbx-chip">
                          Wins: {data?.wins ?? 0}
                        </span>
                        <span className="bbx-chip">
                          Diff: {standingDiff(data)}
                        </span>
                        <span className="bbx-chip">
                          Pts Scored: {data?.pointsScored ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

            {tab === "matches" && !filteredMatches.length && (
              <div className="bbx-empty">No matches found.</div>
            )}

            {tab === "players" && (
              <section
                className="bbx-soft-card"
                style={{ padding: 16, marginBottom: 16 }}
              >
                <IonItem className="bbx-input" lines="none">
                  <IonLabel position="stacked">Add Participant</IonLabel>
                  <IonInput
                    value={newParticipantName}
                    placeholder="Player name"
                    onIonInput={(e) =>
                      setNewParticipantName(String(e.detail.value || ""))
                    }
                  />
                </IonItem>

                <button
                  className="bbx-button primary"
                  style={{ width: "100%", marginTop: 12 }}
                  disabled={addingParticipant}
                  onClick={submitParticipant}
                >
                  {addingParticipant ? "Adding…" : "+ Add Player"}
                </button>

                <section
                  className="bbx-soft-card"
                  style={{ padding: 16, marginTop: 16 }}
                >
                  <p className="bbx-subtitle" style={{ marginTop: 0 }}>
                    Bulk paste players, one name per line.
                  </p>

                  <IonItem className="bbx-input" lines="none">
                    <IonLabel position="stacked">Bulk Participants</IonLabel>
                    <IonTextarea
                      value={bulkNames}
                      autoGrow
                      placeholder={`Player 1\nPlayer 2\nPlayer 3`}
                      onIonInput={(e) =>
                        setBulkNames(String(e.detail.value || ""))
                      }
                    />
                  </IonItem>

                  <button
                    className="bbx-button ghost"
                    style={{ width: "100%", marginTop: 12 }}
                    disabled={addingBulk}
                    onClick={submitBulkParticipants}
                  >
                    {addingBulk ? "Adding…" : "+ Add Bulk Players"}
                  </button>
                </section>
              </section>
            )}

            {tab === "standings" && !standings.length && (
              <div className="bbx-empty">No rankings yet.</div>
            )}
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
                      {getPlayerName(selectedMatch, "player1")}
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
                      {getPlayerName(selectedMatch, "player2")}
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
                          ? getPlayerName(selectedMatch, "player1")
                          : getPlayerName(selectedMatch, "player2")}
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
                    <button className="bbx-button ghost" onClick={resetScore}>
                      Reset
                    </button>

                    <button
                      className="bbx-button ghost"
                      onClick={closeScoreModal}
                    >
                      Cancel
                    </button>
                  </div>

                  <button
                    className="bbx-button primary"
                    style={{ width: "100%", marginTop: 10 }}
                    disabled={saving}
                    onClick={saveScore}
                  >
                    {saving ? "Saving..." : "Save Score"}
                  </button>
                </div>
              )}
            </main>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default TournamentDetail;
