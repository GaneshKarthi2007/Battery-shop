import React, { useRef } from "react";
import { Calendar } from "lucide-react";

export interface DateInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Automatically inserts "-" between DD, MM, and YYYY as the user types digits.
 * Gracefully handles backspace/deletion without getting stuck on hyphens.
 */
export function formatDdMmYyyy(input: string, prevValue: string = ""): string {
  // If user is deleting / backspacing:
  if (input.length < prevValue.length) {
    if (input.endsWith("-")) {
      return input.slice(0, -1);
    }
    return input;
  }

  // Extract up to 8 digits
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";
  if (digits.length < 2) return digits;
  if (digits.length === 2) return `${digits}-`;
  if (digits.length < 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (digits.length === 4) return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
}

/**
 * Converts DD-MM-YYYY to YYYY-MM-DD for standard API queries.
 */
export function parseDateToApi(dmy: string): string {
  if (!dmy) return "";
  const parts = dmy.split("-");
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dmy;
}

/**
 * Ensures a date is displayed in DD-MM-YYYY format.
 */
export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export function DateInput({
  id,
  label,
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  className = "",
  disabled = false,
}: DateInputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = formatDdMmYyyy(e.target.value, value);
    onChange(nextVal);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value; // YYYY-MM-DD from native date picker
    if (raw) {
      const parts = raw.split("-");
      if (parts.length === 3) {
        onChange(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
  };

  const openPicker = () => {
    if (pickerRef.current) {
      if (typeof pickerRef.current.showPicker === "function") {
        pickerRef.current.showPicker();
      } else {
        pickerRef.current.click();
      }
    }
  };

  // Convert current DD-MM-YYYY to YYYY-MM-DD for native picker
  const pickerValue = parseDateToApi(value);

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          maxLength={10}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-9 text-xs font-semibold bg-gray-50 dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-gray-900 dark:text-white transition-all font-mono ${className}`}
        />
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          tabIndex={-1}
          aria-label="Open calendar"
          className="absolute right-2.5 p-1 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          title="Open Calendar Picker"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
        <input
          ref={pickerRef}
          type="date"
          value={pickerValue}
          onChange={handlePickerChange}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
      </div>
    </div>
  );
}
