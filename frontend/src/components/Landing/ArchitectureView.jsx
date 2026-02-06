import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Database, Server, Layout, 
  BrainCircuit, GitBranch, Terminal, ShieldCheck 
} from 'lucide-react';
import styles from './Architecture.module.css';

const ArchitectureView = ({ onBack }) => {
  return (
    <div className={styles.container}>
      {/* NAVIGATION */}
      <nav className={styles.nav}>
        <button onClick={onBack} className={styles.backBtn}>
          <ArrowLeft size={18} /> Return to Node
        </button>
        <div className={styles.logo}>SYSTEM <span>BLUEPRINT</span></div>
      </nav>

      {/* HEADER */}
      <header className={styles.header}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>System <span className={styles.gradientText}>Architecture</span></h1>
          <p>
            A high-level overview of the Neuro-Symbolic Hybrid engine powering CorePlan.
            Combining Classical Planning (GraphPlan) with Predictive ML.
          </p>
        </motion.div>
      </header>

      {/* SECTION 1: INTERACTIVE ARCHITECTURE DIAGRAM */}
      <section className={styles.diagramSection}>
        <h2 className={styles.sectionTitle}><GitBranch className={styles.icon} /> Data Flow Pipeline</h2>
        
        <div className={styles.pipelineGrid}>
          {/* Frontend Node */}
          <Node 
            icon={<Layout size={30} />} 
            title="React Frontend" 
            desc="Visualizes Waves & GANTT" 
            delay={0.1} 
          />
          
          <Arrow />

          {/* API Node */}
          <Node 
            icon={<Server size={30} />} 
            title="FastAPI Core" 
            desc="Request Orchestration" 
            delay={0.3} 
            color="#f97316"
          />

          <Arrow />

          {/* The Brain (Hybrid) */}
          <motion.div 
            className={styles.hybridCore}
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <div className={styles.coreLabel}>HYBRID ENGINE</div>
            <div className={styles.splitBrain}>
              <div className={styles.brainLeft}>
                <BrainCircuit size={24} />
                <span>GraphPlan</span>
                <small>Logic & Mutex</small>
              </div>
              <div className={styles.brainRight}>
                <ShieldCheck size={24} />
                <span>ML Model</span>
                <small>Risk Prediction</small>
              </div>
            </div>
          </motion.div>

          <Arrow />

          {/* Database Node */}
          <Node 
            icon={<Database size={30} />} 
            title="SQLite / Vector DB" 
            desc="Persistence Layer" 
            delay={0.7} 
          />
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS (Step by Step) */}
      <section className={styles.workflowSection}>
        <h2 className={styles.sectionTitle}>Processing Logic</h2>
        <div className={styles.steps}>
          <Step 
            num="01" 
            title="Ingestion & Parsing" 
            text="User uploads CSV. The system parses tasks, dependencies, and resource requirements into a generic state object."
          />
          <Step 
            num="02" 
            title="ML Heuristic Injection" 
            text="Before planning, the Random Forest model analyzes task complexity and historical data to append a 'Risk Score' to each action."
          />
          <Step 
            num="03" 
            title="Graph Expansion" 
            text="The Planner generates levels (State -> Action -> State). It detects Mutexes (Interference, Competing Needs) and prunes invalid paths."
          />
          <Step 
            num="04" 
            title="Backward Search extraction" 
            text="Once the goal state appears in the graph without mutexes, the engine recursively backtracks to find the optimal 'Wave' schedule."
          />
        </div>
      </section>

      {/* SECTION 3: THE CODE VAULT */}
      <section className={styles.codeSection}>
        <h2 className={styles.sectionTitle}><Terminal className={styles.icon} /> Core Algorithm Snippet</h2>
        <motion.div 
          className={styles.terminalWindow}
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
        >
          <div className={styles.terminalHeader}>
            <div className={styles.dots}>
              <span className={styles.dotRed}></span>
              <span className={styles.dotYellow}></span>
              <span className={styles.dotGreen}></span>
            </div>
            <span>core/planner.py</span>
          </div>
          <div className={styles.codeBlock}>
            <pre>
{`def expand_graph(self, level):
    """
    Expands the Planning Graph by one level (Action Layer + State Layer).
    Checks for Mutex (Mutual Exclusion) constraints.
    """
    current_state = self.levels[level]
    next_state = set(current_state)
    actions = []

    # 1. Identify Applicable Actions
    for action in self.all_actions:
        if action.preconditions.issubset(current_state):
            actions.append(action)

    # 2. Mutex Detection (Resource Contention)
    for a1 in actions:
        for a2 in actions:
            if a1 != a2 and self.has_resource_conflict(a1, a2):
                self.add_mutex(a1, a2, level)

    # 3. Apply Effects
    for action in actions:
        next_state.update(action.effects)
    
    return next_state`}
            </pre>
          </div>
        </motion.div>
      </section>
      
      <footer className={styles.footer}>
        <p>CorePlan Architecture v1.0 // Build 2024.10.05</p>
      </footer>
    </div>
  );
};

// --- Sub-components for Animations ---

const Node = ({ icon, title, desc, delay, color }) => (
  <motion.div 
    className={styles.node}
    initial={{ opacity: 0, scale: 0.5 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring' }}
    style={{ borderColor: color || 'rgba(59, 130, 246, 0.3)' }}
  >
    <div className={styles.nodeIcon} style={{ color: color || '#3b82f6' }}>{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </motion.div>
);

const Arrow = () => (
  <motion.div 
    className={styles.arrow}
    initial={{ width: 0 }}
    whileInView={{ width: 50 }}
    transition={{ duration: 0.5 }}
  />
);

const Step = ({ num, title, text }) => (
  <motion.div 
    className={styles.stepCard}
    initial={{ x: -50, opacity: 0 }}
    whileInView={{ x: 0, opacity: 1 }}
    viewport={{ once: true }}
  >
    <div className={styles.stepNum}>{num}</div>
    <div className={styles.stepContent}>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  </motion.div>
);

export default ArchitectureView;