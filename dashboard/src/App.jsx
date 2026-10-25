import React, { useState, useEffect } from 'react';

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.em-root {
  --bg: #f5f6fb;
  --card: #ffffff;
  --ink: #1b1f3b;
  --muted: #6b7194;
  --line: #e6e8f2;
  --indigo: #4b4bf0;
  --coral: #f2583e;
  --teal: #12a594;
  --sun: #f5b52e;
  --plum: #9b4dca;
  --activity: #4b4bf0;
  --s1: #4b4bf0;
  --s2: #9b4dca;
  --s3: #f2583e;
  --s4: #f5b52e;
  --s5: #12a594;

  min-height: 100vh;
  background: var(--bg);
  transition: background 0.5s ease;
  color: var(--ink);
  padding: 32px 20px 56px;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-sizing: border-box;
}
.em-root *, .em-root *::before, .em-root *::after { box-sizing: border-box; }

/* Whole dashboard shifts to a warm alert palette when an SOS is active */
.em-root.alert-mode {
  --bg: #fff1ee;
  --line: #f5d3cb;
  --muted: #8a6a72;
  --activity: #7a1f3d;
  --s1: #f2583e;
  --s2: #f47c63;
  --s3: #f2583e;
  --s4: #f5b52e;
  --s5: #c2371f;
}
.em-stripe span, .em-activity { transition: background 0.5s ease; }
.alert-mode .em-header, .alert-mode .em-log { border-color: #f5d3cb; box-shadow: 0 8px 24px rgba(242, 88, 62, 0.10); }
.alert-mode .em-btn:hover { background: var(--coral); }
.alert-mode .em-table tbody tr:hover { background: #fff7f5; }
.alert-mode .em-table td { color: #4a3340; }

@keyframes em-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(242, 88, 62, 0.45); }
  70%  { box-shadow: 0 0 0 18px rgba(242, 88, 62, 0); }
  100% { box-shadow: 0 0 0 0 rgba(242, 88, 62, 0); }
}
.em-state.alert { animation: em-pulse 2s ease-out 3; }
@media (prefers-reduced-motion: reduce) {
  .em-state.alert { animation: none; }
}
.em-wrap { max-width: 1000px; margin: 0 auto; }

/* Header */
.em-header {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(40, 44, 100, 0.06);
}
.em-stripe { display: flex; height: 6px; }
.em-stripe span { flex: 1; }
.em-header-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 22px 28px;
}
.em-title { margin: 0; font-size: 2.1rem; font-weight: 800; letter-spacing: -1px; line-height: 1; }
.em-sub { margin: 8px 0 0; color: var(--muted); font-size: 0.92rem; }

.em-status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
}
.em-status.ok { background: #e3f6f3; color: #0b7a6d; }
.em-status.down { background: #fde8e4; color: #c2371f; }
.em-dot { width: 9px; height: 9px; border-radius: 50%; background: currentColor; }

/* Overview */
.em-overview {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
.em-state {
  border-radius: 24px;
  padding: 30px;
  border: 1px solid var(--line);
}
.em-state.armed { background: #e6f6f3; border-color: #c4e9e3; }
.em-state.alert { background: var(--coral); border-color: var(--coral); color: #fff; box-shadow: 0 16px 40px rgba(242, 88, 62, 0.25); }
.em-chip {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}
.armed .em-chip { background: #fff; color: #0b7a6d; }
.alert .em-chip { background: rgba(255, 255, 255, 0.22); color: #fff; }
.em-state h2 { margin: 14px 0 22px; font-size: 2rem; font-weight: 800; letter-spacing: -0.8px; }
.em-state-msg { margin: 0; max-width: 460px; line-height: 1.6; color: #25605a; font-size: 1.02rem; }

.em-tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.em-tile {
  background: #fff;
  color: var(--ink);
  border-radius: 14px;
  padding: 14px 18px;
  border-left: 5px solid var(--accent);
}
.em-tile span { display: block; font-size: 0.82rem; color: var(--muted); margin-bottom: 4px; }
.em-tile strong { font-size: 1.05rem; word-break: break-word; }

.em-ack-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 20px; }
.em-ack {
  background: #fff;
  color: #c2371f;
  border: none;
  padding: 11px 20px;
  border-radius: 10px;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.em-ack:hover { background: #ffe9e4; }
.em-ack:focus-visible { outline: 3px solid var(--sun); outline-offset: 2px; }
.em-countdown { font-size: 0.88rem; font-weight: 500; color: rgba(255, 255, 255, 0.9); }
.em-last-note { margin: 14px 0 0; font-size: 0.9rem; font-weight: 600; color: #0b7a6d; }

/* Activity */
.em-activity {
  background: var(--activity);
  color: #fff;
  border-radius: 24px;
  padding: 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}
.em-activity::after {
  content: '';
  position: absolute;
  right: -40px;
  bottom: -40px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: var(--sun);
  opacity: 0.9;
}
.em-activity h3 { margin: 0; font-size: 1rem; font-weight: 600; color: rgba(255, 255, 255, 0.8); }
.em-count { font-size: 4rem; font-weight: 800; letter-spacing: -2px; line-height: 1; margin-top: 18px; }
.em-count-label { margin-top: 6px; font-weight: 600; color: rgba(255, 255, 255, 0.85); }
.em-latest {
  position: relative;
  z-index: 1;
  margin-top: 22px;
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.16);
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Log */
.em-log {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 8px 24px rgba(40, 44, 100, 0.06);
}
.em-log-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 12px; }
.em-log-head h3 { margin: 0; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.4px; }
.em-btn {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.em-btn:hover { background: var(--indigo); }
.em-btn:focus-visible { outline: 3px solid var(--sun); outline-offset: 2px; }

.em-table-wrap { overflow-x: auto; }
.em-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
.em-table th {
  padding: 10px 14px;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 2px solid var(--line);
  white-space: nowrap;
}
.em-table td { padding: 14px; border-bottom: 1px solid var(--line); color: #3a3f63; white-space: nowrap; }
.em-table tbody tr:hover { background: #f8f8fd; }
.em-table td.id { font-weight: 700; color: var(--ink); box-shadow: inset 4px 0 0 var(--row-accent); }
.em-type { display: inline-block; padding: 4px 11px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
.em-type.sos { background: #fde8e4; color: #c2371f; }
.em-type.other { background: #e8e8fe; color: #3636c4; }
.em-empty { text-align: center; padding: 44px 16px !important; color: var(--muted); white-space: normal !important; }
.em-empty strong { display: block; color: var(--ink); font-size: 1.05rem; margin-bottom: 4px; }

@media (max-width: 760px) {
  .em-overview { grid-template-columns: 1fr; }
  .em-header-body { padding: 20px; }
  .em-state, .em-log { padding: 22px; }
}
@media (max-width: 520px) {
  .em-tiles { grid-template-columns: 1fr; }
  .em-title { font-size: 1.8rem; }
}
`;

const TILE_ACCENTS = ['#4b4bf0', '#9b4dca', '#f5b52e', '#12a594'];

// How long an alert keeps the dashboard in alert mode before it returns to normal
const ALERT_DURATION_MS = 30000;
const API = 'http://localhost:3000';

function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderLeft: `5px solid ${accent}`,
        borderRadius: 14,
        padding: '12px 16px',
        minWidth: 130,
        flex: '1 1 130px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function MathPanel() {
  const [tele, setTele] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, s] = await Promise.all([
          fetch(`${API}/api/telemetry`).then((r) => r.json()),
          fetch(`${API}/api/stats`).then((r) => r.json()),
        ]);
        setTele(t);
        setStats(s);
      } catch (e) {
        /* server offline: keep last values */
      }
    };
    load();
    const id = setInterval(load, 1000);
    return () => clearInterval(id);
  }, []);

  const W = 600, H = 170, P = 14;
  const filt = tele.map((d) => d.filtered);
  const raw = tele.map((d) => d.raw);
  const thr = tele.length ? tele[tele.length - 1].threshold : 0;
  const mu = tele.length ? tele[tele.length - 1].mu : 0;
  const all = [...filt, ...raw, thr, mu].filter((v) => typeof v === 'number');
  const lo = Math.min(...all, 0);
  const hi = Math.max(...all, 1);
  const x = (i) => P + (i / Math.max(tele.length - 1, 1)) * (W - 2 * P);
  const y = (v) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P);
  const toPath = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');

  const f = (v, d = 1) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d) : '-');

  return (
    <section className="em-log" style={{ marginBottom: 24 }}>
      <div className="em-log-head">
        <h3>Signal analysis</h3>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          T = μ − max(kσ, margin) &nbsp;|&nbsp; touch when filtered &lt; T
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxHeight: 200 }}>
        {tele.length === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="13" fill="#6b7194">
            Waiting for telemetry from the device...
          </text>
        )}
        <line x1={P} x2={W - P} y1={y(mu)} y2={y(mu)} stroke="#12a594" strokeDasharray="2 4" />
        <line x1={P} x2={W - P} y1={y(thr)} y2={y(thr)} stroke="#f2583e" strokeDasharray="6 4" />
        <path d={toPath(raw)} fill="none" stroke="#b8bbe8" strokeWidth="1.5" />
        <path d={toPath(filt)} fill="none" stroke="#4b4bf0" strokeWidth="2.5" />
        <text x={W - P} y={y(mu) - 4} textAnchor="end" fontSize="11" fill="#12a594">mean μ</text>
        <text x={W - P} y={y(thr) + 13} textAnchor="end" fontSize="11" fill="#f2583e">threshold T</text>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 14px' }}>
        Light line = raw reading, blue line = lowest filtered reading in each second. A touch pulls the blue line below the red line.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="μ (mean)" value={f(stats?.mu)} accent="#12a594" />
        <StatCard label="σ (std dev)" value={f(stats?.sigma, 2)} accent="#4b4bf0" />
        <StatCard label="Threshold T" value={f(stats?.threshold)} accent="#f2583e" />
        <StatCard label="Margin μ − T" value={f(stats?.margin)} accent="#f5b52e" />
        <StatCard label="Alerts" value={stats?.alerts ?? '-'} accent="#9b4dca" />
        <StatCard label="Mean tap interval (ms)" value={f(stats?.meanPress, 0)} accent="#4b4bf0" />
        <StatCard label="Std of interval (ms)" value={f(stats?.stdPress, 0)} accent="#12a594" />
        <StatCard label="Alerts / min" value={f(stats?.alertsPerMin, 2)} accent="#f5b52e" />
        <StatCard label="Data rate (bps)" value={f(stats?.dataRateBps, 0)} accent="#f2583e" />
      </div>
    </section>
  );
}

function App() {
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState('Unknown');
  const [acknowledgedKey, setAcknowledgedKey] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Tick once a second so the countdown and auto-return stay accurate
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Poll the local receiver endpoint every 2 seconds
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/alerts');
        const data = await response.json();
        setAlerts(data);
        setStatus('Connected');
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setStatus('Disconnected');
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  const latestAlert = alerts.length > 0 ? alerts[0] : null;
  const connected = status === 'Connected';

  // An alert is "active" for 30 seconds after it arrives, or until someone acknowledges it
  const alertKey = latestAlert ? `${latestAlert.eventId}-${latestAlert.serverReceivedAt}` : null;
  const alertAge = latestAlert ? now - new Date(latestAlert.serverReceivedAt).getTime() : null;
  const withinWindow = latestAlert && (Number.isNaN(alertAge) || alertAge < ALERT_DURATION_MS);
  const isActive = Boolean(latestAlert && acknowledgedKey !== alertKey && withinWindow);
  const secondsLeft =
    isActive && !Number.isNaN(alertAge) ? Math.max(0, Math.ceil((ALERT_DURATION_MS - alertAge) / 1000)) : null;

  const exportCsv = () => {
    if (alerts.length === 0) return;
const header = ['eventId', 'deviceId', 'eventType', 'tapCount', 'meanIntervalMs', 'mu', 'sigma', 'threshold', 'serverReceivedAt'];    const rows = alerts.map((a) =>
      header.map((key) => `"${String(a[key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'empower-events.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const details = latestAlert
    ? [
        { label: 'Event ID', value: latestAlert.eventId },
        { label: 'Device source', value: latestAlert.deviceId },
        { label: 'Pattern', value: `${latestAlert.tapCount} rapid taps` },
        { label: 'Time received', value: new Date(latestAlert.serverReceivedAt).toLocaleTimeString() },
      ]
    : [];

  return (
    <div className={`em-root${isActive ? ' alert-mode' : ''}`}>
      <style>{styles}</style>
      <div className="em-wrap">
        {/* Header */}
        <header className="em-header">
          <div className="em-stripe" aria-hidden="true">
            <span style={{ background: 'var(--s1)' }} />
            <span style={{ background: 'var(--s2)' }} />
            <span style={{ background: 'var(--s3)' }} />
            <span style={{ background: 'var(--s4)' }} />
            <span style={{ background: 'var(--s5)' }} />
          </div>
          <div className="em-header-body">
            <div>
              <h1 className="em-title">Empower</h1>
              <p className="em-sub">TapShield safety prototype with live monitoring</p>
            </div>
            <div className={`em-status ${connected ? 'ok' : 'down'}`}>
              <span className="em-dot" />
              Receiver {status.toLowerCase()}
            </div>
          </div>
        </header>

        {/* Overview */}
        <div className="em-overview">
          <section className={`em-state ${isActive ? 'alert' : 'armed'}`}>
            <span className="em-chip">System state</span>
            <h2>{isActive ? 'Active SOS alert' : 'Armed and monitoring'}</h2>

            {isActive ? (
              <>
                <div className="em-tiles">
                  {details.map((item, i) => (
                    <div key={item.label} className="em-tile" style={{ '--accent': TILE_ACCENTS[i] }}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="em-ack-row">
                  <button className="em-ack" onClick={() => setAcknowledgedKey(alertKey)}>
                    Acknowledge alert
                  </button>
                  {secondsLeft !== null && (
                    <span className="em-countdown">Returns to normal in {secondsLeft}s</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="em-state-msg">
                  The device is working and waiting for the designated touch pattern. Trigger the hardware sensor 3 times to send a test alert.
                </p>
                {latestAlert && (
                  <p className="em-last-note">
                    Last alert: {latestAlert.eventId} at {new Date(latestAlert.serverReceivedAt).toLocaleTimeString()}
                  </p>
                )}
              </>
            )}
          </section>

          <aside className="em-activity">
            <div>
              <h3>Activity summary</h3>
              <div className="em-count">{alerts.length}</div>
              <div className="em-count-label">Total events logged</div>
            </div>
            <div className="em-latest">
              Latest: {latestAlert ? new Date(latestAlert.serverReceivedAt).toLocaleDateString() : 'N/A'}
            </div>
          </aside>
        </div>
        <MathPanel />

        {/* Event log */}
        <section className="em-log">
          <div className="em-log-head">
            <h3>Event history log</h3>
            <button className="em-btn" onClick={exportCsv} disabled={alerts.length === 0}>
              Export data
            </button>
          </div>

          <div className="em-table-wrap">
            <table className="em-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Source device</th>
                  <th>Type</th>
                  <th>Taps</th>
                  <th>Avg interval (ms)</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="em-empty">
                      <strong>No events yet</strong>
                      Waiting for the first event from the device.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert, index) => {
                    const isSos = alert.eventType === 'SOS';
                    return (
                      <tr key={`${alert.eventId}-${index}`}>
                        <td className="id" style={{ '--row-accent': isSos ? '#f2583e' : '#4b4bf0' }}>
                          {alert.eventId}
                        </td>
                        <td>{alert.deviceId}</td>
                        <td>
                          <span className={`em-type ${isSos ? 'sos' : 'other'}`}>{alert.eventType}</span>
                        </td>
                        <td>{alert.tapCount}</td>
                        <td>{typeof alert.meanIntervalMs === 'number' ? alert.meanIntervalMs.toFixed(0) : '-'}</td>
                        <td>{new Date(alert.serverReceivedAt).toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;