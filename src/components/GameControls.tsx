import React from 'react';

const GameControls: React.FC<{
  startNewGame: () => void;
  resetScores: () => void;
  submitScores?: () => void;
}> = ({ startNewGame, resetScores, submitScores }) => {
  return (
    <div>
      <button onClick={startNewGame}>New Game</button>
      <button onClick={resetScores}>Reset Scores</button>
      {submitScores && <button onClick={submitScores}>Submit Scores</button>}
    </div>
  );
};

export default GameControls;