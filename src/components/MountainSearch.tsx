import { useState, useRef, useEffect } from 'react';
import type { Mountain } from '../types';
import { MOUNTAINS } from '../data/mountains';

interface Props {
  label: string;
  onSelect: (mountain: Mountain) => void;
  selected: Mountain | null;
}

export function MountainSearch({ label, onSelect, selected }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? MOUNTAINS.filter((m) =>
        `${m.name}, ${m.state}`.toLowerCase().includes(query.toLowerCase())
      )
    : MOUNTAINS;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-sky-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={selected ? `${selected.name}, ${selected.state}` : 'Search mountains...'}
        className="w-full px-3 py-2 bg-sky-50 border border-sky-300 rounded-lg text-sky-900 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="absolute z-[1000] mt-1 w-full max-h-64 overflow-y-auto bg-white border border-sky-200 rounded-lg shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sky-400 text-sm">No mountains found</div>
          ) : (
            filtered.map((m) => (
              <button
                key={`${m.name}-${m.state}`}
                className="w-full text-left px-3 py-2 text-sm text-sky-900 hover:bg-sky-50 transition-colors"
                onClick={() => {
                  onSelect(m);
                  setQuery('');
                  setOpen(false);
                  inputRef.current?.blur();
                }}
              >
                <span className="font-medium">{m.name}</span>
                <span className="text-sky-500 ml-1">{m.state}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
