// Hero "stack" figure + work filters.
// The layer list in the HTML (ul.stack-labels > li[data-layer]) is the source of truth;
// the isometric slabs are drawn from it so labels and slabs always line up.
(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const W = 290, H = 420;           // viewBox
  const CX = 132, A = 118, B = 33;  // slab center x, half-width, half-depth
  const T = 12;                     // slab thickness
  const Y0 = 50, GAP = 78;          // first slab center y, spacing

  const stack = document.querySelector(".stack");
  const labelList = document.querySelector(".stack-labels");
  if (!stack || !labelList) return;

  const items = [...labelList.querySelectorAll("li[data-layer]")];
  const ys = items.map((_, i) => Y0 + i * GAP);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  const pts = (arr) => arr.map((p) => p.join(",")).join(" ");

  // ---- draw ----
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "A five-layer stack, from agents at the top to hardware at the bottom" });
  el("line", { class: "spine", x1: CX, y1: ys[0], x2: CX, y2: ys[ys.length - 1] }, svg);

  const slabs = {};
  // paint bottom-up so upper slabs occlude lower ones
  for (let i = items.length - 1; i >= 0; i--) {
    const cy = ys[i];
    const li = items[i];
    const g = el("g", { class: "slab" + (li.dataset.focus ? " focus" : ""), "data-layer": li.dataset.layer }, svg);
    el("polygon", { class: "left", points: pts([[CX - A, cy], [CX, cy + B], [CX, cy + B + T], [CX - A, cy + T]]) }, g);
    el("polygon", { class: "right", points: pts([[CX, cy + B], [CX + A, cy], [CX + A, cy + T], [CX, cy + B + T]]) }, g);
    el("polygon", { class: "top", points: pts([[CX - A, cy], [CX, cy - B], [CX + A, cy], [CX, cy + B]]) }, g);
    // faint die grid on the top face
    for (const f of [1 / 3, 2 / 3]) {
      el("line", { class: "grid", x1: CX - A + A * f, y1: cy - B * f, x2: CX + A * f, y2: cy + B - B * f }, g);
      el("line", { class: "grid", x1: CX - A + A * f, y1: cy + B * f, x2: CX + A * f, y2: cy - B + B * f }, g);
    }
    el("line", { class: "leader", x1: CX + A + 6, y1: cy, x2: W, y2: cy }, g);
    slabs[li.dataset.layer] = g;
  }

  const pulse = el("g", { "aria-hidden": "true" }, svg);
  el("circle", { class: "pulse-glow", r: 11, cx: CX, cy: ys[0] }, pulse);
  el("circle", { class: "pulse", r: 4.5, cx: CX, cy: ys[0] }, pulse);

  stack.insertBefore(svg, labelList);
  items.forEach((li, i) => { li.style.top = (ys[i] / H) * 100 + "%"; });
  stack.classList.add("is-ready");

  // ---- hover sync between slab and label ----
  function setHot(layer, on) {
    slabs[layer]?.classList.toggle("is-hot", on);
    labelList.querySelector(`li[data-layer="${layer}"] .layer-btn`)?.classList.toggle("is-hot", on);
  }
  for (const [layer, g] of Object.entries(slabs)) {
    g.addEventListener("mouseenter", () => setHot(layer, true));
    g.addEventListener("mouseleave", () => setHot(layer, false));
    g.addEventListener("click", () => toggleLayer(layer, true));
  }
  items.forEach((li) => {
    const btn = li.querySelector(".layer-btn");
    btn.addEventListener("mouseenter", () => setHot(li.dataset.layer, true));
    btn.addEventListener("mouseleave", () => setHot(li.dataset.layer, false));
    btn.addEventListener("click", () => toggleLayer(li.dataset.layer, true));
  });

  // ---- filters ----
  const works = [...document.querySelectorAll(".work")];
  const chips = [...document.querySelectorAll(".chip[data-area]")];
  const status = document.querySelector(".filter-status");
  const workSection = document.getElementById("work");
  const state = { layer: null, area: null };

  function toggleLayer(layer, scroll) {
    state.layer = state.layer === layer ? null : layer;
    state.area = null;
    apply();
    if (scroll && state.layer) {
      // land on the first highlighted project, not the top of the list
      const target = works.find((w) => !w.classList.contains("is-dim")) || workSection;
      const top = target.getBoundingClientRect().top + window.scrollY - 32;
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }
  chips.forEach((c) => c.addEventListener("click", () => {
    state.area = state.area === c.dataset.area ? null : c.dataset.area;
    state.layer = null;
    apply();
  }));

  function apply() {
    const active = state.layer || state.area;
    const litLayers = new Set();
    let shown = 0;
    works.forEach((w) => {
      const areas = (w.dataset.areas || "").split(/\s+/);
      const match = state.layer ? w.dataset.layer === state.layer
        : state.area ? areas.includes(state.area) : true;
      w.classList.toggle("is-dim", !!active && !match);
      if (match) { shown++; if (active) litLayers.add(w.dataset.layer); }
    });
    for (const [layer, g] of Object.entries(slabs)) g.classList.toggle("is-on", litLayers.has(layer));
    items.forEach((li) => li.querySelector(".layer-btn").setAttribute("aria-pressed", String(state.layer === li.dataset.layer)));
    chips.forEach((c) => c.setAttribute("aria-pressed", String(state.area === c.dataset.area)));

    if (!status) return;
    status.textContent = "";
    if (!active) return;
    const label = state.layer
      ? labelList.querySelector(`li[data-layer="${state.layer}"] .name-text`).textContent
      : chips.find((c) => c.dataset.area === state.area).textContent;
    status.append(`Highlighting ${shown} of ${works.length} · ${label}`);
    const clear = document.createElement("button");
    clear.type = "button";
    clear.textContent = "clear";
    clear.addEventListener("click", () => { state.layer = state.area = null; apply(); });
    status.append(clear);
  }

  // ---- pulse: one request travelling down the stack and back ----
  if (reduceMotion) return;
  const circles = pulse.querySelectorAll("circle");
  const PERIOD = 7000, DOWN = 2600, HOLD = 800;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  let visible = true, start = performance.now(), lit = null;

  function yAt(ms) {
    const t = ms % PERIOD, top = ys[0], bot = ys[ys.length - 1];
    if (t < DOWN) return top + (bot - top) * ease(t / DOWN);
    if (t < DOWN + HOLD) return bot;
    if (t < 2 * DOWN + HOLD) return bot - (bot - top) * ease((t - DOWN - HOLD) / DOWN);
    return top;
  }
  function frame(now) {
    if (visible && !document.hidden) {
      const y = yAt(now - start);
      circles.forEach((c) => c.setAttribute("cy", y));
      let next = null;
      ys.forEach((cy, i) => { if (Math.abs(cy - y) < 22) next = items[i].dataset.layer; });
      if (next !== lit) {
        if (lit) slabs[lit].classList.remove("is-lit");
        if (next) slabs[next].classList.add("is-lit");
        lit = next;
      }
    }
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(stack);
  }
  requestAnimationFrame(frame);
})();
