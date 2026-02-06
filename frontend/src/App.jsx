import React, { useState } from "react";
import LandingPage from "./components/Landing/LandingPage";
import Dashboard from "./components/Dashboard/Dashboard";
import ArchitectureView from "./components/Landing/ArchitectureView"; // Import new file
import styles from "./App.module.css";

function App() {
  const [view, setView] = useState("landing"); // 'landing', 'dashboard', 'arch'

  return (
    <div className={styles.wrapper}>
      {view === "landing" && (
        <LandingPage 
            onStart={() => setView("dashboard")} 
            onViewArch={() => setView("arch")} // Pass this prop to Landing
        />
      )}
      
      {view === "dashboard" && (
        <Dashboard onBack={() => setView("landing")} />
      )}

      {view === "arch" && (
        <ArchitectureView onBack={() => setView("landing")} />
      )}
    </div>
  );
}

export default App;