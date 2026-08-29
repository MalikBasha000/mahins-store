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
  // Replace '919876543210' with your actual store WhatsApp number with country code
  const STORE_ADMIN_PHONE = '919876543210' 

  let targetPhone = STORE_ADMIN_PHONE
  let message = ''

  const itemsFormatted = Array.isArray(items) 
    ? items.map(i => `• ${i.name} (${i.quantity}x) - ₹${i.price * i.quantity}`).join('\n') 
    : 'Custom Order'

  if (isToCustomer && customerPhone) {
    targetPhone = customerPhone.replace(/\D/g, '')
    if (targetPhone.length === 10) targetPhone = `91${targetPhone}`

    message = `Hello *${customerName}*! 👋\n\nThank you for shopping at *Mahin's One-Stop One-Store*!\n\n📦 *Order Status:* ${status}\n🆔 *Tracking ID:* \`${trackingId}\`\n\n*Items Ordered:*\n${itemsFormatted}\n\n💰 *Total Amount:* ₹${totalAmount}\n\nWe will notify you once your package dispatches!`
  } else {
    message = `Hello Mahin! I just placed an order on your store.\n\n👤 *Customer:* ${customerName}\n🆔 *Tracking ID:* \`${trackingId}\`\n\n*Items:*\n${itemsFormatted}\n\n💰 *Total:* ₹${totalAmount}`
  }

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
}