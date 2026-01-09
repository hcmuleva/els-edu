import { SafeArea } from "@capacitor-community/safe-area";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css"; // Math equation styles
import "./index.css";
import "./App.css";
import App from "./App.jsx";

// Initialize safe area plugin to handle status bar and home indicator insets
const initSafeArea = async () => {
  try {
    // This plugin can automatically set CSS variables: --safe-area-inset-top, etc.
    // However, it's safer to enable it explicitly or listen for changes.
    // For now, initializing it is enough as it injects the variables.
    await SafeArea.initialize();
  } catch (err) {
    console.warn("Safe area plugin initialization failed:", err);
  }
};

initSafeArea();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure there is a <div id='root'></div> in your HTML.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
