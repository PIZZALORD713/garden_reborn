# Discord Bug Triage Workflow (fRiENEMiES)

## Intake channel
- Discord: `#bug-reports`
- Required intake template is posted in-channel.

## Triage SLA
- First response target: < 2 hours
- Severity assignment target: < 6 hours

## Severity rubric
- **S1**: Core flow blocked (can’t load token, can’t export, hard crash)
- **S2**: Major degradation but workaround exists
- **S3**: Cosmetic/minor issues

## Area taxonomy
- loader
- animation
- export
- wallet/ENS
- UI

## Thread/status convention
Thread name:
`BUG-YYYYMMDD-### short-title`

Status tags in thread title:
- `[NEW]`
- `[NEEDS-INFO]`
- `[TRIAGED]`
- `[IN-PROGRESS]`
- `[FIXED]`
- `[SHIPPED]`

## Triage response format
- Severity: S1/S2/S3
- Area: (taxonomy)
- Repro confidence: high/medium/low
- Hypothesis: 1-2 lines
- Next action: one concrete request or next engineering step

## GitHub handoff
When report quality is adequate, create a GitHub issue using template below and include:
- Discord message link (original report)
- Discord thread link (triage thread)
- Attachments copied into issue

---

## Copy/paste GitHub issue template (manual handoff)

Title format:
`[Sx][area] short description`

Body:

```md
## Summary
One-sentence bug summary.

## Severity
S1 | S2 | S3

## Area
loader | animation | export | wallet/ENS | UI

## Environment
- Device:
- Browser:
- App version/commit:

## Identity
- Token ID:
- Wallet/ENS:

## Steps to Reproduce
1.
2.
3.

## Expected Result

## Actual Result

## Frequency
always | intermittent | once

## Attachments
- screenshot/video links

## Discord Context
- Report message:
- Thread:

## Triage Notes
- Repro confidence:
- Hypothesis:
- Next action:
```
