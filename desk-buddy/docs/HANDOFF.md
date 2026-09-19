# Andy + Kyle handoff

## First 15 minutes

Both run `npm ci`, `npm test`, and `npm run dev`. Walk through `3x-2` → hint → `3x-6` and confirm one additional completion in the parent dashboard. Read `src/types/contracts.ts` together before branching.

## Andy — platform and tutoring

1. Authentication and storage: implement family membership and database-backed sessions/events. Done when two families cannot see or mutate each other's data and duplicate retries count once.
2. Live tutor adapter: keep secrets server-side; retain the response shape. Done when first-attempt-before-hint policy, timeout recovery, output validation, and answer-leakage checks pass.
3. Elastic adapter: index minimal events and replace the aggregator behind `/api/dashboard`. Done when one completion appears once, correct family filters are enforced, and an indexing outage does not lose it.
4. Deploy after the local-file adapter has been replaced. Own dependencies and environment documentation.

## Kyle — product and dashboard

1. Refine `/learn`: readable turns, scroll/focus behavior, error recovery, empty/busy/completed states. Done when the full session is usable by keyboard and at 375px width.
2. Refine `/parent`: accessible metric explanations, clear source labels, useful topic details. Done when every displayed number comes from the shared API contract and empty/error states work.
3. Add customizations only after there is an authenticated persistence API; do not ship settings that silently do nothing.
4. Prepare the demo narrative and validate it with Andy on the deployed version.

## Coordination rules

- Use one repository and feature branches. One editor/agent owns a file at a time.
- Andy owns shared types, package/lock files, and API routes; Kyle owns page/component styling.
- Each coding-tool task should name permitted files, expected behavior, and checks to run. Review diffs before merging.
- Do not ask two agents to rewrite the whole application concurrently.
- Avoid committing secrets or `.data`. Use synthetic fixtures in coding prompts.
- Integrate after the first working endpoint, then every few hours. Keep main buildable.
- Reserve the final two hours for verification and demo rehearsal.

## Priority cut line

Must have: one real guided session, one stored event, one genuine dashboard update, isolated family access before public use. Nice to have: photo input and tailored follow-up question. Defer: voice, robots, advanced mastery estimation, native apps, and push notifications.

## Acceptance checklist

- [ ] Fresh `npm ci` works; typecheck, tests, and production build pass.
- [ ] First-time visitor can find both views without instructions.
- [ ] Tutor gives a hint only after an attempt.
- [ ] A single completion updates the parent metrics once.
- [ ] Sample history is visibly marked and never represented as measured learning.
- [ ] Network/provider errors allow recovery without double-counting.
- [ ] Before real users: auth, family isolation, consent/retention/deletion, service data policies reviewed.
