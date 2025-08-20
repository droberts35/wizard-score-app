export function calculateScore(playerCards: number[], trumpSuit: string): number {
    let score = 0;
    const trumpPoints = 2; // Example points for trump cards
    const nonTrumpPoints = 1; // Example points for non-trump cards

    playerCards.forEach(card => {
        if (isTrumpCard(card, trumpSuit)) {
            score += trumpPoints;
        } else {
            score += nonTrumpPoints;
        }
    });

    return score;
}

export function resetScores(numPlayers: number): number[] {
    return Array(numPlayers).fill(0);
}

function isTrumpCard(card: number, trumpSuit: string): boolean {
    // Implement logic to determine if the card is a trump card based on its value and suit
    // This is a placeholder implementation
    return card % 2 === 0; // Example condition for trump card
}

/**
 * Score calculation (common variant):
 * - If player wins exactly their bid: 20 + 10 * tricksWon
 * - If player misses: -10 * abs(bid - tricksWon)
 */
export function scoreForPlayer(bid: number, tricksWon: number): number {
  if (bid === tricksWon) return 20 + 10 * tricksWon;
  return -10 * Math.abs(bid - tricksWon);
}

export function computeRoundResults(
  roundNumber: number,
  players: { id: string }[],
  bids: Record<string, number>,
  tricks: Record<string, number>
) {
  return players.map(p => {
    const bid = bids[p.id] ?? 0;
    const won = tricks[p.id] ?? 0;
    const score = scoreForPlayer(bid, won);
    return {
      round: roundNumber,
      playerId: p.id,
      bid,
      tricksWon: won,
      score
    };
  });
}