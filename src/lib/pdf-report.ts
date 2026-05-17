// PDF Report Generator using browser's print API + styled HTML
// No external libraries needed — generates a printable page

import { metricsFor } from "./calc";
import type { Holding } from "./portfolio-store";
import type { PortfolioSummary } from "./calc";

export function generatePdfReport(
  holdings: Holding[],
  summary: PortfolioSummary,
  userName: string,
) {
  const metrics = holdings.map(metricsFor);
  const date = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rows = metrics
    .map(
      (m) => `
    <tr>
      <td><strong>${m.holding.symbol}</strong><br/><small>${m.name}</small></td>
      <td>${m.holding.quantity}</td>
      <td>$${m.holding.buyPrice.toFixed(2)}</td>
      <td>$${m.currentPrice.toFixed(2)}</td>
      <td>$${m.invested.toFixed(2)}</td>
      <td>$${m.currentValue.toFixed(2)}</td>
      <td class="${m.pl >= 0 ? "profit" : "loss"}">${m.pl >= 0 ? "+" : ""}$${m.pl.toFixed(2)}<br/><small>${m.plPct >= 0 ? "+" : ""}${m.plPct.toFixed(2)}%</small></td>
    </tr>
  `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>WealthLens.ai — Portfolio Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0a0f1c; background: #fff; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #00c88a; padding-bottom: 16px; }
    .logo { font-size: 28px; font-weight: 800; color: #00c88a; letter-spacing: -1px; }
    .logo span { color: #0a0f1c; }
    .meta { text-align: right; font-size: 12px; color: #666; }
    .meta p { margin-top: 2px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-box { background: #f0f9ff; border-radius: 12px; padding: 16px; border-left: 4px solid #00c88a; }
    .stat-box.loss { border-left-color: #ff5252; background: #fff5f5; }
    .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 4px; }
    .stat-value { font-size: 20px; font-weight: 800; color: #0a0f1c; }
    .stat-sub { font-size: 11px; color: #666; margin-top: 2px; }
    .profit { color: #00c88a; }
    .loss { color: #ff5252; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 28px; }
    thead th { background: #0a0f1c; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    tbody tr:nth-child(even) { background: #f8faff; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
    tbody td small { font-size: 11px; color: #666; display: block; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0a0f1c; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e8e8e8; }
    .insights { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .insight-box { background: #f8faff; border-radius: 8px; padding: 12px; border: 1px solid #e0e8ff; }
    .insight-title { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
    .insight-text { font-size: 11px; color: #555; line-height: 1.5; }
    .risk-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .risk-low { background: #e6fff5; color: #00a86b; }
    .risk-medium { background: #fff8e6; color: #d97706; }
    .risk-high { background: #fff0f0; color: #ff5252; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 32px; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">WealthLens<span>.ai</span></div>
      <div style="font-size:12px;color:#666;margin-top:4px;">Track it. Grow it. Master it.</div>
    </div>
    <div class="meta">
      <p><strong>Portfolio Report</strong></p>
      <p>Prepared for: ${userName}</p>
      <p>Date: ${date}</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat-box">
      <div class="stat-label">Total Invested</div>
      <div class="stat-value">$${summary.invested.toFixed(2)}</div>
      <div class="stat-sub">${holdings.length} holdings</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Current Value</div>
      <div class="stat-value">$${summary.currentValue.toFixed(2)}</div>
      <div class="stat-sub">Live prices</div>
    </div>
    <div class="stat-box ${summary.pl >= 0 ? "" : "loss"}">
      <div class="stat-label">Total P / L</div>
      <div class="stat-value ${summary.pl >= 0 ? "profit" : "loss"}">${summary.pl >= 0 ? "+" : ""}$${summary.pl.toFixed(2)}</div>
      <div class="stat-sub ${summary.pl >= 0 ? "profit" : "loss"}">${summary.plPct >= 0 ? "+" : ""}${summary.plPct.toFixed(2)}% all-time</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Risk Level</div>
      <div class="stat-value">${summary.riskScore}/100</div>
      <div class="stat-sub"><span class="risk-badge risk-${summary.riskLevel.toLowerCase()}">${summary.riskLevel} Risk</span></div>
    </div>
  </div>

  <div class="section-title">Holdings Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Stock</th>
        <th>Qty</th>
        <th>Buy Price</th>
        <th>Current</th>
        <th>Invested</th>
        <th>Value</th>
        <th>P / L</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="section-title">AI Insights</div>
  <div class="insights">
    <div class="insight-box">
      <div class="insight-title">📊 Diversification</div>
      <div class="insight-text">Score: <strong>${summary.diversification}%</strong><br/>${summary.diversification > 60 ? "Well diversified across multiple sectors." : "Consider adding more sectors to reduce concentration risk."}</div>
    </div>
    <div class="insight-box">
      <div class="insight-title">🏆 Top Performer</div>
      <div class="insight-text">${summary.best ? `<strong>${summary.best.holding.symbol}</strong> (${summary.best.name})<br/>Return: <span class="profit">${summary.best.plPct >= 0 ? "+" : ""}${summary.best.plPct.toFixed(2)}%</span>` : "N/A"}</div>
    </div>
    <div class="insight-box">
      <div class="insight-title">⚠️ Risk Analysis</div>
      <div class="insight-text">Risk Score: <strong>${summary.riskScore}/100</strong> (${summary.riskLevel})<br/>${summary.riskLevel === "High" ? "Consider rebalancing to reduce concentration." : summary.riskLevel === "Low" ? "Your portfolio is well-balanced." : "Moderate risk — monitor closely."}</div>
    </div>
    <div class="insight-box">
      <div class="insight-title">📉 Weakest Position</div>
      <div class="insight-text">${summary.worst && summary.worst !== summary.best ? `<strong>${summary.worst.holding.symbol}</strong><br/>Return: <span class="loss">${summary.worst.plPct.toFixed(2)}%</span>` : "All positions performing similarly."}</div>
    </div>
  </div>

  <div class="footer">
    Generated by WealthLens.ai · For informational purposes only · Not financial advice
  </div>

  <script>
    window.onload = () => { window.print(); }
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups for PDF export.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
