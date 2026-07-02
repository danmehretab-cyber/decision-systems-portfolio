const marsInputs = {
  credit: document.getElementById("mars-credit"),
  fx: document.getElementById("mars-fx"),
  vix: document.getElementById("mars-vix"),
  corr: document.getElementById("mars-corr"),
  dollar: document.getElementById("mars-dollar"),
};

const marsWeights = {
  credit: 0.24,
  fx: 0.18,
  vix: 0.2,
  corr: 0.19,
  dollar: 0.19,
};

const marsLabels = {
  credit: "Credit stress",
  fx: "FX turbulence",
  vix: "VIX confirmation",
  corr: "Market correlation",
  dollar: "Dollar pressure",
};

const meridianOpportunities = [
  { name: "Paid Ads", return: 0.35, confidence: 0.65, risk: 0.35, liquidity: 0.85 },
  { name: "Content", return: 0.45, confidence: 0.55, risk: 0.4, liquidity: 0.7 },
  { name: "Product", return: 0.7, confidence: 0.45, risk: 0.6, liquidity: 0.4 },
  { name: "Sales", return: 0.55, confidence: 0.6, risk: 0.45, liquidity: 0.8 },
  { name: "Cash", return: 0.03, confidence: 0.99, risk: 0.02, liquidity: 1.0 },
];

const riskProfiles = {
  conservative: [0.25, 0.2, 0.1, 0.25, 0.2],
  balanced: [0.3, 0.3, 0.0, 0.3, 0.1],
  aggressive: [0.25, 0.2, 0.25, 0.25, 0.05],
};

function drawBarChart(canvas, labels, values, colors) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = 34;
  const chartHeight = height - pad * 2;
  const barGap = 12;
  const barWidth = (width - pad * 2 - barGap * (values.length - 1)) / values.length;
  const max = Math.max(...values, 1);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfdff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#dce2ec";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = pad + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }

  values.forEach((value, index) => {
    const x = pad + index * (barWidth + barGap);
    const barHeight = (value / max) * (chartHeight - 8);
    const y = height - pad - barHeight;
    ctx.fillStyle = colors[index] || "#2563eb";
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#172033";
    ctx.font = "bold 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(String(Math.round(value)), x + barWidth / 2, y - 8);
    ctx.fillStyle = "#657087";
    ctx.font = "12px system-ui";
    ctx.fillText(labels[index], x + barWidth / 2, height - 12);
  });
}

function renderRows(container, rows, type) {
  container.innerHTML = "";
  rows.forEach((row) => {
    const wrapper = document.createElement("div");
    wrapper.className = type === "allocation" ? "allocation-row" : "driver-row";

    const label = document.createElement("span");
    label.textContent = row.label;

    const track = document.createElement("span");
    track.className = "bar-track";

    const fill = document.createElement("span");
    fill.className = "bar-fill";
    fill.style.width = `${Math.max(0, Math.min(100, row.value))}%`;
    track.appendChild(fill);

    const value = document.createElement("strong");
    value.textContent = row.display;

    wrapper.append(label, track, value);
    container.appendChild(wrapper);
  });
}

function updateMars() {
  const raw = Object.fromEntries(
    Object.entries(marsInputs).map(([key, input]) => [key, Number(input.value)])
  );
  const score = Object.entries(raw).reduce((total, [key, value]) => total + value * marsWeights[key], 0);

  let regime = "Calm";
  let recommendation = "Maintain full exposure while monitoring driver changes.";
  let color = "#16845f";

  if (score >= 72) {
    regime = "Critical";
    recommendation = "Reduce risky exposure to 0.35x and prioritise capital preservation.";
    color = "#b42318";
  } else if (score >= 58) {
    regime = "Fragile";
    recommendation = "Reduce risky exposure to 0.60x and favour defensive allocation.";
    color = "#b46b00";
  }

  document.getElementById("mars-regime").textContent = regime;
  document.getElementById("mars-regime").style.color = color;
  document.getElementById("mars-score").textContent = `Score ${Math.round(score)}`;
  document.getElementById("mars-recommendation").textContent = recommendation;

  const sortedRows = Object.entries(raw)
    .map(([key, value]) => ({
      label: marsLabels[key],
      value,
      display: String(value),
    }))
    .sort((a, b) => b.value - a.value);

  renderRows(document.getElementById("mars-drivers"), sortedRows, "driver");

  drawBarChart(
    document.getElementById("mars-chart"),
    ["Credit", "FX", "VIX", "Corr", "Dollar"],
    [raw.credit, raw.fx, raw.vix, raw.corr, raw.dollar],
    ["#2563eb", "#16845f", "#b46b00", "#64748b", "#7c3aed"]
  );
}

function updateMeridian() {
  const capital = Number(document.getElementById("meridian-capital").value);
  const risk = document.getElementById("meridian-risk").value;
  const weights = riskProfiles[risk];
  const allocations = meridianOpportunities.map((opportunity, index) => ({
    ...opportunity,
    amount: Math.round((capital * weights[index]) / 100) * 100,
  }));

  const totalAllocated = allocations.reduce((total, item) => total + item.amount, 0);
  const drift = capital - totalAllocated;
  allocations[allocations.length - 1].amount += drift;

  const survival = risk === "aggressive" ? "Scenario survival 4/5" : "Scenario survival 5/5";
  const warning =
    risk === "aggressive"
      ? "Aggressive profile increases upside but weakens downside resilience."
      : risk === "conservative"
        ? "Conservative profile protects capital but may underinvest in growth."
        : "Balanced profile avoids low-confidence product scaling until evidence improves.";

  document.getElementById("capital-label").textContent = `GBP ${capital}`;
  document.getElementById("meridian-mode").textContent = risk[0].toUpperCase() + risk.slice(1);
  document.getElementById("meridian-survival").textContent = survival;
  document.getElementById("meridian-warning").textContent = warning;

  renderRows(
    document.getElementById("meridian-allocation"),
    allocations
      .filter((item) => item.amount > 0)
      .map((item) => ({
        label: item.name,
        value: (item.amount / capital) * 100,
        display: `GBP ${item.amount}`,
      })),
    "allocation"
  );

  drawBarChart(
    document.getElementById("meridian-chart"),
    allocations.map((item) => item.name.split(" ")[0]),
    allocations.map((item) => item.amount),
    ["#2563eb", "#16845f", "#b46b00", "#64748b", "#0f766e"]
  );
}

Object.values(marsInputs).forEach((input) => input.addEventListener("input", updateMars));
document.getElementById("meridian-capital").addEventListener("input", updateMeridian);
document.getElementById("meridian-risk").addEventListener("change", updateMeridian);

updateMars();
updateMeridian();
