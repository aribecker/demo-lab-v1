# Simulator navigation and access grounding — 2026-10-27

App.jsx filters the Trading Simulator destination by canUseSimulator; Home.jsx applies the same restriction to the card. SimulatorGate.jsx already separates anonymous, denied and authorized routes, and backend SimulatorAccess.java enforces verified Google aribecker2@gmail.com.

Always expose navigation and the Home card. Keep SimulatorGate and all backend permission checks; anonymous and denied users must never mount the simulator or issue protected reads/commands. Greet authenticated users and use the requested Spanish denial message. Logout and session expiry remove private data, not navigation. No identity or database changes.
