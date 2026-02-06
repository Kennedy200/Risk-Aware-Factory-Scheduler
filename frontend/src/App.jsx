import React, { useState } from "react";
import LandingPage from "./components/Landing/LandingPage";
import Dashboard from "./components/Dashboard/Dashboard"; // Import the real Dashboard
import styles from "./App.module.css"; // Ensure this exists (we created it earlier)

function App() {
  const [view, setView] = useState("landing");

  return (
    <div className={styles.wrapper}>
      {view === "landing" ? (
        <LandingPage onStart={() => setView("dashboard")} />
      ) : (
        <Dashboard onBack={() => setView("landing")} />
      )}
    </div>
  );
}

export default App;