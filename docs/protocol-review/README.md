# Protocol Review Workflow

Protocol content (doses, dilutions, preparations, challenge steps, pharmacy-verification flags) is clinical data. Automated tests can verify file integrity, but only a clinician can verify clinical correctness. This workflow is enforced by convention — do not treat a console diff or a green test suite as clinical sign-off.

## Steps

1. Run the protocol sync against an approved local source:
   ```sh
   npm run protocols:sync -- --from-path /path/to/approved/export.json --review-only
   ```
   `--review-only` writes the review artifact and exits **without** changing `protocols.snapshot.json` or the generated masterlist.
2. Open `docs/protocol-review/latest-diff.md`. It lists every added/removed drug, protocol addition/removal, label and test-type change, SPT change, IDT ratio/concentration/preparation change, challenge interval and dose-step change, and review-note/pharmacy-verification change.
3. Ask an appropriate clinician to review **every** changed dose, dilution, preparation, challenge step, and pharmacy-verification flag.
4. Record the reviewer's name, role, review date, and decision in the sign-off block at the bottom of `latest-diff.md`.
5. Only after a documented clinical decision: re-run the sync **without** `--review-only` to accept the changes (`protocols.snapshot.json` and `drugMasterlist.generated.ts` are regenerated).
6. Re-run the protocol ordering tests and the full application test suite:
   ```sh
   npx vitest run src/shared/data
   npm run test:unit
   ```
7. Commit with the signed-off `latest-diff.md` included.

## Notes

- `latest-diff.md` is a tracked artifact: an uncommitted, unsigned diff is a signal that protocol changes are pending review.
- Never fabricate a reviewer, approval, date, or clinical decision.
- The report contains protocol content only — no patient data.
