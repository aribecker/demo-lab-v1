# R50 — Responsive Users / Groups record layout

Specification first: specs/design-system.md, Responsive CRUD records; specs/demo-lab-access.md, Mobile record/action layout.

Grounding: the supplied Android screenshot shows the long group name compressed to a character-wide column. AccessManagement reused people__list, designed for a name and timestamp. Its non-wrapping flex row placed details and three full-name action buttons as competing siblings, while min-width:0 and overflow-wrap:anywhere on the detail span allowed the name to collapse.

Correction: shared record-list block, separate flexible details/action regions, wrapping on both row and action group, and full-width details above actions at <=820px. Short visible Edit/Delete/Members labels retain contextual accessible names. Metadata uses 12px. Users and Groups share this rule; People name/time rows remain separate. No authorization, database, CRUD operation or route-state changes.

Regression protection: central style contract guards item/action wrapping, bounded children, growing details and the stacked <=820px rule. A long group name behavior check verifies full record text and short button labels with complete accessible context; existing CRUD and route-transition regressions remain active. The old markup fails the new behavior contract.

Visual verification limitation: local Chromium cannot start because the execution environment rejects its socket syscall; DOM-only tests are not pixel proofs. The acceptance matrix remains 320/360/390/600/820/1024 CSS pixels with normal/120-character names and long emails, as recorded in the specification.

Validation result: 158 frontend tests pass across 23 files, central CSS/BEM/token and 9 contrast checks plus the responsive CRUD contract pass, and the production build passes.
