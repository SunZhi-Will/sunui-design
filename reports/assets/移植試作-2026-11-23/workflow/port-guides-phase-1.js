export const meta = {
  name: 'port-guides-phase-1',
  description: 'Phase 1 of the port-guide scale-up: classify all 212 blocks, write acceptance checklists for 20 blocks, scan free block sources for stale comments. Haiku, Sonnet and Opus check each other.',
  phases: [
    { title: 'Triage', detail: 'Haiku and Sonnet classify every block independently from its metadata' },
    { title: 'Arbitrate', detail: 'Opus settles the blocks the two disagree on' },
    { title: 'Checklist', detail: 'Opus writes an acceptance checklist from each block source' },
    { title: 'Critique', detail: 'Sonnet checks each checklist against the source; Opus revises if needed' },
    { title: 'Scan', detail: 'Haiku scans free block sources for stale comments and missing easings' },
    { title: 'Confirm', detail: 'Sonnet re-reads the cited lines and drops false findings' },
  ],
}

const W = '/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/phase1'
const WEB = '/Applications/Projects/nextjs/sunui-design/apps/web'
const pad = (n) => String(n).padStart(2, '0')
const CLASSES = ['web-only', 'generic-control', 'tactile', 'object-scene', 'effect-library', 'page-template']
const VALUES = ['high', 'medium', 'low', 'none']

// ---------- Triage ----------
const TRIAGE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          klass: { type: 'string', enum: CLASSES },
          nativeValue: { type: 'string', enum: VALUES },
          reason: { type: 'string', description: 'one short sentence' },
        },
        required: ['name', 'klass', 'nativeValue', 'reason'],
      },
    },
  },
  required: ['items'],
}

const triageRules = `Classify each UI block for one purpose: deciding whether it is worth porting from the web (React) to other platforms, especially phone apps (SwiftUI, Flutter, React Native).

klass, pick exactly one:
- web-only: the block exists because of the browser. Page chrome and page-level navigation (site header, back-to-top, table of contents that follows page scroll, scroll progress), cursor and hover effects, cookie banners, browser frames, link previews. A native app gets this from the system or its navigation container.
- generic-control: a standard control or section every platform already ships or every team already has: tabs, pagination, skeleton, dialog, drawer, tooltip, accordion, FAQ, pricing table, plan comparison, plain form field, empty state, avatar stack, file dropzone.
- tactile: a small interaction whose value is how it feels: a button with a distinct press, a stepper, a slider, a toggle, a counter that rolls, a confirm-twice button, a favourite heart, toasts you swipe.
- object-scene: the block draws a recognisable object or a small world that the user manipulates or watches: a coupon you claim, a scratch card, a card pack you tear, a stamp card, a prize wheel, a 3D book, a pixel scene, a glass cube, a receipt printer.
- effect-library: one file that switches between many effects or presets through a prop (text effects, button effects, background effects, scene transitions, cursor effects).
- page-template: a whole page or a full hero or landing section composed of several parts.

nativeValue, how much a phone app would gain from having this exact block:
- high: distinctive, touch works as well as or better than mouse, hard to get elsewhere.
- medium: useful and it carries over, but not distinctive.
- low: carries over but the platform already has an equivalent that is good enough.
- none: makes no sense in a phone app (web-only blocks, hover-only or cursor-only effects, page-scroll storytelling tied to a web page).

Use the metadata given: title, description, categories, series, interaction, when-to-use notes and the detected features (hover: true with interaction "hover" usually means it depends on a pointer). Judge by what the block is, not by how impressive the description sounds. Return one item for every block in the file, with the exact name.`

function triagePrompt(n) {
  return `${triageRules}\n\nThe blocks are in ${W}/triage/batch-${pad(n)}.json (a JSON array). Read that file and classify every block in it. Do not read anything else.`
}

const ARBITER_SCHEMA = TRIAGE_SCHEMA

// ---------- Checklists ----------
const CHECK_SCHEMA = {
  type: 'object',
  properties: {
    block: { type: 'string' },
    summary: { type: 'string', description: 'one sentence: what the block is for' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'short kebab-case id, unique in this checklist' },
          behaviour: { type: 'string', description: 'what must be true, in plain words' },
          trigger: { type: 'string', description: 'the exact user action or data change that brings it about, or "initial render"' },
          expect: { type: 'string', description: 'the observable result with its numbers: text, attribute, size, duration, spring, order' },
          kind: { type: 'string', enum: ['state', 'text', 'attribute', 'keyboard', 'timing', 'motion', 'layout', 'reduced-motion'] },
          scope: { type: 'string', enum: ['all', 'web', 'touch'], description: 'all: every platform. web: needs a mouse, hover or a hardware keyboard. touch: only on touch devices.' },
        },
        required: ['id', 'behaviour', 'trigger', 'expect', 'kind', 'scope'],
      },
    },
  },
  required: ['block', 'summary', 'items'],
}

function checklistPrompt(name) {
  return `Write the acceptance checklist for the SunUI block "${name}". A coding agent will port this block to another platform (Vue, Svelte, SwiftUI, Flutter, React Native) and a separate judge will run this checklist against the port. The React source is the specification.

Read ${WEB}/registry/free/${name}/${name}.tsx and ${WEB}/registry/free/${name}/demo.tsx. If the block imports a shared item, read it too: "@/components/ui/stamp" is ${WEB}/registry/free/stamp/stamp.tsx and "@/lib/sunui-motion" is ${WEB}/registry/lib/sunui-motion/motion.ts.

Write 10 to 16 items. Rules:
- Every item must be checkable by operating the demo and observing it: something a script or a person can see, read or measure. No item about code structure.
- Take every number from the code: spring stiffness and damping, durations, delays, offsets, scales, timeouts, thresholds, clamps. Never estimate.
- Cover every state the block can be in and what triggers each one, the keyboard behaviour including the Tab order (Tab must stop on the same controls in the same order as the original and on nothing decorative), the accessible names and live announcements, what reduced motion changes, and the edge cases the code handles on purpose (limits, disabled, empty, repeated presses, cancel).
- State what the demo shows on first render so a port can be compared with it.
- When the code and a comment disagree, follow the code.
- scope "web" for anything that needs a mouse, hover or a hardware keyboard; "touch" for touch-only behaviour; "all" otherwise.
- Plain English, no em dashes.`
}

const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'true only if nothing below needs changing' },
    wrong: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, problem: { type: 'string', description: 'what the code actually does, with the line or the value' } }, required: ['id', 'problem'] } },
    missing: { type: 'array', items: { type: 'string', description: 'a behaviour in the code that no item covers' } },
    untestable: { type: 'array', items: { type: 'string', description: 'id of an item that cannot be observed from outside' } },
  },
  required: ['ok', 'wrong', 'missing', 'untestable'],
}

function criticPrompt(name, checklist) {
  return `Check an acceptance checklist against the source it was written from. Assume it contains mistakes and find them.

Read ${WEB}/registry/free/${name}/${name}.tsx and ${WEB}/registry/free/${name}/demo.tsx (and ${WEB}/registry/free/stamp/stamp.tsx or ${WEB}/registry/lib/sunui-motion/motion.ts if the block imports them).

For every item verify the trigger and the expected result against the code, number by number. Report:
- wrong: an item whose trigger or expectation does not match the code. Say what the code does.
- missing: a state, a keyboard path, a limit or a reduced-motion branch in the code that no item covers. Only real behaviours, not style details.
- untestable: an item that cannot be observed by operating the demo.
Set ok to true only if all three lists are empty.

The checklist:
${JSON.stringify(checklist, null, 1)}`
}

function revisePrompt(name, checklist, critique) {
  return `Revise the acceptance checklist for the SunUI block "${name}". A reviewer compared it with the source and reported problems. Re-read ${WEB}/registry/free/${name}/${name}.tsx and ${WEB}/registry/free/${name}/demo.tsx, decide for each reported problem whether the reviewer is right (the code decides), then return the complete corrected checklist: fix wrong items, add the missing behaviours that are real, and rewrite or drop items that cannot be observed. Keep 10 to 18 items, the same fields, plain English, no em dashes.

Current checklist:
${JSON.stringify(checklist, null, 1)}

Reviewer's report:
${JSON.stringify(critique, null, 1)}`
}

// ---------- Hygiene ----------
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          block: { type: 'string' },
          line: { type: 'number' },
          kind: { type: 'string', enum: ['stale-design-wording', 'comment-contradicts-code', 'tween-without-ease', 'usage-note-contradicts-code'] },
          quote: { type: 'string', description: 'the exact text on that line, at most 160 characters' },
          why: { type: 'string', description: 'one sentence' },
        },
        required: ['block', 'line', 'kind', 'quote', 'why'],
      },
    },
  },
  required: ['findings'],
}

const hygieneRules = `These React block sources are handed to other coding agents as the specification for porting, comments included. Find the lines that would mislead a porter. Report only these four kinds:

1. stale-design-wording: a comment or doc string that describes a look from SunUI's old "paper" design language that the code no longer renders: vermilion or 朱紅 ink, an ink stamp or seal pressed onto paper (印章, 蓋章), paper, ink, perforations, tear lines, torn edges, receipts as a visual metaphor. Identifiers are fine (a component or prop named Stamp, stamp, ink, paper is not a finding). Only report prose that claims the UI looks or behaves like paper, ink or a stamp when the code beside it draws a neutral surface, a disc with a check, or a theme colour.
2. comment-contradicts-code: a comment or prop doc that states a behaviour the code does not have (wrong state name, wrong default, wrong unit, wrong trigger).
3. tween-without-ease: a framer-motion transition object that gives a duration but no ease and no type "spring", where the choice of curve is visible (opacity fades, moves, scale). Report the line of the transition.
4. usage-note-contradicts-code: not applicable here, skip it.

Be exact: give the line number and quote the line. Do not report style opinions, missing comments, or anything you are not sure about. An empty list is a fine answer.`

function scanPrompt(n) {
  return `${hygieneRules}\n\nThe files to read are listed in ${W}/hygiene/batch-${pad(n)}.json (name, absolute file path, line count). Read each file in full and report findings.`
}

function confirmPrompt(n, findings) {
  return `Another reviewer scanned some React source files and reported lines that could mislead someone porting the code. Check each report against the file and keep only the ones that are true. Default to dropping a finding if you cannot confirm it from the code.

The rules the first reviewer followed:
${hygieneRules}

The files are listed in ${W}/hygiene/batch-${pad(n)}.json. For each finding open the file, read the cited line and the code around it, and decide. Fix the line number or the quote if they are slightly off. Return the confirmed findings only.

Reported findings:
${JSON.stringify(findings, null, 1)}`
}

// ---------- Run the three tracks side by side ----------
const TRIAGE_BATCHES = args.triageBatches
const HYGIENE_BATCHES = args.hygieneBatches
const CHECK_BLOCKS = args.checklistBlocks

const triageTrack = (async () => {
  const batches = Array.from({ length: TRIAGE_BATCHES }, (_, i) => i + 1)
  const pairs = await parallel(
    batches.map((n) => async () => {
      const [h, s] = await parallel([
        () => agent(triagePrompt(n), { label: `triage ${pad(n)} (haiku)`, phase: 'Triage', model: 'haiku', schema: TRIAGE_SCHEMA }),
        () => agent(triagePrompt(n), { label: `triage ${pad(n)} (sonnet)`, phase: 'Triage', model: 'sonnet', schema: TRIAGE_SCHEMA }),
      ])
      return { n, h, s }
    }),
  )
  const agreed = []
  const disputed = []
  for (const pair of pairs.filter(Boolean)) {
    const hs = new Map(((pair.h && pair.h.items) || []).map((i) => [i.name, i]))
    const ss = new Map(((pair.s && pair.s.items) || []).map((i) => [i.name, i]))
    const names = new Set([...hs.keys(), ...ss.keys()])
    for (const name of names) {
      const a = hs.get(name)
      const b = ss.get(name)
      if (a && b && a.klass === b.klass && a.nativeValue === b.nativeValue) agreed.push({ ...b, by: 'haiku+sonnet' })
      else disputed.push({ name, batch: pair.n, haiku: a || null, sonnet: b || null })
    }
  }
  log(`triage: ${agreed.length} agreed, ${disputed.length} disputed`)
  const chunks = []
  for (let i = 0; i < disputed.length; i += 16) chunks.push(disputed.slice(i, i + 16))
  const settled = await parallel(
    chunks.map((chunk, i) => () =>
      agent(
        `${triageRules}\n\nTwo reviewers classified these blocks and disagreed. Decide each one. The metadata for a block is in ${W}/triage/batch-NN.json where NN is the two-digit batch number given with it; read the entries you need. Return one item per block listed here, with the exact name.\n\n${JSON.stringify(chunk, null, 1)}`,
        { label: `arbitrate ${i + 1}`, phase: 'Arbitrate', model: 'opus', schema: ARBITER_SCHEMA },
      ),
    ),
  )
  const decided = settled.filter(Boolean).flatMap((r) => r.items).map((i) => ({ ...i, by: 'opus' }))
  return { agreed, disputed, decided }
})()

const checklistTrack = pipeline(
  CHECK_BLOCKS,
  (name) => agent(checklistPrompt(name), { label: `checklist ${name}`, phase: 'Checklist', model: 'opus', schema: CHECK_SCHEMA }),
  async (checklist, name) => {
    if (!checklist) return null
    const critique = await agent(criticPrompt(name, checklist), { label: `critique ${name}`, phase: 'Critique', model: 'sonnet', schema: CRITIC_SCHEMA })
    return { checklist, critique }
  },
  async (prev, name) => {
    if (!prev) return null
    const { checklist, critique } = prev
    if (!critique || critique.ok) return { block: name, checklist, critique, revised: false }
    const revised = await agent(revisePrompt(name, checklist, critique), { label: `revise ${name}`, phase: 'Critique', model: 'opus', schema: CHECK_SCHEMA })
    return { block: name, checklist: revised || checklist, critique, revised: Boolean(revised) }
  },
)

const hygieneTrack = pipeline(
  Array.from({ length: HYGIENE_BATCHES }, (_, i) => i + 1),
  (n) => agent(scanPrompt(n), { label: `scan ${pad(n)}`, phase: 'Scan', model: 'haiku', schema: FINDINGS_SCHEMA }),
  async (scan, n) => {
    const found = (scan && scan.findings) || []
    if (!found.length) return { n, reported: 0, confirmed: [] }
    const confirmed = await agent(confirmPrompt(n, found), { label: `confirm ${pad(n)}`, phase: 'Confirm', model: 'sonnet', schema: FINDINGS_SCHEMA })
    return { n, reported: found.length, confirmed: (confirmed && confirmed.findings) || [] }
  },
)

const [triage, checklists, hygiene] = await Promise.all([triageTrack, checklistTrack, hygieneTrack])
log(`checklists: ${checklists.filter(Boolean).length} of ${CHECK_BLOCKS.length}; hygiene batches: ${hygiene.filter(Boolean).length}`)
return { triage, checklists, hygiene }