import React, { useEffect, useState } from 'react';
import GamesList from './components/GamesList';
import PlayerInput from './components/PlayerInput';
import Scoreboard from './components/Scoreboard';
import GameControls from './components/GameControls';
import PlayersPage from './components/PlayersPage';
import { computeRoundResults, scoreForPlayer } from './utils/scoring';
import {
  loadGames,
  saveGames,
  loadPlayers,
  savePlayers,
  determineWinners
} from './utils/storage';
import type { Player, RoundResult, Game, PlayerStats } from './types';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const App: React.FC = () => {
  const [games, setGames] = useState<Game[]>(() => loadGames());
  const [playersRegistry, setPlayersRegistry] = useState<PlayerStats[]>(() => loadPlayers());
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>(games[0]?.id);
  const [bids, setBids] = useState<Record<string, number>>({});
  const [tricks, setTricks] = useState<Record<string, number>>({});
  const [roundError, setRoundError] = useState<string | null>(null);
  const [page, setPage] = useState<'games' | 'players'>('games'); // new: page selection
  // allow selecting multiple existing players to add at once
  const [selectedRegistryPlayers, setSelectedRegistryPlayers] = useState<string[]>([]);
  
  // finalizeGame is idempotent: only do wins/losses once per game
  function finalizeGame(game: Game) {
    if (!game || game.completed) return;
    const winners = determineWinners(game);
    setPlayersRegistry(prev => {
      const map = Object.fromEntries(prev.map(p => [p.id, { ...p }]));
      game.players.forEach(p => {
        if (!map[p.id]) map[p.id] = { id: p.id, name: p.name, wins: 0, losses: 0, gamesPlayed: 0 };
        map[p.id].gamesPlayed += 1;
      });
      winners.forEach(wid => { map[wid].wins += 1; });
      game.players.forEach(p => { if (!winners.includes(p.id)) map[p.id].losses += 1; });
      return Object.values(map);
    });
    setGames(prev => prev.map(g => g.id === game.id ? { ...g, completed: true } : g));
  }
  
  // Add an existing registry player into the selected game by id
  function addRegistryPlayerToSelectedGame(playerId: string | undefined) {
    if (!selectedGame || !playerId) return;
    const pstats = playersRegistry.find(p => p.id === playerId);
    if (!pstats) return;
    setGames(prev => prev.map(g => {
      if (g.id !== selectedGame.id) return g;
      if (g.players.some(p => p.id === pstats.id)) return g;
      return { ...g, players: [...g.players, { id: pstats.id, name: pstats.name }] };
    }));
  }

  // add multiple existing registry players at once
  function addRegistryPlayersToSelectedGame(playerIds: string[]) {
    if (!selectedGame || !playerIds?.length) return;
    setGames(prev => prev.map(g => {
      if (g.id !== selectedGame.id) return g;
      const existingIds = new Set(g.players.map(p => p.id));
      const toAdd = playerIds
        .map(id => playersRegistry.find(r => r.id === id))
        .filter(Boolean)
        .filter(r => !existingIds.has(r!.id)) as PlayerStats[];
      if (toAdd.length === 0) return g;
      return { ...g, players: [...g.players, ...toAdd.map(t => ({ id: t.id, name: t.name }))] };
    }));
  }

  // reorder a player within a game (used before game starts)
  function movePlayerWithinGame(gameId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      const players = [...g.players];
      if (fromIndex < 0 || fromIndex >= players.length || toIndex < 0 || toIndex >= players.length) return g;
      const [moved] = players.splice(fromIndex, 1);
      players.splice(toIndex, 0, moved);
      return { ...g, players };
    }));
  }
  
  function movePlayerUp(gameId: string, index: number) {
    if (index <= 0) return;
    movePlayerWithinGame(gameId, index, index - 1);
  }
  function movePlayerDown(gameId: string, index: number) {
    movePlayerWithinGame(gameId, index, index + 1);
  }
  
  // remove player from game (allowed only before start)
  function removePlayerFromGame(gameId: string, playerId: string) {
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      return { ...g, players: g.players.filter(p => p.id !== playerId) };
    }));
  }

  useEffect(() => { saveGames(games); }, [games]);
  useEffect(() => { savePlayers(playersRegistry); }, [playersRegistry]);

  useEffect(() => {
    if (!selectedGameId && games.length) setSelectedGameId(games[0].id);
  }, [games, selectedGameId]);

  const selectedGame = games.find(g => g.id === selectedGameId);

  // registry helpers (exposed to PlayersPage)
  function addPlayerToRegistry(name: string): PlayerStats {
    const existing = playersRegistry.find(p => p.name === name);
    if (existing) return existing;
    const p: PlayerStats = { id: uid(), name, wins: 0, losses: 0, gamesPlayed: 0 };
    setPlayersRegistry(prev => [...prev, p]);
    return p;
  }

  function updatePlayerName(id: string, name: string) {
    setPlayersRegistry(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    // also update names inside games where present
    setGames(prev => prev.map(g => ({
      ...g,
      players: g.players.map(pl => pl.id === id ? { ...pl, name } : pl)
    })));
  }

  function deletePlayerFromRegistry(id: string) {
    setPlayersRegistry(prev => prev.filter(p => p.id !== id));
    // remove player from any game they are in
    setGames(prev => prev.map(g => ({ ...g, players: g.players.filter(p => p.id !== id) })));
  }

  // Game list actions
  function createNewGame() {
    const id = uid();
    const newGame: Game = {
      id,
      name: `Game ${games.length + 1}`,
      date: new Date().toISOString(),
      players: [],
      history: [],
      roundsCount: 0,
      completed: false,
      dealers: {} // initialize dealers map
    };
    setGames(prev => [newGame, ...prev]);
    setSelectedGameId(id);
    setBids({});
    setTricks({});
  }

  function deleteGame(id: string) {
    setGames(prev => prev.filter(g => g.id !== id));
    if (selectedGameId === id) setSelectedGameId(undefined);
  }

  function addPlayerToSelectedGame(name: string) {
    if (!selectedGameId) {
      // if no selected game, create one first
      createNewGame();
    }
    const targetId = selectedGameId || games[0]?.id;
    if (!targetId) return;
    const pstats = addPlayerToRegistry(name);
    setGames(prev => prev.map(g => {
      if (g.id !== targetId) return g;
      if (g.players.some(p => p.id === pstats.id)) return g;
      return { ...g, players: [...g.players, { id: pstats.id, name: pstats.name }] };
    }));
  }

  // Round inputs operate on selectedGame
  function handleBidChange(playerId: string, value: number) {
    setBids(prev => ({ ...prev, [playerId]: value }));
  }
  function handleTrickChange(playerId: string, value: number) {
    setTricks(prev => ({ ...prev, [playerId]: value }));
  }

  // set dealer for a specific round
  function setDealerForRound(gameId: string, roundNumber: number, playerId: string) {
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      const dealers = { ...(g.dealers || {}) };
      dealers[roundNumber] = playerId;
      return { ...g, dealers };
    }));
  }

  // helper: get dealer for given round (falls back to rotation if not explicitly set)
  function getDealerForRound(game: Game, roundNumber: number) {
    if (game.dealers && game.dealers[roundNumber]) return game.dealers[roundNumber];
    // default rotation: first round -> players[0], next rounds rotate
    if (game.players.length === 0) return undefined;
    const prev = game.dealers?.[roundNumber - 1];
    if (!prev) return game.players[0].id;
    const idx = game.players.findIndex(p => p.id === prev);
    if (idx === -1) return game.players[0].id;
    return game.players[(idx + 1) % game.players.length].id;
  }

  function submitRoundForSelectedGame() {
    if (!selectedGame) return;

    setRoundError(null);
    const playerCount = selectedGame.players.length;
    if (playerCount === 0) {
      setRoundError('Add players to the game before starting rounds.');
      return;
    }

    // maximum rounds based on 60-card Wizard deck (52 + 8 special) -> 60 / players
    const maxRounds = Math.floor(60 / playerCount);
    const roundNumber = selectedGame.roundsCount + 1;
    if (roundNumber > maxRounds) {
      setRoundError(`Round ${roundNumber} exceeds max rounds (${maxRounds}) for ${playerCount} players.`);
      return;
    }

    // Validate tricks: each player's tricks must be between 0 and cards-per-player (roundNumber)
    const cardsPerPlayer = roundNumber;
    const invalid = selectedGame.players.find(p => {
      const t = Number(tricks[p.id] ?? 0);
      return isNaN(t) || t < 0 || t > cardsPerPlayer;
    });
    if (invalid) {
      setRoundError(`Each player's tricks must be between 0 and ${cardsPerPlayer}.`);
      return;
    }

    // Validate total tricks sum equals number of tricks available this round (cardsPerPlayer)
    const sumTricks = selectedGame.players.reduce((s, p) => s + (Number(tricks[p.id] ?? 0)), 0);
    if (sumTricks !== cardsPerPlayer) {
      setRoundError(`Total tricks entered (${sumTricks}) must equal ${cardsPerPlayer} for round ${roundNumber}.`);
      return;
    }

    // ensure there is a dealer set for this round (use rotation default when missing)
    const dealerId = selectedGame.dealers?.[roundNumber] ?? getDealerForRound(selectedGame, roundNumber);
    if (dealerId) setDealerForRound(selectedGame.id, roundNumber, dealerId);

    // all validations passed -> compute results
    const results = computeRoundResults(roundNumber, selectedGame.players, bids, tricks);
    setGames(prev => prev.map(g => g.id === selectedGame.id ? {
      ...g,
      history: [...g.history, ...results],
      roundsCount: g.roundsCount + 1
    } : g));
    setBids({});
    setTricks({});
  }

  function endGameAndRecordWinner() {
    if (!selectedGame) return;
    // mark completed
    const winners = determineWinners(selectedGame);
    // update registry: mark wins/losses/gamesPlayed
    setPlayersRegistry(prev => {
      const map = Object.fromEntries(prev.map(p => [p.id, { ...p }]));
      // increment gamesPlayed for participants
      selectedGame.players.forEach(p => {
        if (!map[p.id]) {
          map[p.id] = { id: p.id, name: p.name, wins: 0, losses: 0, gamesPlayed: 0 };
        }
        map[p.id].gamesPlayed += 1;
      });
      winners.forEach(wid => {
        map[wid].wins += 1;
      });
      // losers = participants not in winners
      selectedGame.players.forEach(p => {
        if (!winners.includes(p.id)) map[p.id].losses += 1;
      });
      return Object.values(map);
    });
    setGames(prev => prev.map(g => g.id === selectedGame.id ? { ...g, completed: true } : g));
  }

  // helper totals for display
  const selectedTotals = selectedGame ? selectedGame.players.reduce<Record<string, number>>((acc, p) => {
    acc[p.id] = selectedGame.history.filter(h => h.playerId === p.id).reduce((s, r) => s + r.score, 0);
    return acc;
  }, {}) : {};

  // UI: simple header to switch pages
  return (
    <div>
      <header className="app-header">
        <div className="app-title">Wizard Score</div>
        <nav className="app-nav">
          <button className={page === 'games' ? 'active' : ''} onClick={() => setPage('games')}>Games</button>
          <button className={page === 'players' ? 'active' : ''} onClick={() => setPage('players')}>Players</button>
        </nav>
      </header>

      {page === 'players' ? (
        <PlayersPage
          players={playersRegistry}
          onAdd={(name) => addPlayerToRegistry(name)}
          onDelete={(id) => deletePlayerFromRegistry(id)}
          onRename={(id, name) => updatePlayerName(id, name)}
        />
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <GamesList
              games={games}
              selectedId={selectedGameId}
              onSelect={(id) => { setSelectedGameId(id); setPage('games'); }}
              onDelete={(id) => { deleteGame(id); }}
              onNew={createNewGame}
            />
          </div>

          <div style={{ flex: 1 }}>
            <h2>{selectedGame ? selectedGame.name : 'No game selected'}</h2>
            {!selectedGame && <div>Select or create a game.</div>}

            {selectedGame && (
              <>
                <div style={{ marginTop: 8 }}>
                  <h3>Players in game</h3>

                  {selectedGame.roundsCount === 0 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <PlayerInput
                          onAdd={(name) => {
                            const pstats = addPlayerToRegistry(name);
                            setGames(prev => prev.map(g => {
                              if (g.id !== selectedGame.id) return g;
                              if (g.players.some(p => p.id === pstats.id)) return g;
                              return { ...g, players: [...g.players, { id: pstats.id, name: pstats.name }] };
                            }));
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          multiple
                          value={selectedRegistryPlayers}
                          onChange={e => {
                            const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                            setSelectedRegistryPlayers(opts);
                          }}
                          style={{ padding: 6, minWidth: 200, height: 120 }}
                        >
                          {playersRegistry.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <button
                            onClick={() => {
                              addRegistryPlayersToSelectedGame(selectedRegistryPlayers);
                              setSelectedRegistryPlayers([]);
                            }}
                          >
                            Add selected
                          </button>
                          <button onClick={() => setSelectedRegistryPlayers([])}>Clear</button>
                        </div>
                      </div>

                      <div style={{ minWidth: 220 }}>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
                          Reorder players (top = first to receive dealer rotation)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {selectedGame.players.map((p, idx) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: 6, borderRadius: 6 }}>
                              <div style={{ width: 18, textAlign: 'center', color: '#666' }}>{idx + 1}</div>
                              <div style={{ flex: 1 }}>{p.name}</div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => movePlayerUp(selectedGame.id, idx)} disabled={idx === 0}>↑</button>
                                <button onClick={() => movePlayerDown(selectedGame.id, idx)} disabled={idx === selectedGame.players.length - 1}>↓</button>
                                <button onClick={() => removePlayerFromGame(selectedGame.id, p.id)}>Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* player list intentionally hidden once the game has started */}

                  {/* Dealer controls for upcoming round */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong>Dealer (Round {selectedGame.roundsCount + 1}):</strong>
                    <select
                      value={selectedGame.dealers?.[selectedGame.roundsCount + 1] ?? getDealerForRound(selectedGame, selectedGame.roundsCount + 1) ?? ''}
                      onChange={e => setDealerForRound(selectedGame.id, selectedGame.roundsCount + 1, e.target.value)}
                    >
                      {selectedGame.players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const next = getDealerForRound(selectedGame, selectedGame.roundsCount + 1);
                        if (!next) return;
                        const idx = selectedGame.players.findIndex(p => p.id === next);
                        const newIdx = (idx + 1) % Math.max(1, selectedGame.players.length);
                        setDealerForRound(selectedGame.id, selectedGame.roundsCount + 1, selectedGame.players[newIdx].id);
                      }}
                    >
                      Rotate
                    </button>
                    <button
                      onClick={() => {
                        setGames(prev => prev.map(g => g.id === selectedGame.id ? ({ ...g, dealers: (() => { const d = { ...(g.dealers || {}) }; delete d[selectedGame.roundsCount + 1]; return d; })() }) : g));
                      }}
                    >
                      Clear
                    </button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <h3>Round {selectedGame.roundsCount + 1} — Enter bids</h3>
                    {selectedGame.players.map(p => (
                      <div key={p.id} style={{ marginBottom: 6 }}>
                        <label style={{ marginRight: 8 }}>{p.name}</label>
                        <input type="number" min={0} value={bids[p.id] ?? ''} onChange={e => setBids(prev => ({ ...prev, [p.id]: Number(e.target.value) }))} style={{ width: 80, marginRight: 12 }} />
                        <span style={{ color: '#666' }}>bid</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <h3>Round {selectedGame.roundsCount + 1} — Enter tricks won</h3>
                    {selectedGame.players.map(p => (
                      <div key={p.id} style={{ marginBottom: 6 }}>
                        <label style={{ marginRight: 8 }}>{p.name}</label>
                        <input
                          type="number"
                          min={0}
                          max={selectedGame.roundsCount + 1}
                          value={tricks[p.id] ?? ''}
                          onChange={e => setTricks(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                          style={{ width: 80, marginRight: 12 }}
                        />
                        <span style={{ color: '#666' }}>tricks won</span>
                      </div>
                    ))}

                    {roundError && (
                      <div style={{ marginTop: 8, color: '#842029', background: '#fff1f2', padding: 8, borderRadius: 6 }}>
                        {roundError}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button onClick={submitRoundForSelectedGame} disabled={selectedGame.players.length === 0}>End Round / Compute Scores</button>

                    <button
                      onClick={() => {
                        if (!selectedGame) return;
                        if (selectedGame.completed) return;
                        const ok = window.confirm('Finalize this game and record wins/losses? This cannot be undone.');
                        if (!ok) return;
                        finalizeGame(selectedGame);
                      }}
                      disabled={selectedGame.completed}
                      style={{ marginLeft: 8 }}
                    >
                      {selectedGame.completed ? 'Game Finalized' : 'End Game (record result)'}
                    </button>
                  </div>

                  <section style={{ marginTop: 20 }}>
                    <h3>Scoreboard</h3>
                    <Scoreboard
                      players={selectedGame.players}
                      history={selectedGame.history}
                      roundsCount={selectedGame.roundsCount}
                      dealers={selectedGame.dealers}
                    />
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;