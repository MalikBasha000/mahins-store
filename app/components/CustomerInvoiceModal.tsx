// app/components/CustomerInvoiceModal.tsx
'use client'

import React, { useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface CustomerInvoiceModalProps {
  order: any
  onClose: () => void
}

export default function CustomerInvoiceModal({ order, onClose }: CustomerInvoiceModalProps) {
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

    pdf.save(`Invoice_${order.tracking_id}.pdf`)
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
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
          <div>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded border border-green-200">
              Delivered • Official Receipt
            </span>
            <h3 className="text-xl font-black text-gray-900 mt-1">Invoice #{order.tracking_id}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              🖨️ Print
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

        <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 max-h-[65vh] overflow-y-auto flex justify-center">
          <div
            ref={documentRef}
            className="bg-white p-8 w-full max-w-2xl rounded-xl shadow-sm text-gray-900 font-sans"
            style={{ minHeight: '800px' }}
          >
            {/* Invoice Header */}
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

            {/* Billed To Details */}
            <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="font-bold text-indigo-900 uppercase block mb-1">Billed & Delivered To:</span>
                <p className="font-extrabold text-sm text-gray-900 mb-1">{order.customer_name || 'Customer'}</p>
                <p className="text-gray-600 leading-relaxed">{order.shipping_address}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="font-bold text-indigo-900 uppercase block mb-1">Order Summary:</span>
                <p className="text-gray-600">
                  <strong>Tracking ID:</strong> <span className="font-mono text-gray-900">{order.tracking_id}</span>
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Payment Mode:</strong> {order.payment_method || 'Online'}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Status:</strong> <span className="font-bold text-green-700 uppercase">Delivered ✓</span>
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

            {/* Summary */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span className="font-bold text-green-700">FREE</span>
                </div>
                <div className="flex justify-between font-black text-sm text-indigo-950 border-t-2 border-gray-300 pt-2">
                  <span>Grand Total Paid:</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 text-center text-[10px] text-gray-400">
              <p>Thank you for shopping with Mahin's One-Stop One-Store!</p>
              <p>This is an official receipt for your delivered order.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}