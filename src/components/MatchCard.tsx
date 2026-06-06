import { IonBadge, IonButton, IonCard, IonCardContent, IonChip, IonText } from '@ionic/react';
import { useState } from 'react';
import api from '../api/challonge';
import { useAuth } from '../context/AuthContext';

interface Props {
  match: any;
  player1: string;
  player2: string;
  onUpdated: () => void;
}

const scoreMap: Record<string, number> = { X: 3, O: 2, B: 2, S: 1, W: 1 };

const MatchCard: React.FC<Props> = ({ match, player1, player2, onUpdated }) => {
  const { user } = useAuth();
  const isCompleted = match.state === 'complete';
  const [editing, setEditing] = useState(!isCompleted);
  const [selectedPlayer, setSelectedPlayer] = useState<'p1' | 'p2'>('p1');
  const [p1Codes, setP1Codes] = useState<string[]>([]);
  const [p2Codes, setP2Codes] = useState<string[]>([]);
  const canEdit = !!user;

  const addCode = (code: string) => selectedPlayer === 'p1' ? setP1Codes([...p1Codes, code]) : setP2Codes([...p2Codes, code]);
  const calculateScore = (codes: string[]) => codes.reduce((total, code) => total + scoreMap[code], 0);
  const p1Score = calculateScore(p1Codes);
  const p2Score = calculateScore(p2Codes);

  const submitWinner = async () => {
    if (!canEdit) return alert('Please login first');
    if (!match.player1_id || !match.player2_id) return alert('Match is missing participants.');
    if (p1Score === p2Score) return alert('Scores are tied. Pick a real winner first.');

    try {
      const winnerId = p1Score > p2Score ? match.player1_id : match.player2_id;
      await api.put(`/tournaments/${match.tournament_id}/matches/${match.id}`, {
        scores_csv: `${p1Score}-${p2Score}`,
        winner_id: winnerId,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        p1_score: p1Score,
        p2_score: p2Score,
      });

      alert('Match updated');
      setEditing(false);
      onUpdated();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit');
    }
  };

  return (
    <IonCard>
      <IonCardContent>
        <IonBadge>Round {match.round}</IonBadge> <IonBadge color={isCompleted ? 'success' : 'warning'}>{match.state}</IonBadge>
        <h2>{player1}</h2>
        <p>VS</p>
        <h2>{player2}</h2>

        {!editing && isCompleted && (
          <>
            <h1>{match.scores_csv}</h1>
            <p>Final Score</p>
            {canEdit && <IonButton onClick={() => setEditing(true)}>Edit Score</IonButton>}
          </>
        )}

        {!canEdit && <IonText color="medium"><p>Login to report scores.</p></IonText>}

        {editing && canEdit && (
          <>
            <IonButton fill={selectedPlayer === 'p1' ? 'solid' : 'outline'} onClick={() => setSelectedPlayer('p1')}>{player1}</IonButton>
            <IonButton fill={selectedPlayer === 'p2' ? 'solid' : 'outline'} onClick={() => setSelectedPlayer('p2')}>{player2}</IonButton>
            {['X', 'O', 'B', 'S', 'W'].map((code) => <IonChip key={code} onClick={() => addCode(code)}>{code}</IonChip>)}
            <h2>{p1Score} - {p2Score}</h2>
            <IonText color="medium"><p>{player1}: {p1Codes.join(', ') || 'none'} | {player2}: {p2Codes.join(', ') || 'none'}</p></IonText>
            <IonButton color="medium" onClick={() => { setP1Codes([]); setP2Codes([]); }}>Reset</IonButton>
            <IonButton onClick={submitWinner}>Save Match</IonButton>
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default MatchCard;
