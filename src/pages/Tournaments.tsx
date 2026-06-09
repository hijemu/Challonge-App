import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
} from "@ionic/react";
import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { getTournaments } from "../api/challonge";
import { useAuth } from "../context/AuthContext";
import "../theme/bbx.css";

const pickName = (user: any) =>
  user?.name || user?.username || user?.email?.split("@")[0] || "Organizer";
const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const listFromApi = (data: any) =>
  Array.isArray(data) ? data : data?.tournaments || data?.data || [];
const unwrapTournament = (item: any) => item?.tournament || item;
const getId = (item: any) =>
  String(
    unwrapTournament(item)?.id ||
      unwrapTournament(item)?.url ||
      unwrapTournament(item)?.slug ||
      ""
  );
const getTitle = (item: any) =>
  unwrapTournament(item)?.name ||
  unwrapTournament(item)?.title ||
  "Untitled tournament";
const getType = (item: any) =>
  unwrapTournament(item)?.tournament_type ||
  unwrapTournament(item)?.type ||
  "Beyblade X";
const getState = (item: any) =>
  unwrapTournament(item)?.state || unwrapTournament(item)?.status || "ready";

const Tournaments: React.FC = () => {
  const history = useHistory();
  const { user, logout }: any = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const name = pickName(user);
  const activeCount = useMemo(
    () =>
      items.filter((item) =>
        ["underway", "group_stages_underway", "pending"].includes(
          getState(item)
        )
      ).length,
    [items]
  );

  const load = async () => {
    try {
      setMessage("");
      const data = await getTournaments();
      setItems(listFromApi(data));
    } catch (err: any) {
      setMessage(
        err.response?.data?.error ||
          "Could not load tournaments. Connect your Challonge first."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doLogout = async () => {
    if (logout) await logout();
    else localStorage.removeItem("token");
    history.replace("/login");
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (ev) => {
            await load();
            ev.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <main className="bbx-page">
          <div className="bbx-topbar">
            <div>
              <span className="bbx-kicker">BBX RR </span>
              <h1 className="bbx-title">Hey, {name.split(" ")[0]}.</h1>
              <p className="bbx-subtitle">Salamat sa tiwala motherfuckers.</p>
            </div>
            <div className="bbx-avatar">{initials(name)}</div>
          </div>

          <section className="bbx-hero">
            <div className="bbx-hero-main">
              <span className="bbx-kicker">Beta Testing</span>
              <h2 className="bbx-title" style={{ fontSize: 34 }}>
                Putanginamo
              </h2>
              <p className="bbx-subtitle">
                Pasuggest ng magandang ilagay dito sa home banner.
              </p>
            </div>
            <div className="bbx-stat-grid">
              <div className="bbx-stat">
                <strong>{items.length}</strong>
                <span>Total</span>
              </div>
              <div className="bbx-stat">
                <strong>{activeCount}</strong>
                <span>Active</span>
              </div>
              <div className="bbx-stat">
                <strong>{user?.role || "Staff"}</strong>
                <span>Role</span>
              </div>
            </div>
          </section>

          <div className="bbx-action-row">
            <button
              className="bbx-button primary"
              onClick={() => history.push("/connect-challonge")}
            >
              Challonge
            </button>
            <button className="bbx-button ghost" onClick={doLogout}>
              Logout
            </button>
          </div>

          {message && (
            <IonText color="medium">
              <p>{message}</p>
            </IonText>
          )}

          <div className="bbx-section-title">
            <h2>My Tournaments</h2>
            <span>{loading ? "Loading…" : `${items.length} found`}</span>
          </div>

          <div className="bbx-card-list">
            {!loading && items.length === 0 && (
              <div className="bbx-empty">
                No tournaments yet. Connect Challonge or create one from
                Challonge first.
              </div>
            )}

            {items.map((item, index) => {
              const id = getId(item) || String(index);
              const state = getState(item);
              return (
                <button
                  key={`${id}-${index}`}
                  className="bbx-tournament-card"
                  onClick={() => history.push(`/tournaments/${id}`)}
                >
                  <div>
                    <h3 className="bbx-tournament-name">{getTitle(item)}</h3>
                    <div className="bbx-tournament-meta">
                      <span className="bbx-chip">
                        ⚔️ {getType(item).replaceAll("_", " ")}
                      </span>
                      <span className="bbx-chip">
                        <i className="bbx-live-dot" />{" "}
                        {state.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="bbx-chevron">›</div>
                </button>
              );
            })}
          </div>
        </main>

        <nav className="bbx-tabbar">
          <button
            className="active"
            onClick={() => history.push("/tournaments")}
          >
            🏆
            <br />
            Dashboard
          </button>

          <button onClick={() => history.push("/create-tournament")}>
            ➕<br />
            Create
          </button>

          <button
            className="bbx-button ghost"
            onClick={() => history.push("/offline")}
          >
            📱 Offline Mode
          </button>
        </nav>
      </IonContent>
    </IonPage>
  );
};

export default Tournaments;
