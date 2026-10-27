import React from 'react';

// Repository-owned drawings specified in specs/design-system.md (R49).
const drawings = {
  house: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,
  'cloud-sun': <><circle cx="8" cy="8" r="3"/><path d="M8 1v1M1 8h1M3 3l1 1M13 3l-1 1M4 17a4 4 0 0 1 4-4h1a5 5 0 0 1 9-1 4 4 0 1 1 0 8H8a4 4 0 0 1-4-3Z"/></>,
  'layout-grid': <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  'log-in': <path d="M14 3h6v18h-6M3 12h12m-5-5 5 5-5 5"/>,
  'contact-card': <><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M4 17a4 4 0 0 1 8 0M15 9h4m-4 4h4m-4 4h3"/></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/></>,
  'book-open': <path d="M12 5C9 3 5 3 2 4v16c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v16"/>,
  'message-circle': <><path d="M21 11a9 9 0 0 1-13 8l-5 2 1-5a9 9 0 1 1 17-5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></>,
  hand: <path d="M7 13V6a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-7a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7c0 4-2 7-6 7-3 0-5-2-7-4l-3-4a1.5 1.5 0 0 1 2-2l3 3"/>,
  bitcoin: <><circle cx="12" cy="12" r="10"/><path d="M8 7h6a2.5 2.5 0 0 1 0 5H9h6a2.5 2.5 0 0 1 0 5H8M10 7v10M11 5v2m3-2v2m-3 10v2m3-2v2"/></>,
  'chart-candlestick': <><path d="M3 3v18h18M9 4v3m0 8v3M17 3v8m0 6v2"/><rect x="7" y="7" width="4" height="8" rx=".5"/><rect x="15" y="11" width="4" height="6" rx=".5"/></>,
  'user-settings': <><circle cx="8" cy="6" r="3"/><path d="M2 21v-3a6 6 0 0 1 9-5M17 11l1 2 2-.2 1 2-1.2 1.6.2 2-2 1-1 1.6-2-1-2 .2-1-2 1.2-1.6-.2-2 2-1Z"/><circle cx="16.5" cy="16.5" r="1.5"/></>,
  'users-group': <><circle cx="12" cy="6" r="3"/><circle cx="4" cy="9" r="2"/><circle cx="20" cy="9" r="2"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M1 19v-2a4 4 0 0 1 4-4m18 6v-2a4 4 0 0 0-4-4"/></>,
};

export default function MenuIcon({name}) {
  return <svg className="app-shell__menu-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-icon={name}>{drawings[name]}</svg>;
}
