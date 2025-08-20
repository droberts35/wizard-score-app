import React, { useState } from 'react';
import type { PlayerStats } from '../types';
import PlayerInput from './PlayerInput';

const PlayersPage: React.FC<{
  players: PlayerStats[];
  onAdd: (name: string) => PlayerStats | void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}> = ({ players, onAdd, onDelete, onRename }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameVal, setNameVal] = useState('');

  return (
    <div style={{ padding: 12 }}>
      <h2>Players Registry</h2>
      <PlayerInput onAdd={(name) => { onAdd(name); }} />
      <div style={{ marginTop: 12, maxWidth: 520 }}>
        {players.length === 0 && <div style={{ color: '#666' }}>No players yet</div>}
        {players.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
            <div>
              {editingId === p.id ? (
                <input value={nameVal} onChange={e => setNameVal(e.target.value)} style={{ padding: 6 }} />
              ) : (
                <div style={{ fontWeight: 700 }}>{p.name}</div>
              )}
              <div style={{ fontSize: 12, color: '#666' }}>{p.wins}W · {p.losses}L · {p.gamesPlayed}G</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {editingId === p.id ? (
                <>
                  <button onClick={() => { onRename(p.id, nameVal.trim() || p.name); setEditingId(null); }}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingId(p.id); setNameVal(p.name); }}>Rename</button>
                  <button onClick={() => onDelete(p.id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayersPage;