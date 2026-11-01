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

interface ReportTableProps<T extends Record<string, any>> {
  columns: ColDef<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  searchPanelFields?: SearchPanelField<T>[];
  toolbar?: ReactNode;
  emptyMessage?: string;
  rowKey?: (row: T, i: number) => string | number;
  initialShowSearchPanel?: boolean;
}

type SortDir = "asc" | "desc" | null;

export function ReportTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Search records...",
  searchFields = [],
  searchPanelFields = [],
  toolbar,
  emptyMessage = "No matching records found.",
  rowKey,
  initialShowSearchPanel = true,
}: ReportTableProps<T>) {
  const [search, setSearch] = useState("");
  const [panelFilters, setPanelFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [showSearchPanel, setShowSearchPanel] = useState(initialShowSearchPanel);

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

  const handleResetFilters = () => {
    setSearch("");
    setPanelFilters({});
  };

  const activeFiltersCount =
    (search.trim() ? 1 : 0) +
    Object.values(panelFilters).filter((v) => v && v.trim() !== "").length;

  const filtered = useMemo(() => {
    let rows = [...data];

    // Quick text search filter across specified searchFields
    if (search.trim() && searchFields.length > 0) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        searchFields.some((f) => String(row[f] ?? "").toLowerCase().includes(q))
      );
    }

    // Typed Search Panel filters
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
            : String(av).localeCompare(String(bv));
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
      {/* Table Toolbar Header matching reference UI with HIDE/SHOW SEARCH PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-[#2E3B55] bg-gray-50/70 dark:bg-[#0D1B2A]/70">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-white dark:bg-[#1B263B] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 ml-2">
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

          {/* Reference Image 2: Link toggle "HIDE SEARCH PANEL" / "SHOW SEARCH PANEL" */}
          {searchPanelFields.length > 0 && (
            <button
              onClick={() => setShowSearchPanel((prev) => !prev)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showSearchPanel ? "HIDE SEARCH PANEL" : "SHOW SEARCH PANEL"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container: Table on Left + Outlined Search Panel on Right */}
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
                      {col.render
                        ? col.render(row, i)
                        : String(row[col.key as string] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 stroke-[1.5]" />
                      <p>{emptyMessage}</p>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={handleResetFilters}
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Clear search filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Search Panel (matching Reference Image 2: media_1793533739175_71f21b54.png) */}
        {searchPanelFields.length > 0 && showSearchPanel && (
          <aside
            className="w-full lg:w-72 xl:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-[#2E3B55] bg-gray-50/40 dark:bg-[#0E1726]/60 flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2E3B55] bg-white dark:bg-[#15161E]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Search</h3>
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
                  className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
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
