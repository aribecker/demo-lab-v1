# Database panel contrast correction

The Database explorer now uses the application's existing dark blue panel surfaces, light foregrounds and cyan accents. Expanded values have a deeper dark surface with explicit light text. Buttons match the shared44px control style and include visible hover, expanded, disabled and keyboard-focus states. This is a frontend-only CSS correction; explorer interactions and backend behavior are unchanged.

The production build and16 existing Database/routing tests passed. Representative measured contrast ratios: panel text13.36:1, secondary text8.28:1, column values16:1, button text7.84:1 and expanded-button text6.37:1. These are palette-pair measurements rather than a full accessibility audit.
