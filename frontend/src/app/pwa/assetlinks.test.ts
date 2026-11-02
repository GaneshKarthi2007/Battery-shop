import { readFileSync } from "fs";
import path from "path";

// The Android TWA (APK) only hides the browser URL bar when Chrome can verify
// Digital Asset Links. If this file is not valid JSON (e.g. a committed merge
// conflict), verification fails and the app shows the URL bar.
const ASSETLINKS_PATH = path.resolve(__dirname, "../../../public/.well-known/assetlinks.json");

describe("public/.well-known/assetlinks.json", () => {
    const raw = readFileSync(ASSETLINKS_PATH, "utf8");

    it("contains no merge-conflict markers", () => {
        expect(raw).not.toMatch(/^(<{7}|={7}|>{7})/m);
    });

    it("is valid JSON describing the Android app with a SHA-256 fingerprint", () => {
        const links = JSON.parse(raw);
        expect(Array.isArray(links)).toBe(true);

        const app = links.find(
            (l: { target?: { namespace?: string } }) => l.target?.namespace === "android_app",
        );
        expect(app).toBeDefined();
        expect(app.relation).toContain("delegate_permission/common.handle_all_urls");
        expect(app.target.package_name).toBe("com.auralendr.battery");
        expect(app.target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
        for (const fp of app.target.sha256_cert_fingerprints) {
            expect(fp).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
        }
    });
});
