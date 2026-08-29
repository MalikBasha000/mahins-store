// app/admin/SalesCharts.tsx
'use client'

export default function SalesCharts({ orders, products }: { orders: any[]; products: any[] }) {
  // Filter out cancelled orders for revenue calculations
  const validOrders = orders.filter(o => o.status !== 'Cancelled')

  // 1. Group Revenue by Status
  const statusCounts = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Processing: orders.filter(o => o.status === 'Processing').length,
    Shipped: orders.filter(o => o.status === 'Shipped').length,
    Delivered: orders.filter(o => o.status === 'Delivered').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  }

  const maxStatusCount = Math.max(...Object.values(statusCounts), 1)

  // 2. Calculate Category Distribution
  const categoryRevenueMap = new Map<string, number>()
  for (const o of validOrders) {
    if (Array.isArray(o.items)) {
      for (const item of o.items) {
        const cat = item.category || 'General'
        const rev = (Number(item.price) || 0) * (Number(item.quantity) || 1)
        categoryRevenueMap.set(cat, (categoryRevenueMap.get(cat) || 0) + rev)
      }
    }
  }
  const categoryData = Array.from(categoryRevenueMap.entries()).map(([category, revenue]) => ({ category, revenue }))
  const maxCategoryRevenue = Math.max(...categoryData.map(c => c.revenue), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Chart 1: Order Status Distribution Bars */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 mb-1">📊 Order Pipeline Volume</h3>
        <p className="text-xs text-gray-500 mb-6">Real-time count of orders across fulfillment stages</p>

        <div className="space-y-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            const percentage = Math.round((count / maxStatusCount) * 100)
            const barColor = 
              status === 'Delivered' ? 'bg-green-600' :
              status === 'Shipped' ? 'bg-purple-600' :
              status === 'Processing' ? 'bg-blue-600' :
              status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-500'

            return (
              <div key={status}>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-gray-700">{status}</span>
                  <span className="text-gray-900">{count} orders</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                    style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chart 2: Category Revenue Performance Bars */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 mb-1">💰 Revenue by Product Category</h3>
        <p className="text-xs text-gray-500 mb-6">Total earnings breakdown per store category</p>

        {categoryData.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs italic">
            No category revenue data available yet.
          </div>
        ) : (
          <div className="space-y-4">
            {categoryData.map(({ category, revenue }) => {
              const percentage = Math.round((revenue / maxCategoryRevenue) * 100)
              return (
                <div key={category}>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-gray-700">{category}</span>
                    <span className="text-indigo-900">₹{revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(percentage, revenue > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}