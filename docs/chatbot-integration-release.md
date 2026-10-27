# Unified Spring AI chatbot v2.8.0

## Specification-led integration
Source chatbot R19–R22 is reconciled into master R37 before grounding and regeneration. Add /chatbot to the unified menu, Home and static routes; serve /api/chat/models and /api/chat in the existing Java API using Spring AI 1.1.8. No ordinary Git merge or combined-app deployment controller is introduced.

## Behavior and isolation
Free text models are selected from OpenRouter's server-side catalog, with an automatic free router fallback only. Server validates role order, model, bounded context and input sizes, caps output and serializes upstream requests. Errors are generic, prompts and provider keys are not logged. The key remains in OPENROUTER_API_KEY on the backend; missing credentials produce honest pending status/503, never a fake reply. Source service was checked and configured=false.

React retains session-only history, model selection/new conversation, plain text responses, optional es-AR speech recognition and synthesis, editable dictation and voice cleanup. Backend-origin transport is scoped to this environment, uses no-store, bounded timeouts and a retry for catalog startup errors. Conversations leave the browser only for the explicitly submitted model request; voice recognition may use the browser vendor. Login/People/trading state and database configuration are unchanged.

## Requested branch cleanup
Deleted temp-hello-world-2-20261023 (Hello World 2 and 3) through the authenticated GitHub UI. Connector search independently returned no branch. The unified branch and its original Hello World feature remain intact. The old Render static service was not deleted, because the request named the branch only.

A local screenshot recorded the UI deletion. Automatic approval review rejected publishing that screenshot to the repository as an unnecessary external disclosure; it is omitted from repository artifacts.

## Limits and timing
Real LLM response verification requires an owner-provided OpenRouter API key; physical microphone testing requires a supported browser and permission. No paid model fallback, paid hosting change, new service or database is added. Measure all work from 2026-10-24T18:21:04Z through verified live-link delivery, including cleanup, SDD, tests and deployment.
