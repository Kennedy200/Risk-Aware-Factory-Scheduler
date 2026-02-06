import React, { useState } from "react";
import LandingPage from "./components/Landing/LandingPage";
// import Dashboard from "./components/Dashboard/Dashboard"; // We will rebuild Dashboard using the new components next
import styles from "./App.module.css";

function App() {
  const [view, setView] = useState("landing");

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh' }}>
      {view === "landing" ? (
        <LandingPage onStart={() => setView("dashboard")} />
      ) : (
        <div style={{color: 'white', padding: 50}}>
           <h1>Dashboard Under Construction</h1>
           <p>Integrating Backend Dev's WaveGantt & UploadCSV...</p>
           <button onClick={() => setView('landing')}>Back</button>
        </div>
      )}
    </div>
  );
}

export default App;