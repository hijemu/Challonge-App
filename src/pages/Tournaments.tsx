import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getChallongeStatus, getTournaments } from '../api/challonge';
import { useAuth } from '../context/AuthContext';

const Tournaments: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      history.replace('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const status = await getChallongeStatus();
      setConnected(status.connected);
      if (!status.connected) return;

      const data = await getTournaments();
      const sorted = data.sort((a: any, b: any) => {
        return new Date(b.tournament.created_at || 0).getTime() - new Date(a.tournament.created_at || 0).getTime();
      });
      setTournaments(sorted);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Challonge Tournaments</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {user && (
          <IonText color="medium">
            <p>Logged in as {user.name} ({user.role})</p>
          </IonText>
        )}

        <IonButton expand="block" onClick={() => history.push('/connect-challonge')}>Connect / Manage Challonge</IonButton>
        <IonButton fill="clear" onClick={logout}>Logout</IonButton>

        {loading && <p>Loading...</p>}
        {error && <IonText color="danger"><p>{error}</p></IonText>}

        {!loading && !connected && (
          <IonText color="warning">
            <p>Connect your own Challonge account first. After that, this page will show your tournaments only.</p>
          </IonText>
        )}

        {!loading && connected && tournaments.length === 0 && <p>No tournaments found on this Challonge account.</p>}

        <IonList>
          {tournaments.map((item: any) => (
            <IonItem key={item.tournament.id} button onClick={() => history.push(`/tournaments/${item.tournament.id}`)}>
              <IonLabel>
                <h2>{item.tournament.name}</h2>
                <p>{item.tournament.game_name || item.tournament.tournament_type || 'Tournament'}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tournaments;
