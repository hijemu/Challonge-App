import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import { getMatches, getParticipants, getStandings, getTournament } from '../api/challonge';

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [player1Search, setPlayer1Search] = useState('');
  const [player2Search, setPlayer2Search] = useState('');
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [tournamentResponse, matchesResponse, participantsResponse, standingsResponse] = await Promise.all([
        getTournament(id),
        getMatches(id),
        getParticipants(id),
        getStandings(id),
      ]);

      setTournament(tournamentResponse.tournament);
      setMatches(matchesResponse);
      setParticipants(participantsResponse);
      setStandings(standingsResponse);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getParticipantName = (participantId: number) => {
    const participant = participants.find((p: any) => p.participant.id === participantId);
    return participant ? participant.participant.name : 'TBD';
  };

  const filteredMatches = matches.filter((item: any) => {
    const match = item.match;
    const player1 = match.player1_id ? getParticipantName(match.player1_id) : '';
    const player2 = match.player2_id ? getParticipantName(match.player2_id) : '';
    const names = `${player1} ${player2}`.toLowerCase();
    return names.includes(player1Search.toLowerCase()) && names.includes(player2Search.toLowerCase());
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

      <IonContent className="ion-padding">
        {loading && <IonSpinner />}

        {!loading && tournament && (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>{tournament.name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>{tournament.game_name || 'Tournament'}</p>
                <IonBadge>{tournament.state}</IonBadge>
                <p>Players: {tournament.participants_count}</p>
                <p>Matches: {matches.length}</p>
                <p>Type: {tournament.tournament_type}</p>
              </IonCardContent>
            </IonCard>

            <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value as any)}>
              <IonSegmentButton value="matches">Matches</IonSegmentButton>
              <IonSegmentButton value="standings">Standings</IonSegmentButton>
            </IonSegment>

            {activeTab === 'matches' && (
              <>
                <IonSearchbar placeholder="Search player 1 / name" value={player1Search} onIonInput={(e) => setPlayer1Search(e.detail.value || '')} />
                <IonSearchbar placeholder="Search player 2 / name" value={player2Search} onIonInput={(e) => setPlayer2Search(e.detail.value || '')} />

                {filteredMatches.length === 0 && <IonText>No matches available.</IonText>}

                {filteredMatches.map((item: any) => {
                  const match = item.match;
                  const player1 = match.player1_id ? getParticipantName(match.player1_id) : 'TBD';
                  const player2 = match.player2_id ? getParticipantName(match.player2_id) : 'TBD';

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
              </>
            )}

            {activeTab === 'standings' && (
              <IonList>
                {standings.map((player: any, index: number) => (
                  <IonItem key={player.id}>
                    <IonLabel>
                      <h2>#{index + 1} {player.name}</h2>
                      <p>Record: {player.wins}W - {player.losses}L</p>
                      <p>Points Diff: {player.pointsScored - player.pointsAgainst} | Points Scored: {player.pointsScored}</p>
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
