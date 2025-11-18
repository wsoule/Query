import "./App.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./AppNew"; 
import { Toaster } from "./components/ui/sonner";

// Enable dark mode
document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
);
