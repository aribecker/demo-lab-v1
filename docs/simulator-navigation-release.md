# Always-visible Trading Simulator — 2026-10-27

The menu destination and Home card remain visible for anonymous, denied and authorized users. Entering the route retains the existing SimulatorGate. Anonymous entry offers Login without protected requests. Authenticated non-owner entry greets the supplied profile name and displays: Lamentamos, usted no tiene acceso a esta sección. The verified Google owner aribecker2@gmail.com is greeted and sees the full existing simulator. Logout and expiry remove private content without hiding navigation. Backend permission enforcement is unchanged.

Validation: 147 frontend tests passed across 21 files; style checks and production build passed. Tests cover visible anonymous/denied navigation, Home entry, greeting, owner content, logout/expiry, protected request isolation and no simulation commands.

Rollout: skip automatic deploys for this commit and manually deploy the frontend only, since the backend code is unchanged. Existing Google OAuth credentials/callback configuration remain a prerequisite for real sign-in on the new API.
