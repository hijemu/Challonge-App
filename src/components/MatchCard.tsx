import '../theme/bbx.css';

type Props = {
  match?: any;
  onClick?: () => void;
  onScore?: (match: any) => void;
};

const unwrap = (m: any) => m?.match || m || {};
const nameOf = (p: any, fallback: string) => p?.name || p?.display_name || p || fallback;

const MatchCard: React.FC<Props> = ({ match, onClick, onScore }) => {
  const m = unwrap(match);
  const p1 = nameOf(m.player1 || m.player1_name || m.player1_display_name, 'Player A');
  const p2 = nameOf(m.player2 || m.player2_name || m.player2_display_name, 'Player B');
  const scores = m.scores_csv || m.score || '0-0';
  const state = m.state || m.status || 'pending';

  return (
    <button className="bbx-tournament-card bbx-match-card" onClick={onClick || (() => onScore?.(m))}>
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="bbx-match-head">
          <span className="bbx-chip">Battle {m.identifier || m.round || m.id || ''}</span>
          <span className="bbx-chip"><i className="bbx-live-dot" /> {String(state).replaceAll('_', ' ')}</span>
        </div>
        <div className="bbx-versus">
          <div className="bbx-player-pill">{p1}</div>
          <div className="bbx-score">{scores}</div>
          <div className="bbx-player-pill">{p2}</div>
        </div>
      </div>
    </button>
  );
};

export default MatchCard;
