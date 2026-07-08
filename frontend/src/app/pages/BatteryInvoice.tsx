import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Printer, Download } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useDeveloper } from "../contexts/DeveloperContext";
import { apiClient } from "../api/client";
// @ts-ignore
import html2pdf from 'html2pdf.js';

const BatteryInvoice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopConfig } = useDeveloper();
  const sheetRef = useRef<HTMLDivElement>(null);

  const state = location.state as any;

  const [gstEnabled, setGstEnabled] = useState<boolean>(() => {
    if (state && state.gst_enabled !== undefined) {
      return !!state.gst_enabled;
    }
    return true;
  });

  const handleToggleGst = async (enabled: boolean) => {
    setGstEnabled(enabled);
    if (state && state.id && !state.isQuotation) {
      try {
        await apiClient.put(`/sales/${state.id}`, { gst_enabled: enabled });
      } catch (err) {
        console.error("Failed to update GST status on server", err);
      }
    }
  };

  // Scale A4 sheet to fit viewport on mobile
  useEffect(() => {
    const A4_PX = 794; // ~210mm at 96dpi
    const PADDING = 16;

    const applyScale = () => {
      if (!sheetRef.current) return;
      const vw = window.innerWidth;
      const scale = Math.min(1, (vw - PADDING) / A4_PX);
      sheetRef.current.style.transform = `scale(${scale})`;
      // Compensate the dead space that transform leaves above/below
      const naturalH = sheetRef.current.scrollHeight;
      const collapsedH = naturalH * scale;
      const delta = naturalH - collapsedH;
      sheetRef.current.style.marginBottom = `-${delta}px`;
    };

    applyScale();
    window.addEventListener("resize", applyScale);
    return () => window.removeEventListener("resize", applyScale);
  }, []);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>No invoice data available.</p>
        <button onClick={() => navigate("/")} className="ml-4 underline font-semibold">Go Home</button>
      </div>
    );
  }

  const isQuotation = !!state.isQuotation;
  const invoiceNo = state.id 
    ? (isQuotation ? `QT-${state.id.toString().padStart(5, '0')}` : `INV-${state.id.toString().padStart(5, '0')}`)
    : (isQuotation ? `QT-${Date.now().toString().slice(-6)}` : `INV-${Date.now().toString().slice(-6)}`);
  
  const dateObj = state.created_at ? new Date(state.created_at) : new Date();
  const date = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const dueDate = new Date(dateObj.getTime() + 15 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const items: any[] = state.items ?? [];
  const productSubtotal: number = state.productSubtotal ?? 0;
  const serviceSubtotal: number = state.serviceSubtotal ?? 0;
  const subtotal = productSubtotal + serviceSubtotal;
  const gstAmount: number = state.productGst ?? 0;
  const exchange: number = state.exchangeDiscount ?? 0;
  const grandTotal: number = state.finalTotal ?? 0;
  const paymentMethod: string = state.paymentMethod ?? "Cash";
  const warranty: string = state.warrantyDetails?.totalWarranty ?? "";
  const warrantyExpiry: string = state.warrantyDetails?.totalWarrantyExpiry ?? "";

  const handleDownloadPDF = () => {
    if (!sheetRef.current) return;

    // Save the original getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;

    // Override getComputedStyle to safely handle oklch colors for html2canvas
    window.getComputedStyle = function (el, pseudo) {
      const style = originalGetComputedStyle(el, pseudo);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function (propertyName: string) {
              const value = target.getPropertyValue(propertyName);
              if (typeof value === 'string' && value.includes('oklch')) {
                if (propertyName.startsWith('--')) return '#000000';
                if (propertyName.toLowerCase().includes('color')) {
                  if (propertyName === 'background-color') return '#ffffff';
                  return '#111827';
                }
                return '';
              }
              return value;
            };
          }
          const value = Reflect.get(target, prop);
          if (typeof value === 'string' && value.includes('oklch')) {
            const propStr = prop.toString();
            if (propStr.startsWith('--')) return '#000000';
            if (propStr.toLowerCase().includes('color')) {
              if (propStr === 'backgroundColor') return '#ffffff';
              return '#111827';
            }
            return '';
          }
          if (typeof value === 'function') {
            return value.bind(target);
          }
          return value;
        }
      });
    };

    // Options for html2pdf
    const opt = {
      margin: 0,
      filename: `${invoiceNo.toLowerCase()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    // Before generating, temporarily remove scaling, margins and min-height for better capture
    const originalTransform = sheetRef.current.style.transform;
    const originalMarginBottom = sheetRef.current.style.marginBottom;
    const originalMinHeight = sheetRef.current.style.minHeight;
    const originalPadding = sheetRef.current.style.padding;
    
    sheetRef.current.style.transform = 'none';
    sheetRef.current.style.marginBottom = '0';
    sheetRef.current.style.minHeight = 'auto';
    sheetRef.current.style.padding = '10mm';

    html2pdf().set(opt).from(sheetRef.current).save().then(() => {
      // Restore getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;

      // Restore original styles for UI
      if (sheetRef.current) {
        sheetRef.current.style.transform = originalTransform;
        sheetRef.current.style.marginBottom = originalMarginBottom;
        sheetRef.current.style.minHeight = originalMinHeight;
        sheetRef.current.style.padding = originalPadding;
      }
    }).catch((err: unknown) => {
      console.error("PDF generation failed:", err);
      window.getComputedStyle = originalGetComputedStyle;
      if (sheetRef.current) {
        sheetRef.current.style.transform = originalTransform;
        sheetRef.current.style.marginBottom = originalMarginBottom;
        sheetRef.current.style.minHeight = originalMinHeight;
        sheetRef.current.style.padding = originalPadding;
      }
    });
  };

  // HSN code for batteries
  const getHSN = (type: string) => type === "Service" ? "9987" : "8507";

  return (
    <div className="bg-gray-300 min-h-screen py-6 print:py-0 print:bg-white overflow-x-hidden">

      {/* Print and PDF overrides */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body, #root, [data-theme], .dark, div.bg-gray-300, div.overflow-x-hidden {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #111827 !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            --background: #ffffff !important;
            --foreground: #111827 !important;
            --card: #ffffff !important;
            --card-foreground: #111827 !important;
            --border: #e5e7eb !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .a4-sheet {
            box-shadow: none !important;
            transform: none !important;
            margin: 0 auto !important;
            padding: 10mm !important;
            border: none !important;
            background-color: #ffffff !important;
            color: #111827 !important;
            min-height: auto !important;
            height: auto !important;
          }
        }
        .a4-sheet {
          width: 210mm;
          min-height: 297mm;
          font-family: 'Arial', sans-serif;
          transform-origin: top center;
          background-color: #ffffff !important;
          color: #111827 !important;
        }
        /* Override Tailwind OKLCH colors inside the PDF capture zone to prevent html2canvas parsing crashes */
        .a4-sheet .text-gray-900 { color: #111827 !important; }
        .a4-sheet .text-gray-700 { color: #374151 !important; }
        .a4-sheet .text-gray-600 { color: #4b5563 !important; }
        .a4-sheet .text-gray-500 { color: #6b7280 !important; }
        .a4-sheet .text-gray-400 { color: #9ca3af !important; }
        .a4-sheet .text-rose-500 { color: #f43f5e !important; }
        .a4-sheet .text-red-400 { color: #f87171 !important; }
        
        .a4-sheet .bg-white { background-color: #ffffff !important; }
        .a4-sheet .bg-gray-100 { background-color: #f3f4f6 !important; }
        .a4-sheet .bg-gray-50 { background-color: #f9fafb !important; }
        
        .a4-sheet .border-gray-900 { border-color: #111827 !important; }
        .a4-sheet .border-gray-400 { border-color: #9ca3af !important; }
        .a4-sheet .border-gray-300 { border-color: #d1d5db !important; }
        .a4-sheet .border-gray-200 { border-color: #e5e7eb !important; }
        .a4-sheet .border-gray-100 { border-color: #f3f4f6 !important; }
      `}</style>

      {/* ACTION BAR */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 px-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-black font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Toggle Presentation Mode */}
        <div className="flex bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm">
          <button
            onClick={() => handleToggleGst(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${gstEnabled ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            GST Invoice
          </button>
          <button
            onClick={() => handleToggleGst(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!gstEnabled ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Cash Bill
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-500 rounded text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded text-sm font-semibold hover:bg-black transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* A4 SHEET — scaled on mobile via useEffect */}
      <div className="flex justify-center overflow-x-hidden">
        <div
          ref={sheetRef}
          className="a4-sheet bg-white shadow-2xl text-gray-900 text-[12px] leading-snug p-[14mm]"
        >

          {/* ── HEADER ── */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-[22px] font-black text-gray-900 leading-tight">{shopConfig.name}</h1>
              <p className="text-gray-600 text-[11px] mt-0.5">{shopConfig.address}</p>
              <p className="text-gray-600 text-[11px]">Phone: {shopConfig.phone}</p>
              {shopConfig.email && <p className="text-gray-600 text-[11px]">Email: {shopConfig.email}</p>}
              {gstEnabled && <p className="text-gray-700 text-[11px] font-bold mt-0.5">GSTIN: {shopConfig.gst}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-[22px] font-black tracking-widest text-gray-900">
                {isQuotation ? "QUOTATION" : (gstEnabled ? "TAX INVOICE" : "CASH BILL")}
              </h2>
              <div className="mt-1 text-[11px] text-gray-600 space-y-0.5">
                <div className="flex justify-end gap-4">
                  <span className="text-gray-500">{isQuotation ? "Quotation No:" : "Invoice No:"}</span>
                  <span className="font-semibold text-gray-900">{invoiceNo}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-semibold text-gray-900">{date}</span>
                </div>
                {!isQuotation && (
                  <div className="flex justify-end gap-4">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-semibold text-gray-900">{dueDate}</span>
                  </div>
                )}
                {!isQuotation && (
                  <div className="flex justify-end gap-4">
                    <span className="text-gray-500">Payment:</span>
                    <span className="font-semibold text-gray-900">{paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="border-t-2 border-gray-900 mb-4" />

          {/* ── BILL TO ── */}
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
              {isQuotation ? "Quotation For:" : "Bill To:"}
            </p>
            <p className="font-bold text-[13px] text-gray-900">{state.customerInfo?.name ?? "—"}</p>
            {state.customerInfo?.billingAddress && (
              <p className="text-gray-600 text-[11px]">{state.customerInfo.billingAddress}</p>
            )}
            {state.customerInfo?.phone && (
              <p className="text-gray-600 text-[11px]">Phone: {state.customerInfo.phone}</p>
            )}
            {state.vehicleNumber && state.vehicleNumber !== "N/A" && (
              <p className="text-gray-600 text-[11px]">Vehicle: {state.vehicleNumber}</p>
            )}
          </div>

          {/* ── ITEMS TABLE ── */}
          <table className="w-full border-collapse mb-4 text-[11.5px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-2 text-left font-bold text-gray-900 w-6">#</th>
                <th className="py-2 text-left font-bold text-gray-900">Description</th>
                {gstEnabled && <th className="py-2 text-center font-bold text-gray-900 w-12">HSN</th>}
                <th className="py-2 text-center font-bold text-gray-900 w-10">Qty</th>
                <th className="py-2 text-right font-bold text-gray-900 w-24">Rate (₹)</th>
                <th className="py-2 text-right font-bold text-gray-900 w-24">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2 align-top text-gray-500">{i + 1}</td>
                  <td className="py-2 align-top">
                    <span className="font-medium text-gray-900">{item.name} {item.model}</span>
                    {item.warranty && item.warranty !== "N/A" && (
                      <span className="text-gray-400 text-[10px] ml-1">({item.warranty} warranty)</span>
                    )}
                  </td>
                  {gstEnabled && <td className="py-2 align-top text-center text-gray-600">{getHSN(item.type)}</td>}
                  <td className="py-2 align-top text-center text-gray-700">{item.quantity}</td>
                  <td className="py-2 align-top text-right text-gray-700">
                    {Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 align-top text-right font-semibold text-gray-900">
                    {(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── TOTALS ── */}
          <div className="flex justify-end mb-5">
            <div className="w-56 text-[11.5px]">
              {gstEnabled ? (
                <>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {gstAmount > 0 && (
                    <>
                      <div className="flex justify-between py-1 border-b border-gray-200">
                        <span className="text-gray-600">CGST (9%):</span>
                        <span className="font-semibold">₹ {(gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200">
                        <span className="text-gray-600">SGST (9%):</span>
                        <span className="font-semibold">₹ {(gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                </>
              ) : null}
              {exchange > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Exchange Discount:</span>
                  <span className="font-semibold text-gray-700">− ₹ {exchange.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {state.extraCharges > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Extra Charges:</span>
                  <span className="font-semibold text-gray-700">₹ {Number(state.extraCharges).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 mt-1 border-t-2 border-gray-900">
                <span className="font-black text-gray-900 text-[13px]">Total Payable:</span>
                <span className="font-black text-gray-900 text-[13px]">
                  ₹ {Number(grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {isQuotation && (
                <p className="text-[9px] text-gray-400 text-right mt-0.5">Valid for 7 days from date of issue</p>
              )}
            </div>
          </div>

          {/* ── WARRANTY (only for bills) ── */}
          {!isQuotation && warranty && warranty !== "N/A" && (
            <div className="border-l-4 border-gray-400 pl-3 mb-4 py-1">
              <p className="font-black text-[11px] uppercase tracking-wider text-gray-700 mb-1">Warranty Information:</p>
              <ul className="text-[11px] text-gray-600 space-y-0.5 list-none">
                <li>• All batteries come with {warranty} warranty from the date of purchase.</li>
                {warrantyExpiry && warrantyExpiry !== "N/A" && (
                  <li>• Warranty valid until: {warrantyExpiry}</li>
                )}
                <li>• Warranty covers manufacturing defects only.</li>
                <li>• Please retain this invoice for warranty claims.</li>
                <li>• Free maintenance for the first 6 months.</li>
              </ul>
            </div>
          )}

          {/* ── TERMS ── */}
          <div className="mb-5">
            <p className="font-black text-[11px] uppercase tracking-wider text-gray-700 mb-1">Terms and Conditions:</p>
            <ol className="text-[11px] text-gray-600 space-y-0.5 list-none">
              {isQuotation ? (
                <>
                  <li>1. This quotation is valid for 7 days from the date of issue.</li>
                  <li>2. Prices are subject to availability of stock.</li>
                  <li>3. Final pricing may vary at the time of actual billing.</li>
                  <li>4. Goods once sold cannot be returned or exchanged.</li>
                  <li>5. All disputes subject to local jurisdiction.</li>
                </>
              ) : gstEnabled ? (
                <>
                  <li>1. Goods once sold cannot be returned or exchanged.</li>
                  <li>2. Interest @ 18% p.a. will be charged for payments delayed beyond the due date.</li>
                  <li>3. Warranty claims are subject to manufacturer terms and conditions.</li>
                  <li>4. All disputes subject to local jurisdiction.</li>
                </>
              ) : (
                <>
                  <li>1. Please retain this cash bill for warranty claims.</li>
                  <li>2. Goods once sold cannot be returned or exchanged.</li>
                  <li>3. All disputes subject to local jurisdiction.</li>
                  <li>4. Payment is due immediately or as agreed.</li>
                </>
              )}
            </ol>
          </div>

          {/* ── SIGNATURE ── */}
          <div className="border-t border-gray-300 pt-4 flex justify-between items-end">
            <div className="text-center">
              <div className="w-40 border-b border-gray-400 mb-1" style={{ height: "40px" }} />
              <p className="text-[11px] text-gray-600 font-medium">Customer Signature</p>
              <p className="text-[10px] text-gray-400">Date: ___________</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-gray-400 mb-1" style={{ height: "40px" }} />
              <p className="text-[11px] font-bold text-gray-900">{shopConfig.name}</p>
              <p className="text-[10px] text-gray-500">Authorized Signature</p>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="text-center mt-5 border-t border-gray-200 pt-3">
            <p className="text-[11px] text-gray-500 font-medium">
              {isQuotation
                ? `Interested in this quotation? Contact us at ${shopConfig.phone}`
                : "Thank you for your business!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryInvoice;
