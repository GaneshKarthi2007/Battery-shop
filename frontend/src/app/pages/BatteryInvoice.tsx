import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type InvoiceItem = {
  type: string;
  name: string;
  warranty: string;
  qty: number;
  rate: number;
  gst: number;
};

const BatteryInvoice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    items: { id: string | number; name: string; model: string; price: number; quantity: number; warranty: string; type: "Product" | "Service" }[];
    subtotal: number;
    gst: number;
    total: number;
    installCharges?: number;
    otherCharges?: number;
    exchangeRate?: number;
    warrantyDetails?: {
      freeReplacement: string;
      proRata: string;
      totalWarranty: string;
    };
    customerInfo?: {
      name: string;
      phone: string;
      city: string;
    };
    vehicleInfo?: {
      type: string;
      number: string;
    };
    finalTotal?: number;
    finalGst?: number;
  } | undefined;

  // Transform sales items to invoice items or use mock if no state
  const items: InvoiceItem[] = state?.items.map((item) => ({
    type: item.type === "Service" ? "Maintenance Service" : "New Battery",
    name: item.name + (item.model ? ` ${item.model}` : ""),
    warranty: item.warranty,
    qty: item.quantity,
    rate: item.price,
    gst: 18,
  })) || [
      {
        type: "New Battery",
        name: "Amaron Pro 55Ah",
        warranty: "36 Months",
        qty: 1,
        rate: 5200,
        gst: 18,
      },
    ];

  const installCharges = state?.installCharges || 0;
  const otherCharges = state?.otherCharges || 0;
  const exchangeValue = state?.exchangeRate || 0;

  const subtotal = state?.subtotal || items.reduce(
    (acc, item) => acc + item.qty * item.rate,
    0
  );

  const tax = state?.finalGst ?? (state?.gst || items.reduce(
    (acc, item) => acc + (item.qty * item.rate * item.gst) / 100,
    0
  ));

  const grandTotal = state?.finalTotal ?? ((state?.total || subtotal + tax) - exchangeValue);

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Selection
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
        {/* TOP ACCENT BAR */}
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-700 print:hidden" />

        <div className="p-8 md:p-12">
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row justify-between gap-8 border-b border-slate-100 pb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <span className="text-2xl font-black">P</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  PowerGrid <span className="text-blue-600">Batteries</span>
                </h1>
              </div>
              <div className="space-y-1 text-slate-500 text-sm">
                <p className="font-semibold text-slate-800">No. 42, Mount Road, Little Mount</p>
                <p>Chennai, Tamil Nadu - 600015</p>
                <p>Phone: +91 44 2456 7890 | Email: sales@powergrid.com</p>
                <p className="flex items-center gap-1">
                  GSTIN: <span className="font-mono text-slate-700 font-bold">33AAACP1234K1Z5</span>
                </p>
              </div>
            </div>

            <div className="md:text-right flex flex-col justify-end">
              <div className="mb-4">
                <h2 className="text-5xl font-black text-slate-100 uppercase tracking-tighter absolute -mt-12 right-12 opacity-50 print:hidden select-none pointer-events-none">
                  TAX INVOICE
                </h2>
                <h2 className="text-3xl font-bold text-slate-900 relative">TAX INVOICE</h2>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-500">Invoice Number: <span className="text-slate-900 font-bold">#INV-{Math.floor(10000 + Math.random() * 90000)}</span></p>
                <p className="text-slate-500">Date of Issue: <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                <p className="text-slate-500">Payment Status: <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 uppercase">Paid</span></p>
              </div>
            </div>
          </div>

          {/* DETAILS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-3">Billed To</h3>
              <div className="pl-4">
                <p className="text-lg font-bold text-slate-900 mb-1">{state?.customerInfo?.name || "Ganesh S"}</p>
                <p className="text-slate-600">{state?.customerInfo?.phone || "+91 9876543210"}</p>
                <p className="text-slate-600">{state?.customerInfo?.city || "Chennai, Tamil Nadu"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-indigo-600 pl-3">Vehicle / Device Details</h3>
              <div className="pl-4 grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-slate-500">Type:</span>
                <span className="font-bold text-slate-800">{state?.vehicleInfo?.type || "Car"}</span>
                <span className="text-slate-500">Number:</span>
                <span className="font-bold text-slate-800 uppercase">{state?.vehicleInfo?.number || "TN 09 AB 1234"}</span>
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="mt-12 overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Warranty</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Qty</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Rate</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, i) => {
                  const totalValue = item.qty * item.rate;
                  return (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.type}</p>
                      </td>
                      <td className="px-6 py-5 text-center text-sm font-medium text-slate-600">{item.warranty}</td>
                      <td className="px-6 py-5 text-center text-sm font-bold text-slate-900">{item.qty}</td>
                      <td className="px-6 py-5 text-right text-sm text-slate-600">₹{item.rate.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-slate-900">₹{totalValue.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="mt-10 flex flex-col md:flex-row justify-between gap-10">
            {/* Left Box: Warranty Registration */}
            <div className="flex-1 space-y-6">
              <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                <h4 className="text-blue-900 font-bold text-sm mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Warranty Registration
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-tighter">Total Period</p>
                    <p className="font-bold text-blue-900">{state?.warrantyDetails?.totalWarranty || items[0].warranty}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-tighter">Free Replacement</p>
                    <p className="font-bold text-blue-900">{state?.warrantyDetails?.freeReplacement || "18 Months"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-tighter">Pro-rata Period</p>
                    <p className="font-bold text-blue-900">{state?.warrantyDetails?.proRata || "18 Months"}</p>
                  </div>
                </div>
              </div>

              {exchangeValue > 0 && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">♻️</div>
                    <div>
                      <p className="text-xs font-bold text-orange-800 uppercase">Old Battery Value</p>
                      <p className="text-[10px] text-orange-600 italic">Buyback adjusted in total</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-orange-700">- ₹{exchangeValue.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Right: Detailed Totals */}
            <div className="w-full md:w-80">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">₹{subtotal.toLocaleString()}</span>
                </div>

                {installCharges > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Installation Charges</span>
                    <span className="font-bold text-slate-800">₹{installCharges.toLocaleString()}</span>
                  </div>
                )}

                {otherCharges > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Service & Misc</span>
                    <span className="font-bold text-slate-800">₹{otherCharges.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tax Amount (GST 18%)</span>
                  <span className="font-bold text-slate-800">₹{tax.toLocaleString()}</span>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-slate-900 rounded-xl p-5 text-white shadow-xl shadow-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount Due</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black">₹{grandTotal.toLocaleString()}</span>
                      <p className="text-[10px] text-slate-400 font-medium italic">Incl. all taxes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER SECTION */}
          <div className="mt-16 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-4">Terms & Conditions</p>
              <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-3">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>Warranty is provided by the manufacturer.</li>
                <li>Subject to Chennai Jurisdiction.</li>
              </ul>
            </div>
            <div className="text-right">
              <div className="mb-2 italic text-slate-400 text-xs">For PowerGrid Batteries</div>
              <div className="mt-8 border-t border-slate-900 w-48 ml-auto pt-2">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Authorized Signature</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center print:hidden border-t border-slate-50 pt-8">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              Print This Invoice
            </button>
          </div>

          <footer className="mt-12 text-center">
            <p className="text-xs text-slate-400 font-medium">Thank you for your business! Powering your journey, one battery at a time. ⚡</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default BatteryInvoice;
