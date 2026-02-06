import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Database, BrainCircuit, ShieldAlert } from 'lucide-react';
import GraphBackground from './GraphBackground';
import styles from './Landing.module.css';

const LandingPage = ({ onStart, onViewArch }) => {
  return (
    <div className={styles.wrapper}>
      {/* 1. The D3 Animation Layer (Floating Neural Network) */}
      <GraphBackground />

      <div className={styles.contentContainer}>
        {/* 2. Navigation Header */}
        <nav className={styles.nav}>
          <div className={styles.logo}>CORE<span>PLAN</span>.AI</div>
          <button className={styles.loginBtn}>Access Node</button>
        </nav>

        {/* 3. Hero Section */}
        <header className={styles.hero}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className={styles.badge}>System Status: Online</div>
            <h1>Autonomous <br /> Factory Scheduler</h1>
            <p>
              Harness the power of <strong>GraphPlan Algorithms</strong> and 
              <strong> Machine Learning</strong> to resolve mutex conflicts 
              and optimize industrial makespans in real-time.
            </p>

            <div className={styles.ctaGroup}>
              {/* Primary Action: Dashboard */}
              <button onClick={onStart} className={styles.primaryBtn}>
                Initialize System <ChevronRight size={20} />
              </button>
              
              {/* Secondary Action: Architecture View */}
              <button onClick={onViewArch} className={styles.secondaryBtn}>
                View Architecture
              </button>
            </div>
          </motion.div>
        </header>

        {/* 4. Feature Cards (Glassmorphism & D3 Reactive) */}
        <section className={styles.features}>
          <FeatureCard 
            icon={<BrainCircuit size={40} color="#3b82f6" />}
            title="GraphPlan Engine"
            desc="Symbolic AI that iteratively expands state levels to find the optimal parallel execution path."
          />
          <FeatureCard 
            icon={<ShieldAlert size={40} color="#f97316" />}
            title="Risk Prediction"
            desc="Integrated ML models analyze historical data to flag high-risk tasks before they fail."
          />
          <FeatureCard 
            icon={<Database size={40} color="#22c55e" />}
            title="Resource Mutex"
            desc="Hard-constraint logic ensures no two tasks fight for the same robot or station."
          />
        </section>
      </div>
    </div>
  );
};

/**
 * Reusable Animated Feature Card
 */
const FeatureCard = ({ icon, title, desc }) => (
  <motion.div 
    whileHover={{ 
        scale: 1.05, 
        backgroundColor: "rgba(30, 41, 59, 0.6)",
        borderColor: "rgba(59, 130, 246, 0.5)"
    }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={styles.card}
  >
    <div className={styles.cardIcon}>{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </motion.div>
);

export default LandingPage;