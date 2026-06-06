import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { connectApiKeyForDev, disconnectChallonge, getChallongeConnectUrl, getChallongeStatus } from '../api/challonge';
import { useAuth } from '../context/AuthContext';

const ConnectChallonge: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [status, setStatus] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      history.replace('/login');
      return;
    }

    const params = new URLSearchParams(location.search);
    if (params.get('connected') === '1') setMessage('Challonge connected successfully.');
    if (params.get('connected') === '0') setMessage(params.get('error') || 'Challonge connection failed.');

    loadStatus();
  }, [user, location.search]);

  const loadStatus = async () => {
    try {
      setStatus(await getChallongeStatus());
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Could not check connection.');
    }
  };

  const connectOAuth = async () => {
    try {
      const data = await getChallongeConnectUrl();
      window.location.href = data.url;
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to start Challonge connection.');
    }
  };

  const connectDevKey = async () => {
    try {
      await connectApiKeyForDev(apiKey);
      setApiKey('');
      setMessage('Dev API key connected. Use OAuth for production.');
      await loadStatus();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to connect API key.');
    }
  };

  const disconnect = async () => {
    await disconnectChallonge();
    setMessage('Disconnected.');
    await loadStatus();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Connect Challonge</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {message && <IonText color="medium"><p>{message}</p></IonText>}

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>{status?.connected ? 'Connected' : 'Not connected'}</p>
            {status?.expires_at && <p>Expires: {status.expires_at}</p>}
            {status?.scope && <p>Scope: {status.scope}</p>}
          </IonCardContent>
        </IonCard>

        <IonButton expand="block" onClick={connectOAuth}>Connect with Challonge</IonButton>
        <IonButton expand="block" fill="outline" onClick={() => history.push('/tournaments')}>Go to My Tournaments</IonButton>
        {status?.connected && <IonButton expand="block" color="danger" fill="outline" onClick={disconnect}>Disconnect</IonButton>}

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Testing fallback</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Use this only while waiting for your Challonge Connect OAuth app/client keys.</p>
            <IonItem>
              <IonLabel position="stacked">Challonge API v1 Key</IonLabel>
              <IonInput value={apiKey} onIonInput={(e) => setApiKey(e.detail.value || '')} type="password" />
            </IonItem>
            <IonButton expand="block" fill="outline" onClick={connectDevKey}>Connect API Key for Dev</IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ConnectChallonge;
