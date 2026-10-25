const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// ---------- EXISTING: alert storage ----------
let alerts = [];          // last 50 alerts (newest first), shown on the dashboard

// ---------- NEW: maths / telemetry storage ----------
let telemetry = [];       // last 120 signal samples (about 2 minutes at 1 per second)
let alertLog = [];        // longer history of alerts, used for statistics
let bytesTotal = 0;       // total payload bytes received
const startedAt = Date.now();

// Helpers: mean and population standard deviation
const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const std = a => {
  if (!a.length) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map(x => (x - m) ** 2)));
};

// POST: ESP32 sends an SOS alert
app.post('/api/alerts', (req, res) => {
  const alert = {
    ...req.body,
    serverReceivedAt: new Date().toISOString()
  };

  alerts.unshift(alert);
  if (alerts.length > 50) alerts.pop();

  // NEW: keep a longer log for the statistics
  alertLog.push({ ...alert, ts: Date.now() });
  if (alertLog.length > 500) alertLog.shift();
  bytesTotal += Buffer.byteLength(JSON.stringify(req.body));

  console.log('SOS Alert Received:', alert);

  res.status(200).json({
    eventId: alert.eventId,
    received: true,
    serverReceivedAt: alert.serverReceivedAt
  });
});

// GET: dashboard reads alert history
app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

// NEW POST: ESP32 sends one signal sample per second
app.post('/api/telemetry', (req, res) => {
  telemetry.push({ ...req.body, ts: Date.now() });
  if (telemetry.length > 120) telemetry.shift();
  bytesTotal += Buffer.byteLength(JSON.stringify(req.body));
  res.json({ ok: true });
});

// NEW GET: dashboard draws the live signal vs threshold
app.get('/api/telemetry', (req, res) => {
  res.json(telemetry);
});

// NEW GET: computed statistics for the maths panel
app.get('/api/stats', (req, res) => {
  const intervals = alertLog.map(a => a.meanIntervalMs).filter(x => x > 0);
  const secs = (Date.now() - startedAt) / 1000;
  const last = telemetry[telemetry.length - 1];

  const hasCal = last && typeof last.mu === 'number' && typeof last.threshold === 'number';

  res.json({
    alerts: alertLog.length,
    meanPress: mean(intervals),            // mean tap interval in ms (field name kept for the dashboard)
    stdPress: std(intervals),
    alertsPerMin: secs > 0 ? alertLog.length / (secs / 60) : 0,
    dataRateBps: secs > 0 ? (bytesTotal * 8) / secs : 0,   // D = 8b / T
    mu: hasCal ? last.mu : null,
    sigma: hasCal ? last.sigma : null,
    threshold: hasCal ? last.threshold : null,
    margin: hasCal ? last.mu - last.threshold : null        // mu minus threshold
  });
});

// NEW POST: clear everything between experiments
app.post('/api/reset', (req, res) => {
  alerts = [];
  alertLog = [];
  telemetry = [];
  bytesTotal = 0;
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'request.aborted') return;
  console.error(err);
  res.status(500).end();
});

app.listen(PORT, () => {
  console.log(`Empower receiver running on http://localhost:${PORT}`);
});