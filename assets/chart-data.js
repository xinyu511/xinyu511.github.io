// Every number here comes from a primary source (report, repo data, poster, paper);
// the source is noted above each chart. Drawn by assets/charts.js.
window.CHART_DATA = {
  // CS329X persona stability: results/dyad_v1 via scripts/make_report_figures.py (fig3), mean over pairs.
  "persona-dyad-qwen": {
    kind: "xy",
    alt: "Qwen3-4B, same model on both sides: share of a reply copied from the partner's previous line rises from 6% to 33% over 40 turns at baseline, and to 20% with attention damping.",
    x: { type: "band", labels: ["turns 0–9", "10–19", "20–29", "30–39"] },
    y: { min: 0, max: 0.4, ticks: [0, 0.1, 0.2, 0.3, 0.4], fmt: "pct0" },
    series: [
      { name: "base: persona in the system prompt only", slot: 1, markers: true, end: "base 33%", points: [[0, 0.063], [1, 0.193], [2, 0.272], [3, 0.33]] },
      { name: "SHAD: attention to own older replies damped", slot: 2, markers: true, end: "SHAD 20%", points: [[0, 0.053], [1, 0.144], [2, 0.169], [3, 0.204]] },
    ],
    table: { head: ["Turns", "base", "SHAD"], rows: [["0–9", "6.3%", "5.3%"], ["10–19", "19.3%", "14.4%"], ["20–29", "27.2%", "16.9%"], ["30–39", "33.0%", "20.4%"]] },
    height: 240,
  },
  "persona-dyad-m2": {
    kind: "xy",
    alt: "MiniMax-M2-her-4b, same model on both sides: partner copying rises from 6% to 35% at baseline and 37% with attention damping.",
    x: { type: "band", labels: ["turns 0–9", "10–19", "20–29", "30–39"] },
    y: { min: 0, max: 0.4, ticks: [0, 0.1, 0.2, 0.3, 0.4], fmt: "pct0" },
    series: [
      { name: "base: persona in the system prompt only", slot: 1, markers: true, end: "base 35%", points: [[0, 0.055], [1, 0.209], [2, 0.287], [3, 0.345]] },
      { name: "SHAD: attention to own older replies damped", slot: 2, markers: true, end: "SHAD 37%", points: [[0, 0.07], [1, 0.243], [2, 0.31], [3, 0.371]] },
    ],
    table: { head: ["Turns", "base", "SHAD"], rows: [["0–9", "5.5%", "7.0%"], ["10–19", "20.9%", "24.3%"], ["20–29", "28.7%", "31.0%"], ["30–39", "34.5%", "37.1%"]] },
    height: 240,
  },
  // docs/ablation_repetition_2026-10-08/turns.csv, mean rep_prev per assistant turn (3 scenarios).
  "persona-repetition": {
    kind: "xy",
    alt: "Qwen3-8B repetition per turn under four settings. Default sampling and a same-model user loop to 0.8–1.0 by turn 10; the DRY sampler keeps repetition near 0.2.",
    x: { min: 1, max: 19, ticks: [1, 4, 7, 10, 13, 16, 19], fmt: "int", title: "assistant turn", hoverLabel: "turn ", hoverFmt: "int" },
    y: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: "pct0" },
    series: [
      { name: "A: default sampling, replayed user", slot: 1, end: "A", points: [0.029, 0.06, 0.102, 0.151, 0.303, 0.262, 0.267, 0.554, 0.808, 0.907, 0.865, 0.787, 0.849, 0.864, 0.787, 0.866, 0.823, 0.652, 0.772].map((v, i) => [i + 1, v]) },
      { name: "B: model-card sampling + presence penalty", slot: 2, end: "B", points: [0.015, 0.053, 0.067, 0.068, 0.133, 0.179, 0.229, 0.428, 0.326, 0.484, 0.405, 0.539, 0.778, 0.772, 0.553, 0.778, 0.708, 0.767, 0.918].map((v, i) => [i + 1, v]) },
      { name: "C: B + DRY anti-repetition sampler", slot: 3, end: "C", points: [0.018, 0.015, 0.029, 0.057, 0.08, 0.052, 0.08, 0.066, 0.078, 0.127, 0.099, 0.19, 0.189, 0.165, 0.132, 0.22, 0.247, 0.239, 0.199].map((v, i) => [i + 1, v]) },
      { name: "D: B, user played by the same model", slot: 4, end: "D", points: [0.015, 0.035, 0.062, 0.111, 0.185, 0.228, 0.436, 0.723, 0.598, 0.916, 0.995, 0.995, 0.973, 0.972, 0.896, 1.0, 1.0, 0.942, 0.998].map((v, i) => [i + 1, v]) },
    ],
    height: 280,
  },

  // 11-777 MM-HDL: poster table "What the classification baselines told us" (Qwen3-8B zero-shot, 1,424 test designs).
  "mmhdl-modality": {
    kind: "bars",
    alt: "Qwen3-8B zero-shot 8-way classification of Verilog designs. Accuracy 0.639 from code, 0.584 from the dataflow graph, 0.652 from both; macro-F1 0.451, 0.443, 0.486.",
    categories: ["Verilog code", "Dataflow graph", "Code + graph"],
    series: [
      { name: "Accuracy", slot: 1, values: [0.639, 0.584, 0.652] },
      { name: "Macro-F1", slot: 2, values: [0.451, 0.443, 0.486] },
    ],
    x: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: "num2" },
    valueFmt: "num3",
    height: 210,
  },
  // analysis/qwen_analysis_figs/overlap_summary.json, version matching the poster (commit 8231e56).
  "mmhdl-overlap": {
    kind: "bars",
    alt: "Which input lets Qwen3-8B classify each test design correctly: 624 with every input, 294 with none, 130 only with the dataflow graph, 55 only with code.",
    categories: ["Every input", "Code, and code + graph", "Graph, and code + graph", "Code and graph, not both", "Only code + graph", "Only code", "Only graph", "No input"],
    series: [{ name: "Test designs", slots: [1, 1, 1, 1, 1, 1, 2, "muted"], values: [624, 215, 62, 16, 28, 55, 130, 294] }],
    x: { min: 0, max: 700, ticks: [0, 200, 400, 600], fmt: "int" },
    height: 300,
  },

  // Moura group: fast_surrogate/exper.json run B (CIFAR-10, 500 images x 5 sigmas), binned by certifier L1 error.
  "nncert-flops": {
    kind: "xy",
    alt: "Log-log chart: FLOPs Monte Carlo needs to match the certifier's error, from 26.5 GFLOPs at very low error to 0.66 GFLOPs at high error, against a flat 4.1 MFLOPs for one certifier pass.",
    x: { type: "log", min: 1e-4, max: 2, ticks: [1e-4, 1e-3, 1e-2, 1e-1, 1], fmt: "pow10", title: "target L1 error (the certifier's error on that query)", hoverLabel: "L1 error ≈ ", hoverFmt: "num3" },
    y: { type: "log", min: 1e6, max: 1e11, ticks: [1e6, 1e7, 1e8, 1e9, 1e10, 1e11], fmt: "si", tipFmt: "flops" },
    series: [
      { name: "Monte Carlo, samples needed to match", slot: 2, markers: true, end: "Monte Carlo", points: [[0.000198, 2.65e10], [0.0049, 1.05e10], [0.0184, 6.35e9], [0.0575, 3.98e9], [0.163, 2.32e9], [0.531, 9.81e8], [1.444, 6.59e8]] },
      { name: "Amortized certifier, one forward pass", slot: 1, end: "certifier", points: [[1e-4, 4.12e6], [2, 4.12e6]] },
    ],
    table: {
      head: ["Certifier L1 bin", "Queries", "Mean MC samples", "Mean MC FLOPs"],
      rows: [["< 0.001", "277", "644", "26.5 G"], ["0.001–0.01", "571", "255", "10.5 G"], ["0.01–0.03", "584", "154", "6.35 G"], ["0.03–0.1", "649", "97", "3.98 G"], ["0.1–0.3", "284", "56", "2.32 G"], ["0.3–1", "100", "24", "0.98 G"], ["1–2", "35", "16", "0.66 G"]],
    },
    height: 280,
  },

  // 11-411 NLP project report, Tables 2 and 4 (BoolQ / SQuAD validation sets).
  "nlp-metrics": {
    kind: "bars",
    alt: "Question answering: question-type F1 0.978, yes/no F1 0.811, span F1 0.763, span exact match 0.725. Question generation: grammatical 0.874, judged sensible 0.79, BLEU 0.628.",
    categories: ["Question-type classifier · F1", "Yes/no answers · F1", "Span answers · F1", "Span answers · exact match", "Generated: grammatical", "Generated: judged sensible", "Generated: BLEU"],
    series: [{ name: "Score", slots: [1, 1, 1, 1, 2, 2, 2], values: [0.978, 0.811, 0.763, 0.725, 0.874, 0.79, 0.628] }],
    legend: [{ name: "Answering pipeline", slot: 1, kind: "rect" }, { name: "Question generation", slot: 2, kind: "rect" }],
    x: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: "num2" },
    valueFmt: "num3",
    height: 270,
  },

  // STAR Lab: per-query recall@10 stored in pgvector_ANN results HDF5 (glove6B-100-angular, 10k queries).
  "star-tail": {
    kind: "xy",
    alt: "Share of GloVe queries with recall@10 below 0.9 falls from 56% at ef_search 10 to under 1% at 800 (M=16).",
    x: { type: "log", min: 9, max: 900, ticks: [10, 20, 40, 80, 200, 400, 800], fmt: "int", title: "ef_search (HNSW search breadth)", hoverLabel: "ef_search ", hoverFmt: "int" },
    y: { min: 0, max: 0.6, ticks: [0, 0.2, 0.4, 0.6], fmt: "pct0", tipFmt: "pct1s" },
    series: [
      { name: "HNSW M=16", slot: 1, markers: true, end: "M=16", points: [[10, 0.562], [20, 0.412], [40, 0.268], [80, 0.149], [120, 0.099], [200, 0.055], [400, 0.017], [800, 0.004]] },
      { name: "HNSW M=24", slot: 2, markers: true, end: "M=24", points: [[10, 0.478], [40, 0.196], [200, 0.025], [800, 0.001]] },
    ],
    height: 250,
  },
  "star-tradeoff": {
    kind: "xy",
    alt: "Mean recall@10 against queries per second for HNSW M=16 on GloVe: 0.699 at 2,223 QPS up to 0.997 at 108 QPS.",
    x: { type: "log", min: 90, max: 2600, ticks: [100, 200, 500, 1000, 2000], fmt: "int", title: "queries per second", hoverLabel: "", hoverFmt: "int" },
    y: { min: 0.6, max: 1, ticks: [0.6, 0.7, 0.8, 0.9, 1], fmt: "num1", tipFmt: "num3" },
    series: [
      { name: "mean recall@10, HNSW M=16", slot: 1, markers: true, points: [[2223, 0.699], [1644, 0.804], [1128, 0.885], [709, 0.938], [523, 0.959], [348, 0.977], [195, 0.991], [108, 0.997]] },
    ],
    height: 230,
  },
  // Same HDF5 recalls (glove-25-angular, ef_search 10, M=16), queries grouped by KMeans k=10 on the query vectors.
  "star-clusters": {
    kind: "dots",
    alt: "Mean recall@10 by query cluster ranges from 0.706 to 0.869 at ef_search 10.",
    categories: ["cluster A", "cluster B", "cluster C", "cluster D", "cluster E", "cluster F", "cluster G", "cluster H", "cluster I", "cluster J"],
    series: [{ name: "mean recall@10", slot: 1, values: [0.869, 0.865, 0.854, 0.849, 0.842, 0.793, 0.766, 0.75, 0.749, 0.706] }],
    x: { min: 0.68, max: 0.9, ticks: [0.7, 0.75, 0.8, 0.85, 0.9], fmt: "num2" },
    height: 260,
  },

  // CMU Catalyst Lab: resume figure.
  "bw-matmul": {
    kind: "bars",
    alt: "Matmul throughput: our compiler reaches 97% of ThunderKittens.",
    categories: ["ThunderKittens", "Our compiler"],
    series: [{ name: "Matmul throughput vs. ThunderKittens", slots: ["muted", 1], values: [1, 0.97] }],
    x: { min: 0, max: 1, ticks: [0, 0.5, 1], fmt: "pct0" },
    height: 110,
  },

  // 15-418 final report, Table 4: speedup over the CPU (DGL) baseline vs. CUDA block size, batch 64.
  "faultsim-block": {
    kind: "xy",
    alt: "Speedup over the CPU baseline against CUDA block size for four circuits; all peak around 128–256 threads, up to 25.4x on c7552.",
    x: { type: "log", min: 1, max: 1024, ticks: [1, 4, 16, 64, 256, 1024], fmt: "int", title: "threads per block", hoverLabel: "block size ", hoverFmt: "int" },
    y: { min: 0, max: 27, ticks: [0, 5, 10, 15, 20, 25], fmt: "x0", tipFmt: "x1" },
    series: [
      { name: "c7552 (3,975 gates)", slot: 1, end: "c7552", points: [[1, 2.1], [2, 4.0], [4, 7.5], [8, 11.3], [16, 11.8], [32, 20.0], [64, 24.0], [128, 25.4], [256, 24.8], [512, 23.0], [1024, 20.0]] },
      { name: "Circuit 3 (41,333 gates)", slot: 2, end: "Circuit 3", points: [[1, 2.2], [2, 4.2], [4, 6.5], [8, 10.2], [16, 15.3], [32, 18.1], [64, 20.7], [128, 21.5], [256, 22.1], [512, 22.0], [1024, 20.0]] },
      { name: "Circuit 2 (35,446 gates)", slot: 3, end: "Circuit 2", points: [[1, 1.5], [2, 3.0], [4, 5.0], [8, 8.0], [16, 12.1], [32, 15.0], [64, 17.0], [128, 17.6], [256, 17.2], [512, 16.5], [1024, 15.0]] },
      { name: "Circuit 1 (19,126 gates)", slot: 4, end: "Circuit 1", points: [[1, 1.0], [2, 1.5], [4, 2.0], [8, 3.0], [16, 5.1], [32, 8.0], [64, 10.0], [128, 11.0], [256, 11.5], [512, 11.3], [1024, 10.0]] },
    ],
    height: 280,
  },

  // 18-740 lab 1 graded submission final_lab1.csv: NeverTaken ticks / predictor ticks (gem5, 8M instructions).
  "bp-speedup": {
    kind: "dots",
    alt: "Speedup over always-not-taken for seven branch predictors on four SPEC benchmarks. The custom Hybrid TAGE+ predictor is best on nab_r (1.377x) and imagick_r (1.258x); deepsjeng_r barely moves.",
    categories: ["LastGlobal", "GlobalHist", "LocalHist", "Hybrid", "TAGE", "Perceptron", "Hybrid TAGE+ (custom)"],
    series: [
      { name: "nab_r", slot: 1, values: [1.058, 1.056, 1.328, 1.236, 1.252, 1.239, 1.377] },
      { name: "imagick_r", slot: 2, values: [1.066, 1.105, 1.256, 1.214, 1.245, 1.189, 1.258] },
      { name: "xz_r", slot: 3, values: [1.054, 1.061, 1.055, 1.057, 1.068, 1.071, 1.076] },
      { name: "deepsjeng_r", slot: 4, values: [1.004, 1.007, 1.014, 1.014, 1.014, 1.013, 1.014] },
    ],
    x: { min: 0.98, max: 1.4, ticks: [1, 1.1, 1.2, 1.3, 1.4], fmt: "x2" },
    height: 280,
  },

  // 18-447 lab 2 reports (REPORT_forward.pdf): IPC of the 7-stage pipeline, stalling vs. forwarding.
  "core-ipc": {
    kind: "bars",
    alt: "IPC on the dependency-heavy test rises from 0.377 with stalling to 0.991 with forwarding, and from 0.584 to 0.991 on the lighter test.",
    categories: ["Dependency-heavy test", "Lighter-dependency test"],
    series: [
      { name: "Stall on hazards", slot: "muted", values: [0.377, 0.584] },
      { name: "Full forwarding", slot: 1, values: [0.991, 0.991] },
    ],
    x: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: "num2" },
    valueFmt: "num3",
    height: 170,
  },

  // 18-341 project 2: Vivado placed utilization (xc7s50, Spartan-7).
  "mm-util": {
    kind: "bars",
    alt: "FPGA utilization of the matrix-multiply accelerator: block RAM 96.7%, DSP 26.7%, I/O 12.9%, LUTs 3.1%, flip-flops 2.8%.",
    categories: ["Block RAM tiles", "DSP slices", "I/O pins", "LUTs", "Flip-flops"],
    series: [{ name: "Share of the Spartan-7 used", slot: 1, values: [0.967, 0.267, 0.129, 0.0314, 0.0282] }],
    x: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: "pct0" },
    valueFmt: "pct1",
    height: 200,
  },

  // 18-500 final report Table 4: following distance per trial.
  "sf-distance": {
    kind: "xy",
    alt: "Following distance in seven trials: 1.30, 1.35, 1.55, 1.65, 1.10, 0.85 and 1.40 m against a 1.0–1.5 m target.",
    x: { type: "band", labels: ["1", "2", "3", "4", "5", "6", "7"], title: "trial" },
    y: { min: 0.6, max: 1.8, ticks: [0.6, 0.9, 1.2, 1.5, 1.8], fmt: "num1", tipFmt: "m2" },
    bands: [{ y0: 1.0, y1: 1.5, label: "target 1.0–1.5 m" }],
    series: [{ name: "following distance", slot: 1, markers: true, line: false, points: [[0, 1.3], [1, 1.35], [2, 1.55], [3, 1.65], [4, 1.1], [5, 0.85], [6, 1.4]] }],
    height: 230,
  },
  "sf-fps": {
    kind: "xy",
    alt: "Detection frame rate on the Raspberry Pi 5 in six trials: 9.3 to 10.1 FPS, average 9.7.",
    x: { type: "band", labels: ["1", "2", "3", "4", "5", "6"], title: "trial" },
    y: { min: 0, max: 12, ticks: [0, 4, 8, 12], fmt: "int", tipFmt: "num1" },
    bands: [{ y0: 5, y1: 12, label: "requirement ≥ 5 FPS" }],
    series: [{ name: "frames per second", slot: 1, markers: true, line: false, points: [[0, 9.5], [1, 9.8], [2, 10.1], [3, 9.7], [4, 9.3], [5, 9.9]] }],
    height: 200,
  },

  // 18-500 team status report 04-25, Table 2 (unit tests), YOLO detection row.
  "sf-detect": {
    kind: "bars",
    alt: "Person detection mAP@0.5 by scene: classroom 93%, hallway 95%, multiple people 91%, heavy occlusion 89%, side angle 94%.",
    categories: ["Classroom", "Hallway", "Multiple people", "Heavy occlusion", "Side angle"],
    series: [{ name: "mAP@0.5", slots: [1, 1, 1, 2, 1], values: [0.93, 0.95, 0.91, 0.89, 0.94] }],
    legend: [{ name: "Meets the 90% requirement", slot: 1, kind: "rect" }, { name: "Below it", slot: 2, kind: "rect" }],
    x: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: "pct0" },
    height: 200,
  },

  // MCM 2025 paper, Table "Predictions of the optimized tourism plan for the next 5 years".
  "mcm-plan": {
    kind: "xy",
    alt: "Optimized five-year plan for Juneau: resident satisfaction stays between 0.83 and 0.92 while the environmental index recovers from 0.03 to 0.18.",
    x: { type: "band", labels: ["2024", "2025", "2026", "2027", "2028"] },
    y: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: "num2", tipFmt: "num3" },
    series: [
      { name: "Resident satisfaction", slot: 1, markers: true, end: "satisfaction", points: [[0, 0.882], [1, 0.893], [2, 0.832], [3, 0.899], [4, 0.917]] },
      { name: "Environmental index", slot: 2, markers: true, end: "environment", points: [[0, 0.029], [1, 0.076], [2, 0.123], [3, 0.17], [4, 0.181]] },
    ],
    table: {
      head: ["Year", "Tourists", "Tax rate", "Gov. revenue", "Env. index", "Resident sat."],
      rows: [["1", "1.537 M", "4.2%", "$14.0 M", "0.029", "0.882"], ["2", "1.548 M", "4.2%", "$14.1 M", "0.076", "0.893"], ["3", "1.522 M", "5.0%", "$16.6 M", "0.123", "0.832"], ["4", "1.583 M", "4.0%", "$13.8 M", "0.170", "0.899"], ["5", "1.683 M", "3.2%", "$11.7 M", "0.181", "0.917"]],
    },
    height: 240,
  },
};
