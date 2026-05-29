import {
  IonCard,
  IonCardContent,
  IonBadge,
  IonChip,
  IonButton,
} from "@ionic/react";

import { useState } from "react";
import axios from "axios";

interface Props {
  match: any;
  player1: string;
  player2: string;
  onUpdated: () => void;
}

const scoreMap: any = {
  X: 3,
  O: 2,
  B: 2,
  S: 1,
  W: 1,
};

const MatchCard: React.FC<Props> = ({ match, player1, player2, onUpdated }) => {
  const isCompleted = match.state === "complete";

  const [editing, setEditing] = useState(!isCompleted);

  const [selectedPlayer, setSelectedPlayer] = useState<"p1" | "p2">("p1");

  const [p1Codes, setP1Codes] = useState<string[]>([]);

  const [p2Codes, setP2Codes] = useState<string[]>([]);

  const addCode = (code: string) => {
    if (selectedPlayer === "p1") {
      setP1Codes([...p1Codes, code]);
    } else {
      setP2Codes([...p2Codes, code]);
    }
  };

  const calculateScore = (codes: string[]) => {
    return codes.reduce((total, code) => total + scoreMap[code], 0);
  };

  const p1Score = calculateScore(p1Codes);

  const p2Score = calculateScore(p2Codes);

  const resetScores = () => {
    setP1Codes([]);
    setP2Codes([]);
  };

  const submitWinner = async () => {
    try {
      const winnerId = p1Score > p2Score ? match.player1_id : match.player2_id;

      const scoreCsv = `${p1Score}-${p2Score}`;

      await axios.put(`http://localhost:3001/tournaments/${match.tournament_id}/matches/${match.id}`, {
        scores_csv: scoreCsv,
        winner_id: winnerId,
      });

      alert("Match updated");

      setEditing(false);

      onUpdated();
    } catch (err) {
      console.error(err);

      alert("Failed to submit");
    }
  };

  return (
    <IonCard
      style={{
        borderRadius: "18px",
        marginBottom: "18px",
      }}
    >
      <IonCardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <IonBadge color="primary">Round {match.round}</IonBadge>

          <IonChip color={isCompleted ? "success" : "warning"}>
            {match.state}
          </IonChip>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              flex: 1,
              textAlign: "center",
            }}
          >
            <h2>{player1}</h2>
          </div>

          <div
            style={{
              padding: "0 16px",
              fontWeight: "bold",
            }}
          >
            VS
          </div>

          <div
            style={{
              flex: 1,
              textAlign: "center",
            }}
          >
            <h2>{player2}</h2>
          </div>
        </div>

        {!editing && isCompleted && (
          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            <h1
              style={{
                fontSize: "48px",
                margin: 0,
              }}
            >
              {match.scores_csv}
            </h1>

            <p
              style={{
                opacity: 0.7,
              }}
            >
              Final Score
            </p>

            <IonButton fill="outline" onClick={() => setEditing(true)}>
              Edit Score
            </IonButton>
          </div>
        )}

        {editing && (
          <>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <IonButton
                expand="block"
                fill={selectedPlayer === "p1" ? "solid" : "outline"}
                onClick={() => setSelectedPlayer("p1")}
              >
                {player1}
              </IonButton>

              <IonButton
                expand="block"
                fill={selectedPlayer === "p2" ? "solid" : "outline"}
                onClick={() => setSelectedPlayer("p2")}
              >
                {player2}
              </IonButton>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "10px",
              }}
            >
              <IonButton color="danger" onClick={() => addCode("X")}>
                X
              </IonButton>

              <IonButton color="warning" onClick={() => addCode("O")}>
                O
              </IonButton>

              <IonButton color="tertiary" onClick={() => addCode("B")}>
                B
              </IonButton>

              <IonButton color="success" onClick={() => addCode("S")}>
                S
              </IonButton>

              <IonButton color="medium" onClick={() => addCode("W")}>
                W
              </IonButton>
            </div>

            <div
              style={{
                marginTop: "24px",
                textAlign: "center",
              }}
            >
              <h2>
                {p1Score} - {p2Score}
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <IonButton color="medium" expand="block" onClick={resetScores}>
                Reset
              </IonButton>

              <IonButton color="primary" expand="block" onClick={submitWinner}>
                Save Match
              </IonButton>
            </div>
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default MatchCard;
