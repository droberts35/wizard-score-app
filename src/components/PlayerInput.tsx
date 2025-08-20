import React, { useState } from 'react';

const PlayerInput: React.FC<{
  onAdd: (name: string) => void;
}> = ({ onAdd }) => {
  const [name, setName] = useState('');
  return (
    <div style={{ marginBottom: 12 }}>
      <input
        placeholder="Player name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ padding: 6, marginRight: 8 }}
      />
      <button
        onClick={() => {
          if (!name.trim()) return;
          onAdd(name.trim());
          setName('');
        }}
      >
        Add player
      </button>
    </div>
  );
};

export default PlayerInput;