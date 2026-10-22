# Experimental chatbot — R19–R22

Branch from committed iteration 2; do not replace its running services.

- R19: Add /chatbot to the router, navigation and Home. General-purpose multi-turn text chat, model selector, pending/error states, reset, and compact mobile layout.
- R20: Use Spring AI 1.1.x with Boot 3.5. Obtain the current OpenRouter free text model catalog server-side; always offer openrouter/free. Reject models outside that catalog, with no paid fallback. No fabricated replies when credentials are absent.
- R21: Optional speech recognition (Spanish Argentina), editable transcript before Send, visible unsupported/permission errors; optional browser speech synthesis and stop. Stop recognition/synthesis on unmount. Typed chat always remains available.
- R22: Keep provider API key server-side. Bound history (20 messages, 4,000 chars each, 24,000 total), cap output, one active upstream request at a time, bounded timeout, generic upstream errors. No prompt logging or server-side transcript persistence. Render assistant output as plain text.

Architecture: React keeps history in component memory → POST /api/chat → validated model catalog → Spring AI OpenAiChatModel → OpenRouter. GET /api/chat/models returns configuration status and zero-cost text models (5-minute cache; automatic free router fallback). A new model starts a new conversation. No login dependency while OAuth registrations remain pending.

Acceptance: mock upstream validates actual Spring AI request/history/model and response normalization; invalid roles/models/oversized history rejected; absent key returns 503; upstream failure is sanitized; regression suites/build pass. Speech uses feature detection and mock lifecycle tests; physical microphone testing requires a supported browser and user permission. External LLM integration requires OPENROUTER_API_KEY.
