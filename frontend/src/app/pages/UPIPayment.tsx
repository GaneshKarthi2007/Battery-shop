import { useLocation, useNavigate } from "react-router";
import {
    ArrowLeft, CheckCircle, Copy, Smartphone,
    AlertTriangle, Loader2, ShieldCheck, FileText
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "../api/client";

const UPI_ID = "errorkiller001@oksbi";
const SHOP_NAME = "PowerCell Pro";
const POLL_MS = 3000;

type PaymentStatus =
    | "idle"        // initialising
    | "waiting"     // QR shown, polling active — NO button yet
    | "received"    // payment confirmed — show Generate Invoice button
    | "finalising"  // posting sale to backend
    | "done"        // success, navigating
    | "error";      // something failed

export function UPIPayment() {
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state as {
        amount: number;
        saleData: any;
        invoiceState: any;
        customerName: string;
        itemCount: number;
    } | undefined;

    const amount = state?.amount ?? 0;

    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(SHOP_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Battery Shop Payment")}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&ecc=M&data=${encodeURIComponent(upiUrl)}`;

    const [copied, setCopied] = useState(false);
    const [status, setStatus] = useState<PaymentStatus>("idle");
    const [error, setError] = useState("");
    const [dot, setDot] = useState(0);         // animated dots
    const [countdown, setCountdown] = useState<number | null>(null);
    const [upiPaymentId, setUpiPaymentId] = useState<number | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const initialized = useRef(false);

    useEffect(() => { if (!state) navigate("/checkout"); }, [state, navigate]);

    // Animated waiting dots
    useEffect(() => {
        if (status === "waiting") {
            const t = setInterval(() => setDot(d => (d + 1) % 4), 500);
            return () => clearInterval(t);
        }
    }, [status]);

    // ── Create pending payment record on mount ──────────────────────────
    const initPayment = useCallback(async () => {
        if (!state || initialized.current) return null;
        initialized.current = true;
        try {
            const rec = await apiClient.post<{ id: number }>("/upi-payments", {
                amount,
                sale_data: state.saleData,
                invoice_state: state.invoiceState,
            });
            setUpiPaymentId(rec.id);
            setStatus("waiting");
            return rec.id;
        } catch (e: any) {
            setError(e.message || "Could not initialise payment record.");
            setStatus("error");
            return null;
        }
    }, [state, amount]);

    // ── Poll every 3 s; when backend says received → mark locally ───────
    const startPolling = useCallback((id: number) => {
        if (pollRef.current) return;
        pollRef.current = setInterval(async () => {
            try {
                const res = await apiClient.get<{ status: string }>(`/upi-payments/${id}/status`);
                if (res.status === "received") {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                    // Show the Generate Invoice button
                    setStatus("received");
                }
            } catch { /* silent */ }
        }, POLL_MS);
    }, []);

    // ── Finalise: create sale in DB then go to invoice ───────────────────
    const finalisePayment = useCallback(async (id: number) => {
        setStatus("finalising");
        setError("");
        try {
            await apiClient.post(`/upi-payments/${id}/finalise`, {});
            setStatus("done");
            setTimeout(() => {
                navigate("/invoice", {
                    state: { ...(state?.invoiceState ?? {}), paymentMethod: "UPI" },
                });
            }, 1200);
        } catch (e: any) {
            setError(e.message || "Failed to record sale. Please try again.");
            setStatus("received"); // allow retry
        }
    }, [navigate, state]);

    // ── visibilitychange: user returns from UPI app → auto-confirm ───────
    useEffect(() => {
        const onVisible = async () => {
            if (document.visibilityState !== "visible") return;
            if (status !== "waiting" || !upiPaymentId) return;

            // 5-second countdown then auto-confirm
            let sec = 5;
            setCountdown(sec);
            const tick = setInterval(() => {
                sec -= 1;
                setCountdown(sec);
                if (sec <= 0) {
                    clearInterval(tick);
                    setCountdown(null);
                    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                    // Mark payment received in backend then show Generate Invoice button
                    apiClient.post(`/upi-payments/${upiPaymentId}/confirm`, {})
                        .then(() => setStatus("received"))
                        .catch(() => setStatus("received")); // show button even if confirm fails
                }
            }, 1000);
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [status, upiPaymentId]);

    // Init + start polling on mount
    useEffect(() => {
        initPayment().then(id => { if (id) startPolling(id); });
        return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2500); }
        catch { /* silent */ }
    };

    if (!state) return null;

    /* ──────────────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Fixed header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    disabled={status === "finalising" || status === "done"}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">UPI Payment</h1>
                {/* Live indicator dot */}
                <div className={`w-3 h-3 rounded-full mr-2 transition-colors ${status === "done" ? "bg-green-500" :
                        status === "received" ? "bg-green-400 animate-pulse" :
                            status === "finalising" ? "bg-amber-400 animate-pulse" :
                                status === "waiting" ? "bg-blue-400 animate-pulse" : "bg-gray-300"
                    }`} />
            </header>

            <main className="flex-1 pt-20 pb-12 px-4 max-w-md mx-auto w-full space-y-5">

                {/* ── DONE / Finalising ───────────────────────────────────── */}
                {(status === "done" || status === "finalising") && (
                    <div className="bg-green-50 border border-green-200 rounded-3xl p-10 flex flex-col items-center gap-4 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-10 h-10 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-green-800">Payment Confirmed!</p>
                            <p className="text-sm text-green-600 mt-1">
                                ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} received
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 mt-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Generating invoice…</span>
                        </div>
                    </div>
                )}

                {/* ── WAITING + RECEIVED: show QR ─────────────────────────── */}
                {(status === "waiting" || status === "received" || status === "error") && (
                    <>
                        {/* Amount banner */}
                        <div className="bg-gradient-to-br from-[#2E6DFF] to-[#1A4FCC] rounded-3xl p-6 text-white text-center shadow-xl shadow-[#2E6DFF]/30">
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Amount to Pay</p>
                            <p className="text-5xl font-black tracking-tighter">
                                ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-blue-200 text-sm mt-2 font-medium">
                                {state.customerName} · {state.itemCount} item{(state.itemCount ?? 1) !== 1 ? "s" : ""}
                            </p>
                        </div>

                        {/* Status bar */}
                        {status === "waiting" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                                <Loader2 className="w-5 h-5 text-[#2E6DFF] animate-spin shrink-0" />
                                <p className="text-sm font-bold text-blue-800">
                                    {countdown !== null
                                        ? `Payment detected — verifying in ${countdown}s…`
                                        : `Waiting for payment${".".repeat(dot)}`
                                    }
                                </p>
                                <span className="ml-auto text-[10px] text-blue-400 font-bold uppercase tracking-wider">LIVE</span>
                            </div>
                        )}

                        {/* Payment received banner */}
                        {status === "received" && (
                            <div className="bg-green-50 border border-green-300 rounded-2xl px-4 py-3 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                <p className="text-sm font-bold text-green-800">Payment received! Tap below to generate invoice.</p>
                            </div>
                        )}

                        {/* QR Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-5">
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-[#2E6DFF]" />
                                <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Scan &amp; Pay via UPI</p>
                            </div>

                            <div className="relative">
                                <div className="p-3 bg-white rounded-2xl border-2 border-[#2E6DFF]/10 shadow-inner">
                                    <img
                                        src={qrUrl}
                                        alt={`UPI QR — ₹${amount.toFixed(2)} to ${UPI_ID}`}
                                        width={220} height={220}
                                        className="rounded-lg"
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.replaceWith(Object.assign(document.createElement("div"), {
                                                className: "w-[220px] h-[220px] flex items-center justify-center bg-gray-50 rounded-lg",
                                                innerHTML: `<p class='text-xs text-gray-400 text-center px-6 font-medium'>QR unavailable — use UPI ID or Open App below</p>`,
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border-2 border-[#2E6DFF]/20 rounded-full px-3 py-1 shadow-sm">
                                    <span className="text-[11px] font-black text-[#2E6DFF] tracking-tight">UPI</span>
                                </div>
                            </div>

                            {/* UPI ID */}
                            <div className="w-full mt-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">UPI ID</p>
                                <button
                                    onClick={handleCopy}
                                    className="w-full flex items-center justify-between bg-[#F8FAFF] rounded-xl px-4 py-3 border border-[#2E6DFF]/10 hover:bg-[#EEF3FF] transition-colors"
                                >
                                    <span className="font-bold text-slate-900 text-sm tracking-wide">{UPI_ID}</span>
                                    <div className="flex items-center gap-1.5">
                                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-[#2E6DFF]" />}
                                        <span className={`text-xs font-bold ${copied ? "text-green-500" : "text-[#2E6DFF]"}`}>
                                            {copied ? "Copied!" : "Copy"}
                                        </span>
                                    </div>
                                </button>
                            </div>

                            {/* Supported apps */}
                            <div className="flex flex-wrap justify-center gap-2">
                                {["GPay", "PhonePe", "Paytm", "BHIM", "Amazon Pay"].map(app => (
                                    <span key={app} className="text-[11px] font-bold text-slate-400 bg-gray-100 px-2.5 py-1 rounded-full">{app}</span>
                                ))}
                            </div>
                        </div>

                        {/* Open UPI App */}
                        <a
                            href={upiUrl}
                            className="flex w-full items-center justify-center gap-2 bg-[#2E6DFF] hover:bg-[#1E5AFF] text-white h-14 rounded-2xl text-[16px] font-black shadow-lg shadow-[#2E6DFF]/25 transition-all active:scale-[0.98] no-underline"
                        >
                            <Smartphone className="w-5 h-5" />
                            Open UPI App
                        </a>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        {/*
                            ── Generate Invoice button ──────────────────────────────
                            ONLY shown when status === "received" (payment confirmed).
                            Hidden during "waiting" — the customer hasn't paid yet.
                        */}
                        {status === "received" && upiPaymentId && (
                            <button
                                onClick={() => finalisePayment(upiPaymentId)}
                                className="w-full py-5 rounded-2xl text-[16px] font-black bg-green-500 hover:bg-green-600 text-white shadow-xl shadow-green-400/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 animate-pulse-once"
                            >
                                <FileText className="w-5 h-5" />
                                Generate Invoice
                            </button>
                        )}

                        {/* Hint text – only while waiting */}
                        {status === "waiting" && (
                            <p className="text-center text-[11px] text-slate-400 font-medium pb-4">
                                "Generate Invoice" button will appear automatically once payment is detected
                            </p>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
