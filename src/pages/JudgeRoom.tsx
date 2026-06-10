import {
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonPage,
    IonText,
  } from "@ionic/react";
  import { useMemo, useState } from "react";
  import { useHistory } from "react-router-dom";
  import {
    getJudgeMatches,
    submitJudgeScore,
  } from "../api/challonge";
  import "../theme/bbx.css";
  
  const unwrapMatch = (row: any) => row?.match || row?.data || row || {};
  
  const asId = (value: any) => {
    const raw = value?.id ?? value?.data?.id ?? value;
    if (raw === null || raw === undefined || raw === "") return null;
    return String(raw);
  };
  
  const parseScore = (score: string) => {
    const [a, b] = String(score || "0-0")
      .split("-")
      .map((n) => Number(String(n).trim()) || 0);
  
    return [a || 0, b || 0];
  };
  
  const getPlayerId = (match: any, side: "player1" | "player2") => {
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
  
  const getPlayerName = (match: any, side: "player1" | "player2") => {
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
      (side === "player1" ? "Player 1" : "Player 2")
    );
  };
  
  const JudgeRoom: React.FC = () => {
    const history = useHistory();
  
    const [tournamentId, setTournamentId] = useState("");
    const [matches, setMatches] = useState<any[]>([]);
    const [matchSearch, setMatchSearch] = useState("");
    const [message, setMessage] = useState("");
  
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [activeScorer, setActiveScorer] = useState<"p1" | "p2">("p1");
    const [p1Score, setP1Score] = useState(0);
    const [p2Score, setP2Score] = useState(0);
    const [saving, setSaving] = useState(false);
  
    const loadMatches = async () => {
      try {
        setMessage("");
  
        if (!tournamentId.trim()) {
          setMessage("Enter a tournament ID first.");
          return;
        }
  
        const response = await getJudgeMatches(tournamentId.trim());
        const data = response?.data || response;
  
        const rows = Array.isArray(data)
          ? data
          : data?.matches || data?.data || [];
  
        setMatches(rows);
        setMessage(`Loaded ${rows.length} matches.`);
      } catch (err: any) {
        setMatches([]);
        setMessage(
          err.response?.data?.error ||
            "Could not load judge room. Make sure judge access is enabled."
        );
      }
    };
  
    const filteredMatches = useMemo(() => {
      const q = matchSearch.trim().toLowerCase();
      if (!q) return matches;
  
      const terms = q.split(/\s+/).filter(Boolean);
  
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
    }, [matches, matchSearch]);
  
    const openScoreModal = (match: any) => {
      const m = unwrapMatch(match);
      const [a, b] = parseScore(m.scores_csv || m.scores || m.score || "0-0");
  
      setSelectedMatch(m);
      setP1Score(a);
      setP2Score(b);
      setActiveScorer("p1");
    };
  
    const closeScoreModal = () => {
      setSelectedMatch(null);
      setP1Score(0);
      setP2Score(0);
      setActiveScorer("p1");
    };
  
    const addPoints = (points: number) => {
      if (activeScorer === "p1") {
        setP1Score((v) => v + points);
      } else {
        setP2Score((v) => v + points);
      }
    };
  
    const applyDq = () => {
      if (activeScorer === "p1") {
        setP1Score(4);
        setP2Score(0);
      } else {
        setP1Score(0);
        setP2Score(4);
      }
    };
  
    const resetScore = () => {
      setP1Score(0);
      setP2Score(0);
    };
  
    const saveScore = async () => {
      if (!selectedMatch) return;
  
      const player1Id = getPlayerId(selectedMatch, "player1");
      const player2Id = getPlayerId(selectedMatch, "player2");
  
      if (!player1Id || !player2Id) {
        setMessage("Cannot save: match has TBD player slots.");
        return;
      }
  
      const winnerId = p1Score >= p2Score ? player1Id : player2Id;
  
      try {
        setSaving(true);
  
        await submitJudgeScore(
          tournamentId.trim(),
          String(selectedMatch.id),
          {
            scores_csv: `${p1Score}-${p2Score}`,
            winner_id: winnerId,
            player1_id: player1Id,
            player2_id: player2Id,
            p1_score: p1Score,
            p2_score: p2Score,
          }
        );
  
        setMessage("Score submitted.");
        closeScoreModal();
        await loadMatches();
      } catch (err: any) {
        setMessage(
          err.response?.data?.error ||
            "Could not submit score."
        );
      } finally {
        setSaving(false);
      }
    };
  
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
                <span className="bbx-kicker">Judge Mode</span>
                <h1 className="bbx-title" style={{ fontSize: 36 }}>
                  Score Room
                </h1>
                <p className="bbx-subtitle">
                  Enter a shared tournament ID to score matches without a Challonge login.
                </p>
              </div>
            </section>
  
            {message && (
              <IonText color="medium">
                <p>{message}</p>
              </IonText>
            )}
  
            <section className="bbx-soft-card" style={{ padding: 16 }}>
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Tournament ID</IonLabel>
                <IonInput
                  value={tournamentId}
                  placeholder="18060959"
                  onIonInput={(e) =>
                    setTournamentId(String(e.detail.value || "").trim())
                  }
                />
              </IonItem>
  
              <button
                className="bbx-button primary"
                style={{ width: "100%", marginTop: 12 }}
                onClick={loadMatches}
              >
                Load Matches
              </button>
            </section>
  
            {!!matches.length && (
              <IonItem className="bbx-search">
                <IonInput
                  placeholder="Search players, round, state..."
                  value={matchSearch}
                  onIonInput={(e) =>
                    setMatchSearch(String(e.detail.value || ""))
                  }
                />
              </IonItem>
            )}
  
            <div className="bbx-section-title">
              <h2>Matches</h2>
              <span>{filteredMatches.length}</span>
            </div>
  
            <div className="bbx-card-list">
              {filteredMatches.map((row, index) => {
                const m = unwrapMatch(row);
                const p1 = getPlayerName(row, "player1");
                const p2 = getPlayerName(row, "player2");
                const score = m.scores_csv || m.scores || m.score || "0-0";
                const state = m.state || "pending";
  
                return (
                  <button
                    key={m.id || index}
                    className="bbx-tournament-card"
                    onClick={() => openScoreModal(row)}
                  >
                    <div>
                      <h3 className="bbx-tournament-name">
                        Match {index + 1} · Round {m.round || "?"}
                      </h3>
  
                      <div className="bbx-tournament-meta">
                        <span className="bbx-chip">{p1}</span>
                        <span className="bbx-chip">{score}</span>
                        <span className="bbx-chip">{p2}</span>
                        <span className="bbx-chip">
                          {String(state).replaceAll("_", " ")}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
  
              {!!matches.length && !filteredMatches.length && (
                <div className="bbx-empty">No matches found.</div>
              )}
            </div>
          </main>
  
          <IonModal
            isOpen={!!selectedMatch}
            onDidDismiss={closeScoreModal}
          >
            <IonContent className="ion-padding">
              <main className="bbx-page" style={{ maxWidth: 560 }}>
                <h1 className="bbx-title" style={{ padding: 10, fontSize: 28 }}>
                  Judge Score
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
  
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      <button className="bbx-button ghost" onClick={() => addPoints(3)}>
                        Xtreme +3
                      </button>
                      <button className="bbx-button ghost" onClick={() => addPoints(2)}>
                        Over +2
                      </button>
                      <button className="bbx-button ghost" onClick={() => addPoints(2)}>
                        Burst +2
                      </button>
                      <button className="bbx-button ghost" onClick={() => addPoints(1)}>
                        Spin +1
                      </button>
                      <button className="bbx-button ghost" onClick={() => addPoints(1)}>
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
  
                      <button className="bbx-button ghost" onClick={closeScoreModal}>
                        Cancel
                      </button>
                    </div>
  
                    <button
                      className="bbx-button primary"
                      style={{ width: "100%", marginTop: 10 }}
                      disabled={saving}
                      onClick={saveScore}
                    >
                      {saving ? "Submitting..." : "Submit Score"}
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
  
  export default JudgeRoom;