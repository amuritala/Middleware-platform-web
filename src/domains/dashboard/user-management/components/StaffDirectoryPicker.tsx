import { useEffect, useRef, useState } from "react";
import { getStaffDirectory } from "../../../../lib/staffDirectory";
import type { StaffMember } from "../../../../lib/types";

interface StaffDirectoryPickerProps {
  onSelect: (member: StaffMember) => void;
  /** Clearing the pick lets the admin type the name/email by hand again. */
  onClear?: () => void;
  selected?: StaffMember | null;
  disabled?: boolean;
}

function initials(member: StaffMember) {
  return `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase();
}

/**
 * The bank-staff directory field that sits above the name/email inputs: type to search,
 * pick a person, and their name and email fill in. Backed by the injectable directory
 * port - a mock today, `VITE_STAFF_DIRECTORY_URL` tomorrow.
 */
export default function StaffDirectoryPicker({
  onSelect,
  onClear,
  selected,
  disabled,
}: StaffDirectoryPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StaffMember[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [failed, setFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search - mirrors how the list will behave against the real endpoint.
  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      getStaffDirectory()
        .search(term, controller.signal)
        .then((members) => {
          setResults(members);
          setActiveIndex(members.length > 0 ? 0 : -1);
          setFailed(false);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setFailed(true);
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  // Close when clicking away.
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const choose = (member: StaffMember) => {
    onSelect(member);
    setQuery(`${member.firstName} ${member.lastName}`);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/70 to-amber-50/50 p-3.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-orange-500/20 flex-shrink-0">
          {initials(selected)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {selected.firstName} {selected.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {selected.email} · {selected.title}
          </p>
          <p className="text-[11px] text-gray-400 truncate">
            {selected.department} · Staff ID {selected.staffId}
          </p>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/80 transition-colors"
            aria-label="Clear selected staff member"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1.5" htmlFor="staff-search">
        Search staff directory
      </label>
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          id="staff-search"
          ref={inputRef}
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Type a name, staff ID or department…"
          autoComplete="off"
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm transition-shadow"
        />
        {loading && (
          <svg
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/5 animate-scale-in">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Bank staff directory
            </span>
            <span className="text-[10px] text-gray-400">{results.length} matches</span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {failed && (
              <p className="px-4 py-5 text-center text-xs text-red-500">
                The directory is unreachable right now.
              </p>
            )}

            {!failed && results.length === 0 && !loading && (
              <p className="px-4 py-5 text-center text-xs text-gray-400">
                No staff match “{query.trim()}”.
              </p>
            )}

            {!failed &&
              results.map((member, index) => (
                <button
                  key={member.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(member)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === activeIndex ? "bg-orange-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    {initials(member)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900 truncate">
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="block text-[11px] text-gray-400 truncate">
                      {member.title} · {member.department}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                    {member.staffId}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
