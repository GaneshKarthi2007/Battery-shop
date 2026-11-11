import { useState, useMemo, ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Calendar,
  X,
  Filter,
  RotateCcw,
  Wallet,
  CreditCard,
  Receipt,
  RefreshCw,
  Wrench,
  CheckCircle2,
  Clock,
  Tag,
  Sparkles,
} from "lucide-react";
import { CircleLoader } from "../../components/ui/CircleLoader";

export interface ColDef<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T, i: number) => ReactNode;
  className?: string;
}

export interface SearchPanelField<T> {
  key: keyof T | string;
  label: string;
  type?: "text" | "date" | "number" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface QuickFilterChip {
  id?: string;
  key: string;
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ReportTableProps<T extends Record<string, any>> {
  columns: ColDef<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T | string)[];
  searchPanelFields?: SearchPanelField<T>[];
  quickFilterChips?: QuickFilterChip[];
  toolbar?: ReactNode;
  emptyMessage?: string;
  rowKey?: (row: T, i: number) => string | number;
  initialShowSearchPanel?: boolean;
}

type SortDir = "asc" | "desc" | null;

// Helper to pick a contextual WhatsApp-style icon for filter chips
function getChipIcon(label: string, value: string) {
  const text = `${label} ${value}`.toLowerCase();
  if (text.includes("cash")) return Wallet;
  if (text.includes("upi") || text.includes("card") || text.includes("credit")) return CreditCard;
  if (text.includes("sale") || text.includes("bill")) return Receipt;
  if (text.includes("exchange")) return RefreshCw;
  if (text.includes("service")) return Wrench;
  if (text.includes("settled") || text.includes("completed")) return CheckCircle2;
  if (text.includes("pending") || text.includes("clock")) return Clock;
  if (text.includes("journal")) return Tag;
  return Sparkles;
}

export function ReportTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Search records...",
  searchFields = [],
  searchPanelFields = [],
  quickFilterChips,
  toolbar,
  emptyMessage = "No matching records found.",
  rowKey,
  initialShowSearchPanel = true,
}: ReportTableProps<T>) {
  const [search, setSearch] = useState("");
  const [panelFilters, setPanelFilters] = useState<Record<string, string>>({});
  const [activeChip, setActiveChip] = useState<{ key: string; value: string } | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [showSearchPanel, setShowSearchPanel] = useState(initialShowSearchPanel);

  // Automatically derive WhatsApp-style search filter chips from searchPanelFields or props
  const filterChips = useMemo<QuickFilterChip[]>(() => {
    if (quickFilterChips && quickFilterChips.length > 0) {
      return quickFilterChips;
    }

    const derived: QuickFilterChip[] = [];
    const seen = new Set<string>();

    searchPanelFields.forEach((field) => {
      if (field.type === "select" && field.options) {
        field.options.forEach((opt) => {
          // Skip empty placeholder option like "-Select-"
          if (!opt.value || opt.value.trim() === "" || opt.label.includes("-Select")) return;
          const chipKey = `${String(field.key)}:${opt.value}`;
          if (!seen.has(chipKey)) {
            seen.add(chipKey);
            derived.push({
              key: String(field.key),
              value: opt.value,
              label: opt.label,
              icon: getChipIcon(opt.label, opt.value),
            });
          }
        });
      }
    });

    return derived;
  }, [quickFilterChips, searchPanelFields]);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setPanelFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleChipClick = (chip: { key: string; value: string }) => {
    if (chip.key === "_all") {
      setActiveChip(null);
      setPanelFilters({});
      return;
    }

    // Toggle chip: if already active, turn it off
    if (activeChip && activeChip.key === chip.key && activeChip.value === chip.value) {
      setActiveChip(null);
      setPanelFilters((prev) => {
        const next = { ...prev };
        delete next[chip.key];
        return next;
      });
    } else {
      setActiveChip({ key: chip.key, value: chip.value });
      setPanelFilters((prev) => ({
        ...prev,
        [chip.key]: chip.value,
      }));
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setActiveChip(null);
    setPanelFilters({});
  };

  const activeFiltersCount =
    (search.trim() ? 1 : 0) +
    Object.values(panelFilters).filter((v) => v && v.trim() !== "").length;

  const filtered = useMemo(() => {
    let rows = [...data];

    // WhatsApp-Style Universal Live Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      rows = rows.filter((row) => {
        // First check specified searchFields
        if (searchFields.length > 0) {
          const matched = searchFields.some((f) => {
            const val = row[f as string];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
          });
          if (matched) return true;
        }

        // Also check all common record fields (universal search like WhatsApp)
        return Object.values(row).some((val) => {
          if (val === undefined || val === null || typeof val === "object") return false;
          // Format date or numbers for comparison
          if (String(val).toLowerCase().includes(q)) return true;
          if (typeof val === "number" && !isNaN(parseFloat(q)) && Math.abs(val - parseFloat(q)) < 0.01) {
            return true;
          }
          return false;
        });
      });
    }

    // Typed Search Panel and Chip filters
    for (const [key, filterVal] of Object.entries(panelFilters)) {
      if (!filterVal || filterVal.trim() === "") continue;
      const targetVal = filterVal.trim().toLowerCase();

      rows = rows.filter((row) => {
        const rowVal = row[key];
        if (rowVal === undefined || rowVal === null) return false;

        // Date matching (supports ISO 2026-03-10 or localized strings)
        if (key.toLowerCase().includes("date")) {
          const rawDateStr = String(rowVal);
          if (rawDateStr.startsWith(targetVal)) return true;
          try {
            const d = new Date(rawDateStr);
            if (!isNaN(d.getTime())) {
              const iso = d.toISOString().split("T")[0];
              if (iso === targetVal || iso.includes(targetVal)) return true;
              const formatted = d.toLocaleDateString("en-IN");
              if (formatted.includes(targetVal)) return true;
            }
          } catch {
            // fallback
          }
          return rawDateStr.toLowerCase().includes(targetVal);
        }

        // Standard string/number substring or select match
        return String(rowVal).toLowerCase().includes(targetVal);
      });
    }

    // Column sorting
    if (sortKey && sortDir) {
      rows.sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, search, searchFields, panelFilters, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: ColDef<T> }) => {
    if (!col.sortable) return null;
    const k = col.key as string;
    if (sortKey !== k)
      return (
        <ChevronsUpDown className="w-3.5 h-3.5 ml-1 text-gray-400 group-hover:text-blue-500" />
      );
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 text-blue-600 dark:text-blue-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className="flex flex-col bg-white dark:bg-[#15161E] rounded-2xl border border-gray-200 dark:border-[#2E3B55] shadow-sm overflow-hidden">
      {/* Table Toolbar Header with WhatsApp-style search input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-[#2E3B55] bg-gray-50/70 dark:bg-[#0D1B2A]/70">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9.5 pr-8 py-2 text-xs font-medium bg-white dark:bg-[#1B263B] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 ml-2 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                {activeFiltersCount} active filter{activeFiltersCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end shrink-0">
          {toolbar}

          {/* Desktop-only Link toggle "HIDE SEARCH PANEL" / "SHOW SEARCH PANEL" (Hidden on mobile responsive) */}
          {searchPanelFields.length > 0 && (
            <button
              onClick={() => setShowSearchPanel((prev) => !prev)}
              className="hidden lg:flex text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-wider transition-colors items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showSearchPanel ? "HIDE SEARCH PANEL" : "SHOW SEARCH PANEL"}</span>
            </button>
          )}
        </div>
      </div>

      {/* WhatsApp Search Module: Horizontal Scrolling Search Category Filter Chips */}
      {filterChips.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-2 px-4 sm:px-5 border-b border-gray-100 dark:border-[#2E3B55] bg-white/60 dark:bg-[#15161E]/60 select-none">
          {/* "All" reset chip */}
          <button
            type="button"
            onClick={() => handleChipClick({ key: "_all", value: "_all" })}
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-tight transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
              activeChip === null
                ? "bg-blue-600 dark:bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-gray-100/80 dark:bg-[#1B263B] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200/70 dark:hover:bg-gray-700"
            }`}
          >
            <span>All</span>
          </button>

          {/* Contextual WhatsApp-style module filter chips */}
          {filterChips.map((chip) => {
            const isChipActive =
              activeChip?.key === chip.key && activeChip?.value === chip.value;
            const Icon = chip.icon || Tag;

            return (
              <button
                key={`${chip.key}-${chip.value}`}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-tight transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                  isChipActive
                    ? "bg-blue-600 dark:bg-blue-600 text-white border-blue-600 shadow-xs font-bold scale-[1.02]"
                    : "bg-white dark:bg-[#1B263B] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className={`w-3 h-3 ${isChipActive ? "text-white" : "text-gray-400"}`} />
                <span>{chip.label}</span>
                {isChipActive && (
                  <X className="w-3 h-3 ml-0.5 text-white/90 hover:text-white" />
                )}
              </button>
            );
          })}

          {/* Quick Clear All button if active filters exist */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto text-[11px] font-bold text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0 flex items-center gap-1 pl-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      )}

      {/* Main Container: Table on Left + Desktop Outlined Search Panel on Right */}
      <div className="flex flex-col lg:flex-row relative">
        {/* Table Content Area */}
        <div className="flex-1 min-w-0 overflow-x-auto relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-[#070A13]/70 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <CircleLoader size="md" text="Loading records..." />
            </div>
          )}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-gray-50/95 dark:bg-[#0D1B2A]/95 backdrop-blur-sm border-b border-gray-200 dark:border-[#2E3B55]">
                <th className="w-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center border-r border-gray-150 dark:border-[#2E3B55]/50">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key as string}
                    onClick={() => col.sortable && handleSort(col.key as string)}
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 border-r border-gray-150 dark:border-[#2E3B55]/50 last:border-r-0 whitespace-nowrap group ${
                      col.sortable
                        ? "cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400"
                        : ""
                    } ${col.className ?? ""}`}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1B263B]">
              {filtered.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 border-r border-gray-150 dark:border-[#2E3B55]/40 text-center font-medium tabular-nums">
                    {i + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key as string}
                      className={`px-4 py-3 text-gray-800 dark:text-gray-200 border-r border-gray-150 dark:border-[#2E3B55]/40 last:border-r-0 ${
                        col.className ?? ""
                      }`}
                    >
                      {col.render ? (
                        col.render(row, i)
                      ) : (
                        <span>{String(row[col.key as string] ?? "-")}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-6 py-14 text-center text-gray-400 dark:text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 stroke-[1.5]" />
                      <p className="text-sm font-semibold">{emptyMessage}</p>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Clear search and filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop-only Search Panel (Hidden on mobile responsive as requested) */}
        {showSearchPanel && searchPanelFields.length > 0 && (
          <aside className="hidden lg:flex flex-col w-72 border-l border-gray-200 dark:border-[#2E3B55] bg-gray-50/50 dark:bg-[#0D1B2A]/50 shrink-0 animate-in fade-in-50 duration-200">
            {/* Header of Search Panel */}
            <div className="p-4 border-b border-gray-200 dark:border-[#2E3B55] bg-white dark:bg-[#15161E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Search</h3>
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                    title="Reset all search filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSearchPanel(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                  title="Close search panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Outlined Floating Label Fields List */}
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {searchPanelFields.map((field) => {
                const currentVal = panelFilters[field.key as string] || "";

                return (
                  <div
                    key={field.key as string}
                    className="relative border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#0D1B2A] px-2.5 pt-2 pb-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all shadow-2xs"
                  >
                    {/* Floating Label sitting on outline */}
                    <label className="absolute -top-2 left-2 px-1 bg-white dark:bg-[#0D1B2A] text-[10px] font-bold text-gray-500 dark:text-gray-400 select-none">
                      {field.label}
                    </label>

                    {field.type === "select" ? (
                      <div className="relative flex items-center">
                        <select
                          value={currentVal}
                          onChange={(e) =>
                            handleFieldChange(field.key as string, e.target.value)
                          }
                          className="w-full bg-transparent text-xs text-gray-800 dark:text-white outline-none cursor-pointer appearance-none pr-5 py-0.5"
                        >
                          <option value="" className="dark:bg-[#0D1B2A] dark:text-gray-400">
                            -Select {field.label}-
                          </option>
                          {field.options?.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              className="dark:bg-[#0D1B2A] dark:text-white"
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <input
                          type={
                            field.type === "date"
                              ? "date"
                              : field.type === "number"
                              ? "number"
                              : "text"
                          }
                          value={currentVal}
                          onChange={(e) =>
                            handleFieldChange(field.key as string, e.target.value)
                          }
                          placeholder={field.placeholder || ""}
                          className="w-full bg-transparent text-xs text-gray-800 dark:text-white outline-none pr-2 py-0.5 placeholder:text-gray-300 dark:placeholder:text-gray-600 font-medium"
                        />
                        {field.type === "date" ? (
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0 pointer-events-none" />
                        ) : (
                          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 pointer-events-none" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Filter Info footer */}
            <div className="p-3 border-t border-gray-200 dark:border-[#2E3B55] bg-white dark:bg-[#15161E] text-center text-[11px] text-gray-400">
              Filters table data instantly by typed values
            </div>
          </aside>
        )}
      </div>

      {/* Footer count & info */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-[#2E3B55] text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-50/60 dark:bg-[#0D1B2A]/60 flex items-center justify-between">
        <div>
          Showing <span className="font-bold text-gray-900 dark:text-gray-100">{filtered.length}</span> of{" "}
          <span className="font-bold text-gray-900 dark:text-gray-100">{data.length}</span> records
          {activeFiltersCount > 0 && (
            <span className="italic ml-1"> ({activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} applied)</span>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="text-[11px] text-gray-400 dark:text-gray-500">
            Click on column headers to sort
          </div>
        )}
      </div>
    </div>
  );
}
