import { FiSearch, FiX } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search songs...",
}) {
  const [local, setLocal] = useState(value || "");
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(v);
    }, 200);
  };

  const handleClear = () => {
    setLocal("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <FiSearch
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-overlay pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 bg-surface text-text placeholder:text-overlay rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue/30 transition-all"
      />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-surface-hover text-overlay"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}
