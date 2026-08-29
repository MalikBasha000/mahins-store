// lib/whatsapp-link.ts

export function generateWhatsAppLink({
  customerPhone,
  customerName,
  trackingId,
  items,
  totalAmount,
  status,
  isToCustomer = true,
}: {
  customerPhone?: string
  customerName: string
  trackingId: string
  items: any[]
  totalAmount: number
  status: string
  isToCustomer?: boolean
}) {
  // Replace with your actual store WhatsApp number with country code (e.g. 919876543210)
  const STORE_ADMIN_PHONE = '919876543210' 

  let targetPhone = STORE_ADMIN_PHONE
  let message = ''

  // Format each item with calculation: Name (Qty x Price = Subtotal)
  const itemsFormatted = Array.isArray(items) 
    ? items.map(i => {
        const qty = Number(i.quantity) || 1
        const price = Number(i.price) || 0
        const subtotal = qty * price
        return `• *${i.name}*\n   Qty: ${qty} × ₹${price} = *₹${subtotal}*`
      }).join('\n\n') 
    : '• Custom Order'

  // Direct tracking link pointing to your store's tracking or orders page
  const trackingLink = `https://mahinsonestoponestore.in/orders?tracking=${trackingId}`

  if (isToCustomer && customerPhone) {
    targetPhone = customerPhone.replace(/\D/g, '')
    if (targetPhone.length === 10) targetPhone = `91${targetPhone}`

    message = `Hello *${customerName}*! 👋\n\nThank you for shopping at *Mahin's One-Stop One-Store*!\n\n📦 *Order Status:* ${status}\n🆔 *Tracking ID:* \`${trackingId}\`\n\n*📋 Itemized Order Summary:*\n${itemsFormatted}\n\n━━━━━━━━━━━━━━━━━\n💰 *Total Payable Amount:* *₹${totalAmount}*\n━━━━━━━━━━━━━━━━━\n\n🔗 *Track Your Order Live Here:*\n${trackingLink}\n\nWe will notify you once your package dispatches!`
  } else {
    message = `Hello Mahin! A new order has been placed on your store.\n\n👤 *Customer:* ${customerName}\n🆔 *Tracking ID:* \`${trackingId}\`\n\n*📋 Items:*\n${itemsFormatted}\n\n💰 *Total:* *₹${totalAmount}*`
  }

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
}