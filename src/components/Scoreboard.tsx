import React from 'react';
import type { Player, RoundResult } from '../types';

const formatBidActual = (r?: RoundResult) => {
  if (!r) return '';
  return `${r.bid}/${r.tricksWon}`;
};

const Scoreboard: React.FC<{
  players: Player[];
  history: RoundResult[];
  roundsCount: number;
  dealers?: Record<number, string>;
}> = ({ players, history, roundsCount, dealers = {} }) => {
  if (players.length === 0) return <div>Add players to see the scorecard.</div>;

  // Build lookup: round -> playerId -> RoundResult
  const resultsByRound: Record<number, Record<string, RoundResult | undefined>> = {};
  history.forEach(h => {
    resultsByRound[h.round] = resultsByRound[h.round] || {};
    resultsByRound[h.round][h.playerId] = h;
  });

  // Determine how many rounds to show: include future rounds (max based on deck)
  const maxRoundsBasedOnDeck = players.length > 0 ? Math.floor(60 / players.length) : 0;
  const roundsToShow = Math.max(roundsCount, maxRoundsBasedOnDeck || roundsCount);

  const rounds = Array.from({ length: roundsToShow }, (_, i) => i + 1);

  // compute cumulative totals only for completed rounds
  const cumulative: Record<number, Record<string, number>> = {};
  const prevTotals: Record<string, number> = {};
  players.forEach(p => (prevTotals[p.id] = 0));

  for (let r = 1; r <= roundsCount; r++) {
    cumulative[r] = {};
    players.forEach(p => {
      const result = resultsByRound[r]?.[p.id];
      const added = result ? result.score : 0;
      const newTotal = (prevTotals[p.id] || 0) + added;
      cumulative[r][p.id] = newTotal;
      prevTotals[p.id] = newTotal;
    });
  }

  // compute dealer rotation for all shown rounds (use provided dealers as explicit overrides)
  const computedDealer: Record<number, string | undefined> = {};
  for (let r = 1; r <= roundsToShow; r++) {
    if (dealers[r]) {
      computedDealer[r] = dealers[r];
      continue;
    }
    if (r === 1) {
      computedDealer[1] = dealers[1] ?? players[0]?.id;
      continue;
    }
    // rotate from previous computed dealer
    const prev = computedDealer[r - 1] ?? dealers[r - 1];
    if (!prev) {
      computedDealer[r] = players[0]?.id;
      continue;
    }
    const idx = players.findIndex(p => p.id === prev);
    if (idx === -1) computedDealer[r] = players[0]?.id;
    else computedDealer[r] = players[(idx + 1) % players.length]?.id;
  }

  return (
    <div className="scoreboard-card">
      <table className="score-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', paddingLeft: 12 }} aria-hidden="true">&nbsp;</th>
            {players.map(p => (
              <th key={p.id}>{p.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map(r => (
            <tr key={r}>
              <td style={{ textAlign: 'left', paddingLeft: 12 }}>R{r}</td>
              {players.map(p => {
                const roundResult = resultsByRound[r]?.[p.id];
                const total = cumulative[r]?.[p.id];
                const isDealer = computedDealer[r] === p.id;
                const hit = roundResult ? roundResult.bid === roundResult.tricksWon : undefined;
                const bidClass =
                  hit === undefined ? 'round-detail-inline' : `round-detail-inline ${hit ? 'bid-hit' : 'bid-miss'}`;

                // For future rounds (r > roundsCount) show no score, but still show dealer badge
                return (
                  <td key={p.id} className={`round-cell ${isDealer ? 'dealer' : ''}`}>
                    <div className="cell-inline" style={{ justifyContent: 'center' }}>
                      <div
                        className={`cell-total ${typeof total === 'number' ? (total > 0 ? 'pos' : total < 0 ? 'neg' : 'zero') : 'zero'}`}
                        title={r <= roundsCount ? `Cumulative total after round ${r}` : `Projected after round ${r}`}
                      >
                        {r <= roundsCount ? (total ?? 0) : ''}
                      </div>
                      <div className={bidClass} style={{ opacity: r <= roundsCount ? 1 : 0.7 }}>
                        {r <= roundsCount ? formatBidActual(roundResult) : formatBidActual(roundResult) /* empty for most future rounds */}
                      </div>
                      {isDealer && <div className="dealer-badge" title="Dealer">D</div>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Scoreboard;