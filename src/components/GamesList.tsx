import React from 'react';
import type { Game } from '../types';

const GamesList: React.FC<{
  games: Game[];
  selectedId?: string;
  onSelect: (id?: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}> = ({ games, selectedId, onSelect, onDelete, onNew }) => {
  return (
    <div style={{ width: 280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Games</h3>
        <button onClick={onNew}>New</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
        {games.length === 0 && <li style={{ color: '#666' }}>No games yet</li>}
        {games.map(g => (
          <li key={g.id} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: selectedId === g.id ? '#eef3ff' : '#fff',
                padding: 8,
                borderRadius: 6,
                cursor: 'pointer'
              }}
              onClick={() => onSelect(g.id)}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(g.date).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}>Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GamesList;