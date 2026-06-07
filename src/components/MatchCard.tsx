import '../theme/bbx.css';

type Props = {
  match?: any;
  participants?: any[];
  player1Name?: string;
  player2Name?: string;
  onClick?: () => void;
  onScore?: (match: any) => void;
};

const unwrap = (m: any) => m?.match || m?.data || m || {};

const getSeedName = (participants: any[] = [], seed: number) => {
  const found = participants.find((p: any) => {
    const data = p?.participant || p;
    return Number(data.seed) === seed;
  });

  const data = found?.participant || found;
  return data?.name || `Seed ${seed}`;
};

const fallbackByIdentifier = (identifier: string, participants: any[] = []) => {
  const id = String(identifier || '').toUpperCase();

  if (id === 'A') return [getSeedName(participants, 1), getSeedName(participants, 2)];
  if (id === 'B') return [getSeedName(participants, 3), getSeedName(participants, 4)];
  if (id === 'C') return ['Winner A', 'Winner B'];
  if (id === 'D') return [getSeedName(participants, 5), getSeedName(participants, 6)];
  if (id === 'E') return [getSeedName(participants, 7), getSeedName(participants, 8)];

  return ['TBD', 'TBD'];
};

const MatchCard: React.FC<Props> = ({
  match,
  participants = [],
  player1Name,
  player2Name,
  onClick,
  onScore,
}) => {
  const m = unwrap(match);

  const [fallbackP1, fallbackP2] = fallbackByIdentifier(m.identifier, participants);

  const p1 =
    player1Name ||
    m.player1_name ||
    m.player1_display_name ||
    m.player1?.name ||
    fallbackP1;

  const p2 =
    player2Name ||
    m.player2_name ||
    m.player2_display_name ||
    m.player2?.name ||
    fallbackP2;

  const scores = m.scores_csv || m.scores || m.score || '0-0';
  const state = m.state || m.status || 'pending';

  return (
    <button
      type="button"
      className="bbx-tournament-card bbx-match-card"
      onClick={onClick || (() => onScore?.(m))}
    >
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="bbx-match-head">
          <span className="bbx-chip">Battle {m.identifier || m.round || m.id || ''}</span>
          <span className="bbx-chip">
            <i className="bbx-live-dot" /> {String(state).replaceAll('_', ' ')}
          </span>
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