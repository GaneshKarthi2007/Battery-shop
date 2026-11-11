import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DeveloperProvider } from "../../contexts/DeveloperContext";
import { ServiceLogIdPrefixSetting } from "./ServiceLogIdPrefixSetting";

describe("ServiceLogIdPrefixSetting", () => {
    beforeEach(() => localStorage.clear());

    it("lets the user set a prefix and shows a live preview", () => {
        render(
            <DeveloperProvider>
                <ServiceLogIdPrefixSetting />
            </DeveloperProvider>
        );

        const input = screen.getByLabelText(/^Prefix$/i);
        expect(input).toHaveValue("");
        expect(screen.getByTestId("service-log-id-prefix-preview")).toHaveTextContent("1");

        fireEvent.change(input, { target: { value: "SRV-" } });
        expect(input).toHaveValue("SRV-");
        expect(screen.getByTestId("service-log-id-prefix-preview")).toHaveTextContent("SRV-1");

        const saved = JSON.parse(localStorage.getItem("developer_shop_config") || "{}");
        expect(saved.serviceLogIdPrefix).toBe("SRV-");
    });

    it("rejects characters that are not allowed in a prefix", () => {
        render(
            <DeveloperProvider>
                <ServiceLogIdPrefixSetting />
            </DeveloperProvider>
        );
        const input = screen.getByLabelText(/^Prefix$/i);
        fireEvent.change(input, { target: { value: "S R V !" } });
        expect(input).toHaveValue("SRV");
    });
});
