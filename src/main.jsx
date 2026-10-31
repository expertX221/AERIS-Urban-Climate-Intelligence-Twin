import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";

// A new deployment can replace lazy chunk filenames while a page is open.
// Retry once; the scene boundary preserves the semantic app if loading still fails.
window.addEventListener("vite:preloadError", (event) => {
  try {
    const last = Number(sessionStorage.getItem("aeris-preload-retry") || 0);
    if (Date.now() - last > 15000) {
      sessionStorage.setItem("aeris-preload-retry", String(Date.now()));
      event.preventDefault();
      location.reload();
    }
  } catch {
    /* The scene boundary handles unavailable storage or network. */
  }
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
