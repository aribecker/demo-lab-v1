# Chatbot experimental · 2.3.0

Branch: `prueba-chatbot-spring-ai`, based on iteration 2 commit `9b1104b`.
Specifications: `specs/chatbot.md` (R19–R22), committed before implementation.

Spring Boot 3.5.16 + Spring AI 1.1.8. General-purpose chat with model selector,
multi-turn context, new-conversation control, pending/error states, editable
Spanish dictation and optional speech synthesis. Browser support and microphone
permission determine voice availability. Typed input always works. Speech
recognition may send audio to the browser vendor's recognition service.

## Activate real responses

1. Create an OpenRouter account and API key at https://openrouter.ai/settings/keys.
2. In the **experimental service**, Render → Environment, add `OPENROUTER_API_KEY`.
   Keep it server-side; do not use a VITE variable or paste the key into chat.
3. Save and redeploy. `/api/chat/models` must report `configured: true`.
4. Open `/chatbot`, choose Automático or a specific free model, and send a message.

All selectable models are zero-cost text models from the live catalog; fallback is
`openrouter/free`. Provider quotas, availability and terms apply. No paid fallback.
No real LLM response has been verified without the owner's key.

## Deployment

`Chat-Dockerfile` builds and tests React, embeds its dist in Spring Boot and runs
one combined web service. `VITE_CHAT_API_URL=/` makes chat use the same origin.
Existing Weather and Login features keep their original API endpoints.
Use the experimental branch and Dockerfile; leave the iteration-2 services as-is.
No database required. Conversations are only in React memory and sent in each
request (20 messages, 4,000 characters each, 24,000 total); no server persistence.
Provider processing/privacy is disclosed before sending. Output is plain text.

## Validation

46 React tests: regression, selected model/history, reset, missing key, provider
error with draft recovery, dictation edit-before-send, synthesis and voice cleanup.
27 Java tests: regression plus real Spring AI serialization against a local HTTP
fixture, exact model/history, limits, role/model rejection, no-key and upstream errors.
Vite build and executable JAR package pass. Physical microphone and external model
consent/quota checks remain manual until key and browser permission are available.
