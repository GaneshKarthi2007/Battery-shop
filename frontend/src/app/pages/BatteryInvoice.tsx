import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Printer, Download } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useDeveloper } from "../contexts/DeveloperContext";
// @ts-ignore
import html2pdf from 'html2pdf.js';

const BatteryInvoice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopConfig } = useDeveloper();
  const sheetRef = useRef<HTMLDivElement>(null);

  const state = location.state as any;

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
  const invoiceNo = isQuotation
    ? `QT-${Date.now().toString().slice(-6)}`
    : `INV-${Date.now().toString().slice(-6)}`;
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const dueDate = new Date(Date.now() + 15 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

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

    // Before generating, temporarily remove scaling and margins for better capture
    const originalTransform = sheetRef.current.style.transform;
    const originalMarginBottom = sheetRef.current.style.marginBottom;
    
    sheetRef.current.style.transform = 'none';
    sheetRef.current.style.marginBottom = '0';

    html2pdf().set(opt).from(sheetRef.current).save().then(() => {
      // Restore original styles for UI
      if (sheetRef.current) {
        sheetRef.current.style.transform = originalTransform;
        sheetRef.current.style.marginBottom = originalMarginBottom;
      }
    });
  };

  // HSN code for batteries
  const getHSN = (type: string) => type === "Service" ? "9987" : "8507";

  return (
    <div className="bg-gray-300 min-h-screen py-6 print:py-0 print:bg-white overflow-x-hidden">

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .a4-sheet {
            box-shadow: none !important;
            transform: none !important;
            margin-bottom: 0 !important;
          }
        }
        .a4-sheet {
          width: 210mm;
          min-height: 297mm;
          font-family: 'Arial', sans-serif;
          transform-origin: top center;
        }
      `}</style>

      {/* ACTION BAR */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 px-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-black font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
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
              <p className="text-gray-700 text-[11px] font-bold mt-0.5">GSTIN: {shopConfig.gst}</p>
            </div>
            <div className="text-right">
              <h2 className="text-[22px] font-black tracking-widest text-gray-900">
                {isQuotation ? "QUOTATION" : "INVOICE"}
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
                <th className="py-2 text-center font-bold text-gray-900 w-12">HSN</th>
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
                  <td className="py-2 align-top text-center text-gray-600">{getHSN(item.type)}</td>
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
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {gstAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">GST (18%):</span>
                  <span className="font-semibold">₹ {gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {exchange > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Exchange Discount:</span>
                  <span className="font-semibold text-gray-700">− ₹ {exchange.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 mt-1 border-t-2 border-gray-900">
                <span className="font-black text-gray-900 text-[13px]">Total:</span>
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
              ) : (
                <>
                  <li>1. Payment is due within 15 days from the invoice date.</li>
                  <li>2. Late payments will incur a 2% monthly interest charge.</li>
                  <li>3. Old battery exchange credit has been applied where applicable.</li>
                  <li>4. Goods once sold cannot be returned or exchanged.</li>
                  <li>5. All disputes subject to local jurisdiction.</li>
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
