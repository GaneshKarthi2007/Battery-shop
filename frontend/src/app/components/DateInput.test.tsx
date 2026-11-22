import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  DateInput,
  formatDdMmYyyy,
  parseDateToApi,
  formatDisplayDate,
} from "./DateInput";

describe("DateInput helper functions", () => {
  it("automatically inserts hyphens when typing DD-MM-YYYY", () => {
    expect(formatDdMmYyyy("2", "")).toBe("2");
    expect(formatDdMmYyyy("20", "2")).toBe("20-");
    expect(formatDdMmYyyy("20-1", "20-")).toBe("20-1");
    expect(formatDdMmYyyy("20-11", "20-1")).toBe("20-11-");
    expect(formatDdMmYyyy("20-11-2026", "20-11-202")).toBe("20-11-2026");
  });

  it("handles pasting raw digits by formatting with hyphens", () => {
    expect(formatDdMmYyyy("20112026", "")).toBe("20-11-2026");
    expect(formatDdMmYyyy("01052026", "")).toBe("01-05-2026");
  });

  it("allows smooth deletion / backspace without getting stuck on hyphens", () => {
    // Backspacing from "20-"
    expect(formatDdMmYyyy("20-", "20-1")).toBe("20");
    // Backspacing from "20-11-"
    expect(formatDdMmYyyy("20-11-", "20-11-2")).toBe("20-11");
  });

  it("converts DD-MM-YYYY to API YYYY-MM-DD", () => {
    expect(parseDateToApi("20-11-2026")).toBe("2026-11-20");
    expect(parseDateToApi("05-01-2026")).toBe("2026-01-05");
    expect(parseDateToApi("")).toBe("");
  });

  it("formats display date properly", () => {
    expect(formatDisplayDate("2026-11-20T00:00:00.000Z")).toBe("20-11-2026");
    expect(formatDisplayDate("20-11-2026")).toBe("20-11-2026");
    expect(formatDisplayDate("2026-11-20")).toBe("20-11-2026");
    expect(formatDisplayDate(null)).toBe("-");
  });
});

describe("DateInput Component", () => {
  it("renders with label, placeholder and auto-formats input", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DateInput
        id="test-date"
        label="Start Date"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText(/start date/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "DD-MM-YYYY");

    // Typing '2'
    fireEvent.change(input, { target: { value: "2" } });
    expect(handleChange).toHaveBeenCalledWith("2");

    // Typing '20' (simulates user entering second digit of day)
    fireEvent.change(input, { target: { value: "20" } });
    expect(handleChange).toHaveBeenCalledWith("20-");
  });
});
