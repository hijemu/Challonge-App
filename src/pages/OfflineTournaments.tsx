import {
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonTextarea,
  } from "@ionic/react";
  import { useEffect, useState } from "react";
  import { useHistory } from "react-router-dom";
  import {
    getOfflineTournaments,
    saveOfflineTournament,
    OfflineTournament,
  } from "../utils/offlineTournaments";
  import "../theme/bbx.css";
  
  const OfflineTournaments: React.FC = () => {
    const history = useHistory();
  
    const [items, setItems] = useState<OfflineTournament[]>([]);
    const [name, setName] = useState("");
    const [format, setFormat] =
      useState<OfflineTournament["format"]>("round_robin");
    const [playersText, setPlayersText] = useState("");
    const [swissRounds, setSwissRounds] = useState(5);
    const [roundRobinRounds, setRoundRobinRounds] = useState(1);
    const [finalsCut, setFinalsCut] = useState(8);
  
    const isSwissFormat = format === "swiss" || format === "swiss_single_elim";
  
    const isRoundRobinFormat =
      format === "round_robin" || format === "round_robin_single_elim";
  
    const isTwoStage =
      format === "swiss_single_elim" || format === "round_robin_single_elim";
  
    const load = () => setItems(getOfflineTournaments());
  
    useEffect(() => {
      const unlisten = history.listen(() => {
        load();
      });
  
      load();
  
      return () => unlisten();
    }, [history]);
  
    const create = () => {
      const playerNames = playersText
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
  
      if (!name.trim() || playerNames.length < 2) return;
  
      const tournament: OfflineTournament = {
        id: `offline_${Date.now()}`,
        name: name.trim(),
        format,
        createdAt: new Date().toISOString(),
        players: playerNames.map((playerName, index) => ({
          id: `p_${Date.now()}_${index}`,
          name: playerName,
          seed: index + 1,
        })),
        matches: [],
        stage: isTwoStage ? "qualifiers" : undefined,
        swissRounds: isSwissFormat ? swissRounds : undefined,
        roundRobinRounds: isRoundRobinFormat ? roundRobinRounds : undefined,
        finalsCut: isTwoStage ? finalsCut : undefined,
      };
  
      saveOfflineTournament(tournament);
      load();
      history.push(`/offline/${tournament.id}`);
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
                ← Online
              </button>
            </div>
  
            <section className="bbx-hero">
              <div className="bbx-hero-main">
                <span className="bbx-kicker">Offline Mode</span>
                <h1 className="bbx-title">BBX Offline</h1>
                <p className="bbx-subtitle">
                  Run tournaments without Challonge or internet.
                </p>
              </div>
            </section>
  
            <section className="bbx-soft-card" style={{ padding: 18 }}>
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Tournament Name</IonLabel>
                <IonInput
                  value={name}
                  placeholder="Sunday BBX Offline Cup"
                  onIonInput={(e) => setName(String(e.detail.value || ""))}
                />
              </IonItem>
  
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Format</IonLabel>
                <IonSelect
                  value={format}
                  interface="popover"
                  onIonChange={(e) => setFormat(e.detail.value)}
                >
                  <IonSelectOption value="round_robin">
                    Round Robin Only
                  </IonSelectOption>
                  <IonSelectOption value="swiss">Swiss Only</IonSelectOption>
                  <IonSelectOption value="single_elim">
                    Single Elim Only
                  </IonSelectOption>
                  <IonSelectOption value="swiss_single_elim">
                    Swiss → Single Elim
                  </IonSelectOption>
                  <IonSelectOption value="round_robin_single_elim">
                    Round Robin → Single Elim
                  </IonSelectOption>
                </IonSelect>
              </IonItem>
  
              {isSwissFormat && (
                <IonItem className="bbx-input" lines="none">
                  <IonLabel position="stacked">Swiss Rounds</IonLabel>
                  <IonSelect
                    value={swissRounds}
                    interface="popover"
                    onIonChange={(e) => setSwissRounds(Number(e.detail.value))}
                  >
                    <IonSelectOption value={3}>3 Rounds</IonSelectOption>
                    <IonSelectOption value={4}>4 Rounds</IonSelectOption>
                    <IonSelectOption value={5}>5 Rounds</IonSelectOption>
                    <IonSelectOption value={6}>6 Rounds</IonSelectOption>
                    <IonSelectOption value={7}>7 Rounds</IonSelectOption>
                  </IonSelect>
                </IonItem>
              )}
  
              {isRoundRobinFormat && (
                <IonItem className="bbx-input" lines="none">
                  <IonLabel position="stacked">Round Robin Rounds</IonLabel>
                  <IonSelect
                    value={roundRobinRounds}
                    interface="popover"
                    onIonChange={(e) =>
                      setRoundRobinRounds(Number(e.detail.value))
                    }
                  >
                    <IonSelectOption value={1}>
                      Single Round Robin
                    </IonSelectOption>
                    <IonSelectOption value={2}>
                      Double Round Robin
                    </IonSelectOption>
                    <IonSelectOption value={3}>
                      Triple Round Robin
                    </IonSelectOption>
                  </IonSelect>
                </IonItem>
              )}
  
              {isTwoStage && (
                <IonItem className="bbx-input" lines="none">
                  <IonLabel position="stacked">Finals Cut</IonLabel>
                  <IonSelect
                    value={finalsCut}
                    interface="popover"
                    onIonChange={(e) => setFinalsCut(Number(e.detail.value))}
                  >
                    <IonSelectOption value={4}>Top 4</IonSelectOption>
                    <IonSelectOption value={8}>Top 8</IonSelectOption>
                    <IonSelectOption value={16}>Top 16</IonSelectOption>
                    <IonSelectOption value={32}>Top 32</IonSelectOption>
                  </IonSelect>
                </IonItem>
              )}
  
              <IonItem className="bbx-input" lines="none">
                <IonLabel position="stacked">Players</IonLabel>
                <IonTextarea
                  value={playersText}
                  autoGrow
                  placeholder={`Joboy\nKobe\nLouie\nJed`}
                  onIonInput={(e) => setPlayersText(String(e.detail.value || ""))}
                />
              </IonItem>
  
              <button
                className="bbx-button primary"
                style={{ width: "100%", marginTop: 14 }}
                onClick={create}
              >
                Create Offline Tournament
              </button>
            </section>
  
            <div className="bbx-section-title">
              <h2>Saved Offline</h2>
              <span>{items.length}</span>
            </div>
  
            <div className="bbx-card-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  className="bbx-tournament-card"
                  onClick={() => history.push(`/offline/${item.id}`)}
                >
                  <div>
                    <h3 className="bbx-tournament-name">{item.name}</h3>
                    <div className="bbx-tournament-meta">
                      <span className="bbx-chip">
                        {item.format.replaceAll("_", " ")}
                      </span>
                      <span className="bbx-chip">
                        {item.players.length} Players
                      </span>
                      {item.finalsCut && (
                        <span className="bbx-chip">Top {item.finalsCut}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </main>
        </IonContent>
      </IonPage>
    );
  };
  
  export default OfflineTournaments;