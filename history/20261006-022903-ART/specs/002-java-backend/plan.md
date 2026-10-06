# Implementation plan — Version 0.0.6

1. Archive the previous spec, plan and tasks under a timestamped history directory.
2. Set APP_VERSION and the Maven/Docker artifact to 0.0.6.
3. Translate all active frontend copy, statuses, date formatting, API success/error messages and forecast descriptions into English. Set the HTML language to en. Keep Buenos Aires as the location and timezone.
4. Preserve the half-size title, fixed result slots, animated skeletons, accessibility and reduced-motion support from version 005.
5. Update deterministic Java HTTP tests for the exact English message, version and forecast description. Check frontend JavaScript syntax.
6. Commit specifications, source and documentation together to java-fuentes using a guarded branch update. Let Render Auto-Deploy build and activate the commit.
7. Verify the deployed English UI, a real weather response and unchanged result/card/button geometry during another request.

The primary workspace is /workspace/sites/ssd-full-stack-java. Source files are stored individually in GitHub. Existing historical files retain their original language and version for auditability.
