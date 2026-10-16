"""Generate the project write-up pages and the homepage "Selected work" list.

Every project is described once in PROJECTS. Running this script rewrites
projects/<slug>.html for projects that have a write-up, and replaces the block
between <!-- work:start --> and <!-- work:end --> in index.html.

Charts are referenced by key from assets/chart-data.js:
  {{chart:KEY|Title|Subtitle}}             one full-width chart
  {{pair:KEY1|Title1;KEY2|Title2|Subtitle}}  two charts side by side

Usage: python3 _build/build.py
"""

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = "9"  # asset cache-busting version

LAYERS = {
    "agents": "Agents",
    "models": "Models",
    "retrieval": "Retrieval &amp; systems",
    "kernels": "Kernels &amp; compilers",
    "hardware": "Hardware",
}

# A data-free thumbnail for work whose numbers stay private.
LOOP_ART = """<svg viewBox="0 0 120 72" aria-hidden="true" class="thumb-art">
  <circle cx="30" cy="26" r="9" fill="var(--s1)"/><circle cx="60" cy="14" r="9" fill="var(--s2)"/><circle cx="90" cy="26" r="9" fill="var(--s3)"/>
  <path d="M39 22 Q45 15 51 15" fill="none" stroke="var(--ink-3)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M69 15 Q75 15 81 22" fill="none" stroke="var(--ink-3)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M86 35 Q60 52 34 35" fill="none" stroke="var(--ink-3)" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 3"/>
  <rect x="44" y="52" width="32" height="12" rx="3" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.2"/>
</svg>"""

PROJECTS = [
    # ------------------------------------------------------------------ agents
    dict(
        slug=None, layer="agents", areas="agentic llm-agents ai-infra",
        org="ByteDance", when="Jul – Sep 2026 · intern",
        title="An agent loop that tunes an ads calibration system",
        summary="Replaced manual tuning of an ad-outcome calibration system with a dynamic agentic optimization loop. I also built a self-evolving skill subsystem: execution outcomes become versioned skill definitions, stored in distributed storage that runtime agents read directly instead of going through the API tier.",
        stats=[], tags=["LLM agents", "skill memory", "distributed storage"],
        thumb_art=LOOP_ART,
    ),
    # ------------------------------------------------------------------ models
    dict(
        slug="persona-stability", layer="models", areas="llm conversational llm-agents inference",
        org="Stanford CS329X", when="Oct 2026 – now",
        title="Why role-play LLMs drift in long conversations",
        summary="Over 40+ turns, persona-conditioned LLMs stop sounding like their character. We found the failure looks like imitation, not forgetting: the model copies its own and its partner's earlier lines while still answering persona facts correctly. I built the harness: KV-cache-reusing MLX and Hugging Face backends, decoding-time interventions, and a blind LLM judge calibrated with planted errors.",
        stats=[("~225", "dialogues generated"), ("24/24", "persona facts still correct at turn 39")],
        tags=["Qwen3", "logit / attention steering", "LLM-as-judge", "MLX · HF"],
        thumb="persona-dyad-qwen",
        page=dict(
            title="Persona Drift Study",
            kicker="Models · Stanford CS329X · Oct 2026 – ongoing",
            h1="Why role-play LLMs drift in long conversations",
            dek="Give a model a persona and let it talk for 40 turns, and it stops sounding like that person. We expected forgetting. What we found was imitation.",
            meta=["Two-person team; I built most of the harness", "Python · MLX · Hugging Face · Qwen3"],
            facts=[("~225", "dialogues, 40–50 turns"), ("~500", "blind LLM-judge scores"), ("3,135", "published dialogues re-analyzed"), ("24 / 24", "persona facts correct at turn 39")],
            tldr="Over long conversations, a persona-conditioned model starts copying text that is already in its context, both its own earlier replies and its partner's, while it can still answer questions about the persona correctly. Training-free fixes that push the persona's logits back in did not help. Damping attention to the speaker's own old replies is the one intervention with a consistent positive sign.",
            body="""
<h2>The question</h2>
<p>LLM-simulated users and role-play agents are only useful over a long horizon if they stay the person they were set up to be. Our original idea was a test-time, training-free fix: compare the next-token distribution with and without the persona in the prompt, treat the difference as the persona's contribution, and add a scaled part of it back once the persona fades.</p>

<h2>What I built</h2>
<ul>
  <li><strong>Two inference backends</strong> (MLX on Apple silicon, Hugging Face on CUDA) with prefix-reusing KV-cache slots, so long dialogues don't re-encode history every turn. Both expose attention bias, hidden-state capture, and residual-stream steering, and load 4-bit and GGUF models.</li>
  <li><strong>Decoding-time interventions</strong> as plug-in strategies: persona re-injection, classifier-free-guidance-style logit contrast, a static persona logit bias with a drift thermostat, activation steering, and attention damping on the speaker's own history.</li>
  <li><strong>A two-speaker setup</strong> where one model plays both personas, with separate histories, caches, and strategies per side.</li>
  <li><strong>A blind evaluation pipeline</strong>: dialogues split into anonymized 20-message chunks, scored by independent LLM judges, calibrated with planted errors (3 of 3 caught at the right message) and test-retest across judging phases.</li>
</ul>

<h2>What we found</h2>
<p><strong>The model locks into a template within about ten turns.</strong> On Qwen3-8B, the share of a reply's 3-word sequences already in its last five replies rose from 0.28 (turns 0–9) to 0.92 (turns 40–49), while next-token entropy fell from 0.41 to 0.03 nats.</p>
{{chart:persona-repetition|Repetition per turn, Qwen3-8B|Share of a reply's 3-word sequences already in the model's previous 5 replies, mean over 3 scenarios. An anti-repetition sampler (C) stops the loop; a same-model user (D) makes it worse.}}
<p><strong>It is imitation, not forgetting.</strong> Asked a factual question about its persona at turn 39, the model answered correctly 24 of 24 times (Qwen3-4B, 12 pairs). The persona is still in there; the model just prefers to copy what is already in context. This shows up with every partner we tried: replayed users, a published benchmark's LLM user, and the same model on both sides.</p>
{{pair:persona-dyad-qwen|Qwen3-4B-Instruct (12 pairs);persona-dyad-m2|MiniMax-M2-her-4b (16 pairs)|Same model on both sides, 40 replies each: share of a reply's 3-word sequences copied from the partner's previous line. Damping attention to the speaker's own older replies slows copying on one of the two models.}}
<p><strong>Truncating history trades copying for continuity.</strong> Showing the model only the last 4 rounds cut partner copying to 0.15 (vs. 0.33 baseline and 0.20 with attention damping). But a blind continuity judge, run three times, found more contradictions of earlier facts under truncation in 11 of 12 pairs: 3.6 vs. 1.8 per dialogue.</p>

<h2>What didn't work</h2>
<p>Our original idea, adding the persona's logit contribution back during decoding, did not improve judged behavior in any of four forms on three models. The distribution-level persona signal and the behavior a judge sees turned out to be decoupled, which is a useful negative result for anyone building drift monitors on logit statistics.</p>

<h2>Next</h2>
<p>The target has shifted from persona forgetting to <em>conversational collapse between simulated speakers</em>. Next are a drift sensor based on self-similarity of recent replies (Spearman ≈ −0.8 with judged fidelity in our runs) and a versioned API judge for final numbers.</p>
""",
        ),
    ),
    dict(
        slug="mm-hdl", layer="models", areas="llm mlsys",
        org="CMU 11-777, team of 4", when="Spring 2026",
        title="Multimodal representations of hardware designs",
        summary="Can a model understand a Verilog design better by reading its code and its dataflow graph together? Our team learned joint embeddings of 14,167 designs for description search and circuit-type classification. I built the LLM classification benchmark and its error analysis, plus graph-encoder pretraining for the trained model.",
        stats=[("0.652", "Qwen3-8B zero-shot accuracy with code + graph"), ("130", "designs only the graph input gets right")],
        tags=["Qwen3-8B", "graph attention", "contrastive learning", "Verilog"],
        thumb="mmhdl-modality",
        page=dict(
            title="MM-HDL Project",
            kicker="Models · CMU 11-777 Multimodal ML · Spring 2026",
            h1="Multimodal representations of hardware designs",
            dek="A Verilog module can be read as code, as a dataflow graph, or through a plain-English description. We asked whether a model does better when it sees more than one of them.",
            meta=["Team of four; my part is described below", "Python · PyTorch · Qwen3"],
            facts=[("14,167", "Verilog designs"), ("8", "circuit categories"), ("3", "views per design"), ("1,424", "held-out test designs")],
            body="""
<h2>The setup</h2>
<p>Each design in our dataset (curated from the public BRIDGES corpus) comes with its Verilog code, the design's dataflow graph, a natural-language description, and one of eight category labels. We studied two tasks: finding the right design for a description, and classifying a design into its category.</p>

<h2>My part</h2>
<ul>
  <li><strong>The LLM classification benchmark.</strong> Qwen3-8B, zero-shot, given the code, the graph, or both, with prompts that restrict the answer to one category name, constrained decoding, and tracking of inputs truncated by the context window.</li>
  <li><strong>The error analysis.</strong> Confusion matrices and an overlap study of which designs each input view gets right. This is where the case for combining views came from.</li>
  <li><strong>Pieces of the trained model.</strong> A graph-only pretraining stage with warm start for the graph encoder, a padding-aware pooling fix, and the cross-attention fusion experiments.</li>
</ul>

<h2>What the baselines showed</h2>
{{chart:mmhdl-modality|Qwen3-8B zero-shot, 8-way classification|1,424 held-out designs. Adding the graph to the code helps a little on accuracy and more on macro-F1.}}
<p>Neither view dominates. The graph alone is weaker overall, yet it is the only view that gets 130 designs right, so the two carry different information.</p>
{{chart:mmhdl-overlap|Which input lets the model classify each design correctly|Count of test designs by the set of input views that produced a correct answer.}}

<h2>Where the team landed</h2>
<p>The trained model encodes the graph with a graph attention network, fuses it with the code, and aligns the result with description embeddings using a contrastive loss. On description-to-design search over the full pool, the team's gated-fusion model reached recall@1 of 0.696, against 0.396 for BM25 over code and graph text. Those retrieval results are my teammates' work; the cross-attention variant I ran was still in progress at the poster session.</p>
""",
        ),
    ),
    dict(
        slug="amortized-estimators", layer="models", areas="mlsys gpus",
        org="CMU, Moura group", when="May 2025 – 2026",
        title="One network pass instead of thousands of Monte Carlo samples",
        summary="Certifying a classifier's robustness usually means hundreds to thousands of noisy forward passes per input. We trained a small network that predicts the Monte Carlo answer in one pass. I built the vote-dataset pipeline, ran the cost comparisons on GPU servers, and ported training to AWS Trainium.",
        stats=[("100×+", "fewer FLOPs than Monte Carlo at matched error"), ("4", "datasets: MNIST, Fashion-MNIST, KMNIST, CIFAR-10")],
        tags=["PyTorch Lightning", "Hydra", "AWS Trainium", "randomized smoothing"],
        thumb="nncert-flops",
        page=dict(
            title="Amortized Certification",
            kicker="Models · CMU, Prof. José Moura's group · May 2025 – 2026",
            h1="One network pass instead of thousands of Monte Carlo samples",
            dek="Randomized smoothing certifies a classifier by asking how its prediction changes under Gaussian noise. The standard answer costs hundreds of forward passes per input. We learned to predict it in one.",
            meta=["Research with a PhD student lead", "PyTorch · Lightning · Hydra · AWS Trainium"],
            facts=[("1", "certifier pass per query"), ("160–6,400×", "fewer FLOPs, CIFAR-10"), ("1,300×", "median FLOP ratio"), ("4", "image datasets")],
            body="""
<h2>The problem</h2>
<p>To certify a prediction at noise level σ, you estimate the class distribution of the classifier on many noisy copies of the input. Monte Carlo does this with hundreds to tens of thousands of forward passes for every input and every σ. Our certifier is a network conditioned on σ that maps an image to that class distribution directly.</p>

<h2>What I did</h2>
<ul>
  <li><strong>The data pipeline:</strong> train a base classifier, generate offline "vote" datasets by Monte Carlo sampling across a grid of σ values, train the certifier with cross-entropy, KL, or L1 losses, and evaluate with all three.</li>
  <li><strong>The cost study:</strong> for each held-out image and σ, measure the certifier's L1 error against a high-sample reference, then count how many Monte Carlo samples reach the same error and convert both sides to FLOPs.</li>
  <li><strong>Infrastructure:</strong> runs on MNIST, Fashion-MNIST, KMNIST, and CIFAR-10 on lab GPU servers, and a port of training to AWS Trainium with tensor parallelism.</li>
</ul>

<h2>Result</h2>
{{chart:nncert-flops|Compute to reach the certifier's accuracy, CIFAR-10|500 images × 5 noise levels, binned by the certifier's error on each query. Monte Carlo cost is the FLOPs of the samples it needed to match that error.}}
<p>One certifier pass costs 4.1 MFLOPs; one Monte Carlo sample costs 41 MFLOPs. To match the certifier, Monte Carlo needed 160× to 6,400× more compute depending on how accurate the target was, with a median of about 1,300×. The more precise the answer you need, the bigger the gap. One caveat: Monte Carlo was evaluated in steps of 16 samples, so 160× is the smallest ratio the setup can show.</p>
""",
        ),
    ),
    dict(
        slug="qa-generation", layer="models", areas="llm ir",
        org="CMU NLP course, team of 2", when="Fall 2023",
        title="Question answering and generation over long documents",
        summary="To answer a question about a long article, TF-IDF retrieval picks the relevant passages, a BERT classifier routes yes/no versus open questions, and fine-tuned T5 models answer each type. A second pipeline turns extracted keywords into questions with another fine-tuned T5.",
        stats=[("0.811", "F1 on yes/no questions (BoolQ)"), ("0.763", "F1 on span answers (SQuAD)")],
        tags=["T5", "BERT", "TF-IDF retrieval", "PyTorch"],
        thumb="nlp-metrics",
        page=dict(
            title="Long-Document QA",
            kicker="Models · CMU NLP course · Fall 2023",
            h1="Question answering and generation over long documents",
            dek="Two pipelines over long articles: one answers questions about the text, the other writes questions a reader could ask.",
            meta=["Two-person course project", "Python · PyTorch · Hugging Face"],
            facts=[("0.978", "question-type F1"), ("0.811", "yes/no answer F1"), ("0.763", "span answer F1"), ("79%", "generated questions judged sensible")],
            body="""
<h2>Answering</h2>
<p>Articles are much longer than the passages the models were trained on, so the pipeline first narrows them down. TF-IDF vectors and cosine similarity pick the passages most relevant to the question. A fine-tuned BERT classifier then decides whether the question is yes/no or asks for a span. Yes/no questions go to a T5-small fine-tuned on BoolQ; the rest go to a T5-small fine-tuned on SQuAD that extracts the answer span. Fine-tuning BERT on SQuAD for the span task gave much lower exact match than T5, so we kept T5.</p>

<h2>Generating</h2>
<p>YAKE extracts keywords from the passage; a T5-small fine-tuned on SQuAD treats each keyword as an answer and writes a question for it. We also tried few-shot prompting Llama-2 for both tasks and dropped it: it was slow and its output format was hard to control.</p>

<h2>Results</h2>
{{chart:nlp-metrics|Validation scores for both pipelines|Answering on BoolQ / SQuAD validation sets; generation on SQuAD validation, with grammaticality from LanguageTool and sensibleness from a manual check of 100 sampled questions.}}
<p>The main failure we saw was questions that need implicit reasoning across sentences: the answering models only extract or classify, so they can't combine facts the text never states together. Dense passage retrieval was the next step we did not get to.</p>
""",
        ),
    ),
    # ------------------------------------------------------------------ retrieval
    dict(
        slug="vector-recall", layer="retrieval", areas="ir sys",
        org="CMU STAR Lab", when="Feb 2025 – May 2026",
        title="Measuring who vector search fails",
        summary="Approximate nearest-neighbor search in pgvector returns good results for some groups of queries and poor results for others. I built the lab's offline measurement pipeline, added new workloads, co-designed the lab's adaptive loop that retunes search per query cluster at runtime, and helped build its monitor. Advised by Prof. Akshitha Sriraman.",
        stats=[("56%", "of GloVe-100 queries below 0.9 recall@10 at ef_search 10"), ("0.16", "recall gap between query clusters")],
        tags=["pgvector", "HNSW", "ann-benchmarks", "Docker"],
        thumb="star-tail",
        page=dict(
            title="Vector Search Recall",
            kicker="Retrieval & systems · CMU STAR Lab · Feb 2025 – May 2026",
            h1="Measuring who vector search fails",
            dek="Average recall hides the queries that get bad answers. We measured recall per query and per region of the embedding space, and found the misses are not spread evenly.",
            meta=["Advised by Prof. Akshitha Sriraman", "Python · pgvector · Docker · ann-benchmarks"],
            facts=[("10,000", "queries per sweep"), ("8", "search settings per index"), ("4", "new workloads added"), ("0.16", "recall gap across clusters")],
            body="""
<h2>The problem</h2>
<p>pgvector's HNSW index trades accuracy for speed through its search breadth, <code>ef_search</code>. Benchmarks report mean recall, but recall varies a lot from query to query, and queries from some parts of the embedding space are served much worse than others.</p>

<h2>What I built</h2>
<ul>
  <li><strong>The offline measurement pipeline</strong> on top of ann-benchmarks: pgvector HNSW in Docker, swept over index and search settings, recording recall@10 for every query instead of the average.</li>
  <li><strong>Per-cluster analysis:</strong> KMeans over the query vectors, recall distributions per cluster (violin and box plots), and Earth Mover's distance between clusters.</li>
  <li><strong>New workloads:</strong> GloVe, CIFAR-10/100 image embeddings, FairFace, and DBpedia.</li>
  <li><strong>The runtime side:</strong> co-designed the lab's adaptive loop, which assigns each query to a cluster and retunes search breadth per cluster to hold recall up, and helped build its monitoring module.</li>
</ul>

<h2>What the measurements show</h2>
{{chart:star-tail|Queries left behind, GloVe-100 (10,000 queries)|Share of queries whose recall@10 is below 0.9, as search breadth grows.}}
<p>At a low search breadth the mean recall is 0.70, but more than half the queries fall below 0.9. Raising the breadth fixes them, at a steep price in throughput:</p>
{{chart:star-tradeoff|Recall against throughput, HNSW M=16|Each point is one ef_search setting, from 10 (fastest) to 800.}}
<p>The misses also cluster. Grouping GloVe-25 queries into ten regions of the embedding space, the worst region's mean recall is 0.16 below the best one's at the same setting. That gap is what a single global search breadth can't fix, and why the lab's system tunes search per region.</p>
{{chart:star-clusters|Mean recall@10 by query cluster, GloVe-25, ef_search 10|Queries grouped by KMeans (k = 10) on the query vectors; overall mean 0.804.}}
""",
        ),
    ),
    # ------------------------------------------------------------------ kernels
    dict(
        slug=None, layer="kernels", areas="gpus mlsys inference",
        org="CMU Catalyst Lab", when="May – Aug 2025",
        title="A tensor-kernel compiler for NVIDIA Blackwell",
        summary="Built a compiler for B200 GPUs on TVM with custom scheduling and prototyped codegen passes. Tuned matmul through tile sizes, memory movement, and kernel fusion in PTX and CUDA.",
        stats=[("97%", "of ThunderKittens matmul throughput")],
        tags=["CUDA", "PTX", "TVM", "B200"],
        thumb="bw-matmul",
    ),
    dict(
        slug="cuda-fault-sim", layer="kernels", areas="gpus sys",
        org="CMU 15-418, team of 2", when="Spring 2025",
        title="A CUDA differentiable fault simulator",
        summary="Gradient-based test generation for chips needs a fault simulator that runs inside PyTorch. We replaced a graph-library implementation with custom CUDA kernels that propagate logic values and fault observability layer by layer, one thread per gate.",
        stats=[("25.4×", "faster than the CPU baseline on c7552"), ("94%", "of peak memory bandwidth at batch 64")],
        tags=["CUDA", "C++", "PyTorch extensions", "RTX 4060"],
        thumb="faultsim-block",
        page=dict(
            title="CUDA Fault Simulator",
            kicker="Kernels & compilers · CMU 15-418 Parallel Computer Architecture · Spring 2025",
            h1="A CUDA differentiable fault simulator",
            dek="Automatic test pattern generation can be posed as gradient descent over a probabilistic circuit simulator. That only pays off if the simulator is fast. We moved it onto the GPU.",
            meta=["Two-person team, equal split", "CUDA · C++ · PyTorch extensions · RTX 4060"],
            facts=[("25.4×", "speedup on c7552"), ("41,333", "gates in the largest circuit"), ("25 µs", "fastest kernel, 128 threads"), ("338 GB/s", "of 360 GB/s peak")],
            body="""
<h2>The problem</h2>
<p>A differentiable fault simulator computes, for every gate, the probability of each logic value and of a stuck-at fault being observable, so test patterns can be optimized by gradient descent. The baseline was written in Python on a graph library (DGL).</p>

<h2>What we built</h2>
<ul>
  <li><strong>Custom CUDA kernels</strong> for logic-value propagation and fault-observability propagation, called from PyTorch through a C++ extension so gradients still flow.</li>
  <li><strong>A layer-by-layer schedule:</strong> one kernel launch per topological level, one thread per gate, so every gate's inputs are ready when it runs.</li>
  <li><strong>A flat circuit layout:</strong> gates as arrays with fan-ins in CSR form, a switch over 16 gate types, and input patterns processed in batches.</li>
  <li><strong>A dead end, measured:</strong> a dependency-table version that dropped the level ordering was 38% slower, limited by memory bandwidth, and we abandoned it.</li>
</ul>

<h2>Results</h2>
{{chart:faultsim-block|Speedup over the CPU baseline vs. CUDA block size|End-to-end forward pass at batch size 64, four benchmark circuits.}}
<p>All four circuits peak between 128 and 256 threads per block. Kernel time is lowest at 128 threads (25 µs, against 52 µs at 32 threads) and 11% slower at 512. Speedup grows almost linearly with batch size up to 32 and peaks at batch 64, where the kernels use 338 of the GPU's 360 GB/s of memory bandwidth, so the simulator ends up bandwidth-bound rather than compute-bound.</p>
""",
        ),
    ),
    # ------------------------------------------------------------------ hardware
    dict(
        slug="branch-prediction", layer="hardware", areas="",
        org="CMU 18-740, team of 2", when="Fall 2025",
        title="Branch predictors and out-of-order structures",
        summary="In gem5, I wrote TAGE, perceptron, and a hybrid TAGE+ branch predictor and measured them on SPEC CPU benchmarks. In SystemVerilog, I built register renaming for an out-of-order core alongside a reorder buffer and issue queue.",
        stats=[("1.38×", "speedup on nab_r with the hybrid TAGE+ predictor")],
        tags=["gem5", "C++", "SystemVerilog", "SPEC CPU 2017"],
        thumb="bp-speedup",
        page=dict(
            title="Branch Prediction Lab",
            kicker="Hardware · CMU 18-740 Modern Computer Architecture · Fall 2025",
            h1="Branch predictors and out-of-order structures",
            dek="Two labs on what keeps a modern core busy: guessing branches early, and executing instructions out of order without breaking the program.",
            meta=["Two-person team", "gem5 · C++ · SystemVerilog · Cadence Genus"],
            facts=[("7", "predictors compared"), ("4", "SPEC CPU benchmarks"), ("8M", "instructions per run"), ("1.38×", "best speedup (nab_r)")],
            body="""
<h2>Branch prediction in gem5</h2>
<p>We implemented predictors in gem5 on an in-order ARM core with a 64 kB L1 and 1 MB L2, and simulated 8 million instructions of four SPEC CPU 2017 benchmarks. I wrote the TAGE predictor, the perceptron predictor, and our custom hybrid TAGE+ predictor.</p>
{{chart:bp-speedup|Speedup over always-not-taken|Simulated time of the always-not-taken baseline divided by each predictor's simulated time.}}
<p>The hybrid TAGE+ predictor is best or tied on every benchmark. The gains depend on the program: branch-heavy code with local patterns (nab_r, imagick_r) gains 26–38%, while deepsjeng_r barely moves with any predictor.</p>

<h2>Out-of-order structures in SystemVerilog</h2>
<p>The second lab moved to the structures that make out-of-order execution correct: a register renaming unit that maps architectural registers to physical ones and tracks free registers, a reorder buffer that retires instructions in program order, and an issue queue that wakes up instructions when their operands are ready. I built the renaming logic. We synthesized the components in Cadence Genus and studied core configurations in gem5's out-of-order model.</p>
""",
        ),
    ),
    dict(
        slug="riscv-pipeline", layer="hardware", areas="",
        org="CMU 18-447, team of 4", when="Spring 2025",
        title="A pipelined RISC-V core, from single-cycle to forwarding",
        summary="Built an RV32I core in SystemVerilog step by step: single-cycle, then a 7-stage pipeline, then branch prediction and a set-associative data cache, synthesized for timing, area, and power. My part was the pipeline's stall and forwarding logic.",
        stats=[("0.38 → 0.99", "IPC from stalling to forwarding on a dependency-heavy test"), ("0.86", "geomean IPC of the final core")],
        tags=["SystemVerilog", "VCS", "Synopsys DC"],
        thumb="core-ipc",
        page=dict(
            title="RISC-V Pipeline",
            kicker="Hardware · CMU 18-447 Introduction to Computer Architecture · Spring 2025",
            h1="A pipelined RISC-V core, from single-cycle to forwarding",
            dek="Four labs, one core: start from a single-cycle RV32I design and make it faster without making it wrong.",
            meta=["Team of four; I built the lab 2 pipeline control", "SystemVerilog · VCS · Synopsys Design Compiler"],
            facts=[("7", "pipeline stages (labs 2–3)"), ("0.99", "IPC with forwarding"), ("2.88 ns", "final clock period"), ("0.86", "final geomean IPC")],
            body="""
<h2>The path</h2>
<ul>
  <li><strong>Lab 1:</strong> a single-cycle RV32I core.</li>
  <li><strong>Lab 2:</strong> a 7-stage pipeline (two fetch stages, decode, execute, two memory stages, writeback), first stalling on data hazards, then with full forwarding. This was my part.</li>
  <li><strong>Lab 3:</strong> branch prediction with a branch target buffer and 1- and 2-bit direction counters, flushing on a mispredict.</li>
  <li><strong>Lab 4:</strong> a parameterized set-associative data cache, then tuning the whole design for performance per watt.</li>
</ul>

<h2>Stalling vs. forwarding</h2>
{{chart:core-ipc|Instructions per cycle, 7-stage pipeline|Two course test programs with different amounts of back-to-back data dependence.}}
<p>A stalling pipeline waits for a result to be written back before a dependent instruction can read it; forwarding passes the result from later stages straight to the instruction that needs it. On the dependency-heavy test, IPC went from 0.377 to 0.991 while the clock stayed within 3% (357 vs. 346 MHz), taking throughput from 135 to 343 million instructions per second.</p>

<h2>Where the team ended up</h2>
<p>A 2-bit predictor reached about 91% accuracy on two of the three branch tests (68% on the third) and cut cycle counts by 21–30% against always-not-taken. The final core, with a 2-way data cache and rebalanced critical paths, ran at a 2.88 ns clock with a geomean IPC of 0.86 across four benchmarks, about 298 million instructions per second.</p>
""",
        ),
    ),
    dict(
        slug="rtl-design", layer="hardware", areas="",
        org="CMU 18-341", when="Fall 2025",
        title="RTL design: an FPGA accelerator, a network-on-chip, and USB",
        summary="Three SystemVerilog designs: a pipelined matrix-vector accelerator that meets timing at 100 MHz on a Spartan-7, a two-router network-on-chip with fair arbitration, and the bit-level layers of a USB host.",
        stats=[("100 MHz", "timing met with 0.70 ns slack"), ("97%", "of on-chip block RAM used")],
        tags=["SystemVerilog", "Vivado", "Spartan-7 FPGA", "VCS"],
        thumb="mm-util",
        page=dict(
            title="RTL Design Projects",
            kicker="Hardware · CMU 18-341 Logic Design and Verification · Fall 2025",
            h1="RTL design: an FPGA accelerator, a network-on-chip, and USB",
            dek="Three designs from the same course, each about a different constraint: timing and memory bandwidth, fairness under contention, and getting every bit of a protocol right.",
            meta=["Accelerator and NoC individual; USB with a partner", "SystemVerilog · Vivado · Synopsys VCS"],
            facts=[("100 MHz", "on a Spartan-7"), ("32", "parallel multipliers"), ("24", "arbiter states per port"), ("10,000", "packets in the performance test")],
            body="""
<h2>Matrix-vector accelerator on an FPGA</h2>
<p>The design computes Y = A·B + C for a 128×128 matrix of 8-bit values on a Spartan-7 board. Sixteen dual-port block-RAM banks deliver 32 matrix elements per cycle to 32 parallel multipliers, followed by an adder tree and an accumulator. An extra register stage between the RAMs and the multipliers was what closed timing: the routed design meets 100 MHz with 0.70 ns of worst-case slack.</p>
{{chart:mm-util|FPGA resources used|Placed design on the xc7s50 Spartan-7. Block RAM is the limiting resource: feeding 32 multipliers per cycle takes nearly all of it.}}

<h2>Network-on-chip</h2>
<p>Six nodes connected through two routers. Each node splits 32-bit packets into 8-bit flits and reassembles them on the way out with a pair of FSMs and a small FIFO. Each router output port arbitrates between four inputs with a rotating-priority FSM that has one state per priority order (24 states), so no input can be starved. The design passes every course test, including broadcast, stress, fairness, and a 10,000-packet performance test that it completes in 15,931 cycles.</p>

<h2>USB host, bit layer</h2>
<p>With a partner, a USB host that reads and writes a device over the bus. I built the bit-level path: bit stuffing and unstuffing, NRZI encoding and decoding, driving and sampling the differential lines, bitstream decoding, and the read/write transaction FSM.</p>
""",
        ),
    ),
    dict(
        slug="safefollow", layer="hardware", areas="",
        org="CMU 18-500 capstone, team of 2", when="Spring 2026",
        title="SafeFollow: a robot that follows a person and avoids obstacles",
        summary="A Raspberry Pi 5 robot that tracks one person with YOLO and a stereo camera, keeps a set following distance, and stops for obstacles. I built the vision pipeline: detection, tracking with stable identities, and depth estimation.",
        stats=[("94%", "mAP@0.5 person detection"), ("9.7", "FPS on the Pi's CPU")],
        tags=["YOLO11", "ByteTrack", "OpenCV stereo", "Raspberry Pi 5"],
        thumb="sf-distance",
        page=dict(
            title="SafeFollow Robot",
            kicker="Hardware · CMU 18-500 ECE Capstone · Spring 2026",
            h1="SafeFollow: a robot that follows a person and avoids obstacles",
            dek="An assistive robot that follows an older adult. It has to keep the right person in view, keep its distance, and stop in time.",
            meta=["Two-person team; I built the vision pipeline", "Python · YOLO11 · OpenCV · Raspberry Pi 5"],
            facts=[("94.2%", "mAP@0.5, 6 scenarios"), ("9.7 FPS", "detection on CPU"), ("109 ms", "obstacle reaction"), ("50+ min", "battery life")],
            body="""
<h2>The system</h2>
<ul>
  <li><strong>Vision (my part):</strong> YOLO11n running on the Pi's CPU, restricted to people, with ByteTrack for tracking. A stable-identity layer re-matches the target by position and a color histogram of the torso, so the robot keeps the same person as its target when tracker IDs change.</li>
  <li><strong>Distance:</strong> stereo depth from the eYs3D camera with OpenCV block matching, falling back to an estimate from the bounding-box size.</li>
  <li><strong>Control:</strong> a PID loop holding about 1.25 m, three ultrasonic sensors with caution and stop thresholds, and a four-state machine: follow, avoid, search, stop. My partner built the drive base and motor control.</li>
</ul>

<h2>Testing</h2>
{{chart:sf-distance|Following distance across trials|Measured distance to the target person in seven runs, against the 1.0–1.5 m design target.}}
<p>Four of seven runs stayed inside the target band; the others ended at 1.55 m and 1.65 m (too far) and 0.85 m (too close). Detection held mAP@0.5 of 94.2% across six scenarios of 100 labeled images each, and the robot reacted to obstacles in 109 ms on average against a 200 ms requirement. Following worked at walking speeds of 0.2–0.5 m/s and failed at 0.6 m/s and above.</p>
{{chart:sf-fps|Detection frame rate on the Raspberry Pi 5|Six trials. The original goal was 15 FPS; we relaxed the requirement to 5 FPS.}}
""",
        ),
    ),
]

# Pages linked from elsewhere on the homepage (not in the work list).
EXTRA_PAGES = [
    dict(
        slug="mcm-2025",
        page=dict(
            title="MCM 2025 Paper",
            kicker="Award · Mathematical Contest in Modeling 2025 · Outstanding Winner, MAA Award",
            h1="Managing tourism in Juneau with dynamic programming",
            dek="Juneau, Alaska gets more than a million visitors a year. Our four-day contest paper asked how a city can tax and promote tourism so the economy grows without wearing down its glaciers or its residents.",
            meta=["Two-person team, with a teammate from Rice University", "Multi-objective dynamic programming"],
            facts=[("43", "Outstanding papers of 27,000+ teams"), ("5", "year plan"), ("3", "objectives balanced"), ("2", "cities modeled")],
            body="""
<h2>The model</h2>
<p>A tourist-demand model drives three linked models: economic profit, an environmental index that recovers with protection spending and degrades with crowding, and resident satisfaction, which drops when the town is too crowded or taxes are too high. Each year the city picks a tax rate and a promotion budget. Backward dynamic programming chooses those two controls to maximize profit plus weighted environment and satisfaction over five years, subject to a carrying capacity, minimum environment and satisfaction levels, and the city's budget.</p>

<h2>The plan it found</h2>
{{chart:mcm-plan|Optimized five-year plan|Resident satisfaction and the environmental index under the plan; the table adds visitors, tax rate, and government revenue.}}
<p>The plan keeps visitors roughly flat at 1.5–1.7 million a year and varies the tax between 3.2% and 5.0%. Revenue goes increasingly to environmental protection, so the environmental index recovers steadily while resident satisfaction stays near 0.9. We tested how the plan responds to each input in a sensitivity analysis and adapted the model to Miami, where crowding and visitor behavior differ.</p>

<h2>Links</h2>
<p><a href="https://www.comap-math.org/mcm/2025Certs/2504448.pdf">Certificate</a> · <a href="https://www.contest.comap.com/undergraduate/contests/mcm/contests/2025/results/">Official 2025 results</a></p>
""",
        ),
    ),
]


# ---------------------------------------------------------------- rendering
def chart_block(spec, pair=False):
    parts = spec.split("|")
    if not pair:
        key, title = parts[0], parts[1]
        sub = parts[2] if len(parts) > 2 else ""
        return f"""<figure class="figure chart-fig">
  <div class="chart-title">{title}</div>
  {f'<p class="chart-sub">{sub}</p>' if sub else ''}
  <div data-chart="{key}"></div>
</figure>"""
    # KEY1|Title1;KEY2|Title2|Subtitle
    left, rest = spec.split(";", 1)
    k1, t1 = left.split("|")
    k2, t2, sub = rest.split("|", 2)
    return f"""<figure class="figure chart-fig">
  <p class="chart-sub">{sub}</p>
  <div class="chart-pair">
    <div><div class="chart-title">{t1}</div><div data-chart="{k1}"></div></div>
    <div><div class="chart-title">{t2}</div><div data-chart="{k2}"></div></div>
  </div>
</figure>"""


def expand(body):
    body = re.sub(r"\{\{chart:(.+?)\}\}", lambda m: chart_block(m.group(1)), body, flags=re.S)
    body = re.sub(r"\{\{pair:(.+?)\}\}", lambda m: chart_block(m.group(1), pair=True), body, flags=re.S)
    return body


def page_html(slug, p):
    url = f"https://xinyu511.github.io/projects/{slug}.html"
    desc = html.escape(p["dek"], quote=True)
    facts = "".join(f"<div><b>{v}</b><span>{l}</span></div>" for v, l in p.get("facts", []))
    meta = "".join(f"<span>{m}</span>" for m in p.get("meta", []))
    tldr = f'<div class="tldr"><p><strong>TL;DR.</strong> {p["tldr"]}</p></div>' if p.get("tldr") else ""
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{p['title']}</title>
  <meta name="description" content="{desc}">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{html.escape(p['h1'], quote=True)}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#f4f6f9" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0c1016" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="{url}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/site.css?v={V}">
</head>
<body>
<div class="wrap">
  <header class="topbar">
    <a class="home" href="../">← xinyu li</a>
    <nav><a href="../#work">work</a><a href="../#about">about</a></nav>
  </header>

  <main class="article">
    <div class="kicker">{p['kicker']}</div>
    <h1>{p['h1']}</h1>
    <p class="dek">{p['dek']}</p>
    <div class="meta-row">{meta}</div>
    <div class="facts">{facts}</div>
    {tldr}
{expand(p['body'])}
  </main>

  <footer>
    <a href="../#work">← all work</a>
    <span>lixinyu@stanford.edu</span>
  </footer>
</div>
<script src="../assets/chart-data.js?v={V}"></script>
<script src="../assets/charts.js?v={V}"></script>
</body>
</html>
"""


def work_row(p):
    href = f"projects/{p['slug']}.html" if p.get("slug") else None
    label = html.escape(re.sub(r"<[^>]+>", "", p["title"]), quote=True)
    if p.get("thumb_art"):
        art = p["thumb_art"]
    else:
        art = f'<div data-chart="{p["thumb"]}" data-mode="thumb"></div>'
    thumb = (f'<a class="thumb" href="{href}" aria-label="Open the write-up: {label}">{art}</a>' if href
             else f'<div class="thumb" aria-hidden="true">{art}</div>')
    title = f'<a href="{href}">{p["title"]}</a>' if href else p["title"]
    stats = "".join(f"<li><b>{v}</b>{l}</li>" for v, l in p.get("stats", []))
    stats = f'\n        <ul class="stats">{stats}</ul>' if stats else ""
    tags = "".join(f'<span class="tag">{t}</span>' for t in p.get("tags", []))
    more = f'\n        <a class="more" href="{href}">Read the write-up →</a>' if href else ""
    return f"""    <article class="work" data-layer="{p['layer']}" data-areas="{p['areas']}">
      <div class="work-meta">{thumb}<span class="layer">{LAYERS[p['layer']]}</span><br>{p['org']}<br>{p['when']}</div>
      <div>
        <h3>{title}</h3>
        <p>{p['summary']}</p>{stats}
        <div class="tags">{tags}</div>{more}
      </div>
    </article>"""


def main():
    for p in PROJECTS + EXTRA_PAGES:
        if p.get("slug") and p.get("page"):
            (ROOT / "projects" / f"{p['slug']}.html").write_text(page_html(p["slug"], p["page"]), encoding="utf-8")
    index = ROOT / "index.html"
    s = index.read_text(encoding="utf-8")
    rows = "\n\n".join(work_row(p) for p in PROJECTS)
    s, n = re.subn(r"(<!-- work:start -->\n).*?(<!-- work:end -->)", lambda m: m.group(1) + rows + "\n" + m.group(2), s, flags=re.S)
    assert n == 1, "work markers not found in index.html"
    s = re.sub(r"assets/(site\.css|stack\.js|charts\.js|chart-data\.js)\?v=\d+", lambda m: f"assets/{m.group(1)}?v={V}", s)
    index.write_text(s, encoding="utf-8")
    print(f"wrote {sum(1 for p in PROJECTS + EXTRA_PAGES if p.get('slug') and p.get('page'))} pages, {len(PROJECTS)} work rows")


if __name__ == "__main__":
    main()
