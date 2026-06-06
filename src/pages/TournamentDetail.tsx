import { IonContent, IonPage, IonText } from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { getMatches, getParticipants, getStandings, getTournament } from '../api/challonge';
import MatchCard from '../components/MatchCard';
import '../theme/bbx.css';

const unwrapTournament = (data: any) => data?.tournament || data?.data?.tournament || data?.data || data || {};
const listFrom = (data: any, key: string) => Array.isArray(data) ? data : data?.[key] || data?.data || [];

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [tab, setTab] = useState<'matches' | 'players' | 'standings'>('matches');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [t, m, p, s] = await Promise.all([
          getTournament(id),
          getMatches(id),
          getParticipants(id),
          getStandings(id).catch(() => []),
        ]);
        setTournament(unwrapTournament(t));
        setMatches(listFrom(m, 'matches'));
        setParticipants(listFrom(p, 'participants'));
        setStandings(listFrom(s, 'standings'));
      } catch (err: any) {
        setMessage(err.response?.data?.error || 'Could not load tournament.');
      }
    };
    load();
  }, [id]);

  const title = tournament?.name || tournament?.title || 'Tournament';
  const state = tournament?.state || 'ready';
  const type = tournament?.tournament_type || tournament?.type || 'Beyblade X';
  const currentList = useMemo(() => ({ matches, players: participants, standings })[tab], [tab, matches, participants, standings]);

  return (
    <IonPage>
      <IonContent fullscreen>
        <main className="bbx-page">
          <div className="bbx-back-row">
            <button className="bbx-back-button" onClick={() => history.push('/tournaments')}>← Tournaments</button>
          </div>

          <section className="bbx-hero">
            <div className="bbx-hero-main">
              <span className="bbx-kicker">Battle room</span>
              <h1 className="bbx-title" style={{ fontSize: 36 }}>{title}</h1>
              <p className="bbx-subtitle">{String(type).replaceAll('_', ' ')} · {String(state).replaceAll('_', ' ')}</p>
            </div>
            <div className="bbx-stat-grid">
              <div className="bbx-stat"><strong>{matches.length}</strong><span>Matches</span></div>
              <div className="bbx-stat"><strong>{participants.length}</strong><span>Players</span></div>
              <div className="bbx-stat"><strong>{standings.length}</strong><span>Ranks</span></div>
            </div>
          </section>

          {message && <IonText color="medium"><p>{message}</p></IonText>}

          <div className="bbx-tabbar" style={{ position: 'static', width: 'auto', transform: 'none', margin: '0 0 18px' }}>
            <button className={tab === 'matches' ? 'active' : ''} onClick={() => setTab('matches')}>⚔️<br />Matches</button>
            <button className={tab === 'players' ? 'active' : ''} onClick={() => setTab('players')}>👥<br />Players</button>
            <button className={tab === 'standings' ? 'active' : ''} onClick={() => setTab('standings')}>📊<br />Ranks</button>
          </div>

          <div className="bbx-card-list">
            {tab === 'matches' && matches.map((match, index) => <MatchCard key={match?.match?.id || match?.id || index} match={match} />)}

            {tab !== 'matches' && currentList.map((item: any, index: number) => {
              const data = item?.participant || item?.standing || item;
              return (
                <div key={data?.id || index} className="bbx-tournament-card">
                  <div>
                    <h3 className="bbx-tournament-name">{data?.name || data?.display_name || data?.username || `Entry ${index + 1}`}</h3>
                    <div className="bbx-tournament-meta">
                      <span className="bbx-chip">#{data?.rank || data?.seed || index + 1}</span>
                      {data?.final_rank && <span className="bbx-chip">Final rank {data.final_rank}</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {!currentList.length && <div className="bbx-empty">Nothing here yet.</div>}
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default TournamentDetail;
