import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonBackButton,
  IonButtons,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonSpinner,
  IonButton,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
} from "@ionic/react";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import MatchCard from "../components/MatchCard";

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [player1Search, setPlayer1Search] = useState("");
  const [player2Search, setPlayer2Search] = useState("");

  const [activeTab, setActiveTab] = useState<"matches" | "standings">(
    "matches",
  );

  const [standings, setStandings] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const [participants, setParticipants] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const tournamentResponse = await axios.get(
        `http://localhost:3001/tournaments/${id}`,
      );

      const matchesResponse = await axios.get(
        `http://localhost:3001/tournaments/${id}/matches`,
      );

      const participantsResponse = await axios.get(
        `http://localhost:3001/tournaments/${id}/participants`,
      );

      const standingsResponse = await axios.get(
        `http://localhost:3001/tournaments/${id}/standings`,
      );
      setStandings(standingsResponse.data);

      setTournament(tournamentResponse.data.tournament);

      setMatches(matchesResponse.data);

      setParticipants(participantsResponse.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getParticipantName = (id: number) => {
    const participant = participants.find((p: any) => p.participant.id === id);
    return participant ? participant.participant.name : "TBD";
  };

  const submitScore = async (
    matchId: number,
    scores: string,
    winnerId: number,
  ) => {
    try {
      await axios.put(`http://localhost:3001/matches/${matchId}`, {
        scores_csv: scores,
        winner_id: winnerId,
      });
      alert("Score updated");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update score");
    }
  };

  const filteredMatches = matches.filter((item: any) => {
    const match = item.match;

    const player1 = match.player1_id
      ? getParticipantName(match.player1_id)
      : "";

    const player2 = match.player2_id
      ? getParticipantName(match.player2_id)
      : "";

    const p1 = player1.toLowerCase();
    const p2 = player2.toLowerCase();

    const search1 = player1Search.toLowerCase();

    const search2 = player2Search.toLowerCase();

    const player1Match =
      !search1 || p1.includes(search1) || p2.includes(search1);

    const player2Match =
      !search2 || p1.includes(search2) || p2.includes(search2);

    return player1Match && player2Match;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tournaments" />
          </IonButtons>

          <IonTitle>Tournament</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <IonSpinner name="crescent" />
            <IonText>Loading tournament...</IonText>
          </div>
        )}

        {!loading && tournament && (
          <>
            <IonCard
              style={{
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #3880ff, #5260ff)",
                  padding: "24px",
                  color: "white",
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: "28px",
                    fontWeight: "bold",
                  }}
                >
                  {tournament.name}
                </h1>

                <p
                  style={{
                    marginTop: "8px",
                    opacity: 0.9,
                  }}
                >
                  {tournament.game_name || "Tournament"}
                </p>

                <IonChip color="light">{tournament.state}</IonChip>
              </div>

              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <div
                        style={{
                          textAlign: "center",
                          padding: "16px",
                        }}
                      >
                        <h2 style={{ margin: 0 }}>
                          {tournament.participants_count}
                        </h2>

                        <p style={{ opacity: 0.7 }}>Players</p>
                      </div>
                    </IonCol>

                    <IonCol size="6">
                      <div
                        style={{
                          textAlign: "center",
                          padding: "16px",
                        }}
                      >
                        <h2 style={{ margin: 0 }}>{matches.length}</h2>

                        <p style={{ opacity: 0.7 }}>Matches</p>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                <div style={{ marginTop: "16px" }}>
                  <p>
                    <strong>Type:</strong> {tournament.tournament_type}
                  </p>

                  <p>
                    <strong>URL:</strong> {tournament.full_challonge_url}
                  </p>

                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(tournament.created_at).toLocaleString()}
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
            <div
              style={{
                marginTop: "24px",
                marginBottom: "12px",
              }}
            >
              <h2>Matches</h2>
            </div>
            <IonSegment
              value={activeTab}
              onIonChange={(e) => setActiveTab(e.detail.value as any)}
              style={{ marginBottom: "20px" }}
            >
              {" "}
              <IonSegmentButton value="matches">
                {" "}
                <IonLabel> Matches </IonLabel>{" "}
              </IonSegmentButton>{" "}
              <IonSegmentButton value="standings">
                {" "}
                <IonLabel> Standings </IonLabel>{" "}
              </IonSegmentButton>{" "}
            </IonSegment>

            {activeTab === "matches" && (
              <IonList>
                <div
                  style={{
                    marginBottom: "20px",
                    display: "flex",
                  }}
                >
                  <IonSearchbar
                    placeholder="Search Player 1"
                    value={player1Search}
                    onIonInput={(e) => setPlayer1Search(e.detail.value || "")}
                  />

                  <IonSearchbar
                    placeholder="Search Player 2"
                    value={player2Search}
                    onIonInput={(e) => setPlayer2Search(e.detail.value || "")}
                  />
                </div>
                {matches.length === 0 && (
                  <IonItem>
                    <IonLabel>No matches available.</IonLabel>
                  </IonItem>
                )}

                {filteredMatches.map((item: any) => {
                  const match = item.match;
                  const player1 = match.player1_id
                    ? getParticipantName(match.player1_id)
                    : "TBD";
                  const player2 = match.player2_id
                    ? getParticipantName(match.player2_id)
                    : "TBD";
                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      player1={player1}
                      player2={player2}
                      onUpdated={loadData}
                    />
                  );
                })}
              </IonList>
            )}
            {activeTab === "standings" && (
              <IonList>
                {standings.map((player: any, index: number) => (
                  <IonItem key={player.id}>
                    <IonLabel>
                      <h2>
                        #{index + 1} {player.name}
                      </h2>
                      <p>
                        Record: {player.wins}W -{player.losses}L
                      </p>
                      <p>
                        Points Diff: {player.pointsScored - player.pointsAgainst}
                        {" | "}
                        Points Scored: {player.pointsScored}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default TournamentDetail;
