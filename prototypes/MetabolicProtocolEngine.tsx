/**
 * SPADRA — Metabolic Protocol Engine v2.6
 * ----------------------------------------------------------------------------
 * Standalone diagnostic-quiz prototype. NOT wired into the live Shopify theme
 * (that quiz is vanilla JS + Liquid, see theme-src/sections/native-quiz-modal
 * .liquid) — this is a React/TS rebuild for a separate app shell, built to the
 * exact spec requested: 12-step factorial engine, 6 tracked "biochemical
 * vectors," terminal-style processing screen, diagnostic summary dashboard.
 *
 * Design decisions worth knowing before wiring this to anything real:
 *
 * 1. THE VECTOR SCORES ARE UX FLAVOR, NOT LAB DATA. There is no blood panel,
 *    no wearable, no biomarker feed behind acetaldehyde_clearance et al. — they
 *    are quiz-answer weights rendered as if they were physiological readouts.
 *    That framing is powerful UX and it is also the exact pattern regulators
 *    flag as an implied diagnostic claim. Two guardrails are built in and
 *    should not be removed: (a) the DISCLAIMER string rendered on both the
 *    question screen and the summary, matching the wording already standing
 *    on every Spadra product/quiz surface, and (b) internal-only framing —
 *    "Internal Biochemical Vector State," never "your lab results" or
 *    "your levels." If this ships publicly, Spadra's own compliance read
 *    should sign off on the vector-score presentation specifically, not just
 *    the ingredient claims.
 *
 * 2. THE FOUR SAMPLE CAPSULES ARE REAL SPADRA INGREDIENT NAMES, not the
 *    illustrative ones in the original brief. "KSM-66 Ashwagandha" and
 *    "Electrolyte Matrix" aren't verified as things Spadra's supplier
 *    actually ships (KSM-66 is a specific patented extract — claiming it
 *    without confirming the supplier uses that exact material is a false
 *    claim). Swapped to Ashwagandha / Trace Minerals / Ginger Root / Creatine
 *    — all four are real entries in scripts/spadra_registry.json ingredient
 *    lists. If backing this with the live catalogue, replace CAPSULE_LIBRARY
 *    with a fetch against the same ingredient map the Shopify quiz uses
 *    (snippets/spadra-quiz-catalog.liquid / spadra-ingredient-images.liquid).
 *
 * 3. "4,096 unique metabolic profiles" is copy the brief specified verbatim
 *    (2^12). It is marketing flourish, not a claim this engine's actual state
 *    space produces — left as requested, flagging it here rather than
 *    quietly changing your copy.
 *
 * 4. NO BACKEND. handleClaimProtocol() builds the JSON payload and logs it;
 *    wire it to a real checkout/cart endpoint before shipping.
 *
 * Requires: react, framer-motion, lucide-react, Tailwind CSS (dark mode via
 * bg-[#09090B] literals, no tailwind.config assumptions).
 * ----------------------------------------------------------------------------
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Activity,
  Zap,
  Moon,
  Dumbbell,
  Recycle,
  Wine,
  Brain,
  Leaf,
  Terminal,
  ShieldCheck,
  Package,
  Users,
  Code2,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";

/* ============================================================================
 * DISCLAIMER — matches the standing wording used across Spadra's quiz/product
 * surfaces. Do not rephrase into "diagnoses" / "treats" language.
 * ==========================================================================*/
const DISCLAIMER =
  "This assessment is informational and does not diagnose any condition or replace advice from your healthcare provider. These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

/* ============================================================================
 * VECTOR STATE
 * ==========================================================================*/
type VectorKey =
  | "acetaldehyde_clearance"
  | "neurotransmitter_replenishment"
  | "mitochondrial_atp"
  | "cortisol_hpa_axis"
  | "anabolic_retention"
  | "gastrointestinal_barrier";

type VectorState = Record<VectorKey, number>;

const VECTOR_META: Record<
  VectorKey,
  { label: string; sub: string; icon: React.ElementType }
> = {
  acetaldehyde_clearance: {
    label: "Acetaldehyde Clearance",
    sub: "Phase II Detox / Liver Kinetics",
    icon: Wine,
  },
  neurotransmitter_replenishment: {
    label: "Neurotransmitter Replenishment",
    sub: "Dopamine / GABA / Acetylcholine",
    icon: Brain,
  },
  mitochondrial_atp: {
    label: "Mitochondrial ATP",
    sub: "Cellular Energy & Oxygenation",
    icon: Zap,
  },
  cortisol_hpa_axis: {
    label: "Cortisol / HPA Axis",
    sub: "Adrenal Strain & Sleep Depth",
    icon: Moon,
  },
  anabolic_retention: {
    label: "Anabolic Retention",
    sub: "MPS / Creatine Synthesis / N Balance",
    icon: Dumbbell,
  },
  gastrointestinal_barrier: {
    label: "GI Barrier",
    sub: "Gut Permeability & Anti-Inflammation",
    icon: Leaf,
  },
};

const VECTOR_ORDER: VectorKey[] = [
  "acetaldehyde_clearance",
  "neurotransmitter_replenishment",
  "mitochondrial_atp",
  "cortisol_hpa_axis",
  "anabolic_retention",
  "gastrointestinal_barrier",
];

const BASELINE_VECTORS: VectorState = {
  acetaldehyde_clearance: 50,
  neurotransmitter_replenishment: 50,
  mitochondrial_atp: 50,
  cortisol_hpa_axis: 50,
  anabolic_retention: 50,
  gastrointestinal_barrier: 50,
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function applyDelta(state: VectorState, delta: Partial<VectorState>): VectorState {
  const next = { ...state };
  (Object.keys(delta) as VectorKey[]).forEach((k) => {
    next[k] = clamp(next[k] + (delta[k] ?? 0));
  });
  return next;
}

/* ============================================================================
 * QUESTION ENGINE
 * ==========================================================================*/
type BranchId = "SOCIAL" | "COGNITIVE" | "ANABOLIC" | "ECO";

const BRANCH_META: Record<BranchId, { label: string; tracer: string; icon: React.ElementType }> = {
  SOCIAL: { label: "Nightlife, Event & Social Recovery", tracer: "Social_Recovery", icon: Wine },
  COGNITIVE: { label: "Executive Brain Fog & Peak Cognitive Output", tracer: "Executive_Cognitive", icon: Brain },
  ANABOLIC: { label: "Post-Workout Anabolic & Athletic Retention", tracer: "Anabolic_Retention", icon: Dumbbell },
  ECO: { label: "Supplement Overload & Eco-Packaging Waste", tracer: "Protocol_Consolidation", icon: Recycle },
};

interface Option {
  id: string;
  label: string;
  sub?: string;
  delta: Partial<VectorState>;
  /** appended to the branch tracer once selected, e.g. "ATP_Depletion" */
  tracerTag?: string;
}

interface Question {
  id: string;
  step: number;
  /** Already resolved to branch-specific phrasing by buildQuestionSet(). */
  q: string;
  hint?: string;
  options: Option[];
}

/** Step 1 — Primary Vector Gate. No prior state to condition on. */
const STEP_1: Question = {
  id: "gate",
  step: 1,
  q: "Identify your primary operational bottleneck:",
  options: [
    { id: "SOCIAL", label: "Nightlife, Event & Social Recovery", sub: "Alcohol / sleep disruption", delta: {}, tracerTag: "Social_Recovery" },
    { id: "COGNITIVE", label: "Executive Brain Fog & Peak Cognitive Output", sub: "Focus / working memory", delta: {}, tracerTag: "Executive_Cognitive" },
    { id: "ANABOLIC", label: "Post-Workout Anabolic & Athletic Retention", sub: "Recovery / strength retention", delta: {}, tracerTag: "Anabolic_Retention" },
    { id: "ECO", label: "Supplement Overload & Eco-Packaging Waste", sub: "Consolidation / plastic reduction", delta: {}, tracerTag: "Protocol_Consolidation" },
  ],
};

/** Step 2 — Biochemical Isolation. Fully conditional on the Step 1 branch. */
const STEP_2_BY_BRANCH: Record<BranchId, Question> = {
  SOCIAL: {
    id: "isolation",
    step: 2,
    q: "What is your primary physiological marker the morning after?",
    options: [
      { id: "nausea", label: "Acetaldehyde Nausea", sub: "GI distress, morning queasiness", delta: { acetaldehyde_clearance: -18, gastrointestinal_barrier: -10 }, tracerTag: "Acetaldehyde_Load" },
      { id: "neural", label: "Neural Dysfunction", sub: "Fog, flat affect, no deep work", delta: { neurotransmitter_replenishment: -18, cortisol_hpa_axis: -6 }, tracerTag: "Neural_Depletion" },
      { id: "dehydration", label: "Heavy Dehydration", sub: "Headache, fatigue, thirst", delta: { mitochondrial_atp: -14, cortisol_hpa_axis: -8 }, tracerTag: "Hydration_Deficit" },
    ],
  },
  COGNITIVE: {
    id: "isolation",
    step: 2,
    q: "Which executive function suffers most?",
    options: [
      { id: "memory", label: "Working Memory", sub: "Holding multiple threads at once", delta: { neurotransmitter_replenishment: -16, mitochondrial_atp: -6 }, tracerTag: "WM_Load" },
      { id: "focus", label: "Focus Retention", sub: "Sustained deep-work windows", delta: { neurotransmitter_replenishment: -12, mitochondrial_atp: -12 }, tracerTag: "ATP_Depletion" },
      { id: "decision", label: "Decision Fatigue", sub: "Quality drops late in the day", delta: { cortisol_hpa_axis: -14, neurotransmitter_replenishment: -8 }, tracerTag: "Decision_Fatigue" },
    ],
  },
  ANABOLIC: {
    id: "isolation",
    step: 2,
    q: "Where do you measure your post-social drop?",
    options: [
      { id: "lift", label: "Max Lift Output", sub: "Strength numbers regress", delta: { anabolic_retention: -18, mitochondrial_atp: -6 }, tracerTag: "MPS_Suppression" },
      { id: "cardio", label: "Cardio Endurance", sub: "VO2 ceiling drops fast", delta: { mitochondrial_atp: -16, anabolic_retention: -4 }, tracerTag: "Oxidative_Capacity" },
      { id: "doms", label: "DOMS Recovery Time", sub: "Soreness lingers longer", delta: { anabolic_retention: -12, gastrointestinal_barrier: -6 }, tracerTag: "Recovery_Lag" },
    ],
  },
  ECO: {
    id: "isolation",
    step: 2,
    q: "What is the core friction in your current protocol?",
    options: [
      { id: "clutter", label: "Bottles Clutter", sub: "Counter full of separate SKUs", delta: { gastrointestinal_barrier: -4 }, tracerTag: "SKU_Fragmentation" },
      { id: "fillers", label: "Synthetic Fillers", sub: "Proprietary blends, no real dosing", delta: { gastrointestinal_barrier: -8, acetaldehyde_clearance: -2 }, tracerTag: "Formulation_Opacity" },
      { id: "waste", label: "High Waste", sub: "Plastic footprint per month", delta: {}, tracerTag: "Packaging_Waste" },
    ],
  },
};

/**
 * Steps 3–11 — the shared adaptive profile. Phrasing changes per branch (the
 * combinatorial part of the brief); the answer scale and vector deltas stay
 * consistent across branches so scoring never depends on which of the four
 * near-identical wordings a shopper happened to see.
 */
const STEP_PHRASING: Record<
  number,
  { base: string; hint?: string; branch?: Partial<Record<BranchId, string>> }
> = {
  3: {
    base: "How often does the situation that drives this actually happen?",
    branch: {
      SOCIAL: "How often does a night out actually happen?",
      COGNITIVE: "How often do you hit a demanding cognitive load — a launch, a sprint, back-to-back deep work?",
      ANABOLIC: "How many training sessions do you log in a typical week?",
      ECO: "How many separate supplements are currently in rotation?",
    },
  },
  4: {
    base: "How would you describe your sleep architecture lately?",
    hint: "Fragmented REM and lost deep sleep are different problems with different fixes.",
  },
  5: {
    base: "When does your energy actually run out during the day?",
    hint: "Timing tells us more than intensity.",
  },
  6: {
    base: "How sharp is your stress spike when the pressure actually hits?",
  },
  7: {
    base: "How does your gut respond after a typical meal?",
  },
  8: {
    base: "How fast do you feel back to baseline after a heavy input — physical, mental, or chemical?",
    branch: {
      SOCIAL: "How fast do you clear a heavy drinking night — 12 hours, or closer to 48?",
    },
  },
  9: {
    base: "How many separate bottles are currently on your counter?",
  },
  10: {
    base: "Any dietary or formulation constraints we should route around?",
  },
  11: {
    base: "How often should your protocol actually be re-checked against your schedule?",
  },
};

const STEP_OPTIONS: Record<number, Option[]> = {
  3: [
    { id: "low", label: "1x / month or less", delta: { cortisol_hpa_axis: 4 } },
    { id: "mid", label: "1–2x / week", delta: { cortisol_hpa_axis: -4, mitochondrial_atp: -3 } },
    { id: "high", label: "3–4x / week", delta: { cortisol_hpa_axis: -10, mitochondrial_atp: -8, acetaldehyde_clearance: -6 } },
    { id: "sustained", label: "4+x / week", delta: { cortisol_hpa_axis: -16, mitochondrial_atp: -12, acetaldehyde_clearance: -12, anabolic_retention: -6 } },
  ],
  4: [
    { id: "solid", label: "Solid — I wake up rested", delta: { cortisol_hpa_axis: 6 } },
    { id: "rem", label: "REM Fragmentation", sub: "Waking repeatedly, restless dreams", delta: { neurotransmitter_replenishment: -10, cortisol_hpa_axis: -6 } },
    { id: "deep", label: "Deep Sleep Loss", sub: "Long hours, low restoration", delta: { mitochondrial_atp: -10, anabolic_retention: -6 } },
    { id: "both", label: "Both — sleep is a mess", delta: { neurotransmitter_replenishment: -8, mitochondrial_atp: -8, cortisol_hpa_axis: -8 } },
  ],
  5: [
    { id: "none", label: "It doesn't — steady all day", delta: { mitochondrial_atp: 6 } },
    { id: "midmorning", label: "Mid-morning crash", delta: { mitochondrial_atp: -8, cortisol_hpa_axis: -4 } },
    { id: "afternoon", label: "2–4pm afternoon crash", delta: { mitochondrial_atp: -14 } },
    { id: "evening", label: "Running on empty by evening", delta: { mitochondrial_atp: -18, cortisol_hpa_axis: -8 } },
  ],
  6: [
    { id: "mild", label: "Mild — I stay level", delta: { cortisol_hpa_axis: 6 } },
    { id: "moderate", label: "Moderate — noticeable but manageable", delta: { cortisol_hpa_axis: -8 } },
    { id: "sharp", label: "Sharp — hits hard and lingers", delta: { cortisol_hpa_axis: -16, neurotransmitter_replenishment: -6 } },
  ],
  7: [
    { id: "clean", label: "No issues — digestion is fast", delta: { gastrointestinal_barrier: 6 } },
    { id: "bloat", label: "Post-meal bloat", delta: { gastrointestinal_barrier: -10 } },
    { id: "slow", label: "Slow / sluggish digestion", delta: { gastrointestinal_barrier: -14, mitochondrial_atp: -4 } },
  ],
  8: [
    { id: "fast", label: "About 12 hours", delta: { acetaldehyde_clearance: 8 } },
    { id: "mid", label: "24 hours", delta: { acetaldehyde_clearance: -6 } },
    { id: "slow", label: "Closer to 48 hours", delta: { acetaldehyde_clearance: -16, gastrointestinal_barrier: -6 } },
  ],
  9: [
    { id: "few", label: "0–2 bottles", delta: {} },
    { id: "several", label: "3–6 bottles", delta: {} },
    { id: "many", label: "7–11 bottles", delta: { gastrointestinal_barrier: -2 } },
    { id: "cluttered", label: "12+ bottles", delta: { gastrointestinal_barrier: -4 } },
  ],
  10: [
    { id: "organic", label: "USDA Organic priority", delta: {} },
    { id: "vegan", label: "Vegan", delta: {} },
    { id: "keto", label: "Keto / low-carb", delta: {} },
    { id: "none", label: "No constraints", delta: {} },
  ],
  11: [
    { id: "monthly", label: "Monthly specialist sync", delta: {} },
    { id: "quarterly", label: "Quarterly specialist sync", delta: {} },
  ],
};

const STEP_12: Question = {
  id: "commitment",
  step: 12,
  q: "Select your output optimization window:",
  options: [
    { id: "30day", label: "30-Day Accelerated Metabolic Reset", sub: "Front-loaded, re-evaluated monthly", delta: {} },
    { id: "90day", label: "90-Day Sustainable Output Protocol", sub: "Standard build, quarterly sync", delta: { cortisol_hpa_axis: 4 } },
  ],
};

/** Resolve the 12 questions actually asked for a given branch. */
function buildQuestionSet(branch: BranchId | null): Question[] {
  const qs: Question[] = [STEP_1];
  if (branch) qs.push(STEP_2_BY_BRANCH[branch]);
  for (let step = 3; step <= 11; step++) {
    const phrasing = STEP_PHRASING[step];
    const text = branch && phrasing.branch?.[branch] ? phrasing.branch[branch]! : phrasing.base;
    qs.push({
      id: `step-${step}`,
      step,
      q: text,
      hint: phrasing.hint,
      options: STEP_OPTIONS[step],
    });
  }
  qs.push(STEP_12);
  return qs;
}

/* ============================================================================
 * CAPSULE LIBRARY — real Spadra ingredient names, mapped to the vector each
 * one is presented as supporting. See file header note #2 before shipping.
 * ==========================================================================*/
interface Capsule {
  name: string;
  vector: VectorKey;
  blurb: string;
}

const CAPSULE_LIBRARY: Capsule[] = [
  { name: "NAC", vector: "acetaldehyde_clearance", blurb: "Precursor to glutathione, the body's own Phase II detox pathway." },
  { name: "Milk Thistle", vector: "acetaldehyde_clearance", blurb: "Traditional liver-support botanical, standardized extract." },
  { name: "Theanine", vector: "neurotransmitter_replenishment", blurb: "Calm-focus amino acid, studied alongside caffeine and alone." },
  { name: "Lion's Mane", vector: "neurotransmitter_replenishment", blurb: "Supports nerve growth factor pathways." },
  { name: "CoQ10", vector: "mitochondrial_atp", blurb: "Electron transport chain cofactor — direct ATP synthesis support." },
  { name: "Rhodiola", vector: "mitochondrial_atp", blurb: "Adaptogen studied for fatigue resistance under load." },
  { name: "Ashwagandha", vector: "cortisol_hpa_axis", blurb: "The most-studied adaptogen for cortisol modulation." },
  { name: "Magnesium", vector: "cortisol_hpa_axis", blurb: "Cofactor in HPA-axis regulation and muscle relaxation." },
  { name: "Creatine", vector: "anabolic_retention", blurb: "The single most-researched supplement for strength retention." },
  { name: "BCAA", vector: "anabolic_retention", blurb: "Branch-chain aminos supporting muscle protein synthesis." },
  { name: "10B Probiotic", vector: "gastrointestinal_barrier", blurb: "10-billion CFU strain blend for gut barrier integrity." },
  { name: "Ginger Root", vector: "gastrointestinal_barrier", blurb: "Traditional digestive-comfort botanical." },
  { name: "Trace Minerals", vector: "gastrointestinal_barrier", blurb: "Electrolyte-adjacent mineral complex for rehydration." },
];

function pickCapsules(vectors: VectorState): Capsule[] {
  // Lowest-scoring vector = biggest need. Take the weakest 4 vectors' lead
  // capsule, deduping and back-filling from the library if fewer than 4
  // vectors are meaningfully depleted.
  const ranked = [...VECTOR_ORDER].sort((a, b) => vectors[a] - vectors[b]);
  const picks: Capsule[] = [];
  const used = new Set<string>();
  for (const v of ranked) {
    const candidate = CAPSULE_LIBRARY.find((c) => c.vector === v && !used.has(c.name));
    if (candidate) {
      picks.push(candidate);
      used.add(candidate.name);
    }
    if (picks.length >= 4) break;
  }
  while (picks.length < 4) {
    const filler = CAPSULE_LIBRARY.find((c) => !used.has(c.name));
    if (!filler) break;
    picks.push(filler);
    used.add(filler.name);
  }
  return picks;
}

/* ============================================================================
 * SPECIALIST POOL
 * ==========================================================================*/
const SPECIALISTS = ["Bobbin", "Marisol", "Devon", "Priya", "Ezra", "Nadia"];
function pickSpecialist(seed: number): string {
  return SPECIALISTS[seed % SPECIALISTS.length];
}

/* ============================================================================
 * SHARED UI PRIMITIVES
 * ==========================================================================*/
const EMERALD = "#10B981";

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)] " +
        className
      }
    >
      {children}
    </div>
  );
}

function ProofBar() {
  const items = [
    "USDA Organic Certified",
    "cGMP / FDA-Registered Facility Tested",
    "FSC Zero-Composite Daily Rolls",
    "1:1 Specialist Assigned",
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
      {items.map((t, i) => (
        <React.Fragment key={t}>
          <span>{t}</span>
          {i < items.length - 1 && <span className="text-zinc-700">•</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================================================================
 * MODULE 1 — LANDING HERO
 * ==========================================================================*/
function Hero({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-2xl text-center"
      >
        <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <Activity className="h-6 w-6" style={{ color: EMERALD }} />
        </div>

        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: EMERALD }}>
          Spadra Metabolic Systems
        </p>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
          Metabolic Protocol Engine <span className="text-zinc-500">v2.6</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-400">
          A combinatorial diagnostic mapping your cellular recovery vector across
          4,096 unique metabolic profiles.
        </p>

        <button
          onClick={onStart}
          className="group mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: EMERALD }}
        >
          Initiate Diagnostic Check-In
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="mt-12">
          <ProofBar />
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================================
 * MODULE 2 — QUESTION ENGINE
 * ==========================================================================*/
function ProgressHeader({
  step,
  total,
  branch,
  tracerTags,
}: {
  step: number;
  total: number;
  branch: BranchId | null;
  tracerTags: string[];
}) {
  const pct = Math.round(((step - 1) / total) * 100);
  const branchLabel = branch ? BRANCH_META[branch].tracer : "Unresolved";
  const tail = tracerTags.length ? " / " + tracerTags[tracerTags.length - 1] : "";

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3" />
          Branch: <span className="text-zinc-300">{branchLabel}{tail}</span>
        </span>
        <span>
          Step <span className="text-zinc-200">{step}</span> / {total}
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: EMERALD }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function QuestionScreen({
  question,
  selectedId,
  onSelect,
  onBack,
  canGoBack,
}: {
  question: Question;
  selectedId: string | null;
  onSelect: (opt: Option) => void;
  onBack: () => void;
  canGoBack: boolean;
}) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
        {question.q}
      </h2>
      {question.hint && (
        <p className="mt-2 text-sm text-zinc-500">{question.hint}</p>
      )}

      <div className="mt-8 grid gap-3">
        {question.options.map((opt) => {
          const active = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={
                "group flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-all " +
                (active
                  ? "border-emerald-500/50 bg-emerald-500/[0.08]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]")
              }
            >
              <div>
                <div className={"text-sm font-medium " + (active ? "text-emerald-400" : "text-zinc-200")}>
                  {opt.label}
                </div>
                {opt.sub && <div className="mt-0.5 text-xs text-zinc-500">{opt.sub}</div>}
              </div>
              {active ? (
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: EMERALD }} />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-700 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {canGoBack && (
        <button
          onClick={onBack}
          className="mt-8 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
      )}
    </motion.div>
  );
}

/* ============================================================================
 * MODULE 3 — DIAGNOSTIC MATRIX PROCESSING SCREEN
 * ==========================================================================*/
const PROCESSING_LINES = [
  "Running combinatorial analysis across 4,096 pathway matrices...",
  "Synthesizing USDA Organic compound requirements...",
  "Generating zero-composite FSC daily roll manifest...",
  "Pairing with Protocol Specialist...",
];

function ProcessingScreen({
  specialist,
  onComplete,
}: {
  specialist: string;
  onComplete: () => void;
}) {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const stepMs = 3500 / PROCESSING_LINES.length;
    const timers: number[] = [];
    for (let i = 0; i < PROCESSING_LINES.length; i++) {
      timers.push(
        window.setTimeout(() => setVisibleLines(i + 1), stepMs * (i + 1))
      );
    }
    const done = window.setTimeout(onComplete, 3500);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: EMERALD }} />
          Processing Diagnostic Matrix
        </div>
        <GlassCard className="p-6 font-mono text-[13px] leading-relaxed">
          {PROCESSING_LINES.map((line, i) => {
            const text = line.replace("...", "") + (i === 3 ? ` [${specialist}]...` : "...");
            return (
              <AnimatePresence key={line}>
                {i < visibleLines && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-2 py-1"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: EMERALD }} />
                    <span className="text-zinc-300">{text}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </GlassCard>
      </div>
    </div>
  );
}

/* ============================================================================
 * MODULE 4 — DIAGNOSTIC SUMMARY & CHECKOUT
 * ==========================================================================*/

/** Minimal dependency-free SVG radar chart — no charting library required. */
function VectorRadar({ vectors }: { vectors: VectorState }) {
  const size = 240;
  const center = size / 2;
  const radius = size / 2 - 32;
  const n = VECTOR_ORDER.length;

  const pointFor = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (value / 100) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const dataPoints = VECTOR_ORDER.map((k, i) => pointFor(i, vectors[k]));
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} className="mx-auto">
      {rings.map((r) => {
        const pts = VECTOR_ORDER.map((_, i) => pointFor(i, r * 100).join(",")).join(" ");
        return (
          <polygon
            key={r}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}
      {VECTOR_ORDER.map((_, i) => {
        const [x, y] = pointFor(i, 100);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={dataPath}
        fill="rgba(16,185,129,0.18)"
        stroke={EMERALD}
        strokeWidth={1.5}
      />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={EMERALD} />
      ))}
    </svg>
  );
}

function VectorBars({ vectors }: { vectors: VectorState }) {
  return (
    <div className="grid gap-4">
      {VECTOR_ORDER.map((k) => {
        const meta = VECTOR_META[k];
        const Icon = meta.icon;
        const v = vectors[k];
        return (
          <div key={k}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Icon className="h-3.5 w-3.5 text-zinc-500" />
                {meta.label}
              </span>
              <span className="font-mono text-zinc-400">{v}/100</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${v}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  backgroundColor: v < 40 ? "#F87171" : v < 65 ? "#FBBF24" : EMERALD,
                }}
              />
            </div>
            <div className="mt-1 text-[11px] text-zinc-600">{meta.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

function JsonPayloadBox({ payload }: { payload: object }) {
  const [open, setOpen] = useState(false);
  const json = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  return (
    <GlassCard className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Code2 className="h-4 w-4 text-zinc-500" />
          Developer JSON Payload
        </span>
        <ChevronRight
          className={"h-4 w-4 text-zinc-500 transition-transform " + (open ? "rotate-90" : "")}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="max-h-72 overflow-auto border-t border-white/10 bg-black/40 px-5 py-4 font-mono text-[11px] leading-relaxed text-emerald-300/90">
              {json}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

interface DiagnosticPayload {
  profile_id: string;
  branch: BranchId;
  commitment_window: "30day" | "90day";
  vectors: VectorState;
  answers: Record<string, string>;
  capsules: string[];
  specialist: string;
  generated_at: string;
}

function SummaryDashboard({
  branch,
  vectors,
  answers,
  commitment,
  specialist,
  onClaim,
}: {
  branch: BranchId;
  vectors: VectorState;
  answers: Record<string, string>;
  commitment: "30day" | "90day";
  specialist: string;
  onClaim: () => void;
}) {
  const capsules = useMemo(() => pickCapsules(vectors), [vectors]);

  const weakest = [...VECTOR_ORDER].sort((a, b) => vectors[a] - vectors[b])[0];
  const secondWeakest = [...VECTOR_ORDER].sort((a, b) => vectors[a] - vectors[b])[1];
  const profileNumber = useMemo(
    () => 100 + (Object.values(answers).join("").length % 900),
    [answers]
  );
  const profileId = `Profile ${profileNumber}-${branch[0]}`;
  const profileLabel = `${BRANCH_META[branch].label.split("&")[0].trim()} + ${VECTOR_META[secondWeakest].label} Lag`;

  const payload: DiagnosticPayload = {
    profile_id: profileId,
    branch,
    commitment_window: commitment,
    vectors,
    answers,
    capsules: capsules.map((c) => c.name),
    specialist,
    generated_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: EMERALD }}>
          Diagnostic Complete
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          {profileId}: {profileLabel}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Derived from {Object.keys(answers).length} weighted responses across your{" "}
          {BRANCH_META[branch].tracer} branch.
        </p>

        {/* Vector visualization */}
        <GlassCard className="mt-8 grid gap-8 p-6 sm:grid-cols-2 sm:items-center">
          <VectorRadar vectors={vectors} />
          <VectorBars vectors={vectors} />
        </GlassCard>

        {/* Capsule breakdown */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Your Custom Daily Roll</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {capsules.map((c) => (
              <GlassCard key={c.name} className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EMERALD }} />
                  {c.name}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{c.blurb}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* JSON payload */}
        <div className="mt-6">
          <JsonPayloadBox payload={payload} />
        </div>

        {/* Specialist + eco cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <GlassCard className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-400">
              {specialist[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                Matched with {specialist}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                1:1 for schedule adjustments as your inputs shift.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <Recycle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Eco Impact</div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Replaces up to 12 plastic bottles with 1 FSC-certified daily roll.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Offer + CTA */}
        <GlassCard className="mt-6 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              $44.99/mo <span className="text-zinc-500 font-normal">· under $2/day</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Free SF shipping · Cancel anytime · {commitment === "30day" ? "30-Day" : "90-Day"} protocol window
            </p>
          </div>
          <button
            onClick={onClaim}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            style={{ backgroundColor: EMERALD }}
          >
            <Package className="h-4 w-4" />
            Claim Your Protocol
          </button>
        </GlassCard>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-zinc-600">
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
 * ROOT COMPONENT
 * ==========================================================================*/
type Stage = "hero" | "quiz" | "processing" | "summary";

export default function MetabolicProtocolEngine() {
  const [stage, setStage] = useState<Stage>("hero");
  const [branch, setBranch] = useState<BranchId | null>(null);
  const [vectors, setVectors] = useState<VectorState>(BASELINE_VECTORS);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tracerTags, setTracerTags] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0); // index into the resolved question set
  const [commitment, setCommitment] = useState<"30day" | "90day">("90day");
  const specialistSeed = useRef(Math.floor(Math.random() * 1000));
  const specialist = useMemo(() => pickSpecialist(specialistSeed.current), []);

  const questions = useMemo(() => buildQuestionSet(branch), [branch]);
  const currentQuestion = questions[stepIndex];
  const selectedId = currentQuestion ? answers[currentQuestion.id] ?? null : null;

  const handleStart = useCallback(() => {
    setStage("quiz");
  }, []);

  const handleSelect = useCallback(
    (opt: Option) => {
      const q = questions[stepIndex];

      setAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
      setVectors((prev) => applyDelta(prev, opt.delta));
      if (opt.tracerTag) setTracerTags((prev) => [...prev, opt.tracerTag!]);

      if (q.id === "gate") {
        setBranch(opt.id as BranchId);
      }
      if (q.id === "commitment") {
        setCommitment(opt.id as "30day" | "90day");
      }

      // Advance. Recompute against the (possibly just-resolved) question set
      // on the next tick via the effect below rather than here, since
      // buildQuestionSet(branch) needs the new branch state to be committed.
      if (q.id === "gate") {
        setStepIndex((i) => i + 1);
      } else if (stepIndex + 1 >= questions.length) {
        setStage("processing");
      } else {
        setStepIndex((i) => i + 1);
      }
    },
    [questions, stepIndex]
  );

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleProcessingComplete = useCallback(() => {
    setStage("summary");
  }, []);

  const handleClaim = useCallback(() => {
    const payload: DiagnosticPayload = {
      profile_id: `runtime-${Date.now()}`,
      branch: branch as BranchId,
      commitment_window: commitment,
      vectors,
      answers,
      capsules: pickCapsules(vectors).map((c) => c.name),
      specialist,
      generated_at: new Date().toISOString(),
    };
    // NO BACKEND WIRED — replace with a real cart/checkout call.
    // eslint-disable-next-line no-console
    console.log("Claim Your Protocol → payload", payload);
  }, [branch, commitment, vectors, answers, specialist]);

  if (stage === "hero") {
    return <Hero onStart={handleStart} />;
  }

  if (stage === "processing") {
    return <ProcessingScreen specialist={specialist} onComplete={handleProcessingComplete} />;
  }

  if (stage === "summary" && branch) {
    return (
      <SummaryDashboard
        branch={branch}
        vectors={vectors}
        answers={answers}
        commitment={commitment}
        specialist={specialist}
        onClaim={handleClaim}
      />
    );
  }

  // stage === "quiz"
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 px-6 py-16">
      <div className="mx-auto max-w-xl">
        <ProgressHeader
          step={currentQuestion.step}
          total={12}
          branch={branch}
          tracerTags={tracerTags}
        />
        <AnimatePresence mode="wait">
          <QuestionScreen
            key={currentQuestion.id}
            question={currentQuestion}
            selectedId={selectedId}
            onSelect={handleSelect}
            onBack={handleBack}
            canGoBack={stepIndex > 0}
          />
        </AnimatePresence>
        <p className="mt-12 text-center text-[10px] leading-relaxed text-zinc-700">
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
