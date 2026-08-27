// app/admin/OrderInvoiceModal.tsx
'use client'

import React, { useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface OrderInvoiceModalProps {
  order: any
  type: 'INVOICE' | 'PACKING_SLIP'
  onClose: () => void
}

export default function OrderInvoiceModal({ order, type, onClose }: OrderInvoiceModalProps) {
  const documentRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return

    const canvas = await html2canvas(documentRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const filename = `${type === 'INVOICE' ? 'Invoice' : 'PackingSlip'}_${order.tracking_id}.pdf`
    pdf.save(filename)
  }

  const handlePrint = () => {
    window.print()
  }

  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce(
    (acc: number, item: any) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  )
  const totalAmount = Number(order.total_amount || order.final_payable_amount || subtotal)

  return (
    <div className="fixed inset-0 bg-black/75 flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 my-8">
        {/* Action Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              {type === 'INVOICE' ? 'Tax Invoice & Receipt' : 'Shipping Label & Packing Slip'}
            </span>
            <h3 className="text-xl font-black text-gray-900 mt-0.5">Order #{order.tracking_id}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              🖨️ Quick Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              ⬇️ Download PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 font-bold text-lg bg-gray-100 px-3 py-1 rounded-full cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 max-h-[65vh] overflow-y-auto flex justify-center">
          <div
            ref={documentRef}
            className="bg-white p-8 w-full max-w-2xl rounded-xl shadow-sm text-gray-900 font-sans"
            style={{ minHeight: '800px' }}
          >
            {type === 'INVOICE' ? (
              /* ================== TAX INVOICE LAYOUT ================== */
              <div>
                <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-6 mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
                      Mahin's One-Stop One-Store
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Electronics, Robotics & STEM Components</p>
                    <p className="text-xs text-gray-500">Website: www.mahinsonestoponestore.in</p>
                    <p className="text-xs text-gray-500">Contact: mahinsonestoponestore@gmail.com</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black uppercase tracking-widest text-indigo-900 block">
                      TAX INVOICE
                    </span>
                    <span className="text-xs text-gray-500 block mt-1">
                      Invoice No: <strong className="font-mono text-gray-800">INV-{order.tracking_id.slice(0, 8)}</strong>
                    </span>
                    <span className="text-xs text-gray-500 block">
                      Date: <strong className="text-gray-800">{new Date(order.created_at).toLocaleDateString()}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="font-bold text-indigo-900 uppercase block mb-1">Billed & Shipped To:</span>
                    <p className="font-extrabold text-sm text-gray-900 mb-1">{order.customer_name || 'Customer'}</p>
                    <p className="text-gray-600 leading-relaxed">{order.shipping_address}</p>
                    {order.customer_email && (
                      <p className="text-gray-600 mt-2">
                        <strong>Email:</strong> {order.customer_email}
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="font-bold text-indigo-900 uppercase block mb-1">Order Details:</span>
                    <p className="text-gray-600">
                      <strong>Tracking ID:</strong> <span className="font-mono text-gray-900">{order.tracking_id}</span>
                    </p>
                    <p className="text-gray-600 mt-1">
                      <strong>Payment Mode:</strong> {order.payment_method || 'Online'}
                    </p>
                    <p className="text-gray-600 mt-1">
                      <strong>Status:</strong>{' '}
                      <span className="font-bold uppercase text-indigo-700">{order.status || 'Pending'}</span>
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse text-xs mb-6">
                  <thead>
                    <tr className="bg-indigo-950 text-white font-bold">
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
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="p-2.5 font-bold text-gray-900">{item.name}</td>
                          <td className="p-2.5 text-center font-bold">{qty}</td>
                          <td className="p-2.5 text-right">₹{price}</td>
                          <td className="p-2.5 text-right font-bold text-gray-900">₹{price * qty}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Calculation Summary */}
                <div className="flex justify-end mb-8">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping & Handling:</span>
                      <span className="font-bold text-green-700">FREE</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-indigo-950 border-t-2 border-gray-300 pt-2">
                      <span>Grand Total:</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 text-center text-[10px] text-gray-400">
                  <p>Thank you for choosing Mahin's One-Stop One-Store!</p>
                  <p>This is a computer-generated receipt. For support, reply to orders@mahinsonestoponestore.in</p>
                </div>
              </div>
            ) : (
              /* ================== SHIPPING LABEL & PACKING SLIP LAYOUT ================== */
              <div>
                <div className="border-2 border-dashed border-gray-400 p-6 rounded-2xl mb-6">
                  {/* Header Bar */}
                  <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">STANDARD SHIPMENT</h2>
                      <span className="text-xs font-mono font-bold text-indigo-800">
                        TRACKING: {order.tracking_id}
                      </span>
                    </div>
                    <span className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-full border border-gray-300">
                      {order.payment_method?.includes('COD') ? 'CASH ON DELIVERY' : 'PREPAID'}
                    </span>
                  </div>

                  {/* Addresses Grid (FROM & TO) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* FROM SENDER */}
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                        FROM (SENDER / DISPATCH):
                      </span>
                      <h3 className="text-sm font-extrabold text-indigo-950">Mahin's One-Stop One-Store</h3>
                      <p className="text-xs text-gray-700 leading-relaxed mt-1">
                        Electronics, Robotics & STEM Solutions
                      </p>
                      <p className="text-xs text-gray-700">Email: mahinsonestoponestore@gmail.com</p>
                      <p className="text-xs text-gray-700">Web: www.mahinsonestoponestore.in</p>
                    </div>

                    {/* TO RECIPIENT */}
                    <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                        DELIVER TO (RECIPIENT):
                      </span>
                      <h3 className="text-sm font-black text-gray-900">{order.customer_name || 'Customer'}</h3>
                      <p className="text-xs text-gray-800 leading-relaxed mt-1">{order.shipping_address}</p>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="border-t pt-3 flex justify-between text-[11px] text-gray-500">
                    <div>
                      <strong>Order ID:</strong> #{order.tracking_id.slice(0, 10)}
                    </div>
                    <div>
                      <strong>Dispatch Date:</strong> {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Checklist Table */}
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Package Contents Checklist
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-b">
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-center">Quantity</th>
                        <th className="p-2.5 text-center">Verified [✓]</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="p-2.5 font-semibold text-gray-800">{item.name}</td>
                          <td className="p-2.5 text-center font-bold">{item.quantity || 1}</td>
                          <td className="p-2.5 text-center">
                            <span className="inline-block w-4 h-4 border border-gray-400 rounded"></span>
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