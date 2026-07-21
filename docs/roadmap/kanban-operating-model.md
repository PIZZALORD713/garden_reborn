# fRiENEMiES Kanban Operating Model

_Last updated: 2026-07-20_

This model defines how executable work moves through the canonical
[`fRiENEMiES Roadmap`](https://github.com/users/PIZZALORD713/projects/1) for
`PIZZALORD713/garden_reborn`.

## Operating Principle: One Board, Many Views

`fRiENEMiES Roadmap` is the only GitHub Project for this product. Roadmap,
delivery, review, track, and initiative perspectives are saved filtered views
of that board, not separate projects.

Repository issues are the source of truth. Project views organize those issues;
pull requests deliver them.

> **Tracked Work Item Gate:** Any change that will produce a branch, pull
> request, deployment, or delegated agent task must begin with a real
> `PIZZALORD713/garden_reborn` issue URL already present on the canonical board.
> Draft project cards, chat numbering, and bare references such as “#2” do not
> satisfy this gate.

Read-only investigation, brainstorming, and idea jams are exempt until a
decision becomes executable work.

## Canonical Board

- Board: [`fRiENEMiES Roadmap`](https://github.com/users/PIZZALORD713/projects/1)
- Planning repository: [`PIZZALORD713/garden_reborn`](https://github.com/PIZZALORD713/garden_reborn)
- Tracked item type: repository issue
- Delivery link: pull request containing `Closes #<issue-number>`

Do not create a second project for an initiative. Apply an
`initiative:<slug>` label and save a filtered view on the canonical board.

## Required Views

| View | Layout | Filter | Purpose |
| --- | --- | --- | --- |
| `Roadmap` | Table | none | Full source-of-truth inventory, grouped or sorted by Horizon and Priority. |
| `Delivery` | Board | `is:issue -status:Done` | Active work grouped by Status. |
| `Triage` | Table | `status:Inbox,"Fact Finding"` | New work that is not ready to start. |
| `Now` | Board | `horizon:Now -status:Done` | Current horizon only. |
| `Review` | Table | `status:Review` | Pull requests and evidence waiting for acceptance. |
| `Done` | Table | `status:Done` | Completed and superseded delivery history. |

Create initiative views only while the initiative is active. Use the filter
`label:"initiative:<slug>"`; delete the view after the initiative closes while
retaining the label and issue history.

## Status Lifecycle

| Status | Entry condition | Exit condition |
| --- | --- | --- |
| `Inbox` | A `kanban` issue is automatically added to the board. | Goal, sources, acceptance criteria, and Definition of Done are complete. |
| `Fact Finding` | Material scope or evidence is still unknown. | The issue can be estimated and verified without guessing. |
| `Ready` | The issue is executable and has an owner. | A branch or delegated agent starts. |
| `In Progress` | Implementation has started. | A pull request is opened or work becomes blocked. |
| `Review` | A PR is open and linked with `Closes #<issue-number>`. | Required review, checks, and deployment/runtime proof pass. |
| `Blocked` | Work cannot progress without an external decision or dependency. | The blocker is resolved and documented on the issue. |
| `Done` | The issue is closed as completed after merge and required proof. | Terminal; later reversals use a superseding issue. |

Only one issue should own a branch. When several agents are involved, use one
issue and branch per agent and serialize changes to shared integration files.

## Project Fields

- `Status`: Inbox, Fact Finding, Ready, In Progress, Review, Blocked, Done.
- `Track`: Studio, Blender, Animation, Agent Identity, Web3, Ecosystem, Ops.
- `Horizon`: Now, Next, Later, Someday.
- `Priority`: P0, P1, P2, P3.
- `Source`: Context Pack, Garden Reborn, Local Blender, Agent Vault, Legacy DApp, New Idea.

## Portable Labels

Use labels even when an equivalent project field exists so issue meaning remains
portable outside the Project UI.

- Board intake: `kanban`.
- Initiatives: `initiative:<slug>`.
- Tracks: `track:studio`, `track:blender`, `track:animation`,
  `track:agent-identity`, `track:web3`, `track:ecosystem`, `track:ops`.
- Types: `type:research`, `type:feature`, `type:qa`, `type:docs`, `type:decision`.
- Priorities: `priority:p0`, `priority:p1`, `priority:p2`.
- Sources: `source:context-pack`, `source:garden-reborn`,
  `source:local-blender`, `source:agent-vault`, `source:legacy-dapp`.
- Risks/blockers: `risk:ip-legal`, `blocked`.

## Issue Contract

Executable work must use
[`Tracked work item`](../../.github/ISSUE_TEMPLATE/work-item.yml) and include:

- `Goal`: why the work matters.
- `Grounding Sources`: repository paths, live evidence, decisions, or references.
- `Initiative / View`: an existing `initiative:<slug>` label or `none`.
- `Scope / Ownership`: files, systems, and owner boundaries.
- `Acceptance Criteria`: observable completion checks.
- `Definition of Done`: final merge, proof, and handoff standard.
- `Verification Plan`: commands, browser flows, deployments, or device evidence.

P0 and P1 issues must have a source label and at least one acceptance criterion
that can be verified without guessing.

## Pull Request Contract

Every implementation PR must use
[`pull_request_template.md`](../../.github/pull_request_template.md) and:

- include `Closes #<issue-number>` for the real owning issue;
- name the board/initiative view;
- describe scope boundaries and any intentionally untouched files;
- record exact verification and deployment/runtime evidence;
- move the issue to `Review` when opened;
- avoid closing or moving unrelated cards.

PRs do not need separate board cards. Their linked issue is the tracked item.

## Supersession

Do not reopen completed work merely because product direction changes later.
Create a new issue and PR, add reciprocal `Supersedes #<number>` links, and keep
the original item in `Done`. This preserves both historical truth and the
current product decision.

## Board Automations

The canonical Project must keep these built-in workflows enabled:

1. **Auto-add to project**
   - Repository: `PIZZALORD713/garden_reborn`
   - Filter: `is:issue label:kanban`
2. **Item added to project**
   - Set `Status` to `Inbox`.
3. **Item closed**
   - Set `Status` to `Done`.

Auto-add applies to newly created or newly updated matching issues; it does not
backfill old matches. Add any historical matching issue manually when needed.

## Cadence and Closeout

- Cycle length: 6 weeks.
- Start each cycle with source, priority, and Horizon review.
- Review `Inbox`, `Fact Finding`, `Blocked`, and `Review` at each project check-in.
- End each cycle with verification notes and a board reconciliation.
- Before an agent reports completion, it must verify the issue URL, board
  status, linked PR, merge state, and required runtime/deployment evidence.

## Product Guardrails

- Do not imply fRiENEMiES is official FriendsWithYou work.
- Do not promise commercial rights, guaranteed rewards, guaranteed value, or
  finalized claim mechanics.
- Treat Web3 claim/inventory items as research until separately approved.
- Keep Studio + Blender delivery ahead of broader ecosystem expansion.
