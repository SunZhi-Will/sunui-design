export const meta = {
  name: 'port-checklists-correct',
  description: 'Correct the acceptance checklists using what the judges measured on the original',
  phases: [{ title: 'Correct', detail: 'Sonnet applies the judge-reported corrections to each checklist, checking them against the source' }],
}
const WEB = '/Applications/Projects/nextjs/sunui-design/apps/web'
const R = '/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/p2'
const SCHEMA = {
  type: 'object',
  properties: {
    block: { type: 'string' },
    changed: { type: 'array', items: { type: 'string' }, description: 'id of each item you changed or added, with a few words on what changed' },
    rejected: { type: 'array', items: { type: 'string' }, description: 'a reported problem you did not apply, with the reason' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          behaviour: { type: 'string' },
          trigger: { type: 'string' },
          expect: { type: 'string' },
          kind: { type: 'string', enum: ['state', 'text', 'attribute', 'keyboard', 'timing', 'motion', 'layout', 'reduced-motion'] },
          scope: { type: 'string', enum: ['all', 'web', 'touch'] },
        },
        required: ['id', 'behaviour', 'trigger', 'expect', 'kind', 'scope'],
      },
    },
  },
  required: ['block', 'changed', 'rejected', 'items'],
}
const out = await parallel(
  args.blocks.map((name) => () =>
    agent(
      `Correct the acceptance checklist of the SunUI block "${name}".

A judge ran this checklist against the live React original and found items that are wrong about what the original really does. The judge measured the running original, so where the judge reports a measured behaviour, that is the truth, even when the source code or its comments read differently (framer-motion has runtime rules a reading of the source misses, such as an element with initial={false} not animating when it is already present on first render).

Read the current checklist at ${WEB}/content/port-checklists/${name}.json, the reported problems in ${R}/checklist-problems/${name}.json (a JSON array of strings), and the source ${WEB}/registry/free/${name}/${name}.tsx with demo.tsx beside it.

For each reported problem: correct the item so that its trigger and expectation describe what the original really does, with the judge's numbers. If the problem shows a behaviour no item covers, add an item. Reject a report only if it is about the test setup rather than the block, and say why. Do not touch items nobody reported. Keep the same fields, plain English, no em dashes. Return the complete list of items, not only the changed ones.`,
      { label: `correct ${name}`, phase: 'Correct', model: 'sonnet', schema: SCHEMA },
    ),
  ),
)
return out.filter(Boolean)