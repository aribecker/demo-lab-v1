# Users ↔ Groups blank page correction

Specification first: specs/demo-lab-access.md, Users / Groups navigation isolation addendum.

Grounding: the two routes render the same AccessManagement component under SimulatorGate. React reconciled it as the same instance when switching routes, preserving users rows and user draft while kind became groups. Group rendering read row.permissions.map or draft.permissions.includes from user-shaped objects and threw, leaving a blank page before the route refresh effect ran.

Correction: explicit distinct React keys on the Users and Groups CRUD route elements. Switching sections unmounts the previous instance (including abort/cleanup and its mounted guard) and creates the destination with its own initial state. Existing authorization checks and persisted records are unchanged.

Reproduction before fix: both new regression scenarios failed with the map/includes exceptions. Coverage includes repeated menu transitions with unsaved edits, a loaded membership panel, and leaving an outstanding users list request that resolves late. After the correction run the complete frontend suite, contrast/style contract and production build; deploy frontend only and verify the served bundle contains both distinct route keys.

Validation result: 157 frontend tests pass across 23 files, including the two previously failing reproductions. Central BEM/token boundary and all 9 contrast pairs pass. Production Vite build passes.
