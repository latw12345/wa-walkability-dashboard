const DATA_URL = "assets/WashingtonWalkabilityIndex.geojson";
const WALK_FIELD = "NatWalkInd";
const AREA_FIELD = "Ac_Total";

const breaks = [6, 10, 13, 15];
const breakLabels = ["1-5", "6-9", "10-12", "13-14", "15-20"];

const colors = ["#a50f15", "#de2d26", "#fb6a4a", "#fcae91", "#fee5d9"];

mapboxgl.accessToken =
  "pk.eyJ1IjoibGlhbnM3NyIsImEiOiJjbWt6NGxhMjcwZTJsM2Vwd2RtbWVvZHRuIn0.HDVAEM1yBC3D51XX3B4NPw";

let walkData = null;
let histChart = null;
let popChart = null;

let walkMin, walkMax, popMin, popMax;
let walkRangeLabel, popRangeLabel;
let statCount, statAvgWalk, statPop;

let hasTotPop = false;

document.addEventListener("DOMContentLoaded", () => {
  const infoBtn = document.getElementById("infoJumpBtn");
  const backBtn = document.getElementById("backToMapBtn");
  const infoPage = document.getElementById("infoPage");
  const top = document.getElementById("top");

  if (infoBtn && infoPage) {
    infoBtn.addEventListener("click", () => {
      infoPage.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (backBtn && top) {
    backBtn.addEventListener("click", () => {
      top.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
});

const map = new mapboxgl.Map({
  container: "map",
  projection: "albers",
  style: "mapbox://styles/mapbox/dark-v10",
  //center: [-120.7, 47.4],
  center: [-122.5, 46],
  zoom: 5.75,
  minZoom: 5,
  maxZoom: 10
});

map.on("load", async () => {
  const res = await fetch(DATA_URL);
  if (!res.ok) {
    console.error("Failed to fetch GeoJSON:", DATA_URL, res.status);
    alert("GeoJSON not found. Check DATA_URL path and filename.");
    return;
  }
  walkData = await res.json();

  map.addSource("walkability", { type: "geojson", data: walkData });

  map.addLayer({
    id: "walk-fill",
    type: "fill",
    source: "walkability",
    paint: {
      "fill-color": [
        "step",
        ["to-number", ["get", WALK_FIELD]],
        colors[0],
        breaks[0], colors[1],
        breaks[1], colors[2],
        breaks[2], colors[3],
        breaks[3], colors[4]
      ],
      "fill-opacity": 0.75
    }
  });

  map.addLayer({
    id: "walk-lines",
    type: "line",
    source: "walkability",
    paint: { "line-color": "#2b2b2b", "line-width": 0.3 }
  });

  map.on("click", "walk-fill", (e) => {
    const props = e.features?.[0]?.properties || {};
    const geoid = props.GEOID20 ?? "N/A";
    const idx = props[WALK_FIELD] != null ? Number(props[WALK_FIELD]) : "N/A";
    const pop = props.TotPop != null ? Number(props.TotPop).toLocaleString() : "N/A";

    new mapboxgl.Popup({ closeOnClick: false, closeButton: true })
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>Walkability (1-20):</strong> ${idx}<br>
        <strong>Total Population:</strong> ${pop}
      `)
      .addTo(map);
  });

  map.on("mouseenter", "walk-fill", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "walk-fill", () => (map.getCanvas().style.cursor = ""));

  let symbolsHidden = false;
  const toggleBtn = document.getElementById("toggleLabels");
  toggleBtn.addEventListener("click", () => (symbolsHidden ? showSymbols() : hideSymbols()));

  function hideSymbols() {
    map.getStyle().layers.forEach((layer) => {
      if (layer.type === "symbol" && map.getLayer(layer.id)) {
        try { map.setPaintProperty(layer.id, "text-opacity", 0); } catch (e) {}
        try { map.setPaintProperty(layer.id, "icon-opacity", 0); } catch (e) {}
      }
    });
    toggleBtn.innerText = "Show Labels";
    symbolsHidden = true;
  }

  function showSymbols() {
    map.getStyle().layers.forEach((layer) => {
      if (layer.type === "symbol" && map.getLayer(layer.id)) {
        try { map.setPaintProperty(layer.id, "text-opacity", 1); } catch (e) {}
        try { map.setPaintProperty(layer.id, "icon-opacity", 1); } catch (e) {}
      }
    });
    toggleBtn.innerText = "Hide Labels";
    symbolsHidden = false;
  }

  hideSymbols();

  walkMin = document.getElementById("walkMin");
  walkMax = document.getElementById("walkMax");
  popMin  = document.getElementById("popMin");
  popMax  = document.getElementById("popMax");

  walkRangeLabel = document.getElementById("walkRangeLabel");
  popRangeLabel  = document.getElementById("popRangeLabel");

  statCount   = document.getElementById("statCount");
  statAvgWalk = document.getElementById("statAvgWalk");
  statPop     = document.getElementById("statPop");

  let maxPop = 0;
  hasTotPop = false;

  for (const f of walkData.features) {
    const p = f.properties || {};
    if (p.TotPop != null && p.TotPop !== "") {
      const v = Number(p.TotPop);
      if (!Number.isNaN(v)) {
        hasTotPop = true;
        maxPop = Math.max(maxPop, v);
      }
    }
  }

  if (hasTotPop) {
    const roundedMax = Math.ceil(maxPop / 100) * 100;
    popMin.max = popMax.max = String(roundedMax);
    popMax.value = String(roundedMax);
    popMin.step = popMax.step = roundedMax >= 50000 ? "500" : "100";
  } else {
    popMin.disabled = true;
    popMax.disabled = true;
  }

  walkRangeLabel.textContent = `${walkMin.value} - ${walkMax.value}`;
  popRangeLabel.textContent = hasTotPop
    ? `${Number(popMin.value).toLocaleString()} - ${Number(popMax.value).toLocaleString()}`
    : "Population not available";

  walkMin.addEventListener("input", applyFiltersAndStats);
  walkMax.addEventListener("input", applyFiltersAndStats);
  popMin.addEventListener("input", applyFiltersAndStats);
  popMax.addEventListener("input", applyFiltersAndStats);

  const resetBtn = document.getElementById("resetBtn");

  resetBtn.addEventListener("click", () => {

    walkMin.value = 1;
    walkMax.value = 20;

    if (hasTotPop) {
      popMin.value = 0;
      popMax.value = popMax.max;
    }

    applyFiltersAndStats();
  });

  renderLegend();

  initHistogram();
  initPopChart();

  applyFiltersAndStats();
});

function applyFiltersAndStats() {
  if (!walkData) return;

  let wMin = Number(walkMin.value);
  let wMax = Number(walkMax.value);
  let pMin = Number(popMin.value);
  let pMax = Number(popMax.value);

  if (wMin > wMax) { wMin = wMax; walkMin.value = String(wMin); }
  if (pMin > pMax) { pMin = pMax; popMin.value = String(pMin); }

  walkRangeLabel.textContent = `${wMin} - ${wMax}`;
  popRangeLabel.textContent = hasTotPop
    ? `${pMin.toLocaleString()} - ${pMax.toLocaleString()}`
    : "Population not available";

  map.setPaintProperty("walk-fill", "fill-opacity", [
    "case",
    [
      "all",
      [">=", ["to-number", ["get", WALK_FIELD]], wMin],
      ["<=", ["to-number", ["get", WALK_FIELD]], wMax],
      [">=", ["to-number", ["coalesce", ["get", "TotPop"], 0]], hasTotPop ? pMin : 0],
      ["<=", ["to-number", ["coalesce", ["get", "TotPop"], 0]], hasTotPop ? pMax : 1e15]
    ],
    0.75,
    0.20
  ]);

  let count = 0;
  let sumWalk = 0;
  let sumPop = 0;

  for (const f of walkData.features) {
    const p = f.properties || {};
    const w = Number(p[WALK_FIELD]);
    const pop = hasTotPop ? Number(p.TotPop) : 0;

    if (Number.isNaN(w)) continue;

    const walkOk = w >= wMin && w <= wMax;
    const popOk  = !hasTotPop || (!Number.isNaN(pop) && pop >= pMin && pop <= pMax);

    if (walkOk && popOk) {
      count++;
      sumWalk += w;
      if (hasTotPop && !Number.isNaN(pop)) sumPop += pop;
    }
  }

  statCount.textContent = count.toLocaleString();
  statAvgWalk.textContent = count ? (sumWalk / count).toFixed(2) : "—";
  statPop.textContent = hasTotPop ? sumPop.toLocaleString() : "—";

  updateHistogram();
  updatePopChart();
}

function renderLegend() {
  const legend = document.getElementById("legend");

  let html = `
    <strong>Walkability Index</strong><br>
    <span style="font-size:9pt">1 = Low, 20 = High</span>
    <hr style="border:0;border-top:1px solid #777;margin:8px 0;">
  `;

  for (let i = 0; i < colors.length; i++) {
    html += `
      <p class="break">
        <i class="dot" style="background:${colors[i]}; width:14px; height:14px; border-radius:0; display:inline-block; margin-right:6px;"></i>
        <span class="dot-label" style="top:7px;">${breakLabels[i]}</span>
      </p>
    `;
  }

  html += `
    <p style="text-align:right; font-size:5pt; margin-top:10px;">
      Data: 
      <a href="https://catalog.data.gov/dataset/walkability-index8" 
        target="_blank" 
        style="color:white; text-decoration:underline;">
        U.S. Environmental Protection Agency
      </a>
    </p>
  `;

  legend.innerHTML = html;
}

function initHistogram() {
  const binLabels = [
    "1–2","3–4","5–6","7–8","9–10",
    "11–12","13–14","15–16","17–18","19–20"
  ];

  const xLabels = ["x", ...binLabels];
  const areas = ["area_acres", 0,0,0,0,0,0,0,0,0,0];

  histChart = c3.generate({
    bindto: "#histChart",
    size: { height: 180 },
    data: {
      x: "x",
      columns: [xLabels, areas],
      type: "bar"
    },
    bar: { width: { ratio: 0.9 } },
    axis: {
      x: {
        type: "category",
        label: { text: "Walkability Range", position: "outer-center" },
        tick: { multiline: false }
      },
      y: {
        label: { text: "Surface Area (Acres)", position: "outer-middle" },
        tick: {
          count: 4,
          format: function (d) {
            if (d >= 1000000) {
              return d3.format(",d")(Math.round(d / 1000000)) + "M";
            } else if (d >= 1000) {
              return d3.format(",d")(Math.round(d / 1000)) + "K";
            } else {
              return d3.format(",d")(Math.round(d));
            }
          }
        }
      }
    },
    legend: { show: false },
    padding: { left: 65, right: 10, top: 10, bottom: 10 },
    tooltip: {
      format: {
        title: (d) => binLabels[d],
        value: (v) => `${Number(v).toLocaleString()} acres`
      }
    }
  });
}

function updateHistogram() {
  if (!histChart || !walkData) return;

  let wMin = Number(walkMin.value);
  let wMax = Number(walkMax.value);
  let pMin = Number(popMin.value);
  let pMax = Number(popMax.value);

  if (wMin > wMax) wMin = wMax;
  if (pMin > pMax) pMin = pMax;

  const bins = new Array(10).fill(0);

  for (const f of walkData.features) {
    const p = f.properties || {};
    const w = Number(p[WALK_FIELD]);
    const pop = hasTotPop ? Number(p.TotPop) : 0;

    if (Number.isNaN(w)) continue;

    const walkOk = w >= wMin && w <= wMax;
    const popOk  = !hasTotPop || (!Number.isNaN(pop) && pop >= pMin && pop <= pMax);
    if (!(walkOk && popOk)) continue;

    const area = Number(p[AREA_FIELD]);
    if (Number.isNaN(area)) continue;

    const binIndex = Math.floor((w - 1) / 2);
    if (binIndex >= 0 && binIndex < 10) {
      bins[binIndex] += area;
    }
  }

  histChart.load({
    columns: [["area_acres", ...bins]]
  });
}

function initPopChart() {
  const binLabels = [
    "1-2","3-4","5-6","7-8","9-10",
    "11-12","13-14","15-16","17-18","19-20"
  ];

  const xLabels = ["x", ...binLabels];
  const pop = ["population", 0,0,0,0,0,0,0,0,0,0];

  popChart = c3.generate({
    bindto: "#popChart",
    size: { height: 180 },
    data: {
      x: "x",
      columns: [xLabels, pop],
      type: "bar"
    },
    bar: { width: { ratio: 0.9 } },
    axis: {
      x: {
        type: "category",
        label: { text: "Walkability Range", position: "outer-center" },
        tick: { multiline: false }
      },
      y: {
        label: { text: "Total Population", position: "outer-middle" },
        tick: {
          count: 4,
          format: function (d) {
            if (d >= 1000000) {
              return d3.format(",d")(Math.round(d / 1000000)) + "M";
            } else if (d >= 1000) {
              return d3.format(",d")(Math.round(d / 1000)) + "K";
            } else {
              return d3.format(",d")(Math.round(d));
            }
          }
        }
      }
    },
    legend: { show: false },
    padding: { left: 70, right: 10, top: 10, bottom: 10 },
    tooltip: {
      format: {
        title: (d) => binLabels[d],
        value: (v) => Number(v).toLocaleString()
      }
    }
  });
}

function updatePopChart() {
  if (!popChart || !walkData) return;

  if (!hasTotPop) {
    popChart.load({ columns: [["population", 0,0,0,0,0,0,0,0,0,0]] });
    return;
  }

  let wMin = Number(walkMin.value);
  let wMax = Number(walkMax.value);
  let pMin = Number(popMin.value);
  let pMax = Number(popMax.value);

  if (wMin > wMax) wMin = wMax;
  if (pMin > pMax) pMin = pMax;

  const sums = new Array(10).fill(0);

  for (const f of walkData.features) {
    const p = f.properties || {};
    const w = Number(p[WALK_FIELD]);
    const pop = Number(p.TotPop);

    if (Number.isNaN(w) || Number.isNaN(pop)) continue;

    const walkOk = w >= wMin && w <= wMax;
    const popOk = pop >= pMin && pop <= pMax;
    if (!(walkOk && popOk)) continue;

    const idx = Math.floor((w - 1) / 2);
    if (idx >= 0 && idx < 10) sums[idx] += pop;
  }

  popChart.load({
    columns: [["population", ...sums]]
  });
}