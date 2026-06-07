import {
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonText,
  } from '@ionic/react';
  import { useMemo, useState } from 'react';
  import { useHistory } from 'react-router-dom';
  import { createTournament } from '../api/challonge';
  import '../theme/bbx.css';
  
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  
  const unwrapTournament = (data: any) =>
    data?.tournament || data?.data?.tournament || data?.data || data || {};
  
  const CreateTournament: React.FC = () => {
    const history = useHistory();
  
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState('swiss');
    const [gameName, setGameName] = useState('Beyblade X');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
  
    const finalUrl = useMemo(() => url || slugify(name), [url, name]);
  
    const submit = async () => {
      try {
        setMessage('');
  
        if (!name.trim()) {
          setMessage('Tournament name is required.');
          return;
        }
  
        if (!finalUrl.trim()) {
          setMessage('Tournament URL is required.');
          return;
        }
  
        setSaving(true);
  
        const data = await createTournament({
          name: name.trim(),
          url: finalUrl.trim(),
          tournament_type: format,
          game_name: gameName.trim() || 'Beyblade X',
          description: description.trim(),
        });
  
        const tournament = unwrapTournament(data);
        const id = tournament?.id || tournament?.url || finalUrl;
  
        history.replace(`/tournaments/${id}`);
      } catch (err: any) {
        setMessage(
          err.response?.data?.error ||
            err.response?.data?.details?.errors?.[0]?.detail ||
            err.message ||
            'Could not create tournament.'
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
              <button className="bbx-back-button" onClick={() => history.push('/tournaments')}>
                ← Dashboard
              </button>
            </div>
  
            <section className="bbx-hero">
              <div className="bbx-hero-main">
                <span className="bbx-kicker">New bracket</span>
                <h1 className="bbx-title" style={{ fontSize: 36 }}>
                  Create Tournament
                </h1>
                <p className="bbx-subtitle">
                  Create a Challonge tournament directly from mobile.
                </p>
              </div>
            </section>
  
            {message && (
              <IonText color="danger">
                <p>{message}</p>
              </IonText>
            )}
  
            <section className="bbx-soft-card" style={{ padding: 18 }}>
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Tournament Name</IonLabel>
                <IonInput
                  value={name}
                  placeholder="Saturday BBX Cup"
                  onIonInput={(e) => {
                    const value = String(e.detail.value || '');
                    setName(value);
                    if (!url) setUrl(slugify(value));
                  }}
                />
              </IonItem>
  
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Challonge URL</IonLabel>
                <IonInput
                  value={finalUrl}
                  placeholder="saturday-bbx-cup"
                  onIonInput={(e) => setUrl(slugify(String(e.detail.value || '')))}
                />
              </IonItem>
  
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Format</IonLabel>
                <IonSelect value={format} onIonChange={(e) => setFormat(e.detail.value)}>
                  <IonSelectOption value="swiss">Swiss</IonSelectOption>
                  <IonSelectOption value="single elimination">Single Elimination</IonSelectOption>
                  <IonSelectOption value="double elimination">Double Elimination</IonSelectOption>
                  <IonSelectOption value="round robin">Round Robin</IonSelectOption>
                </IonSelect>
              </IonItem>
  
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Game</IonLabel>
                <IonInput
                  value={gameName}
                  onIonInput={(e) => setGameName(String(e.detail.value || ''))}
                />
              </IonItem>
  
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={description}
                  placeholder="Optional notes..."
                  onIonInput={(e) => setDescription(String(e.detail.value || ''))}
                />
              </IonItem>
  
              <button
                className="bbx-button primary"
                style={{ width: '100%', marginTop: 14 }}
                disabled={saving}
                onClick={submit}
              >
                {saving ? 'Creating…' : 'Create Tournament'}
              </button>
            </section>
          </main>
        </IonContent>
      </IonPage>
    );
  };
  
  export default CreateTournament;