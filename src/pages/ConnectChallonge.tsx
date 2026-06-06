import { IonContent, IonInput, IonItem, IonLabel, IonPage, IonText } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { connectApiKeyForDev, disconnectChallonge, getChallongeConnectUrl, getChallongeStatus } from '../api/challonge';
import { useAuth } from '../context/AuthContext';
import '../theme/bbx.css';

const ConnectChallonge: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [status, setStatus] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');

  const loadStatus = async () => {
    try { setStatus(await getChallongeStatus()); }
    catch (err: any) { setMessage(err.response?.data?.error || 'Could not check connection.'); }
  };

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

  const connected = Boolean(status?.connected);

  return (
    <IonPage>
      <IonContent fullscreen>
        <main className="bbx-page">
          <div className="bbx-back-row">
            <button className="bbx-back-button" onClick={() => history.push('/tournaments')}>← Tournaments</button>
          </div>

          <div className="bbx-topbar">
            <div>
              <span className="bbx-kicker">Connected account</span>
              <h1 className="bbx-title">Challonge link.</h1>
              <p className="bbx-subtitle">Every organizer connects their own account. Your app stays clean and multi-user.</p>
            </div>
            <div className="bbx-avatar">🔗</div>
          </div>

          {message && <IonText color="medium"><p>{message}</p></IonText>}

          <section className="bbx-status-card">
            <span className={`bbx-status-badge ${connected ? '' : 'off'}`}>
              <i className="bbx-live-dot" /> {connected ? 'Connected' : 'Not connected'}
            </span>
            <h2 className="bbx-title" style={{ fontSize: 32 }}>Run brackets with your own account.</h2>
            <p className="bbx-subtitle">OAuth means no sharing API keys. Staff log in, connect Challonge, then control their tournaments.</p>
            {status?.expires_at && <p className="bbx-subtitle">Expires: {status.expires_at}</p>}
            {status?.scope && <p className="bbx-subtitle">Scope: {status.scope}</p>}
          </section>

          <div className="bbx-connect-panel" style={{ marginTop: 16 }}>
            <button className="bbx-button primary" onClick={connectOAuth}>{connected ? 'Reconnect Challonge' : 'Connect with Challonge'}</button>
            <button className="bbx-button ghost" onClick={() => history.push('/tournaments')}>Open My Tournaments</button>
            {connected && <button className="bbx-button danger" onClick={disconnect}>Disconnect</button>}
          </div>

          <div className="bbx-section-title">
            <h2>Testing fallback</h2>
            <span>dev only</span>
          </div>

          <section className="bbx-soft-card" style={{ padding: 18 }}>
            <p className="bbx-subtitle" style={{ marginTop: 0 }}>Use this only while waiting for Challonge Connect OAuth keys.</p>
            <IonItem className="bbx-input" lines="none">
              <IonLabel position="stacked">Challonge API v1 Key</IonLabel>
              <IonInput value={apiKey} onIonInput={(e) => setApiKey(e.detail.value || '')} type="password" />
            </IonItem>
            <button className="bbx-button ghost" style={{ width: '100%', marginTop: 12 }} onClick={connectDevKey}>Connect API Key for Dev</button>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default ConnectChallonge;
