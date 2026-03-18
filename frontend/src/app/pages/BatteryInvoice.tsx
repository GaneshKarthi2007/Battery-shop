import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Printer, Download } from "lucide-react";
import React from "react";
import { useDeveloper } from "../contexts/DeveloperContext";

const BatteryInvoice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopConfig } = useDeveloper();

  const state = location.state as {
    items: { id: string | number; name: string; model: string; price: number; quantity: number; warranty: string; type: "Product" | "Service" }[];
    customerInfo: { name: string; phone: string; billingAddress: string };
    vehicleNumber: string;
    paymentMethod: string;
    productSubtotal: number;
    serviceSubtotal: number;
    productGst: number;
    exchangeDiscount: number;
    finalTotal: number;
    cashAmount?: number;
    upiAmount?: number;
    warrantyDetails: {
      totalWarranty: string;
      totalWarrantyExpiry: string;
    };
  } | undefined;

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No invoice data available.</p>
        <button onClick={() => navigate("/")} className="ml-4 text-blue-600 underline">Go Home</button>
      </div>
    );
  }

  const invoiceData = {
    shopName: shopConfig.name,
    address: shopConfig.address,
    phone: shopConfig.phone,
    gst: shopConfig.gst,
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString('en-IN'),
    customerName: state.customerInfo.name,
    customerPhone: state.customerInfo.phone,
    vehicleNumber: state.vehicleNumber || "N/A",
    items: state.items.map(item => ({
      id: item.id,
      brand: item.name,
      model: item.model,
      warranty: item.warranty || "N/A",
      qty: item.quantity,
      price: item.price,
    })),
    subtotal: state.productSubtotal + state.serviceSubtotal,
    gstPercent: 18,
    gstAmount: state.productGst,
    discount: 0,
    exchange: state.exchangeDiscount,
    grandTotal: state.finalTotal,
    paymentMethod: state.paymentMethod,
    cashAmount: state.cashAmount,
    upiAmount: state.upiAmount,
    warrantyPeriod: state.warrantyDetails.totalWarranty || "48 Months",
  };

  return (
    <div className="bg-gray-50 min-h-screen py-4 print:bg-white print:py-0">
      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mb-4 px-4 no-print flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            title="Print Invoice"
            className="text-blue-700 bg-blue-50 p-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-blue-100 transition-all active:scale-95"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={() => window.print()}
            title="Download as PDF"
            className="bg-blue-700 text-white p-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-blue-800 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        @media print {
            @page {
                size: A4;
                margin: 0;
            }
            body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .no-print {
                display: none !important;
            }
            .invoice-container {
                box-shadow: none !important;
                margin: 0 !important;
            }
        }
      `}</style>

      <div className="max-w-4xl mx-auto bg-white border border-gray-100 invoice-container">
        {/* Header */}
        <div className="border-b-4 border-blue-600 p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl mb-2 font-bold text-gray-900">{invoiceData.shopName}</h1>
              <div className="text-gray-500 space-y-1">
                <p>{invoiceData.address}</p>
                <p>Phone: {invoiceData.phone}</p>
                <p>GST No: {invoiceData.gst}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl mb-4 font-bold text-gray-800">INVOICE</h2>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-end gap-4">
                  <span className="font-medium text-gray-900">Invoice #:</span>
                  <span>{invoiceData.invoiceNo}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="font-medium text-gray-900">Date:</span>
                  <span>{invoiceData.date}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="font-medium text-gray-900">Payment Mode:</span>
                  <div className="text-right">
                    <span className="font-semibold text-blue-600">
                      {invoiceData.paymentMethod === "Split" ? "Split (Cash + UPI)" : invoiceData.paymentMethod}
                    </span>
                    {invoiceData.paymentMethod === "Split" && (
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Cash: ₹{invoiceData.cashAmount?.toLocaleString()} | UPI: ₹{invoiceData.upiAmount?.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="p-8 border-b border-gray-200">
          <h3 className="mb-3 text-lg font-bold text-gray-800">Bill To:</h3>
          <div className="space-y-1 text-gray-600">
            <p className="font-bold text-gray-900 text-xl">{invoiceData.customerName}</p>
            <p>Phone: {invoiceData.customerPhone}</p>
            <p>Vehicle No: {invoiceData.vehicleNumber}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8">
          <table className="w-full text-sm sm:text-base">
            <thead>
              <tr className="border-b-2 border-blue-600">
                <th className="text-left py-3 font-semibold text-gray-800">S.No</th>
                <th className="text-left py-3 font-semibold text-gray-800">Brand</th>
                <th className="text-left py-3 font-semibold text-gray-800">Model</th>
                <th className="text-left py-3 font-semibold text-gray-800 hidden sm:table-cell">Warranty</th>
                <th className="text-right py-3 font-semibold text-gray-800 w-16">Qty</th>
                <th className="text-right py-3 font-semibold text-gray-800 w-28">Price</th>
                <th className="text-right py-3 font-semibold text-gray-800 w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-4 text-gray-700">{index + 1}</td>
                  <td className="py-4 text-gray-900 font-medium">{item.brand}</td>
                  <td className="py-4 text-gray-700">{item.model}</td>
                  <td className="py-4 text-gray-700 hidden sm:table-cell">{item.warranty}</td>
                  <td className="text-right py-4 text-gray-700">{item.qty}</td>
                  <td className="text-right py-4 text-gray-700">₹ {item.price.toLocaleString()}</td>
                  <td className="text-right py-4 text-gray-900 font-medium">₹ {(item.qty * item.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-80">
              <div className="flex justify-between py-2 border-b border-gray-200 text-gray-600">
                <span className="font-medium">Subtotal:</span>
                <span>₹ {invoiceData.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 text-gray-600">
                <span className="font-medium">GST ({invoiceData.gstPercent}%):</span>
                <span>₹ {invoiceData.gstAmount.toLocaleString()}</span>
              </div>
              {invoiceData.exchange > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200 text-red-600">
                  <span className="font-medium">Old Battery Exchange:</span>
                  <span>- ₹ {invoiceData.exchange.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-4 border-t-2 border-blue-600 mt-2">
                <span className="font-bold text-xl text-gray-900">Total:</span>
                <span className="font-bold text-xl text-blue-600">₹ {invoiceData.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Warranty Info */}
        <div className="p-8 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="mb-2 font-bold text-gray-800">Terms & Conditions:</h4>
              <ul className="text-gray-500 text-sm space-y-1 list-disc list-inside">
                <li>Goods once sold cannot be taken back or exchanged.</li>
                <li>Warranty is subject to manufacturer's terms and conditions.</li>
                <li>Original invoice is mandatory for warranty claims.</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-bold text-gray-800">Warranty Information:</h4>
              <div className="text-gray-600 space-y-1 bg-white p-4 rounded-lg border border-gray-200">
                <p><span className="font-medium">Total Warranty Period:</span> {invoiceData.warrantyPeriod}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="px-8 pb-8 pt-4 flex justify-between items-end bg-gray-50 border-t border-gray-200">
          <div className="text-center pt-8">
            <div className="w-48 border-b-2 border-gray-400 mb-2"></div>
            <p className="text-gray-600 font-medium">Customer Signature</p>
          </div>
          <div className="text-center pt-8">
            <div className="w-48 border-b-2 border-gray-400 mb-2"></div>
            <p className="text-gray-600 font-medium">Authorized Signatory</p>
            <p className="text-gray-500 text-sm mt-1">{invoiceData.shopName}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-blue-700 text-white text-center">
          <p>Thank you for your business! For queries, contact us at {invoiceData.phone}</p>
        </div>
      </div>
    </div>
  );
};

export default BatteryInvoice;
