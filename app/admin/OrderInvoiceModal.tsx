// app/admin/OrderInvoiceModal.tsx
'use client'

import React, { useRef } from 'react'

interface OrderInvoiceModalProps {
  order: any
  type: 'INVOICE' | 'PACKING_SLIP'
  onClose: () => void
}

export default function OrderInvoiceModal({ order, type, onClose }: OrderInvoiceModalProps) {
  const documentRef = useRef<HTMLDivElement>(null)

  const handlePrintOrDownload = () => {
    window.print()
  }

  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce(
    (acc: number, item: any) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  )
  const totalAmount = Number(order.total_amount || order.final_payable_amount || subtotal)

  return (
    <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50 overflow-y-auto">
      {/* Strict Print Rules: Physical printer gets pure white background to save ink */}
      <style jsx global>{`
        @media print {
          html, body {
            height: 100% !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-card, #printable-invoice-card * {
            visibility: visible !important;
          }
          #printable-invoice-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 10px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
        }
      `}</style>

      {/* Screen Card in Atelier Rose Palette */}
      <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl max-w-3xl w-full p-6 my-8 text-[#2B2B2B]">
        {/* Action Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#8A7968]/20 mb-6 no-print">
          <div>
            <span className="text-xs font-bold text-[#B76E79] uppercase tracking-wider">
              {type === 'INVOICE' ? 'Tax Invoice & Receipt' : 'Shipping Label & Packing Slip'}
            </span>
            <h3 className="text-xl font-black text-[#2B2B2B] mt-0.5">Order #{order.tracking_id}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintOrDownload}
              className="bg-[#B76E79] hover:bg-[#9E5B65] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 btn-press"
            >
              📥 Print / Save as PDF ({order.tracking_id?.slice(0, 8)})
            </button>
            <button
              onClick={onClose}
              className="text-[#8A7968] hover:text-[#2B2B2B] font-bold text-lg bg-[#EADBC8] border border-[#8A7968]/30 px-3 py-1 rounded-full cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Document Container (Screen Preview) */}
        <div className="border border-[#8A7968]/30 rounded-2xl p-4 bg-[#F4EADE] max-h-[65vh] overflow-y-auto flex justify-center">
          <div
            id="printable-invoice-card"
            ref={documentRef}
            className="bg-[#EFE3D3] p-6 sm:p-8 w-full max-w-2xl rounded-xl shadow-xs text-[#2B2B2B] font-sans border border-[#8A7968]/20"
          >
            {type === 'INVOICE' ? (
              /* ================== TAX INVOICE LAYOUT ================== */
              <div>
                <div className="flex justify-between items-start border-b-2 border-[#8A7968]/50 pb-6 mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-[#2B2B2B] tracking-tight">
                      Mahin's One-Stop One-Store
                    </h1>
                    <p className="text-xs text-[#8A7968] mt-1">Electronics, Robotics & STEM Components</p>
                    <p className="text-xs text-[#8A7968]">Website: www.mahinsonestoponestore.in</p>
                    <p className="text-xs text-[#8A7968]">Contact: mahinsonestoponestore@gmail.com</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black uppercase tracking-widest text-[#B76E79] block">
                      TAX INVOICE
                    </span>
                    <span className="text-xs text-[#8A7968] block mt-1">
                      Invoice No: <strong className="font-mono text-[#2B2B2B]">INV-{order.tracking_id?.slice(0, 8)}</strong>
                    </span>
                    <span className="text-xs text-[#8A7968] block">
                      Date: <strong className="text-[#2B2B2B]">{new Date(order.created_at).toLocaleDateString()}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
                  <div className="bg-[#F4EADE] p-4 rounded-xl border border-[#8A7968]/30">
                    <span className="font-bold text-[#B76E79] uppercase block mb-1">Billed & Shipped To:</span>
                    <p className="font-extrabold text-sm text-[#2B2B2B] mb-1">{order.customer_name || 'Customer'}</p>
                    <p className="text-[#8A7968] leading-relaxed">{order.shipping_address}</p>
                    {order.customer_email && (
                      <p className="text-[#8A7968] mt-2">
                        <strong className="text-[#2B2B2B]">Email:</strong> {order.customer_email}
                      </p>
                    )}
                  </div>

                  <div className="bg-[#F4EADE] p-4 rounded-xl border border-[#8A7968]/30">
                    <span className="font-bold text-[#B76E79] uppercase block mb-1">Order Details:</span>
                    <p className="text-[#8A7968]">
                      <strong className="text-[#2B2B2B]">Tracking ID:</strong> <span className="font-mono text-[#2B2B2B]">{order.tracking_id}</span>
                    </p>
                    <p className="text-[#8A7968] mt-1">
                      <strong className="text-[#2B2B2B]">Payment Mode:</strong> {order.payment_method || 'Online'}
                    </p>
                    <p className="text-[#8A7968] mt-1">
                      <strong className="text-[#2B2B2B]">Status:</strong>{' '}
                      <span className="font-bold uppercase text-[#B76E79]">{order.status || 'Pending'}</span>
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse text-xs mb-6">
                  <thead>
                    <tr className="bg-[#2B2B2B] text-[#F4EADE] font-bold">
                      <th className="p-2.5 rounded-l-lg">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, idx: number) => {
                      const qty = Number(item.quantity) || 1
                      const price = Number(item.price) || 0
                      return (
                        <tr key={idx} className="border-b border-[#8A7968]/20">
                          <td className="p-2.5 font-bold text-[#2B2B2B]">{item.name}</td>
                          <td className="p-2.5 text-center font-bold text-[#2B2B2B]">{qty}</td>
                          <td className="p-2.5 text-right text-[#8A7968]">₹{price}</td>
                          <td className="p-2.5 text-right font-bold text-[#2B2B2B]">₹{price * qty}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Calculation Summary */}
                <div className="flex justify-end mb-6">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-[#8A7968]">
                      <span>Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-[#8A7968]">
                      <span>Shipping & Handling:</span>
                      <span className="font-bold text-green-700">FREE</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-[#2B2B2B] border-t-2 border-[#8A7968]/30 pt-2">
                      <span>Grand Total:</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#8A7968]/20 pt-4 text-center text-[10px] text-[#8A7968]">
                  <p>Thank you for choosing Mahin's One-Stop One-Store!</p>
                  <p>This is a computer-generated receipt. For support, write to orders@mahinsonestoponestore.in</p>
                </div>
              </div>
            ) : (
              /* ================== SHIPPING LABEL & PACKING SLIP LAYOUT ================== */
              <div>
                <div className="border-2 border-dashed border-[#8A7968]/50 p-6 rounded-2xl mb-6 bg-[#F4EADE]/60">
                  {/* Header Bar */}
                  <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-4 mb-4">
                    <div>
                      <h2 className="text-xl font-black text-[#2B2B2B]">STANDARD SHIPMENT</h2>
                      <span className="text-xs font-mono font-bold text-[#B76E79]">
                        TRACKING: {order.tracking_id}
                      </span>
                    </div>
                    <span className="text-xs font-bold bg-[#EADBC8] text-[#2B2B2B] px-3 py-1.5 rounded-full border border-[#8A7968]/30">
                      {order.payment_method?.includes('COD') ? 'CASH ON DELIVERY' : 'PREPAID'}
                    </span>
                  </div>

                  {/* Addresses Grid (FROM & TO) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* FROM SENDER */}
                    <div className="bg-[#EFE3D3] p-3.5 rounded-xl border border-[#8A7968]/30">
                      <span className="text-[10px] font-bold text-[#8A7968] uppercase tracking-widest block mb-1">
                        FROM (SENDER / DISPATCH):
                      </span>
                      <h3 className="text-sm font-extrabold text-[#2B2B2B]">Mahin's One-Stop One-Store</h3>
                      <p className="text-xs text-[#8A7968] leading-relaxed mt-1">
                        Electronics, Robotics & STEM Solutions
                      </p>
                      <p className="text-xs text-[#8A7968]">Email: mahinsonestoponestore@gmail.com</p>
                      <p className="text-xs text-[#8A7968]">Web: www.mahinsonestoponestore.in</p>
                    </div>

                    {/* TO RECIPIENT */}
                    <div className="bg-[#B76E79]/10 p-3.5 rounded-xl border border-[#B76E79]/30">
                      <span className="text-[10px] font-bold text-[#B76E79] uppercase tracking-widest block mb-1">
                        DELIVER TO (RECIPIENT):
                      </span>
                      <h3 className="text-sm font-black text-[#2B2B2B]">{order.customer_name || 'Customer'}</h3>
                      <p className="text-xs text-[#2B2B2B] leading-relaxed mt-1">{order.shipping_address}</p>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="border-t border-[#8A7968]/20 pt-3 flex justify-between text-[11px] text-[#8A7968]">
                    <div>
                      <strong className="text-[#2B2B2B]">Order ID:</strong> #{order.tracking_id?.slice(0, 10)}
                    </div>
                    <div>
                      <strong className="text-[#2B2B2B]">Dispatch Date:</strong> {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Checklist Table */}
                <h4 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider mb-2">
                  Package Contents Checklist
                </h4>
                <div className="border border-[#8A7968]/30 rounded-xl overflow-hidden text-xs bg-[#F4EADE]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#EADBC8] text-[#2B2B2B] font-bold border-b border-[#8A7968]/20">
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-center">Quantity</th>
                        <th className="p-2.5 text-center">Verified [✓]</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-[#8A7968]/15">
                          <td className="p-2.5 font-semibold text-[#2B2B2B]">{item.name}</td>
                          <td className="p-2.5 text-center font-bold text-[#2B2B2B]">{item.quantity || 1}</td>
                          <td className="p-2.5 text-center">
                            <span className="inline-block w-4 h-4 border border-[#8A7968] rounded bg-white"></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}