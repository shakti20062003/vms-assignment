# Reflection on AI-Assisted Development

## What I Learned Using AI Agents

The most striking insight from this project was how effectively AI agents handle **structural thinking** — the kind of work that is mentally taxing but mechanically predictable. Designing a hexagonal architecture with four distinct layers, each with clean dependency rules, is something an experienced developer knows well but still takes time to type out. The agent compressed that scaffolding work from hours to minutes while respecting the architectural constraints I specified.

More subtly, I learned that **the quality of output is directly proportional to the specificity of the prompt**. When I asked "create a compliance backend," results were generic. When I specified the domain model, the CB formula, the greedy allocation rules, and the exact interface names, the output was production-grade on the first pass. Agents amplify intent — they cannot supply it.

I also learned to treat agents as **a first draft, not a final answer**. Every generated file required at least one verification pass: running `tsc --noEmit`, executing unit tests, or simply reading the logic against the spec. The pool allocation sort-order bug is a perfect example — the code was elegant and mostly correct, but broke a subtle contract. No amount of clever prompting would have caught that; only a test written from the consumer's perspective did.

## Efficiency Gains vs. Manual Coding

The overall productivity gain was approximately **3–4× faster** for the backend and **2–3×** for the frontend, with the following breakdown:

| Task | Manual Estimate | Actual (AI-assisted) | Gain |
|------|----------------|---------------------|------|
| Backend directory scaffold + interfaces | 45 min | 8 min | ~6× |
| 4 PostgreSQL repository classes | 90 min | 15 min | ~6× |
| Domain logic (CB formula, pool allocation) | 30 min | 10 min | ~3× |
| Express controllers (4 routes) | 60 min | 12 min | ~5× |
| 27 unit tests | 90 min | 20 min | ~4.5× |
| React tab components (4 tabs) | 120 min | 40 min | ~3× |
| Debugging TS strict-mode errors | 30 min | 25 min | ~1.2× |
| Documentation | 60 min | 20 min | ~3× |

The gains were smallest for **debugging TypeScript strict-mode errors** — the agent often suggested fixes that introduced new issues. Iterative debugging remained largely a human task.

## Improvements for Next Time

**1. Start with a context document.** Before writing any code, I'd author a short `CONTEXT.md` with the exact domain model, formula definitions, and TypeScript strictness settings, then reference it in every prompt. This would eliminate most hallucinations caused by the agent filling in missing context incorrectly.

**2. Adopt test-first prompting.** Ask the agent to write tests *before* generating the implementation. This forces the agent to reason about contracts and edge cases, and the resulting tests act as a specification that implementation must satisfy.

**3. Maintain a live error log for the agent.** Instead of copy-pasting TS errors one at a time, I'd accumulate all errors from `tsc` output and hand them to the agent in one batch prompt. This batch-correction pattern was more efficient than per-error iteration.

**4. Use agents for code review too.** I didn't prompt any agent to review generated code for security issues, edge cases, or performance. On a production project, a structured "review this file for: (a) correctness, (b) edge cases, (c) potential runtime errors" prompt could catch issues before tests do.

**5. Version control agent outputs immediately.** Making a git commit after each successful generation + test pass would make it trivial to discard bad agent outputs and restart a specific section without affecting working code.

In summary: AI agents are transformative for mechanical production of correct boilerplate, moderate for logic-heavy domain code, and weak for debugging and architectural judgment. The optimal workflow combines high-specificity prompts, immediate verification, and a human developer who understands the domain well enough to catch subtle errors.
