# Database theme grounding

The Database stylesheet uses light backgrounds (#fff, #f6f8fa and #f8fafb), while the application root sets a light foreground and dark color scheme. This creates poor text contrast and a visual mismatch.

Existing styles.css/people.css/chatbot.css establish dark gradient panels (#142b3a to #102331), bright text (#edf6fc), secondary text (#a4b9c8 / #c4d8e4), cyan accents (#9ae6ef / #b4f3fc), dark controls (#234d61) and visible blue borders. Apply this palette within database.css only. Use a deeper dark surface for expanded column values and explicit light text for preformatted cells. Keep the existing disclosure markup/handlers, API client and backend unchanged. Increase plus/minus controls to the application's44px control size and retain focus outlines.

Validate the production build and existing Database/routing tests; measure representative text and control contrast pairs and visually inspect the deployed expanded table/row. Bump the frontend patch version only. Deploy only the frontend through its existing connector configuration; no secret or database operation is needed.
