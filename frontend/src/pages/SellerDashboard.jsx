import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, Sector
} from 'recharts'
import api from "../api"
import Navbar from "../components/Navbar"
import "./main.css"

/* ── Custom Tooltips ────────────────────────────────────────── */

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: entry.color }} />
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 600, fontFamily: 'Space Mono, monospace', color: 'var(--text)' }}>
              {prefix}{Number(entry.value).toLocaleString()}{suffix}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="var(--text)" fontSize="13px" fontWeight={600}>
        {payload.category_name || payload.status}
      </text>
      <text x={cx} y={cy + 12} dy={8} textAnchor="middle" fill="var(--text-muted)" fontSize="11px" fontFamily="Space Mono, monospace">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} fill={fill} />
    </g>
  )
}

/* ── Components ─────────────────────────────────────────────── */

function MiniStat({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '100px', opacity: 0.05, filter: 'grayscale(100%)' }}>{icon}</div>
      <div className="stat-label" style={{ position: 'relative', zIndex: 1 }}>{icon} {label}</div>
      <div className={`stat-value ${color || ''}`} style={{ position: 'relative', zIndex: 1 }}>{value}</div>
      {sub && <div className="stat-sub" style={{ position: 'relative', zIndex: 1 }}>{sub}</div>}
    </div>
  )
}

function GrowthIndicator({ value, label }) {
  const isPositive = value >= 0
  return (
    <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isPositive ? 'var(--green)' : 'var(--red)', fontSize: '20px' }}>
        {isPositive ? '↑' : '↓'}
      </div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Space Mono, monospace', color: isPositive ? 'var(--green)' : 'var(--red)' }}>
          {isPositive ? '+' : ''}{value}%
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  )
}

/* ── Product Performance Table ──────────────────────────────── */

function ProductPerformanceTable({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' })

  const sortedData = useMemo(() => {
    let sortableItems = [...data]
    sortableItems.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sortableItems
  }, [data, sortConfig])

  const requestSort = (key) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const maxUnits = Math.max(...data.map(d => d.units_sold), 1)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ width: '100%', minWidth: '600px' }}>
        <thead>
          <tr>
            <th style={{ width: '40px' }}>#</th>
            <th>Product Name</th>
            <th>Category</th>
            <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => requestSort('units_sold')}>
              Units Sold {sortConfig.key === 'units_sold' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => requestSort('revenue')}>
              Revenue {sortConfig.key === 'revenue' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={item.product_id}>
              <td className="rank" style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
              <td style={{ fontWeight: 500, color: 'var(--text)' }}>{item.product_name}</td>
              <td><span style={{ background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-soft)' }}>{item.category}</span></td>
              
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>{item.units_sold}</span>
                  <div style={{ width: '60px', height: '4px', background: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(item.units_sold / maxUnits) * 100}%`, height: '100%', background: 'var(--blue)' }} />
                  </div>
                </div>
              </td>
              
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <span className="money" style={{ color: 'var(--accent)', fontWeight: 600 }}>PKR {Number(item.revenue).toLocaleString()}</span>
                  <div style={{ width: '60px', height: '4px', background: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(item.revenue / maxRevenue) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                </div>
              </td>
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No products found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ── Main Dashboard ─────────────────────────────────────────── */

export default function SellerDashboard() {
  const [dashData, setDashData] = useState(null)
  const [cityData, setCityData] = useState([])
  const [catData, setCatData] = useState([])
  const [customerData, setCustomerData] = useState(null)
  const [statusData, setStatusData] = useState([])
  const [allProductsData, setAllProductsData] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState(null)
  const [activePieIndex, setActivePieIndex] = useState(0)
  
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [dashRes, cityRes, catRes, custRes, statusRes, productsRes] = await Promise.all([
          api.get("/api/analytics/seller-dashboard/"),
          api.get("/api/analytics/revenue-by-city/"),
          api.get("/api/analytics/category-performance/"),
          api.get("/api/analytics/customer-insights/"),
          api.get("/api/analytics/order-status/"),
          api.get("/api/analytics/top-products/") // Now returns all products
        ])
        if (!cancelled) {
          setDashData(dashRes.data)
          setCityData(cityRes.data)
          setCatData(catRes.data)
          setCustomerData(custRes.data)
          setStatusData(statusRes.data)
          setAllProductsData(productsRes.data)
        }
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 403) navigate("/")
          else setError("Failed to load dashboard data.")
        }
      } finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [navigate])

  const NAV = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "analytics", icon: "📈", label: "Analytics" },
    { id: "inventory", icon: "🏆", label: "Inventory Performance" },
    { id: "products", icon: "📦", label: "My Products", onClick: () => navigate("/seller/products") },
    { id: "orders", icon: "🧾", label: "Orders", onClick: () => navigate("/seller/orders") },
  ]

  if (loading) return (
    <div className="app-shell"><Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--text-muted)', fontSize: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Loading business intelligence...
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="app-shell"><Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 'var(--navbar-h)', color: 'var(--red)', fontSize: 14 }}>{error}</div>
    </div>
  )

  const { summary = {}, monthly_trend = [] } = dashData || {}
  const cs = customerData?.customer_segments || {}
  const growth = customerData?.growth || {}
  
  const COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#14b8a6','#f59e0b','#ef4444']
  const STATUS_COLORS = { PENDING: '#3b82f6', SHIPPED: '#f97316', DELIVERED: '#22c55e', CANCELLED: '#ef4444' }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dash-sidebar-section">
            <div className="dash-sidebar-label">BI Dashboard</div>
            {NAV.map(item => (
              <button key={item.id} className={`dash-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => item.onClick ? item.onClick() : setActiveTab(item.id)}>
                <span className="dash-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
          <div className="dash-sidebar-section" style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="dash-sidebar-label">Quick Links</div>
            <Link to="/" className="dash-nav-item"><span className="dash-nav-icon">🛍️</span>Shop Front</Link>
          </div>
        </aside>

        <main className="dashboard-main">

          {/* ════════════ OVERVIEW TAB ════════════ */}
          {activeTab === "overview" && (<>
            <div className="dashboard-greeting">
              <h2>Executive <span>Summary</span></h2>
              <p>High-level metrics for your storefront</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <MiniStat icon="💰" label="Total Revenue" value={`PKR ${Number(summary.total_revenue||0).toLocaleString()}`} sub="All time net revenue" color="accent" />
              <MiniStat icon="🧾" label="Total Orders" value={summary.total_orders||0} sub="Completed & pending" color="blue" />
              <MiniStat icon="👥" label="Total Customers" value={cs.total || 0} sub="Unique buyers" color="green" />
              <MiniStat icon="💵" label="Avg Order Value" value={`PKR ${Number(summary.avg_order_value||0).toLocaleString()}`} sub="Per transaction" color="accent" />
            </div>

            {/* Growth indicators */}
            {(growth.order_growth !== undefined) && (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <GrowthIndicator value={growth.revenue_growth} label="30-Day Revenue vs Previous" />
                <GrowthIndicator value={growth.order_growth} label="30-Day Orders vs Previous" />
                
                <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', fontSize: '20px' }}>⚠️</div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Space Mono, monospace', color: 'var(--red)' }}>{summary.low_stock_count || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Low Stock Items</div>
                  </div>
                </div>
              </div>
            )}

            <div className="charts-grid">
              {/* Monthly trend (Area Chart) */}
              <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                <div className="chart-card-title"><span>📈</span> Revenue Trend</div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart data={monthly_trend} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value/1000}k`} />
                      <Tooltip content={<CustomTooltip prefix="PKR " />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* City Revenue (Bar Chart) */}
              <div className="chart-card">
                <div className="chart-card-title"><span>🗺️</span> Revenue by City</div>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={cityData.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `${value/1000}k`} />
                      <YAxis dataKey="city" type="category" stroke="var(--text-muted)" fontSize={12} width={80} />
                      <Tooltip content={<CustomTooltip prefix="PKR " />} cursor={{fill: 'var(--bg-hover)'}} />
                      <Bar dataKey="revenue" name="Revenue" fill="var(--blue)" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown (Pie Chart) */}
              <div className="chart-card">
                <div className="chart-card-title"><span>🥧</span> Category Breakdown</div>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie 
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        data={catData} 
                        cx="50%" cy="50%" 
                        innerRadius={60} outerRadius={80} 
                        dataKey="revenue"
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                        stroke="var(--bg-card)"
                        strokeWidth={2}
                      >
                        {catData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>)}

          {/* ════════════ ANALYTICS TAB ════════════ */}
          {activeTab === "analytics" && (<>
            <div className="dashboard-greeting">
              <h2>Deep <span>Analytics</span></h2>
              <p>Explore detailed metrics across your store</p>
            </div>

            <div className="charts-grid">
              {/* Order Volume */}
              <div className="chart-card full-width">
                <div className="chart-card-title"><span>📦</span> Order Volume Trend</div>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={monthly_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip suffix=" orders" />} cursor={{fill: 'var(--bg-hover)'}} />
                      <Bar dataKey="orders" name="Orders" fill="var(--blue)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Status Distribution */}
              <div className="chart-card">
                <div className="chart-card-title"><span>📊</span> Order Status Distribution</div>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="status"
                        paddingAngle={2} stroke="none">
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip suffix=" orders" />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-soft)' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Revenue */}
              <div className="chart-card">
                <div className="chart-card-title"><span>💰</span> Revenue by Status</div>
                {statusData.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data</div> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {statusData.map((s, i) => {
                      const totalRev = statusData.reduce((sum, d) => sum + d.revenue, 0)
                      const pct = totalRev > 0 ? (s.revenue / totalRev * 100) : 0
                      const color = STATUS_COLORS[s.status] || 'var(--accent)'
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                            <span style={{ color: color, fontWeight: 600 }}>{s.status}</span>
                            <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-soft)', fontSize: '12px' }}>
                              PKR {Number(s.revenue).toLocaleString()} <span style={{ opacity: 0.5 }}>({pct.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Rating trend */}
              {customerData?.rating_trend?.length > 0 && (
                <div className="chart-card full-width">
                  <div className="chart-card-title"><span>⭐</span> Average Rating Trend</div>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <AreaChart data={customerData.rating_trend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorStar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip suffix=" ★" />} />
                        <Area type="monotone" dataKey="avg_rating" name="Rating" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorStar)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </>)}

          {/* ════════════ INVENTORY TAB ════════════ */}
          {activeTab === "inventory" && (<>
            <div className="dashboard-greeting">
              <h2>Inventory <span>Performance</span></h2>
              <p>Sort and analyze your product catalogue to identify winners and losers</p>
            </div>

            <div className="chart-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="chart-card-title" style={{ padding: '24px 24px 16px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
                <span>🏆</span> Comprehensive Product Metrics
              </div>
              <div style={{ padding: '0 24px 24px 24px' }}>
                <ProductPerformanceTable data={allProductsData} />
              </div>
            </div>
          </>)}

        </main>
      </div>
    </div>
  )
}
