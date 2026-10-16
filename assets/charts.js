// Small chart renderer for project pages and homepage thumbnails.
// Every chart is described once in assets/chart-data.js (window.CHART_DATA) and drawn
// wherever an element has data-chart="<key>": full size with axes, legend, tooltip and a
// data table, or as a text-free thumbnail when data-mode="thumb".
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const DATA = window.CHART_DATA || {};
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

  const FMT = {
    pct0: (v) => Math.round(v * 100) + "%",
    pct1: (v) => (v * 100).toFixed(1) + "%",
    num1: (v) => v.toFixed(1),
    num2: (v) => v.toFixed(2),
    num3: (v) => v.toFixed(3),
    int: (v) => Math.round(v).toLocaleString("en-US"),
    x1: (v) => v.toFixed(1) + "×",
    x0: (v) => Math.round(v) + "×",
    x2: (v) => v.toFixed(2) + "×",
    flops: (v) => FMT.si(v) + " FLOPs",
    pct1s: (v) => (v * 100).toFixed(1) + "%",
    ms: (v) => Math.round(v) + " ms",
    m2: (v) => v.toFixed(2) + " m",
    pow10: (v) => {
      const e = Math.round(Math.log10(v));
      return "10" + String(e).split("").map((c) => SUP[c]).join("");
    },
    si: (v) => {
      const a = Math.abs(v);
      for (const [d, s] of [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "K"]]) {
        if (a >= d) return +(v / d).toPrecision(3) + s;
      }
      return String(+v.toPrecision(3));
    },
  };
  const fmt = (name, v) => (FMT[name] || FMT.num2)(v);

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function html(tag, cls, parent, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  const color = (slot) => (slot === "muted" ? "var(--ink-3)" : `var(--s${slot || 1})`);

  let measureCtx;
  function textWidth(s, size = 11) {
    measureCtx = measureCtx || document.createElement("canvas").getContext("2d");
    measureCtx.font = `${size}px "JetBrains Mono", ui-monospace, monospace`;
    return measureCtx.measureText(s).width;
  }

  function scale(axis, r0, r1) {
    if (axis.type === "log") {
      const a = Math.log10(axis.min), b = Math.log10(axis.max);
      return (v) => r0 + ((Math.log10(v) - a) / (b - a)) * (r1 - r0);
    }
    if (axis.type === "band") {
      const n = axis.labels.length, pad = 0.5;
      return (i) => r0 + ((i + pad) / n) * (r1 - r0);
    }
    return (v) => r0 + ((v - axis.min) / (axis.max - axis.min)) * (r1 - r0);
  }

  // rounded data-end on the right, square at the baseline
  function hbarPath(x0, x1, y, h) {
    const r = Math.min(4, (x1 - x0) / 2, h / 2);
    return `M${x0},${y}H${x1 - r}Q${x1},${y} ${x1},${y + r}V${y + h - r}Q${x1},${y + h} ${x1 - r},${y + h}H${x0}Z`;
  }

  // ---------- tooltip ----------
  function makeTip(host) {
    const tip = html("div", "chart-tip", host);
    tip.setAttribute("role", "status");
    return {
      show(x, y, head, rows) {
        tip.textContent = "";
        if (head) html("div", "tip-head", tip, head);
        for (const r of rows) {
          const row = html("div", "tip-row", tip);
          const key = html("i", "key-" + (r.kind || "line"), row);
          key.style.background = color(r.slot);
          html("b", null, row, r.value);
          html("span", null, row, r.name);
        }
        tip.classList.add("on");
        const hw = host.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
        let left = x + 14;
        if (left + tw > hw) left = Math.max(0, x - tw - 14);
        tip.style.left = left + "px";
        tip.style.top = Math.max(0, y - th / 2) + "px";
      },
      hide() { tip.classList.remove("on"); },
    };
  }

  // ---------- legend / table ----------
  function legend(host, items) {
    if (items.length < 2) return;
    const lg = html("div", "chart-legend", host);
    for (const it of items) {
      const s = html("span", null, lg);
      const k = html("i", "key-" + (it.kind || "line"), s);
      k.style.background = color(it.slot);
      s.appendChild(document.createTextNode(it.name));
    }
  }
  function table(host, spec) {
    const t = spec.table;
    if (!t) return;
    const d = html("details", "chart-table", host);
    html("summary", null, d, "Show data");
    const tb = html("table", null, d);
    const tr = html("tr", null, html("thead", null, tb));
    t.head.forEach((h) => html("th", null, tr, h));
    const body = html("tbody", null, tb);
    t.rows.forEach((r) => {
      const row = html("tr", null, body);
      r.forEach((c) => html("td", null, row, c));
    });
  }

  // ---------- axes ----------
  function yAxis(g, spec, ys, x0, x1, thumb) {
    if (thumb) return;
    for (const t of spec.y.ticks || []) {
      const y = ys(t);
      el("line", { class: "grid", x1: x0, x2: x1, y1: y, y2: y }, g);
      el("text", { class: "tick", x: x0 - 8, y: y + 4, "text-anchor": "end" }, g).textContent = fmt(spec.y.fmt, t);
    }
  }
  function xAxis(g, spec, xs, y, thumb) {
    if (thumb) return;
    const ax = spec.x;
    const ticks = ax.type === "band" ? ax.labels.map((_, i) => i) : ax.ticks || [];
    for (const t of ticks) {
      const label = ax.type === "band" ? ax.labels[t] : ax.tickLabels ? ax.tickLabels[ticks.indexOf(t)] : fmt(ax.fmt, t);
      el("text", { class: "tick", x: xs(t), y: y + 16, "text-anchor": "middle" }, g).textContent = label;
    }
  }

  // ---------- xy: lines, markers, bands ----------
  function drawXY(svg, host, spec, W, H, thumb) {
    const series = spec.series;
    let endLabels = !thumb && series.some((s) => s.end);
    if (endLabels) {
      // drop end labels up front if any two would sit closer than one text line
      const top = 12, bottom = H - (spec.x.title ? 44 : 28);
      const ysPre = scale(spec.y, bottom, top);
      const ends = series.filter((s) => s.end).map((s) => ysPre(s.points[s.points.length - 1][1])).sort((a, b) => a - b);
      for (let i = 1; i < ends.length; i++) if (ends[i] - ends[i - 1] < 13) endLabels = false;
    }
    const yTickW = thumb ? 0 : Math.max(0, ...(spec.y.ticks || []).map((t) => textWidth(fmt(spec.y.fmt, t))));
    const endW = endLabels ? Math.max(...series.map((s) => (s.end ? textWidth(s.end) : 0))) + 14 : 0;
    const m = thumb ? { l: 6, r: 6, t: 8, b: 8 } : { l: yTickW + 14, r: Math.max(12, endW), t: 12, b: spec.x.title ? 44 : 28 };
    const x0 = m.l, x1 = W - m.r, y0 = H - m.b, y1 = m.t;
    const xs = scale(spec.x, x0, x1), ys = scale(spec.y, y0, y1);
    const g = el("g", {}, svg);

    yAxis(g, spec, ys, x0, x1, thumb);
    if (thumb) el("line", { class: "grid", x1: x0, x2: x1, y1: y0, y2: y0 }, g);
    xAxis(g, spec, xs, y0, thumb);
    if (!thumb && spec.x.title) el("text", { class: "axis-title", x: (x0 + x1) / 2, y: H - 6, "text-anchor": "middle" }, g).textContent = spec.x.title;

    for (const b of spec.bands || []) {
      const ya = ys(b.y1), yb = ys(b.y0);
      el("rect", { class: "band", x: x0, y: ya, width: x1 - x0, height: yb - ya }, g);
      if (!thumb && b.label) el("text", { class: "band-label", x: x0 + 6, y: ya + 13 }, g).textContent = b.label;
    }

    const hl = thumb && spec.thumb && Array.isArray(spec.thumb.highlight) ? spec.thumb.highlight : null;
    series.forEach((s, i) => {
      const muted = hl !== null && !hl.includes(i);
      const c = muted ? "var(--ink-3)" : color(s.slot);
      const pts = s.points.map(([x, y]) => [xs(x), ys(y)]);
      if (s.line !== false && pts.length > 1) {
        el("path", {
          class: "series-line" + (s.dash ? " dashed" : ""),
          d: "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L"),
          stroke: c, "stroke-width": thumb ? 1.6 : 2, opacity: muted ? 0.45 : 1,
        }, g);
      }
      const showMarkers = thumb ? s.markers && pts.length <= 12 : s.markers;
      if (showMarkers) {
        for (const p of pts) el("circle", { class: "marker", cx: p[0], cy: p[1], r: thumb ? 2.2 : 4, fill: c, opacity: muted ? 0.45 : 1 }, g);
      } else if (thumb && !muted && pts.length) {
        const p = pts[pts.length - 1];
        el("circle", { class: "marker", cx: p[0], cy: p[1], r: 2.4, fill: c }, g);
      }
    });

    if (endLabels) placeEndLabels(g, series, xs, ys, x1);
    if (thumb) return;

    // hover: crosshair when series share x positions, nearest point otherwise
    const tip = makeTip(host);
    const shared = series.every((s) => s.points.length === series[0].points.length && s.points.every((p, j) => p[0] === series[0].points[j][0]));
    const hair = el("line", { class: "hair", y1: y1, y2: y0, x1: 0, x2: 0, visibility: "hidden" }, g);
    const hit = el("rect", { x: x0, y: y1, width: x1 - x0, height: y0 - y1, fill: "transparent" }, svg);
    const xLabel = (x) => (spec.x.type === "band" ? spec.x.labels[x] : (spec.x.hoverLabel || "") + fmt(spec.x.hoverFmt || spec.x.fmt, x));
    let idx = -1;
    function showIndex(j) {
      idx = j;
      const x = series[0].points[j][0], px = xs(x);
      hair.setAttribute("x1", px); hair.setAttribute("x2", px); hair.setAttribute("visibility", "visible");
      const rows = series.map((s) => ({ slot: s.slot, name: s.name, value: fmt(spec.y.tipFmt || spec.y.fmt, s.points[j][1]) }));
      tip.show(px, (y0 + y1) / 2, xLabel(x), rows);
    }
    function move(ev) {
      const r = svg.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      if (shared) {
        let best = 0, bd = Infinity;
        series[0].points.forEach((p, j) => { const d = Math.abs(xs(p[0]) - mx); if (d < bd) { bd = d; best = j; } });
        showIndex(best);
      } else {
        let best = null, bd = 28;
        series.forEach((s) => s.points.forEach((p) => {
          const d = Math.hypot(xs(p[0]) - mx, ys(p[1]) - my);
          if (d < bd) { bd = d; best = { s, p }; }
        }));
        if (!best) return tip.hide();
        tip.show(xs(best.p[0]), ys(best.p[1]), xLabel(best.p[0]), [{ slot: best.s.slot, name: best.s.name, value: fmt(spec.y.tipFmt || spec.y.fmt, best.p[1]) }]);
      }
    }
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerleave", () => { tip.hide(); hair.setAttribute("visibility", "hidden"); });
    if (shared) {
      svg.setAttribute("tabindex", "0");
      svg.addEventListener("keydown", (e) => {
        const n = series[0].points.length;
        if (e.key === "ArrowRight") { showIndex(Math.min(n - 1, idx + 1)); e.preventDefault(); }
        if (e.key === "ArrowLeft") { showIndex(Math.max(0, idx < 0 ? n - 1 : idx - 1)); e.preventDefault(); }
        if (e.key === "Escape") tip.hide();
      });
      svg.addEventListener("focus", () => showIndex(idx < 0 ? series[0].points.length - 1 : idx));
      svg.addEventListener("blur", () => { tip.hide(); hair.setAttribute("visibility", "hidden"); });
    }
  }

  function placeEndLabels(g, series, xs, ys, x1) {
    const items = series.filter((s) => s.end).map((s) => {
      const p = s.points[s.points.length - 1];
      return { s, x: xs(p[0]), y: ys(p[1]) };
    }).sort((a, b) => a.y - b.y);
    // labels that would collide are dropped; the legend carries identity instead
    for (let i = 1; i < items.length; i++) {
      if (items[i].y - items[i - 1].y < 13) return;
    }
    for (const it of items) {
      el("text", { class: "end-label", x: x1 + 8, y: it.y + 4 }, g).textContent = it.s.end;
    }
  }

  // ---------- bars: horizontal, grouped ----------
  function drawBars(svg, host, spec, W, H, thumb) {
    const cats = spec.categories, n = spec.series.length;
    const stacked = !thumb && W < 520;  // narrow screens: category label sits above its bars
    const labelW = thumb || stacked ? 0 : Math.max(...cats.map((c) => textWidth(c))) + 12;
    const valW = thumb ? 0 : Math.max(...spec.series.flatMap((s) => s.values.map((v) => textWidth(fmt(spec.valueFmt || spec.x.fmt, v))))) + 10;
    const m = thumb ? { l: 6, r: 6, t: 6, b: 6 } : { l: stacked ? 1 : labelW, r: valW, t: 4, b: spec.x.ticks ? 24 : 4 };
    const x0 = m.l, x1 = W - m.r;
    const band = (H - m.t - m.b) / cats.length;
    const room = stacked ? band - 18 : band * 0.72;
    const bh = Math.min(thumb ? 10 : stacked ? 16 : 22, room / n - (n > 1 ? 2 : 0));
    const xs = scale(spec.x, x0, x1);
    const g = el("g", {}, svg);
    if (!thumb) {
      for (const t of spec.x.ticks || []) {
        el("line", { class: "grid", x1: xs(t), x2: xs(t), y1: m.t, y2: H - m.b }, g);
        el("text", { class: "tick", x: xs(t), y: H - 6, "text-anchor": "middle" }, g).textContent = fmt(spec.x.fmt, t);
      }
    }
    el("line", { class: "axis", x1: xs(spec.x.min), x2: xs(spec.x.min), y1: m.t, y2: H - m.b }, g);
    const tip = thumb ? null : makeTip(host);
    cats.forEach((c, ci) => {
      const groupH = n * bh + (n - 1) * 2;
      const gy = stacked ? m.t + ci * band + 18 : m.t + ci * band + (band - groupH) / 2;
      if (stacked) el("text", { class: "cat", x: x0, y: gy - 6 }, g).textContent = c;
      else if (!thumb) el("text", { class: "cat", x: x0 - 10, y: gy + groupH / 2 + 4, "text-anchor": "end" }, g).textContent = c;
      spec.series.forEach((s, si) => {
        const v = s.values[ci];
        if (v == null) return;
        const slot = s.slots ? s.slots[ci] : s.slot;
        const y = gy + si * (bh + 2);
        const p = el("path", { class: "bar", d: hbarPath(xs(spec.x.min), Math.max(xs(spec.x.min) + 1, xs(v)), y, bh), fill: color(slot) }, g);
        if (thumb) return;
        el("text", { class: "value", x: xs(v) + 6, y: y + bh / 2 + 4 }, g).textContent = fmt(spec.valueFmt || spec.x.fmt, v);
        const hit = el("rect", { x: x0, y: y - 1, width: x1 - x0, height: bh + 2, fill: "transparent" }, g);
        const on = () => { p.classList.add("hot"); tip.show(xs(v), y + bh / 2, c, [{ kind: "rect", slot, name: s.name, value: fmt(spec.valueFmt || spec.x.fmt, v) }]); };
        const off = () => { p.classList.remove("hot"); tip.hide(); };
        hit.addEventListener("pointerenter", on);
        hit.addEventListener("pointerleave", off);
      });
    });
  }

  // ---------- dots: one row per category, one dot per series ----------
  function drawDots(svg, host, spec, W, H, thumb) {
    const cats = spec.categories;
    const stacked = !thumb && W < 520;
    const labelW = thumb || stacked ? 0 : Math.max(...cats.map((c) => textWidth(c))) + 12;
    const m = thumb ? { l: 6, r: 6, t: 6, b: 6 } : { l: stacked ? 8 : labelW, r: 16, t: 6, b: 24 };
    const x0 = m.l, x1 = W - m.r, band = (H - m.t - m.b) / cats.length;
    const xs = scale(spec.x, x0, x1);
    const g = el("g", {}, svg);
    if (!thumb) {
      for (const t of spec.x.ticks || []) {
        el("line", { class: "grid", x1: xs(t), x2: xs(t), y1: m.t, y2: H - m.b }, g);
        el("text", { class: "tick", x: xs(t), y: H - 6, "text-anchor": "middle" }, g).textContent = fmt(spec.x.fmt, t);
      }
    }
    const tip = thumb ? null : makeTip(host);
    cats.forEach((c, ci) => {
      const y = stacked ? m.t + ci * band + band * 0.68 : m.t + (ci + 0.5) * band;
      const vals = spec.series.map((s) => s.values[ci]);
      el("line", { class: "dot-rail", x1: xs(Math.min(...vals)), x2: xs(Math.max(...vals)), y1: y, y2: y }, g);
      if (stacked) el("text", { class: "cat", x: x0 - 8, y: y - 11 }, g).textContent = c;
      else if (!thumb) el("text", { class: "cat", x: x0 - 10, y: y + 4, "text-anchor": "end" }, g).textContent = c;
      spec.series.forEach((s, si) => {
        const dot = el("circle", { class: "marker", cx: xs(s.values[ci]), cy: y, r: thumb ? 2.2 : 4.5, fill: color(s.slot) }, g);
        if (thumb) return;
        const hit = el("circle", { cx: xs(s.values[ci]), cy: y, r: 12, fill: "transparent" }, g);
        hit.addEventListener("pointerenter", () => {
          dot.setAttribute("r", 6);
          tip.show(xs(s.values[ci]), y, c, spec.series.map((t) => ({ kind: "dot", slot: t.slot, name: t.name, value: fmt(spec.x.fmt, t.values[ci]) })));
        });
        hit.addEventListener("pointerleave", () => { dot.setAttribute("r", 4.5); tip.hide(); });
      });
    });
  }

  // ---------- mount ----------
  function render(node) {
    const spec = DATA[node.dataset.chart];
    if (!spec) return;
    const thumb = node.dataset.mode === "thumb";
    node.textContent = "";
    node.classList.add("chart", thumb ? "is-thumb" : "is-full");
    if (!thumb) {
      const items = spec.legend || (spec.kind === "bars" && spec.series.length < 2 ? [] : spec.series.map((s) => ({ name: s.name, slot: s.slot, kind: spec.kind === "bars" ? "rect" : spec.kind === "dots" ? "dot" : "line" })));
      legend(node, items);
    }
    const W = thumb ? 120 : Math.max(240, node.clientWidth);
    let H = thumb ? 72 : spec.height || 260;
    if (!thumb && W < 520 && (spec.kind === "bars" || spec.kind === "dots")) {
      H = Math.max(H, spec.categories.length * (spec.kind === "bars" ? 24 + spec.series.length * 18 : 40) + 30);
    }
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: thumb ? "100%" : W, height: thumb ? "100%" : H, role: thumb ? "presentation" : "img" }, null);
    if (thumb) svg.setAttribute("aria-hidden", "true");
    else svg.setAttribute("aria-label", spec.alt || "");
    node.appendChild(svg);
    ({ xy: drawXY, bars: drawBars, dots: drawDots }[spec.kind] || drawXY)(svg, node, spec, W, H, thumb);
    if (!thumb) table(node, spec);
  }

  const nodes = [...document.querySelectorAll("[data-chart]")];
  nodes.forEach(render);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => nodes.filter((n) => n.dataset.mode !== "thumb").forEach(render));
  if ("ResizeObserver" in window) {
    const widths = new WeakMap();
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.round(e.contentRect.width);
        if (widths.get(e.target) !== w) { widths.set(e.target, w); requestAnimationFrame(() => render(e.target)); }
      }
    });
    nodes.filter((n) => n.dataset.mode !== "thumb").forEach((n) => ro.observe(n));
  }
})();
