/**
 * SPADRA — Metabolic Protocol Engine v2.6
 * ============================================================================
 * Standalone diagnostic-quiz application. NOT wired into the live Shopify
 * theme — the production Spadra quiz is vanilla JS + Liquid in
 * theme-src/sections/native-quiz-modal.liquid. This is a separate React app
 * shell built to the v2.6 spec.
 *
 * ---------------------------------------------------------------------------
 * ARCHITECTURE: VECTORS ARE DERIVED, NEVER ACCUMULATED
 * ---------------------------------------------------------------------------
 * computeVectors() is a pure function of the answer record. Nothing mutates a
 * running score.
 *
 * This is the single most important decision in the file, and it is a bug fix.
 * The obvious implementation — `setVectors(v => applyDelta(v, opt.delta))` on
 * each selection — is wrong the moment the user presses Back and changes an
 * answer: the old delta stays applied and the new one is added on top, so the
 * same person gets a different diagnosis depending on whether they revised.
 * Deriving from answers makes back-navigation, branch-switching and revision
 * correct by construction rather than by remembering to write an undo path.
 *
 * ---------------------------------------------------------------------------
 * WHAT MAKES IT ACTUALLY FACTORIAL
 * ---------------------------------------------------------------------------
 * The spec asks that every answer alter the phrasing, options AND
 * physiological diagnostic scope of later questions. All three are real here:
 *
 *   phrasing  — each step is a factory over (branch, isolation), not a string.
 *   options   — steps 3/5/8/9/10/11 serve genuinely different option sets per
 *               branch; an ANABOLIC user is never asked about drinking.
 *   scope     — scopeDelta() amplifies vectors inside the branch's diagnostic
 *               triad and damps those outside it, and amplifies the single
 *               vector isolated at step 2 further still. The same literal
 *               answer therefore moves the vector space differently depending
 *               on the path taken to reach it.
 *
 * ---------------------------------------------------------------------------
 * HONESTY CONSTRAINTS — please read before changing copy
 * ---------------------------------------------------------------------------
 * 1. THE SIX VECTORS ARE QUIZ-ANSWER WEIGHTS, NOT MEASUREMENTS. There is no
 *    blood panel, wearable, or biomarker feed behind them. Presenting them as
 *    physiological readouts is the core of the design and also precisely the
 *    shape regulators read as an implied diagnostic claim. Three guardrails
 *    are load-bearing: the DISCLAIMER rendered on every screen that shows a
 *    score; the words "self-reported" on the summary; and internal framing
 *    ("Vector State") rather than "your levels" or "your results". Before this
 *    ships publicly, Spadra compliance should sign off on the vector-score
 *    presentation specifically — separately from the ingredient claims.
 *
 * 2. CAPSULE NAMES ARE REAL SPADRA INGREDIENTS, drawn from
 *    scripts/spadra_registry.json. The spec's illustrative "KSM-66
 *    Ashwagandha" names a specific patented extract — printing that without
 *    confirming the supplier ships that exact material would be a false
 *    claim — and "Electrolyte Matrix" is not a Spadra SKU. Substituted
 *    Ashwagandha and Trace Minerals. When wiring to the live catalogue,
 *    replace CAPSULE_LIBRARY with a fetch against the same source the Shopify
 *    quiz uses (snippets/spadra-quiz-catalog.liquid).
 *
 * 3. "4,096 unique metabolic profiles" is spec copy, kept verbatim. It is 2^12
 *    marketing flourish, not a count this engine's real state space produces.
 *    Flagged rather than silently rewritten.
 *
 * ---------------------------------------------------------------------------
 * CHART FORM
 * ---------------------------------------------------------------------------
 * Bars are primary; the radar is a secondary "profile shape" glyph. Comparing
 * magnitude across named categories is a bar job — radar distorts, because
 * perceived area grows with the square of the value and the shape changes
 * entirely with arbitrary axis order. The spec offered "radar / bars"; this
 * keeps both with the readable one leading. Bar fills use the reserved status
 * scale (depleted/moderate/optimal) and every bar carries an icon and a text
 * state label, so state is never encoded by color alone.
 *
 * Deps: react, framer-motion, lucide-react, Tailwind. No charting library.
 * ==========================================================================*/

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Dumbbell,
  Leaf,
  Loader2,
  Moon,
  Package,
  Recycle,
  ShieldCheck,
  Terminal,
  TrendingDown,
  Users,
  Wine,
  Zap,
  Minus,
} from "lucide-react";

/* ==========================================================================
 * TOKENS
 * ========================================================================*/
const SURFACE = "#09090B";
const EMERALD = "#10B981";

/** Reserved status scale. Contrast vs the dark surface >= 3:1 and worst-adjacent
 *  CVD separation dE 12.3 (target 8) — validated, not eyeballed. Always shipped
 *  with an icon + text label; never color alone. */
const STATUS = {
  depleted: { hex: "#F87171", label: "Depleted", Icon: TrendingDown },
  moderate: { hex: "#FBBF24", label: "Moderate", Icon: Minus },
  optimal: { hex: EMERALD, label: "Optimal", Icon: Check },
} as const;

function statusFor(v: number) {
  if (v < 40) return STATUS.depleted;
  if (v < 65) return STATUS.moderate;
  return STATUS.optimal;
}

const DISCLAIMER =
  "This assessment is informational and does not diagnose any condition or replace advice from your healthcare provider. These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

/* ==========================================================================
 * VECTOR STATE
 * ========================================================================*/
type VectorKey =
  | "acetaldehyde_clearance"
  | "neurotransmitter_replenishment"
  | "mitochondrial_atp"
  | "cortisol_hpa_axis"
  | "anabolic_retention"
  | "gastrointestinal_barrier";

type VectorState = Record<VectorKey, number>;
type VectorDelta = Partial<Record<VectorKey, number>>;

const VECTOR_ORDER: VectorKey[] = [
  "acetaldehyde_clearance",
  "neurotransmitter_replenishment",
  "mitochondrial_atp",
  "cortisol_hpa_axis",
  "anabolic_retention",
  "gastrointestinal_barrier",
];

const VECTOR_META: Record<
  VectorKey,
  { label: string; short: string; sub: string; Icon: React.ElementType }
> = {
  acetaldehyde_clearance: {
    label: "Acetaldehyde Clearance",
    short: "Clearance",
    sub: "Phase II Detox / Liver Kinetics",
    Icon: Wine,
  },
  neurotransmitter_replenishment: {
    label: "Neurotransmitter Replenishment",
    short: "Neuro",
    sub: "Dopamine / GABA / Acetylcholine",
    Icon: Brain,
  },
  mitochondrial_atp: {
    label: "Mitochondrial ATP",
    short: "ATP",
    sub: "Cellular Energy & Oxygenation",
    Icon: Zap,
  },
  cortisol_hpa_axis: {
    label: "Cortisol / HPA Axis",
    short: "HPA",
    sub: "Adrenal Strain & Sleep Depth",
    Icon: Moon,
  },
  anabolic_retention: {
    label: "Anabolic Retention",
    short: "Anabolic",
    sub: "MPS / Creatine Synthesis / N Balance",
    Icon: Dumbbell,
  },
  gastrointestinal_barrier: {
    label: "GI Barrier",
    short: "GI",
    sub: "Gut Permeability & Anti-Inflammation",
    Icon: Leaf,
  },
};

const BASELINE = 62; // a neutral self-reported starting point, not "healthy"

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/* ==========================================================================
 * BRANCHES & SCOPE
 * ========================================================================*/
type BranchId = "SOCIAL" | "COGNITIVE" | "ANABOLIC" | "ECO";

const BRANCH_META: Record<
  BranchId,
  { label: string; tracer: string; Icon: React.ElementType }
> = {
  SOCIAL: {
    label: "Nightlife, Event & Social Recovery",
    tracer: "Social_Recovery",
    Icon: Wine,
  },
  COGNITIVE: {
    label: "Executive Brain Fog & Peak Cognitive Output",
    tracer: "Executive_Cognitive",
    Icon: Brain,
  },
  ANABOLIC: {
    label: "Post-Workout Anabolic & Athletic Retention",
    tracer: "Anabolic_Retention",
    Icon: Dumbbell,
  },
  ECO: {
    label: "Supplement Overload & Eco-Packaging Waste",
    tracer: "Protocol_Consolidation",
    Icon: Recycle,
  },
};

/** The three vectors a branch is actually diagnosing. Deltas inside this triad
 *  are amplified; deltas outside it are damped. This is what "diagnostic scope"
 *  means operationally. */
const BRANCH_SCOPE: Record<BranchId, VectorKey[]> = {
  SOCIAL: [
    "acetaldehyde_clearance",
    "neurotransmitter_replenishment",
    "gastrointestinal_barrier",
  ],
  COGNITIVE: [
    "neurotransmitter_replenishment",
    "mitochondrial_atp",
    "cortisol_hpa_axis",
  ],
  ANABOLIC: ["anabolic_retention", "mitochondrial_atp", "cortisol_hpa_axis"],
  ECO: [
    "gastrointestinal_barrier",
    "acetaldehyde_clearance",
    "mitochondrial_atp",
  ],
};

/** Step-2 answer -> the single vector sharpened hardest for the rest of the run. */
const ISOLATION_FOCUS: Record<string, VectorKey> = {
  nausea: "acetaldehyde_clearance",
  neural: "neurotransmitter_replenishment",
  dehydration: "mitochondrial_atp",
  memory: "neurotransmitter_replenishment",
  focus: "mitochondrial_atp",
  decision: "cortisol_hpa_axis",
  lift: "anabolic_retention",
  cardio: "mitochondrial_atp",
  doms: "anabolic_retention",
  clutter: "gastrointestinal_barrier",
  fillers: "gastrointestinal_barrier",
  waste: "acetaldehyde_clearance",
};

const IN_SCOPE_GAIN = 1.35;
const OUT_SCOPE_GAIN = 0.7;
const FOCUS_GAIN = 1.6;

interface Ctx {
  branch: BranchId | null;
  isolation: string | null;
}

/**
 * The scope transform. A raw delta is re-weighted by where the vector sits
 * relative to what this particular path is diagnosing — so an identical answer
 * produces a different physiological reading depending on the branch and the
 * step-2 isolation that preceded it.
 */
function scopeDelta(raw: VectorDelta, ctx: Ctx): VectorDelta {
  if (!ctx.branch) return raw;
  const scope = BRANCH_SCOPE[ctx.branch];
  const focus = ctx.isolation ? ISOLATION_FOCUS[ctx.isolation] : null;
  const out: VectorDelta = {};
  (Object.keys(raw) as VectorKey[]).forEach((k) => {
    const base = raw[k] ?? 0;
    let gain = scope.includes(k) ? IN_SCOPE_GAIN : OUT_SCOPE_GAIN;
    if (focus === k) gain = FOCUS_GAIN;
    out[k] = base * gain;
  });
  return out;
}

/* ==========================================================================
 * QUESTION MODEL
 * ========================================================================*/
interface Option {
  id: string;
  label: string;
  sub?: string;
  delta: VectorDelta;
  tracerTag?: string;
}

interface ResolvedQuestion {
  /** Stable, branch-qualified so answers can never collide across branches. */
  key: string;
  step: number;
  q: string;
  hint?: string;
  options: Option[];
}

interface StepSpec {
  step: number;
  keyFor: (ctx: Ctx) => string;
  phrase: (ctx: Ctx) => string;
  hint?: (ctx: Ctx) => string | undefined;
  options: (ctx: Ctx) => Option[];
}

/* -------------------------------------------------------------------------
 * STEP 1 — Primary Vector Gate
 * -----------------------------------------------------------------------*/
const STEP_1: StepSpec = {
  step: 1,
  keyFor: () => "s1_gate",
  phrase: () => "Identify your primary operational bottleneck:",
  options: () => [
    {
      id: "SOCIAL",
      label: "Nightlife, Event & Social Recovery",
      sub: "Alcohol / sleep disruption",
      delta: {},
      tracerTag: "Gate_Resolved",
    },
    {
      id: "COGNITIVE",
      label: "Executive Brain Fog & Peak Cognitive Output",
      sub: "Focus / working memory",
      delta: {},
      tracerTag: "Gate_Resolved",
    },
    {
      id: "ANABOLIC",
      label: "Post-Workout Anabolic & Athletic Retention",
      sub: "Recovery / strength retention",
      delta: {},
      tracerTag: "Gate_Resolved",
    },
    {
      id: "ECO",
      label: "Supplement Overload & Eco-Packaging Waste",
      sub: "Consolidation / plastic reduction",
      delta: {},
      tracerTag: "Gate_Resolved",
    },
  ],
};

/* -------------------------------------------------------------------------
 * STEP 2 — Biochemical Isolation (fully conditional on step 1)
 * -----------------------------------------------------------------------*/
const STEP_2_OPTIONS: Record<BranchId, Option[]> = {
  SOCIAL: [
    {
      id: "nausea",
      label: "Acetaldehyde Nausea",
      sub: "GI distress, morning queasiness",
      delta: { acetaldehyde_clearance: -20, gastrointestinal_barrier: -10 },
      tracerTag: "Acetaldehyde_Load",
    },
    {
      id: "neural",
      label: "Neural Dysfunction",
      sub: "Fog, flat affect, no deep work",
      delta: { neurotransmitter_replenishment: -20, cortisol_hpa_axis: -6 },
      tracerTag: "Neural_Depletion",
    },
    {
      id: "dehydration",
      label: "Heavy Dehydration",
      sub: "Headache, fatigue, thirst",
      delta: { mitochondrial_atp: -16, cortisol_hpa_axis: -8 },
      tracerTag: "Hydration_Deficit",
    },
  ],
  COGNITIVE: [
    {
      id: "memory",
      label: "Working Memory",
      sub: "Holding several threads at once",
      delta: { neurotransmitter_replenishment: -18, mitochondrial_atp: -6 },
      tracerTag: "WM_Load",
    },
    {
      id: "focus",
      label: "Focus Retention",
      sub: "Sustained deep-work windows",
      delta: { mitochondrial_atp: -16, neurotransmitter_replenishment: -10 },
      tracerTag: "ATP_Depletion",
    },
    {
      id: "decision",
      label: "Decision Fatigue",
      sub: "Quality collapses late in the day",
      delta: { cortisol_hpa_axis: -18, neurotransmitter_replenishment: -8 },
      tracerTag: "Decision_Fatigue",
    },
  ],
  ANABOLIC: [
    {
      id: "lift",
      label: "Max Lift Output",
      sub: "Strength numbers regress",
      delta: { anabolic_retention: -20, mitochondrial_atp: -6 },
      tracerTag: "MPS_Suppression",
    },
    {
      id: "cardio",
      label: "Cardio Endurance",
      sub: "Aerobic ceiling drops fast",
      delta: { mitochondrial_atp: -18, anabolic_retention: -6 },
      tracerTag: "Oxidative_Capacity",
    },
    {
      id: "doms",
      label: "DOMS Recovery Time",
      sub: "Soreness lingers into the next session",
      delta: { anabolic_retention: -14, gastrointestinal_barrier: -6 },
      tracerTag: "Recovery_Lag",
    },
  ],
  ECO: [
    {
      id: "clutter",
      label: "Bottles Clutter",
      sub: "Counter full of separate SKUs",
      delta: { gastrointestinal_barrier: -6 },
      tracerTag: "SKU_Fragmentation",
    },
    {
      id: "fillers",
      label: "Synthetic Fillers",
      sub: "Proprietary blends, no real dosing",
      delta: { gastrointestinal_barrier: -12, acetaldehyde_clearance: -6 },
      tracerTag: "Formulation_Opacity",
    },
    {
      id: "waste",
      label: "High Waste",
      sub: "Plastic footprint per month",
      delta: { acetaldehyde_clearance: -4 },
      tracerTag: "Packaging_Waste",
    },
  ],
};

const STEP_2_PHRASE: Record<BranchId, string> = {
  SOCIAL: "What is your primary physiological marker the morning after?",
  COGNITIVE: "Which executive function suffers most?",
  ANABOLIC: "Where do you measure your post-social drop?",
  ECO: "What is the core friction in your current protocol?",
};

const STEP_2: StepSpec = {
  step: 2,
  keyFor: (c) => `s2_isolation:${c.branch ?? "none"}`,
  phrase: (c) => (c.branch ? STEP_2_PHRASE[c.branch] : ""),
  options: (c) => (c.branch ? STEP_2_OPTIONS[c.branch] : []),
};

/* -------------------------------------------------------------------------
 * STEPS 3–11 — Deep Cellular Profile.
 * Phrasing varies for every branch. Option sets genuinely diverge on the steps
 * where a shared question would be nonsense (an ANABOLIC user is never asked
 * how often they drink).
 * -----------------------------------------------------------------------*/
const byBranch = <T,>(c: Ctx, map: Record<BranchId, T>, fallback: T): T =>
  c.branch ? map[c.branch] : fallback;

const STEP_3: StepSpec = {
  step: 3,
  keyFor: (c) => `s3_frequency:${c.branch ?? "none"}`,
  phrase: (c) =>
    byBranch(
      c,
      {
        SOCIAL: "How often does a night out actually happen?",
        COGNITIVE:
          "How often do you hit a genuinely demanding cognitive load — a launch, a sprint, back-to-back deep work?",
        ANABOLIC: "How many training sessions do you log in a typical week?",
        ECO: "How often do you reorder or restock your current stack?",
      },
      "How often does the driver of this happen?"
    ),
  hint: (c) =>
    c.branch === "SOCIAL"
      ? "Frequency separates an acute event from a sustained metabolic load."
      : undefined,
  options: (c) =>
    byBranch<Option[]>(
      c,
      {
        SOCIAL: [
          { id: "f1", label: "1x / month or less", delta: { acetaldehyde_clearance: 6, cortisol_hpa_axis: 4 } },
          { id: "f2", label: "1–2x / week", delta: { acetaldehyde_clearance: -6, cortisol_hpa_axis: -4 } },
          { id: "f3", label: "3–4x / week", delta: { acetaldehyde_clearance: -14, cortisol_hpa_axis: -10, mitochondrial_atp: -6 } },
          { id: "f4", label: "4+x / week", delta: { acetaldehyde_clearance: -20, cortisol_hpa_axis: -16, mitochondrial_atp: -10, gastrointestinal_barrier: -8 } },
        ],
        COGNITIVE: [
          { id: "f1", label: "Rarely — steady workload", delta: { cortisol_hpa_axis: 6, mitochondrial_atp: 4 } },
          { id: "f2", label: "A few days a month", delta: { cortisol_hpa_axis: -5, neurotransmitter_replenishment: -4 } },
          { id: "f3", label: "Most weeks", delta: { cortisol_hpa_axis: -12, neurotransmitter_replenishment: -10, mitochondrial_atp: -6 } },
          { id: "f4", label: "Permanently — it never lets up", delta: { cortisol_hpa_axis: -18, neurotransmitter_replenishment: -16, mitochondrial_atp: -12 } },
        ],
        ANABOLIC: [
          { id: "f1", label: "1–2 sessions", delta: { anabolic_retention: 4 } },
          { id: "f2", label: "3–4 sessions", delta: { anabolic_retention: -6, mitochondrial_atp: -4 } },
          { id: "f3", label: "5–6 sessions", delta: { anabolic_retention: -12, mitochondrial_atp: -10, cortisol_hpa_axis: -8 } },
          { id: "f4", label: "Twice daily / competition block", delta: { anabolic_retention: -18, mitochondrial_atp: -14, cortisol_hpa_axis: -14 } },
        ],
        ECO: [
          { id: "f1", label: "Quarterly — I buy in bulk", delta: {} },
          { id: "f2", label: "Monthly", delta: { gastrointestinal_barrier: -3 } },
          { id: "f3", label: "Constantly — something always runs out", delta: { gastrointestinal_barrier: -8, mitochondrial_atp: -4 } },
          { id: "f4", label: "I've lost track entirely", delta: { gastrointestinal_barrier: -12, mitochondrial_atp: -6 } },
        ],
      },
      []
    ),
};

const STEP_4: StepSpec = {
  step: 4,
  keyFor: () => "s4_sleep",
  phrase: (c) =>
    byBranch(
      c,
      {
        SOCIAL: "How does your sleep architecture hold up on a night you've been drinking?",
        COGNITIVE: "How would you describe your sleep architecture on a heavy work week?",
        ANABOLIC: "How would you describe your sleep on a hard training block?",
        ECO: "How would you describe your sleep architecture lately?",
      },
      "How would you describe your sleep architecture lately?"
    ),
  hint: () =>
    "REM fragmentation and lost deep sleep are different problems with different fixes.",
  options: () => [
    { id: "solid", label: "Solid — I wake up genuinely restored", delta: { cortisol_hpa_axis: 8, mitochondrial_atp: 4 } },
    { id: "rem", label: "REM Fragmentation", sub: "Waking repeatedly, restless dreaming", delta: { neurotransmitter_replenishment: -12, cortisol_hpa_axis: -8 } },
    { id: "deep", label: "Deep Sleep Loss", sub: "Long hours, low restoration", delta: { mitochondrial_atp: -12, anabolic_retention: -8, cortisol_hpa_axis: -6 } },
    { id: "both", label: "Both — the whole architecture is broken", delta: { neurotransmitter_replenishment: -10, mitochondrial_atp: -10, cortisol_hpa_axis: -10, anabolic_retention: -6 } },
  ],
};

const STEP_5: StepSpec = {
  step: 5,
  keyFor: (c) => `s5_velocity:${c.branch ?? "none"}`,
  phrase: (c) =>
    byBranch(
      c,
      {
        SOCIAL: "On a normal (non-recovery) day, when does your energy actually run out?",
        COGNITIVE: "When does your cognitive output measurably drop off?",
        ANABOLIC: "When in the day is your training output at its worst?",
        ECO: "When does your energy actually run out during the day?",
      },
      "When does your energy actually run out during the day?"
    ),
  hint: () => "Timing localises the deficit better than intensity does.",
  options: (c) =>
    byBranch<Option[]>(
      c,
      {
        SOCIAL: [
          { id: "none", label: "It doesn't — steady all day", delta: { mitochondrial_atp: 8 } },
          { id: "am", label: "Mid-morning", delta: { mitochondrial_atp: -10, cortisol_hpa_axis: -5 } },
          { id: "pm", label: "The 2–4pm window", delta: { mitochondrial_atp: -15 } },
          { id: "eve", label: "I'm running on empty by evening", delta: { mitochondrial_atp: -20, cortisol_hpa_axis: -10 } },
        ],
        COGNITIVE: [
          { id: "none", label: "It holds all day", delta: { mitochondrial_atp: 8, neurotransmitter_replenishment: 4 } },
          { id: "am", label: "After the first deep-work block", delta: { mitochondrial_atp: -12, neurotransmitter_replenishment: -8 } },
          { id: "pm", label: "The 2–4pm window", delta: { mitochondrial_atp: -16, neurotransmitter_replenishment: -6 } },
          { id: "eve", label: "Nothing useful after 4pm", delta: { mitochondrial_atp: -20, neurotransmitter_replenishment: -12, cortisol_hpa_axis: -8 } },
        ],
        ANABOLIC: [
          { id: "none", label: "Output is consistent whenever I train", delta: { mitochondrial_atp: 8, anabolic_retention: 4 } },
          { id: "am", label: "Morning sessions are flat", delta: { mitochondrial_atp: -10, cortisol_hpa_axis: -8 } },
          { id: "pm", label: "Afternoon sessions fall off", delta: { mitochondrial_atp: -14, anabolic_retention: -6 } },
          { id: "eve", label: "Evening sessions are barely worth doing", delta: { mitochondrial_atp: -18, anabolic_retention: -10, cortisol_hpa_axis: -8 } },
        ],
        ECO: [
          { id: "none", label: "It doesn't — steady all day", delta: { mitochondrial_atp: 8 } },
          { id: "am", label: "Mid-morning crash", delta: { mitochondrial_atp: -10 } },
          { id: "pm", label: "The 2–4pm window", delta: { mitochondrial_atp: -14 } },
          { id: "eve", label: "Empty by evening", delta: { mitochondrial_atp: -18, cortisol_hpa_axis: -8 } },
        ],
      },
      []
    ),
};

const STEP_6: StepSpec = {
  step: 6,
  keyFor: () => "s6_hpa",
  phrase: (c) =>
    byBranch(
      c,
      {
        SOCIAL: "How sharp is your stress response the day after a heavy night?",
        COGNITIVE: "How sharp is your stress spike when the pressure actually lands?",
        ANABOLIC: "How hard does systemic stress hit you outside the gym?",
        ECO: "How sharp is your stress spike when the pressure lands?",
      },
      "How sharp is your stress spike when the pressure lands?"
    ),
  options: () => [
    { id: "mild", label: "Mild — I stay level", delta: { cortisol_hpa_axis: 10 } },
    { id: "mod", label: "Moderate — noticeable, manageable", delta: { cortisol_hpa_axis: -8 } },
    { id: "sharp", label: "Sharp — hits hard and lingers for hours", delta: { cortisol_hpa_axis: -18, neurotransmitter_replenishment: -8 } },
    { id: "chronic", label: "Constant — there's no baseline to return to", delta: { cortisol_hpa_axis: -24, neurotransmitter_replenishment: -12, mitochondrial_atp: -8 } },
  ],
};

const STEP_7: StepSpec = {
  step: 7,
  keyFor: () => "s7_gut",
  phrase: (c) =>
    byBranch(
      c,
      {
        SOCIAL: "How does your gut behave in the 24 hours after drinking?",
        COGNITIVE: "How does your gut respond after a typical working meal?",
        ANABOLIC: "How does your gut handle your current intake volume?",
        ECO: "How does your gut respond after a typical meal?",
      },
      "How does your gut respond after a typical meal?"
    ),
  options: () => [
    { id: "clean", label: "No issues — digestion is fast and quiet", delta: { gastrointestinal_barrier: 10 } },
    { id: "bloat", label: "Post-meal bloat", delta: { gastrointestinal_barrier: -12 } },
    { id: "slow", label: "Slow, heavy, sluggish digestion", delta: { gastrointestinal_barrier: -16, mitochondrial_atp: -6 } },
    { id: "reactive", label: "Reactive — certain foods clearly set it off", delta: { gastrointestinal_barrier: -20, acetaldehyde_clearance: -6 } },
  ],
};

const STEP_8: StepSpec = {
  step: 8,
  keyFor: (c) => `s8_clearance:${c.branch ?? "none"}`,
  phrase: (c) =>
    byBranch(
      c,
      {
        SOCIAL: "How long does it take to clear a heavy night — 12 hours, or closer to 48?",
        COGNITIVE: "After a genuinely draining week, how long until your head is fully back?",
        ANABOLIC: "After a maximal session, how long until you're back to full output?",
        ECO: "How quickly do you notice a change when you start or stop a supplement?",
      },
      "How fast do you return to baseline after a heavy input?"
    ),
  options: (c) =>
    byBranch<Option[]>(
      c,
      {
        SOCIAL: [
          { id: "fast", label: "About 12 hours", delta: { acetaldehyde_clearance: 12 } },
          { id: "mid", label: "A full 24 hours", delta: { acetaldehyde_clearance: -8 } },
          { id: "slow", label: "Closer to 48 hours", delta: { acetaldehyde_clearance: -18, gastrointestinal_barrier: -8 } },
          { id: "verySlow", label: "It costs me the whole weekend", delta: { acetaldehyde_clearance: -24, gastrointestinal_barrier: -10, mitochondrial_atp: -8 } },
        ],
        COGNITIVE: [
          { id: "fast", label: "One good night's sleep", delta: { neurotransmitter_replenishment: 10, cortisol_hpa_axis: 6 } },
          { id: "mid", label: "A full weekend", delta: { neurotransmitter_replenishment: -8, cortisol_hpa_axis: -6 } },
          { id: "slow", label: "Most of the following week", delta: { neurotransmitter_replenishment: -16, cortisol_hpa_axis: -12 } },
          { id: "verySlow", label: "I don't think I've been fully back in months", delta: { neurotransmitter_replenishment: -22, cortisol_hpa_axis: -18, mitochondrial_atp: -10 } },
        ],
        ANABOLIC: [
          { id: "fast", label: "24 hours", delta: { anabolic_retention: 10, mitochondrial_atp: 6 } },
          { id: "mid", label: "48 hours", delta: { anabolic_retention: -8 } },
          { id: "slow", label: "72+ hours", delta: { anabolic_retention: -16, mitochondrial_atp: -8 } },
          { id: "verySlow", label: "I train through it and never fully recover", delta: { anabolic_retention: -22, mitochondrial_atp: -12, cortisol_hpa_axis: -12 } },
        ],
        ECO: [
          { id: "fast", label: "Within days — I'm clearly responsive", delta: { acetaldehyde_clearance: 8, gastrointestinal_barrier: 6 } },
          { id: "mid", label: "A few weeks", delta: { acetaldehyde_clearance: -4 } },
          { id: "slow", label: "Honestly, I've never been able to tell", delta: { acetaldehyde_clearance: -12, gastrointestinal_barrier: -8 } },
          { id: "verySlow", label: "I assume most of it does nothing", delta: { acetaldehyde_clearance: -16, gastrointestinal_barrier: -12 } },
        ],
      },
      []
    ),
};

const STEP_9: StepSpec = {
  step: 9,
  keyFor: () => "s9_volume",
  phrase: (c) =>
    c.branch === "ECO"
      ? "Exactly how many separate bottles are we consolidating?"
      : "How many separate supplement bottles are currently in rotation?",
  options: () => [
    { id: "v1", label: "0–2 bottles", delta: {} },
    { id: "v2", label: "3–6 bottles", delta: { gastrointestinal_barrier: -2 } },
    { id: "v3", label: "7–11 bottles", delta: { gastrointestinal_barrier: -5 } },
    { id: "v4", label: "12+ bottles", delta: { gastrointestinal_barrier: -8 } },
  ],
};

const STEP_10: StepSpec = {
  step: 10,
  keyFor: () => "s10_constraints",
  phrase: () => "Any dietary or formulation constraints we must route around?",
  hint: () => "This filters the compound set, it does not change your vector scores.",
  options: () => [
    { id: "organic", label: "USDA Organic priority", delta: {} },
    { id: "vegan", label: "Vegan", delta: {} },
    { id: "keto", label: "Keto / low-carb", delta: {} },
    { id: "none", label: "No constraints", delta: {} },
  ],
};

const STEP_11: StepSpec = {
  step: 11,
  keyFor: () => "s11_sync",
  phrase: (c) =>
    c.branch === "SOCIAL"
      ? "Your calendar drives this protocol. How often should your specialist re-check it?"
      : "How often should your protocol be re-checked against your schedule?",
  options: () => [
    { id: "monthly", label: "Monthly specialist sync", sub: "My inputs shift constantly", delta: {} },
    { id: "quarterly", label: "Quarterly specialist sync", sub: "My routine is fairly stable", delta: {} },
  ],
};

const STEP_12: StepSpec = {
  step: 12,
  keyFor: () => "s12_commitment",
  phrase: () => "Select your output optimization window:",
  options: () => [
    { id: "30day", label: "30-Day Accelerated Metabolic Reset", sub: "Front-loaded, re-evaluated monthly", delta: {} },
    { id: "90day", label: "90-Day Sustainable Output Protocol", sub: "Standard build, quarterly sync", delta: {} },
  ],
};

const STEP_SPECS: StepSpec[] = [
  STEP_1, STEP_2, STEP_3, STEP_4, STEP_5, STEP_6,
  STEP_7, STEP_8, STEP_9, STEP_10, STEP_11, STEP_12,
];

const TOTAL_STEPS = STEP_SPECS.length;

/* ==========================================================================
 * PURE ENGINE
 * ========================================================================*/
type Answers = Record<string, string>;

function ctxFrom(answers: Answers): Ctx {
  const branch = (answers["s1_gate"] as BranchId | undefined) ?? null;
  const isolation = branch ? answers[`s2_isolation:${branch}`] ?? null : null;
  return { branch, isolation };
}

/** Resolve the 12 questions for the current answer state. */
function resolveQuestions(answers: Answers): ResolvedQuestion[] {
  const ctx = ctxFrom(answers);
  return STEP_SPECS.map((spec) => ({
    key: spec.keyFor(ctx),
    step: spec.step,
    q: spec.phrase(ctx),
    hint: spec.hint?.(ctx),
    options: spec.options(ctx),
  }));
}

/**
 * Vectors as a pure function of answers. Called on every render; never
 * accumulated. Revising an answer or switching branch produces exactly the
 * score that path would have produced from a clean start.
 */
function computeVectors(answers: Answers): VectorState {
  const ctx = ctxFrom(answers);
  const state: VectorState = {
    acetaldehyde_clearance: BASELINE,
    neurotransmitter_replenishment: BASELINE,
    mitochondrial_atp: BASELINE,
    cortisol_hpa_axis: BASELINE,
    anabolic_retention: BASELINE,
    gastrointestinal_barrier: BASELINE,
  };

  for (const spec of STEP_SPECS) {
    const key = spec.keyFor(ctx);
    const chosenId = answers[key];
    if (!chosenId) continue;
    const opt = spec.options(ctx).find((o) => o.id === chosenId);
    if (!opt) continue;
    const scoped = scopeDelta(opt.delta, ctx);
    (Object.keys(scoped) as VectorKey[]).forEach((k) => {
      state[k] = state[k] + (scoped[k] ?? 0);
    });
  }

  (Object.keys(state) as VectorKey[]).forEach((k) => {
    state[k] = clamp(state[k]);
  });
  return state;
}

/** Tracer path, derived — so Back genuinely rewinds it. */
function computeTracer(answers: Answers, uptoStep: number): string {
  const ctx = ctxFrom(answers);
  const tags: string[] = [];
  for (const spec of STEP_SPECS) {
    if (spec.step > uptoStep) break;
    const chosen = answers[spec.keyFor(ctx)];
    if (!chosen) continue;
    const opt = spec.options(ctx).find((o) => o.id === chosen);
    if (opt?.tracerTag) tags.push(opt.tracerTag);
  }
  const head = ctx.branch ? BRANCH_META[ctx.branch].tracer : "Unresolved";
  const tail = tags.filter((t) => t !== "Gate_Resolved").slice(-1)[0];
  return tail ? `${head} / ${tail}` : head;
}

/** Drop answers whose question no longer exists on the current path. */
function pruneAnswers(answers: Answers): Answers {
  const valid = new Set(resolveQuestions(answers).map((q) => q.key));
  const out: Answers = {};
  Object.keys(answers).forEach((k) => {
    if (valid.has(k)) out[k] = answers[k];
  });
  return out;
}

/** Deterministic 32-bit hash — same answers always yield the same profile id
 *  and the same specialist, so a result is reproducible and testable. */
function hashAnswers(answers: Answers): number {
  const src = Object.keys(answers)
    .sort()
    .map((k) => `${k}=${answers[k]}`)
    .join("|");
  let h = 2166136261;
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/* ==========================================================================
 * CAPSULES — real Spadra ingredient names (see header note 2)
 * ========================================================================*/
interface Capsule {
  name: string;
  vector: VectorKey;
  blurb: string;
}

const CAPSULE_LIBRARY: Capsule[] = [
  { name: "NAC", vector: "acetaldehyde_clearance", blurb: "Precursor to glutathione, the body's own Phase II detox pathway." },
  { name: "Milk Thistle", vector: "acetaldehyde_clearance", blurb: "Standardized liver-support botanical, long-established traditional use." },
  { name: "Theanine", vector: "neurotransmitter_replenishment", blurb: "Calm-focus amino acid, studied both alongside caffeine and alone." },
  { name: "Lion's Mane", vector: "neurotransmitter_replenishment", blurb: "Studied for nerve growth factor pathway support." },
  { name: "CoQ10", vector: "mitochondrial_atp", blurb: "Electron transport chain cofactor — direct ATP synthesis support." },
  { name: "Rhodiola", vector: "mitochondrial_atp", blurb: "Adaptogen studied for fatigue resistance under sustained load." },
  { name: "Ashwagandha", vector: "cortisol_hpa_axis", blurb: "The most-studied adaptogen for cortisol modulation." },
  { name: "Magnesium", vector: "cortisol_hpa_axis", blurb: "Cofactor in HPA-axis regulation and muscle relaxation." },
  { name: "Creatine", vector: "anabolic_retention", blurb: "The most-researched supplement in sports science, full stop." },
  { name: "BCAA", vector: "anabolic_retention", blurb: "Branch-chain aminos supporting muscle protein synthesis." },
  { name: "10B Probiotic", vector: "gastrointestinal_barrier", blurb: "10-billion CFU strain blend for gut barrier integrity." },
  { name: "Ginger Root", vector: "gastrointestinal_barrier", blurb: "Traditional digestive-comfort botanical." },
  { name: "Trace Minerals", vector: "gastrointestinal_barrier", blurb: "Full-spectrum mineral complex supporting rehydration." },
];

/** Weakest vectors first — the four with the most ground to make up. */
function pickCapsules(vectors: VectorState): Capsule[] {
  const ranked = [...VECTOR_ORDER].sort((a, b) => vectors[a] - vectors[b]);
  const picks: Capsule[] = [];
  const used = new Set<string>();
  for (const v of ranked) {
    const c = CAPSULE_LIBRARY.find((x) => x.vector === v && !used.has(x.name));
    if (c) { picks.push(c); used.add(c.name); }
    if (picks.length === 4) return picks;
  }
  for (const c of CAPSULE_LIBRARY) {
    if (picks.length === 4) break;
    if (!used.has(c.name)) { picks.push(c); used.add(c.name); }
  }
  return picks;
}

const SPECIALISTS = ["Bobbin", "Marisol", "Devon", "Priya", "Ezra", "Nadia"];

/* ==========================================================================
 * UI PRIMITIVES
 * ========================================================================*/
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl ${className}`}>
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
    <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
      {items.map((t, i) => (
        <li key={t} className="flex items-center gap-3">
          <span>{t}</span>
          {i < items.length - 1 && <span aria-hidden className="text-zinc-700">•</span>}
        </li>
      ))}
    </ul>
  );
}

/* ==========================================================================
 * MODULE 1 — LANDING HERO
 * ========================================================================*/
function Hero({ onStart }: { onStart: () => void }) {
  const reduce = useReducedMotion();
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden text-zinc-100"
      style={{ backgroundColor: SURFACE }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-2xl text-center"
      >
        <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <Activity className="h-6 w-6" style={{ color: EMERALD }} aria-hidden />
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
          className="group mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
          style={{ backgroundColor: EMERALD }}
        >
          Initiate Diagnostic Check-In
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
        <div className="mt-12"><ProofBar /></div>
        <p className="mt-10 text-[10px] leading-relaxed text-zinc-700">{DISCLAIMER}</p>
      </motion.div>
    </main>
  );
}

/* ==========================================================================
 * LIVE VECTOR RAIL — the spec's "track scores 0-100 & render live"
 * ========================================================================*/
function VectorRail({ vectors, dense = false }: { vectors: VectorState; dense?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className={dense ? "grid grid-cols-2 gap-x-4 gap-y-3" : "grid gap-3"}>
      {VECTOR_ORDER.map((k) => {
        const meta = VECTOR_META[k];
        const v = vectors[k];
        const s = statusFor(v);
        return (
          <div key={k}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="flex items-center gap-1.5 truncate text-zinc-400">
                <meta.Icon className="h-3 w-3 flex-shrink-0 text-zinc-600" aria-hidden />
                <span className="truncate">{dense ? meta.short : meta.label}</span>
              </span>
              <span className="font-mono tabular-nums text-zinc-500">{v}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: s.hex }}
                initial={false}
                animate={{ width: `${v}%` }}
                transition={reduce ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ==========================================================================
 * MODULE 2 — QUESTION ENGINE
 * ========================================================================*/
function ProgressHeader({ step, tracer }: { step: number; tracer: string }) {
  const reduce = useReducedMotion();
  const pct = ((step - 1) / TOTAL_STEPS) * 100;
  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
        <span className="flex min-w-0 items-center gap-1.5">
          <Terminal className="h-3 w-3 flex-shrink-0" aria-hidden />
          <span className="flex-shrink-0">Branch:</span>
          <span className="truncate text-zinc-300">{tracer}</span>
        </span>
        <span className="flex-shrink-0" aria-live="polite">
          Step <span className="text-zinc-200">{step}</span> / {TOTAL_STEPS}
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: EMERALD }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduce ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function QuestionScreen({
  question,
  selectedId,
  onSelect,
}: {
  question: ResolvedQuestion;
  selectedId: string | null;
  onSelect: (o: Option) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? undefined : { opacity: 0, x: -14 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <h2 className="text-xl sm:text-2xl font-medium leading-snug tracking-tight text-white">
        {question.q}
      </h2>
      {question.hint && <p className="mt-2 text-sm text-zinc-500">{question.hint}</p>}

      <div className="mt-8 grid gap-3" role="radiogroup" aria-label={question.q}>
        {question.options.map((opt, i) => {
          const active = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(opt)}
              className={
                "group flex items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 " +
                (active
                  ? "border-emerald-500/50 bg-emerald-500/[0.08]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]")
              }
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="hidden h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-white/10 font-mono text-[10px] text-zinc-600 sm:flex"
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className={"block text-sm font-medium " + (active ? "text-emerald-400" : "text-zinc-200")}>
                    {opt.label}
                  </span>
                  {opt.sub && <span className="mt-0.5 block text-xs text-zinc-500">{opt.sub}</span>}
                </span>
              </span>
              {active ? (
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: EMERALD }} aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-700 transition-transform group-hover:translate-x-0.5" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ==========================================================================
 * MODULE 3 — PROCESSING
 * ========================================================================*/
const PROCESS_LINES = [
  "Running combinatorial analysis across 4,096 pathway matrices",
  "Synthesizing USDA Organic compound requirements",
  "Generating zero-composite FSC daily roll manifest",
  "Pairing with Protocol Specialist",
];
const PROCESS_MS = 3500;

function ProcessingScreen({ specialist, onDone }: { specialist: string; onDone: () => void }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const each = PROCESS_MS / PROCESS_LINES.length;
    const timers = PROCESS_LINES.map((_, i) =>
      window.setTimeout(() => setShown(i + 1), each * (i + 1))
    );
    const finish = window.setTimeout(onDone, PROCESS_MS);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, [onDone]);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 text-zinc-100"
      style={{ backgroundColor: SURFACE }}
    >
      <div className="w-full max-w-lg">
        <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: EMERALD }} aria-hidden />
          Processing Diagnostic Matrix
        </p>
        <GlassCard className="p-6 font-mono text-[13px] leading-relaxed">
          <ol aria-live="polite" className="space-y-1">
            {PROCESS_LINES.slice(0, shown).map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2 py-1"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: EMERALD }} aria-hidden />
                <span className="text-zinc-300">
                  {line}
                  {i === PROCESS_LINES.length - 1 ? ` [${specialist}]` : ""}...
                </span>
              </motion.li>
            ))}
          </ol>
        </GlassCard>
      </div>
    </main>
  );
}

/* ==========================================================================
 * MODULE 4 — SUMMARY
 * ========================================================================*/

/** Secondary "profile shape" glyph. Bars below carry the readable magnitudes. */
function ProfileShape({ vectors }: { vectors: VectorState }) {
  const size = 200;
  const c = size / 2;
  const r = c - 26;
  const n = VECTOR_ORDER.length;
  const pt = (i: number, val: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (val / 100) * r;
    return [c + rr * Math.cos(a), c + rr * Math.sin(a)];
  };
  const poly = (val: (i: number) => number) =>
    VECTOR_ORDER.map((_, i) => pt(i, val(i)).join(",")).join(" ");

  return (
    <figure className="m-0">
      <svg width={size} height={size} role="img" aria-label="Profile shape glyph; exact values are listed below." className="mx-auto">
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon key={ring} points={poly(() => ring * 100)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        ))}
        {VECTOR_ORDER.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />;
        })}
        <polygon
          points={poly((i) => vectors[VECTOR_ORDER[i]])}
          fill="rgba(16,185,129,0.16)"
          stroke={EMERALD}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {VECTOR_ORDER.map((k, i) => {
          const [x, y] = pt(i, vectors[k]);
          return <circle key={k} cx={x} cy={y} r={3} fill={EMERALD} stroke={SURFACE} strokeWidth={2} />;
        })}
      </svg>
      <figcaption className="mt-1 text-center text-[10px] uppercase tracking-[0.12em] text-zinc-600">
        Profile shape
      </figcaption>
    </figure>
  );
}

/** Primary readable form. Status fill + icon + text label — never color alone. */
function VectorBars({ vectors }: { vectors: VectorState }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-4">
      {VECTOR_ORDER.map((k) => {
        const meta = VECTOR_META[k];
        const v = vectors[k];
        const s = statusFor(v);
        return (
          <li key={k}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-zinc-300">
                <meta.Icon className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" aria-hidden />
                <span className="truncate">{meta.label}</span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-1.5">
                <s.Icon className="h-3 w-3" style={{ color: s.hex }} aria-hidden />
                <span className="text-zinc-400">{s.label}</span>
                <span className="font-mono tabular-nums text-zinc-500">{v}/100</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: s.hex }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${v}%` }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-600">{meta.sub}</p>
          </li>
        );
      })}
    </ul>
  );
}

interface Payload {
  profile_id: string;
  branch: BranchId;
  isolation: string | null;
  commitment_window: string;
  vectors: VectorState;
  answers: Answers;
  capsules: string[];
  specialist: string;
  engine_version: "2.6";
  generated_at: string;
}

function JsonBox({ payload }: { payload: Payload }) {
  const [open, setOpen] = useState(false);
  const json = useMemo(() => JSON.stringify(payload, null, 2), [payload]);
  return (
    <GlassCard className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Code2 className="h-4 w-4 text-zinc-500" aria-hidden />
          Developer JSON Payload
        </span>
        <ChevronRight className={"h-4 w-4 text-zinc-500 transition-transform " + (open ? "rotate-90" : "")} aria-hidden />
      </button>
      {open && (
        <pre className="max-h-72 overflow-auto border-t border-white/10 bg-black/40 px-5 py-4 font-mono text-[11px] leading-relaxed text-emerald-300/90">
          {json}
        </pre>
      )}
    </GlassCard>
  );
}

function Summary({
  answers,
  vectors,
  onClaim,
}: {
  answers: Answers;
  vectors: VectorState;
  onClaim: (p: Payload) => void;
}) {
  const ctx = ctxFrom(answers);
  const branch = ctx.branch!;
  const hash = hashAnswers(answers);
  const specialist = SPECIALISTS[hash % SPECIALISTS.length];
  const capsules = useMemo(() => pickCapsules(vectors), [vectors]);

  const ranked = [...VECTOR_ORDER].sort((a, b) => vectors[a] - vectors[b]);
  const profileId = `Profile ${(hash % 900) + 100}-${branch[0]}`;
  const headline = `${BRANCH_META[branch].label.split(/[&,]/)[0].trim()} + ${VECTOR_META[ranked[0]].label} Lag`;
  const commitment = answers["s12_commitment"] ?? "90day";

  const payload: Payload = {
    profile_id: profileId,
    branch,
    isolation: ctx.isolation,
    commitment_window: commitment,
    vectors,
    answers,
    capsules: capsules.map((c) => c.name),
    specialist,
    engine_version: "2.6",
    generated_at: new Date().toISOString(),
  };

  return (
    <main className="min-h-screen px-6 py-16 text-zinc-100" style={{ backgroundColor: SURFACE }}>
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: EMERALD }}>
          Diagnostic Complete
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-white">
          {profileId}: {headline}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Derived from {Object.keys(answers).length} self-reported responses on the{" "}
          {BRANCH_META[branch].tracer} branch. Vector scores are a weighted reading
          of your answers, not a measurement.
        </p>

        <GlassCard className="mt-8 grid items-center gap-8 p-6 sm:grid-cols-[200px_1fr]">
          <ProfileShape vectors={vectors} />
          <VectorBars vectors={vectors} />
        </GlassCard>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Your Custom Daily Roll</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {capsules.map((c) => (
              <li key={c.name}>
                <GlassCard className="h-full p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-white">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EMERALD }} />
                    {c.name}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{c.blurb}</p>
                </GlassCard>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6"><JsonBox payload={payload} /></div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <GlassCard className="flex items-center gap-4 p-5">
            <span
              aria-hidden
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-400"
            >
              {specialist[0]}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Users className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" aria-hidden />
                Matched 1:1 with {specialist}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                For schedule adjustments as your inputs shift.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4 p-5">
            <span aria-hidden className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <Recycle className="h-5 w-5 text-emerald-400" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Eco Impact</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Replaces up to 12 plastic bottles with 1 FSC-certified daily roll.
              </p>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="mt-6 flex flex-col items-center gap-5 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-white sm:justify-start">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" aria-hidden />
              $44.99/mo <span className="font-normal text-zinc-500">· under $2/day</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Free SF shipping · Cancel anytime ·{" "}
              {commitment === "30day" ? "30-day accelerated reset" : "90-day sustainable protocol"}
            </p>
          </div>
          <button
            onClick={() => onClaim(payload)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] sm:w-auto"
            style={{ backgroundColor: EMERALD }}
          >
            <Package className="h-4 w-4" aria-hidden />
            Claim Your Protocol
          </button>
        </GlassCard>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-zinc-600">{DISCLAIMER}</p>
      </div>
    </main>
  );
}

/* ==========================================================================
 * ROOT
 * ========================================================================*/
type Stage = "hero" | "quiz" | "processing" | "summary";

export default function MetabolicProtocolEngine() {
  const [stage, setStage] = useState<Stage>("hero");
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const liveRef = useRef<HTMLDivElement>(null);

  const questions = useMemo(() => resolveQuestions(answers), [answers]);
  const vectors = useMemo(() => computeVectors(answers), [answers]);
  const current = questions[stepIndex];
  const tracer = useMemo(
    () => computeTracer(answers, current?.step ?? 1),
    [answers, current]
  );

  const select = useCallback(
    (opt: Option) => {
      setAnswers((prev) => {
        const next = { ...prev, [questions[stepIndex].key]: opt.id };
        // Changing the gate invalidates the branch-qualified questions below
        // it; prune rather than leaving orphaned answers to score invisibly.
        return pruneAnswers(next);
      });
      if (stepIndex + 1 >= TOTAL_STEPS) setStage("processing");
      else setStepIndex((i) => i + 1);
    },
    [questions, stepIndex]
  );

  const back = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  // Number keys pick an option; Backspace goes back.
  useEffect(() => {
    if (stage !== "quiz" || !current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= current.options.length) {
        e.preventDefault();
        select(current.options[n - 1]);
      } else if (e.key === "Backspace" && stepIndex > 0) {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, current, select, back, stepIndex]);

  const claim = useCallback((p: Payload) => {
    // NO BACKEND WIRED — replace with the real cart/checkout call.
    // eslint-disable-next-line no-console
    console.log("[Spadra] Claim Your Protocol →", p);
  }, []);

  if (stage === "hero") return <Hero onStart={() => setStage("quiz")} />;

  if (stage === "processing") {
    return (
      <ProcessingScreen
        specialist={SPECIALISTS[hashAnswers(answers) % SPECIALISTS.length]}
        onDone={() => setStage("summary")}
      />
    );
  }

  if (stage === "summary") {
    return <Summary answers={answers} vectors={vectors} onClaim={claim} />;
  }

  return (
    <main className="min-h-screen px-6 py-16 text-zinc-100" style={{ backgroundColor: SURFACE }}>
      <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_220px]">
        <div>
          <ProgressHeader step={current.step} tracer={tracer} />
          <AnimatePresence mode="wait">
            <QuestionScreen
              key={current.key}
              question={current}
              selectedId={answers[current.key] ?? null}
              onSelect={select}
            />
          </AnimatePresence>

          {stepIndex > 0 && (
            <button
              onClick={back}
              className="mt-8 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              Back
            </button>
          )}

          {/* Mobile: the live rail sits under the question. */}
          <div className="mt-10 lg:hidden">
            <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
              Vector State · live
            </p>
            <VectorRail vectors={vectors} dense />
          </div>

          <p className="mt-12 text-[10px] leading-relaxed text-zinc-700">{DISCLAIMER}</p>
        </div>

        {/* Desktop: sticky live rail. */}
        <aside className="hidden lg:block">
          <div className="sticky top-16" ref={liveRef}>
            <p className="mb-4 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
              Vector State · live
            </p>
            <VectorRail vectors={vectors} />
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ==========================================================================
 * Exported for tests — see scripts/test_engine.mjs
 * ========================================================================*/
export {
  computeVectors,
  resolveQuestions,
  pruneAnswers,
  ctxFrom,
  scopeDelta,
  pickCapsules,
  hashAnswers,
  STEP_SPECS,
  TOTAL_STEPS,
  VECTOR_ORDER,
};
export type { Answers, VectorState, VectorKey, BranchId, Payload };
