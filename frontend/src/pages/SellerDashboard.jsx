import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import "./main.css";

// ── Bar Chart ──────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "13px",
        }}
      >
        No data available
      </div>
    );
  }

  const max = Math.max(...data.map((d) => Number(d[valueKey])));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "6px",
        height: "130px",
        padding: "0 4px",
      }}
    >
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const heightPct = max > 0 ? Math.max(4, (val / max) * 100) : 4;
        const label = String(d[labelKey]);
        const shortLabel = label.length > 7 ? label.slice(0, 7) : label;

        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <div
              title={`${d[labelKey]}: ${val.toLocaleString()}`}
              style={{
                width: "100%",
                height: `${heightPct}%`,
                background: color || "var(--accent)",
                borderRadius: "3px 3px 0 0",
                opacity: 0.85,
                transition: "height 0.5s ease",
                cursor: "default",
              }}
            />
            <span
              style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                maxWidth: "100%",
                textOverflow: "ellipsis",
              }}
            >
              {shortLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut Chart ────────────────────────────────────────────────
function DonutChart({ data, valueKey, labelKey }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "13px",
        }}
      >
        No data available
      </div>
    );
  }

  const COLORS = [
    "#f97316",
    "#3b82f6",
    "#22c55e",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
    "#f59e0b",
    "#ef4444",
  ];
  const sliced = data.slice(0, 6);
  const total = sliced.reduce((s, d) => s + Number(d[valueKey]), 0);

  // Build slices using reduce — no variable mutation after render
  const { slices } = sliced.reduce(
    (acc, d, i) => {
      const pct = Number(d[valueKey]) / total;
      const angle = pct * 360;
      const startAngle = acc.cumAngle;
      const endAngle = startAngle + angle;
      const r = 60,
        cx = 80,
        cy = 80;
      const toRad = (deg) => (deg * Math.PI) / 180;
      const x1 = cx + r * Math.cos(toRad(startAngle));
      const y1 = cy + r * Math.sin(toRad(startAngle));
      const x2 = cx + r * Math.cos(toRad(endAngle));
      const y2 = cy + r * Math.sin(toRad(endAngle));
      const large = angle > 180 ? 1 : 0;

      acc.slices.push({
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
        color: COLORS[i],
        label: d[labelKey],
        pct: (pct * 100).toFixed(1),
      });

      return { slices: acc.slices, cumAngle: endAngle };
    },
    { slices: [], cumAngle: -90 },
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        flexWrap: "wrap",
      }}
    >
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        style={{ flexShrink: 0 }}
      >
        <circle cx="80" cy="80" r="60" fill="var(--bg-card)" />
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity="0.9">
            <title>
              {s.label}: {s.pct}%
            </title>
          </path>
        ))}
        <circle cx="80" cy="80" r="35" fill="var(--bg-elevated)" />
        <text
          x="80"
          y="76"
          textAnchor="middle"
          fill="var(--text)"
          fontSize="10"
          fontFamily="Space Mono, monospace"
        >
          REVENUE
        </text>
        <text
          x="80"
          y="90"
          textAnchor="middle"
          fill="var(--accent)"
          fontSize="10"
          fontFamily="Space Mono, monospace"
        >
          BY CAT
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "2px",
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "var(--text-soft)" }}>{s.label}</span>
            <span
              style={{
                color: "var(--text-muted)",
                marginLeft: "auto",
                fontFamily: "Space Mono, monospace",
                fontSize: "11px",
              }}
            >
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, sub, colorClass }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${colorClass || ""}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ── SellerDashboard ────────────────────────────────────────────
export default function SellerDashboard() {
  const [dashData, setDashData] = useState(null);
  const [cityData, setCityData] = useState([]);
  const [catData, setCatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [dashRes, cityRes, catRes] = await Promise.all([
          api.get("/api/analytics/seller-dashboard/"),
          api.get("/api/analytics/revenue-by-city/"),
          api.get("/api/analytics/category-performance/"),
        ]);
        if (!cancelled) {
          setDashData(dashRes.data);
          setCityData(cityRes.data.slice(0, 8));
          setCatData(catRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          // If 403, user is not a seller — redirect home
          if (err.response?.status === 403) navigate("/");
          else setError("Failed to load dashboard data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const NAV = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "analytics", icon: "📈", label: "Analytics" },
    {
      id: "products",
      icon: "📦",
      label: "My Products",
      onClick: () => navigate("/seller/products"),
    },
    {
      id: "orders",
      icon: "🧾",
      label: "Orders",
      onClick: () => navigate("/seller/orders"),
    },
  ];

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            paddingTop: "var(--navbar-h)",
            color: "var(--text-muted)",
            fontSize: "14px",
          }}
        >
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <Navbar />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            paddingTop: "var(--navbar-h)",
            color: "var(--red)",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  const {
    summary = {},
    top_products = [],
    monthly_trend = [],
  } = dashData || {};

  return (
    <div className="app-shell">
      <Navbar />

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dash-sidebar-section">
            <div className="dash-sidebar-label">Seller Panel</div>
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`dash-nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div
            className="dash-sidebar-section"
            style={{
              marginTop: "16px",
              borderTop: "1px solid var(--border)",
              paddingTop: "16px",
            }}
          >
            <div className="dash-sidebar-label">Quick Links</div>
            <Link to="/" className="dash-nav-item">
              <span className="dash-nav-icon">🛍️</span>
              Browse as Customer
            </Link>
            <Link to="/seller/products/add" className="dash-nav-item">
              <span className="dash-nav-icon">➕</span>
              Add Product
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="dashboard-main">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <>
              <div className="dashboard-greeting">
                <h2>
                  Seller <span>Dashboard</span>
                </h2>
                <p>Here's how your store is performing</p>
              </div>

              <div className="stats-grid">
                <StatCard
                  label="💰 Total Revenue"
                  value={`PKR ${Number(summary.total_revenue || 0).toLocaleString()}`}
                  sub="All time"
                  colorClass="accent"
                />
                <StatCard
                  label="🧾 Total Orders"
                  value={summary.total_orders || 0}
                  sub="Excluding cancelled"
                  colorClass="blue"
                />
                <StatCard
                  label="📦 Products Listed"
                  value={summary.total_products || 0}
                  sub="Active listings"
                  colorClass="green"
                />
                <StatCard
                  label="⚠️ Low Stock"
                  value={summary.low_stock_count || 0}
                  sub="Items with ≤ 5 units"
                  colorClass="red"
                />
              </div>

              {/* Monthly trend */}
              <div className="chart-card" style={{ marginBottom: "16px" }}>
                <div className="chart-card-title">
                  <span>📈</span> Monthly Revenue Trend
                </div>
                <BarChart
                  data={monthly_trend}
                  valueKey="revenue"
                  labelKey="month"
                  color="var(--accent)"
                />
              </div>

              <div className="charts-grid">
                {/* Top products table */}
                <div className="chart-card">
                  <div className="chart-card-title">
                    <span>🏆</span> Top Products
                  </div>
                  {top_products.length === 0 ? (
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        padding: "12px 0",
                      }}
                    >
                      No data yet
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Units</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top_products.map((p, i) => (
                          <tr key={i}>
                            <td className="rank">#{i + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.units}</td>
                            <td className="money">
                              PKR {Number(p.revenue).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Revenue by city */}
                <div className="chart-card">
                  <div className="chart-card-title">
                    <span>🗺️</span> Revenue by City
                  </div>
                  <BarChart
                    data={cityData}
                    valueKey="revenue"
                    labelKey="city"
                    color="var(--blue)"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Analytics ── */}
          {activeTab === "analytics" && (
            <>
              <div className="dashboard-greeting">
                <h2>
                  Deep <span>Analytics</span>
                </h2>
                <p>Real-time SQL-powered insights</p>
              </div>

              <div className="charts-grid">
                <div className="chart-card full-width">
                  <div className="chart-card-title">
                    <span>📈</span> Monthly Revenue
                  </div>
                  <BarChart
                    data={monthly_trend}
                    valueKey="revenue"
                    labelKey="month"
                    color="var(--accent)"
                  />
                </div>

                <div className="chart-card full-width">
                  <div className="chart-card-title">
                    <span>📦</span> Monthly Orders
                  </div>
                  <BarChart
                    data={monthly_trend}
                    valueKey="orders"
                    labelKey="month"
                    color="var(--blue)"
                  />
                </div>

                <div className="chart-card full-width">
                  <div className="chart-card-title">
                    <span>🗺️</span> Revenue by City
                  </div>
                  <BarChart
                    data={cityData}
                    valueKey="revenue"
                    labelKey="city"
                    color="var(--green)"
                  />
                </div>

                <div className="chart-card full-width">
                  <div className="chart-card-title">
                    <span>🥧</span> Category Breakdown
                  </div>
                  <DonutChart
                    data={catData}
                    valueKey="revenue"
                    labelKey="category_name"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Products (placeholder) ── */}
          {activeTab === "products" && (
            <>
              <div className="dashboard-greeting">
                <h2>
                  My <span>Products</span>
                </h2>
                <p>Manage your store listings</p>
              </div>
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>Product management coming soon</h3>
                <p>You'll be able to add, edit and remove products here</p>
              </div>
            </>
          )}

          {/* ── Orders (placeholder) ── */}
          {activeTab === "orders" && (
            <>
              <div className="dashboard-greeting">
                <h2>
                  Incoming <span>Orders</span>
                </h2>
                <p>View and update customer orders</p>
              </div>
              <div className="empty-state">
                <div className="empty-state-icon">🧾</div>
                <h3>Orders view coming soon</h3>
                <p>You'll be able to manage order statuses here</p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
