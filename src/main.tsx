import "./App.css";
import React from "react";
import ReactDOM from "react-dom/client";
// import App from "./App"; // Old app
// import App from "./AppDemo"; // New Railway-style demo
import App from "./AppNew"; // Full featured Railway-style app
import { Toaster } from "./components/ui/sonner";

// Enable dark mode
document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
);
