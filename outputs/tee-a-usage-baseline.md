# Tee A — Feature Usage Baseline (90 Days)

**Period:** 2026-01-25 to 2026-04-25
**Data sources:** `tracking_events` table (69,737 events), Umami analytics (58,728 events)

## Overall Traffic

| Metric | tracking_events | Umami |
|--------|----------------|-------|
| Total events (90d) | 69,737 | 58,728 |
| Unique sessions | 229 | 103 |
| Unique visitors | 107 | — |

## Targeted Feature Routes — Usage

Of 14 features checked, **only 4 had any visits at all**, all from **a single IP hash** (developer/owner, not a customer).

| Feature Route | Page Views | Unique Visitors | Decision |
|---|---|---|---|
| `/time-machine` | 2 | 1 (dev) | KUSTUTA |
| `/prosecutor` | 2 | 1 (dev) | KUSTUTA |
| `/exam-simulator` | 4 | 1 (dev) | KUSTUTA |
| `/chain-reaction` | 2 | 1 (dev) | KUSTUTA |
| `/war-room` | 0 | 0 | KUSTUTA |
| `/compliance-genome` | 0 | 0 | KUSTUTA |
| `/digital-twin` | 0 | 0 | KUSTUTA |
| `/stress-test` | 0 | 0 | KUSTUTA |
| `/compliance-autopsy` | 0 | 0 | KUSTUTA |
| `/what-if` | 0 | 0 | KUSTUTA |
| `/achievements` | 0 | 0 | KUSTUTA |
| `/gpai` | 0 | 0 | KUSTUTA |
| `/compliance-decay` | 0 | 0 | KUSTUTA |
| `/compliance-network` | 0 | 0 | KUSTUTA |

**Verdict: ALL 14 features had <5 unique users (actually 0-1, all developer). All qualify for deletion without asking.**

## Top 15 Actually Used Pages (for contrast)

| Page | Total Events |
|---|---|
| `/` (homepage) | 32,622 |
| `/en/blog` | 11,561 |
| `/contract-analysis` | 4,190 |
| `/login` | 2,773 |
| `/supply-chain` | 2,386 |
| `/pricing` | 1,918 |
| `/terms` | 1,769 |
| `/nis2/scope-check` | 1,703 |
| `/assessment` | 1,618 |
| `/fine-calculator` | 1,428 |
| `/workspace` | 1,222 |
| `/dashboard` | 892 |
| `/board-risk` | 584 |
| `/history` | 496 |
| `/register` | 445 |

## Conclusion

Zero real customers used any of the 14 targeted features. The only visits came from the developer's own IP. All features qualify for immediate deletion under the <5 users criterion.

**Note:** Features from PRs 1-7 (PromoSlot, Achievements, GPAI, ComplianceDecay, BalticLeadCrawler, ComplianceNetwork, WarRoom, all simulators) were ALREADY deleted in cleanup phases 00-05 merged to main. The deletion decisions are retroactively validated by this data.
