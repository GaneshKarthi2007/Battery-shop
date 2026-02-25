import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Printer } from "lucide-react";
import React from "react";

const BatteryInvoice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
    shopName: "SMR Battery Shop",
    address: "Thoothukudi, Tamilnadu",
    phone: "7092706484",
    gst: "33XXXXX1234X1Z5",
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
    warrantyPeriod: state.warrantyDetails.totalWarranty || "48 Months",
  };

  return (
    <div className="bg-gray-100 min-h-screen py-4 print:bg-white print:py-0">
      {/* Action Bar */}
      <div className="max-w-[850px] mx-auto mb-4 px-4 no-print flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg active:scale-95"
        >
          <Printer className="w-5 h-5" />
          Print Invoice
        </button>
      </div>

      <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 5mm;
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
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 10mm !important;
                        border: 1px solid #eee !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        background-color: white !important;
                    }
                    .min-h-screen {
                        min-height: auto !important;
                        height: auto !important;
                    }
                }
            `}</style>

      <div className="invoice-container" style={styles.container}>
        <h1 style={styles.header}>🔋 {invoiceData.shopName}</h1>
        <div style={styles.shopInfo}>
          <p>{invoiceData.address}</p>
          <p>Phone: {invoiceData.phone}</p>
          <p>GST No: {invoiceData.gst}</p>
        </div>

        <hr style={{ margin: '5px 0' }} />

        <h3 style={styles.sectionTitle}>Invoice Details</h3>
        <div style={styles.infoGrid}>
          <div>
            <p><strong>Invoice No:</strong> {invoiceData.invoiceNo}</p>
            <p><strong>Date:</strong> {invoiceData.date}</p>
            <p><strong>Transaction:</strong> <span style={{ color: invoiceData.paymentMethod === 'UPI' ? '#0d47a1' : '#2e7d32', fontWeight: 'bold' }}>{invoiceData.paymentMethod}</span></p>
          </div>
          <div>
            <p><strong>Customer:</strong> {invoiceData.customerName}</p>
            <p><strong>Phone:</strong> {invoiceData.customerPhone}</p>
            <p><strong>Vehicle No:</strong> {invoiceData.vehicleNumber}</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>S.No</th>
              <th style={styles.th}>Brand</th>
              <th style={styles.th}>Model</th>
              <th style={styles.th}>Warranty</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={item.id}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{item.brand}</td>
                <td style={styles.td}>{item.model}</td>
                <td style={styles.td}>{item.warranty}</td>
                <td style={styles.td}>{item.qty}</td>
                <td style={styles.td}>₹ {item.price.toLocaleString()}</td>
                <td style={styles.td}>₹ {(item.qty * item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.summary}>
          <p>Subtotal: ₹ {invoiceData.subtotal.toLocaleString()}</p>
          <p>GST ({invoiceData.gstPercent}% on Products): ₹ {invoiceData.gstAmount.toLocaleString()}</p>
          {invoiceData.exchange > 0 && (
            <p style={{ color: '#d32f2f' }}>Old Battery Exchange: - ₹ {invoiceData.exchange.toLocaleString()}</p>
          )}
          <h3 style={styles.totalAmount}>Grand Total: ₹ {invoiceData.grandTotal.toLocaleString()}</h3>
        </div>

        <hr style={{ margin: '5px 0' }} />

        <p style={{ marginTop: '10px', fontSize: '13px' }}><strong>Warranty Period:</strong> {invoiceData.warrantyPeriod}</p>

        <div style={styles.signatureSection}>
          <div style={{ textAlign: 'center' }}>
            <p>__________________</p>
            <p>Customer Signature</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p>__________________</p>
            <p>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "800px",
    width: "100%",
    margin: "0 auto",
    padding: "10mm",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontFamily: "'Inter', system-ui, sans-serif",
    backgroundColor: "#fff",
  },
  header: {
    textAlign: "center",
    color: "#0d47a1",
    marginBottom: "0px",
    fontSize: "20px",
  },
  shopInfo: {
    textAlign: "center",
    marginBottom: "5px",
    fontSize: "12px",
  },
  sectionTitle: {
    marginTop: "5px",
    marginBottom: "5px",
    borderBottom: "2px solid #0d47a1",
    paddingBottom: "2px",
    color: "#0d47a1",
    fontSize: "15px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "5px",
    marginBottom: "5px",
    fontSize: "12px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "5px",
    backgroundColor: "#fff",
  },
  th: {
    border: "1px solid #ddd",
    padding: "4px",
    backgroundColor: "#0d47a1",
    color: "#fff",
    textAlign: "center",
    fontSize: "11px",
  },
  td: {
    border: "1px solid #ddd",
    padding: "4px",
    textAlign: "center",
    fontSize: "11px",
  },
  summary: {
    marginTop: "5px",
    padding: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #ddd",
    borderRadius: "5px",
    textAlign: "right",
    fontSize: "12px",
  },
  totalAmount: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#d32f2f",
    marginTop: "2px",
  },
  signatureSection: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "bold",
    fontSize: "12px",
    breakInside: "avoid",
  },
};

export default BatteryInvoice;
