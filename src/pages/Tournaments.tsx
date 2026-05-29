import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
} from "@ionic/react";

import { useEffect, useState } from "react";
import { getTournaments } from "../api/challonge";

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getTournaments();

      const sorted = data.sort((a: any, b: any) => {
        return (
          new Date(b.tournament.created_at).getTime() -
          new Date(a.tournament.created_at).getTime()
        );
      });

      setTournaments(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tournaments</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading && <IonText>Loading...</IonText>}

        {!loading && tournaments.length === 0 && (
          <IonText>No tournaments found.</IonText>
        )}

        <IonList>
          {tournaments.map((item: any) => (
            <IonItem
              button
              routerLink={`/tournament/${item.tournament.id}`}
              key={item.tournament.id}
            >
              <IonLabel>
                <h2>{item.tournament.name}</h2>
                <p>{item.tournament.game_name}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tournaments;
