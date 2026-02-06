import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Database, 
  Cpu, 
  Settings, 
  LogOut, 
  PlusCircle,
  Play
} from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'resources', label: 'Resources', icon: <Database size={20} /> },
    { id: 'tasks', label: 'Tasks', icon: <Cpu size={20} /> },
  ];

  return (
    <div className={styles.dashboardLayout}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>CORE<span>PLAN</span></div>
        
        <nav className={styles.navMenu}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={onBack}>
            <LogOut size={20} /> <span>Exit System</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={styles.content}>
        <header className={styles.contentHeader}>
          <div>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p>Project: Risk-Aware Factory v1.0</p>
          </div>
          <div className={styles.actionHeader}>
            <button className={styles.primaryBtn}>
              <Play size={18} fill="currentColor" /> Run AI Scheduler
            </button>
          </div>
        </header>

        <section className={styles.mainCanvas}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <OverviewPlaceholder />}
              {activeTab === 'resources' && <div className={styles.placeholder}>Resource Management Form coming...</div>}
              {activeTab === 'tasks' && <div className={styles.placeholder}>Task Definition Logic coming...</div>}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

// Sub-component for a cleaner look
const OverviewPlaceholder = () => (
  <div className={styles.statsGrid}>
    <div className={styles.statCard}>
      <h4>Total Waves</h4>
      <h2>--</h2>
      <p>Calculated by GraphPlan</p>
    </div>
    <div className={styles.statCard}>
      <h4>Resources Logged</h4>
      <h2>0</h2>
      <p>Hardware/Software/Human</p>
    </div>
    <div className={styles.statCard}>
      <h4>Risk Factor</h4>
      <h2 style={{ color: '#2ecc71' }}>Low</h2>
      <p>Heuristic Analysis</p>
    </div>
  </div>
);

export default Dashboard;