import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./styles/base.css";
import "./styles/scenes.css";

document.body.classList.add("boot-lock");

createRoot(document.getElementById("root")).render(<App />);
