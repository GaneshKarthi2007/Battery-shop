import { Hash } from "lucide-react";
import { useDeveloper, formatServiceLogId } from "../../contexts/DeveloperContext";

interface Props {
    /** Tailwind accent colour family, e.g. "purple" (developer) or "blue" (admin). */
    accent?: "purple" | "blue";
}

/**
 * Editable "Service Log ID Prefix" setting card.
 * Shared by the Developer console and the Admin Settings page so both roles can set the prefix.
 */
export function ServiceLogIdPrefixSetting({ accent = "purple" }: Props) {
    const { shopConfig, updateShopConfig } = useDeveloper();
    const prefix = shopConfig.serviceLogIdPrefix ?? "";
    const iconBg = accent === "blue" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600";
    const ring = accent === "blue" ? "focus:ring-blue-500" : "focus:ring-purple-500";

    return (
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Hash className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Service Log ID Prefix</h3>
                    <p className="text-xs text-gray-500">
                        Text shown in front of the Service Log ID number on the New Service form and service screens. Leave blank for plain numbers.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="service-log-id-prefix" className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                    <input
                        id="service-log-id-prefix"
                        type="text"
                        value={prefix}
                        maxLength={10}
                        onChange={(e) => updateShopConfig({ serviceLogIdPrefix: e.target.value })}
                        className={`w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 ${ring} focus:border-transparent outline-none transition-all font-mono uppercase`}
                        placeholder="E.g., SRV-"
                    />
                </div>
                <div className="text-sm text-gray-600">
                    Preview: <span data-testid="service-log-id-prefix-preview" className="font-mono font-bold text-gray-900">{formatServiceLogId(prefix, 1)}</span>
                </div>
            </div>
        </div>
    );
}
