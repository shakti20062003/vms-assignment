# AI Agent Workflow Log

## Agents Used

- **Claude (claude.ai / Claude Code)** — Primary agent for architecture design, full file generation, iterative debugging, and documentation
- **GitHub Copilot** — Inline autocomplete for repetitive boilerplate (repository method stubs, SQL queries, type declarations)
- **Cursor Agent** — Used for cross-file refactoring tasks (renaming interfaces, propagating type changes across adapters)

---

## Prompts & Outputs

### Example 1 — Hexagonal Architecture Scaffold

**Prompt (to Claude Code):**
```
Design a hexagonal architecture for a FuelEU Maritime compliance backend in Node.js + TypeScript.
I need:
- Domain entities: Route, ComplianceBalance, BankEntry, Pool, PoolMember
- Use-case classes for: GetAllRoutes, SetBaseline, ComputeCB, BankSurplus, ApplyBanked, CreatePool
- Repository interfaces as outbound ports
- Express controllers as inbound adapters
Show me the full directory structure and the core domain files first.
```

**Generated output (excerpt):**
```
src/
  core/
    domain/Route.ts          ← Entities + pure functions (computePercentDiff, isCompliant)
    domain/Compliance.ts     ← computeComplianceBalance, allocatePool (greedy algorithm)
    application/RouteUseCases.ts
    application/ComplianceUseCases.ts
    application/BankingUseCases.ts
    application/PoolUseCases.ts
    ports/repositories.ts    ← IRouteRepository, IComplianceRepository, ...
  adapters/
    inbound/http/            ← Express controllers
    outbound/postgres/       ← Repository implementations
  infrastructure/
    db/                      ← client, migrate, seed
    server/app.ts
```

The agent correctly inferred the dependency inversion principle: use-cases depend on ports (interfaces), not on the concrete Postgres adapters.

---

### Example 2 — Greedy Pool Allocation Algorithm

**Prompt:**
```
Implement the FuelEU Article 21 pool allocation algorithm in TypeScript.
Rules:
- Sum of all member CBs must be >= 0
- Sort members descending by CB
- Transfer surplus from positive-CB ships to cover deficits in negative-CB ships
- No surplus ship should exit the pool with a negative CB
- Return cbBefore and cbAfter for each member
```

**Generated output (core logic):**
```typescript
export function allocatePool(members) {
  const totalCb = members.reduce((sum, m) => sum + m.cbBefore, 0);
  if (totalCb < 0) throw new Error('Pool sum must be >= 0');

  const result = members.map(m => ({ ...m, cbAfter: m.cbBefore }));
  const sorted = [...result].sort((a, b) => b.cbBefore - a.cbBefore);
  const surplusPool = sorted.filter(m => m.cbBefore > 0);
  const deficitPool = sorted.filter(m => m.cbBefore < 0);

  for (const deficit of deficitPool) {
    let needed = Math.abs(deficit.cbAfter);
    for (const surplus of surplusPool) {
      if (needed <= 0) break;
      const transfer = Math.min(surplus.cbAfter, needed);
      surplus.cbAfter -= transfer;
      deficit.cbAfter += transfer;
      needed -= transfer;
    }
  }
  ...
}
```

**Correction applied:** The initial agent output did not merge the sorted array back to the original order when returning results. This was caught during unit test design — the test expected results indexed by `shipId`, not by sort order. Added a `resultMap` merge step.

---

### Example 3 — React TanStack Query Hooks Pattern

**Prompt (to Cursor Agent):**
```
Create a React page component for the Banking tab using TanStack Query.
It should:
- Show a Ship ID + Year selector
- Fetch bank records (getBankRecords) and adjusted CB (getAdjustedCB) in parallel
- Have a "Bank Surplus" button that calls bankSurplus mutation (disabled if CB <= 0)
- Have an "Apply Banked" form with amount input (disabled if nothing banked)
- Show KPI cards for rawCB, totalBanked, adjustedCB
- Show success/error messages after mutations
Use the adapters from otherAdapters.ts as the data source.
```

**Generated output:** The agent produced the full component structure correctly, including `useQueryClient()` with `invalidateQueries` on mutation success to refetch updated balances. One hallucination was caught: it tried to use `import { complianceAdapter } from './otherAdapters'` inside a `queryFn` via `require()` — which is a CommonJS pattern incompatible with ESM. This was corrected to a standard top-level import.

---

### Example 4 — Unit Test Generation

**Prompt:**
```
Write Jest unit tests for these use-case classes using mocked repositories:
- GetAllRoutesUseCase: test filter by vesselType, year
- SetBaselineUseCase: test success and "route not found" error
- BankSurplusUseCase: test positive CB banks correctly, negative CB throws
- ApplyBankedUseCase: test amount > available throws, deductBankEntry called
- CreatePoolUseCase: test valid pool created, invalid sum throws
Use jest.fn() mocks for all repositories.
```

**Generated output:** 27 tests passing. Agent correctly modeled mocks with `jest.fn().mockResolvedValue(...)` patterns. One correction needed: the `CreatePoolUseCase` test used routes with negative CB (HFO ships above target), making the pool sum negative. Test was corrected to use LNG routes with `ghgIntensity: 85.0` to produce positive CBs.

---

## Validation / Corrections

| # | Issue | How Fixed |
|---|-------|-----------|
| 1 | `allocatePool` returned results in sorted order, not original order | Added `resultMap` to preserve original member ordering |
| 2 | `BankingTab.tsx` used `require()` inside queryFn for complianceAdapter | Changed to top-level ESM import |
| 3 | Test for `CreatePoolUseCase` used non-compliant routes → negative CB sum | Switched mock routes to LNG with ghgIntensity = 85.0 |
| 4 | `verbatimModuleSyntax` TS setting required `import type` for all type-only imports | Batch-fixed all files with `import type` syntax |
| 5 | Stale template files in `src/adapters/ui/components/` conflicted with our `pages/` | Deleted stale files from Vite scaffold |
| 6 | `tailwindcss` and `autoprefixer` dropped from `node_modules` after npm reinstalls | Explicitly pinned and reinstalled `tailwindcss@3`, `autoprefixer`, `postcss` |
| 7 | Frontend `tsconfig.app.json` had `noUnusedLocals: true` — `React` import was flagged | Removed unnecessary `import React` (React 17+ JSX transform) |

---

## Observations

### Where agents saved time
- **Architecture scaffolding** — generating the full hexagonal directory structure with correct naming conventions took ~2 minutes vs. ~30 minutes manually
- **Repetitive repository boilerplate** — all four Postgres repository classes (routes, compliance, banking, pools) with row-to-domain mappers were generated in one pass
- **SQL schema** — migrations + seed data generated correctly on first attempt, matching the spec's table definitions
- **Test stubs** — 27 unit tests generated in one shot; required only minor corrections to test data

### Where agents failed or hallucinated
- **CommonJS `require()` inside ESM module** — agent mixed module systems when referencing adapters inside a queryFn
- **Stale file accumulation** — agent-created Vite scaffold left conflicting files in unexpected locations that silently caused type errors
- **Sort order assumption** — the pool allocation algorithm returned members in sorted order, breaking downstream code that expected original order
- **TS strict settings** — agent didn't account for `verbatimModuleSyntax` requiring `import type` everywhere

### How tools were combined
- **Claude** for architecture design, complex domain logic (pool allocation, CB formula), full component generation, and debugging TypeScript errors
- **Copilot** for filling in repetitive SQL (`ON CONFLICT DO UPDATE`, `RETURNING *` patterns) and axios generic types
- **Cursor** for cross-file renames when interfaces were refactored (e.g., `IRouteApiPort` → `IRoutesPort`)

---

## Best Practices Followed

1. **Typed prompts** — always specified exact TypeScript signatures in prompts to avoid implicit `any`
2. **Incremental validation** — ran `tsc --noEmit` and `jest` after each major generation step
3. **Diff review** — never accepted large generated files wholesale; always diffed against intended contract
4. **Domain-first prompting** — asked agent to generate domain logic before adapters, ensuring clean separation
5. **Test-driven correction** — wrote unit tests before fixing bugs; let test failures guide corrections
6. **Single-responsibility prompts** — kept each prompt focused on one layer/file to reduce hallucination surface area
