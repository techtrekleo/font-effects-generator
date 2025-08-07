import React from 'react';

export const ColorInput: React.FC<{label: string, value: string, onChange: (color: string) => void}> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between bg-gray-700/60 p-2 rounded-lg">
      <label htmlFor={`color-${label}`} className="text-gray-300 font-medium text-sm">{label}</label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-gray-400 text-sm tracking-wider">{value.toUpperCase()}</span>
        <input
          id={`color-${label}`}
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent"
          style={{ 'WebkitAppearance': 'none', 'MozAppearance': 'none', 'appearance': 'none' } as React.CSSProperties}
        />
      </div>
    </div>
  );
