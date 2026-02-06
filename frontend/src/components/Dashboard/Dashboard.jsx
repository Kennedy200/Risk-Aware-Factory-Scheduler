import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Database, Cpu, LogOut, Play, 
  Menu, ChevronLeft, ChevronRight, Zap, Server, 
  Activity, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import UploadCSV from '../UploadCSV';
import styles from './Dashboard.module.css';

const Dashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Mission Control', icon: <LayoutDashboard size={22} /> },
    { id: 'resources', label: 'Resource Grid', icon: <Database size={22} /> },
    { id: 'tasks', label: 'Task Matrix', icon: <Cpu size={22} /> },
  ];

  return (
    <div className={styles.dashboardLayout}>
      {/* --- COLLAPSIBLE SIDEBAR --- */}
      <motion.aside 
        animate={{ width: collapsed ? 80 : 280 }}
        className={styles.sidebar}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            {collapsed ? <span style={{color:'#f97316'}}>CP</span> : <>CORE<span>PLAN</span></>}
          </div>
        </div>
        
        <nav className={styles.navMenu}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
              title={collapsed ? item.label : ''}
            >
              {activeTab === item.id && (
                <motion.div layoutId="activeTab" className={styles.activeBg} />
              )}
              <div className={styles.navContent} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </div>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          
          <div className={`${styles.userSection} ${collapsed ? styles.hidden : ''}`}>
             <button className={styles.logoutBtn} onClick={onBack}>
                <LogOut size={18} /> <span>Disconnect</span>
             </button>
          </div>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT --- */}
      <main className={styles.content} style={{ marginLeft: collapsed ? 80 : 280 }}>
        <header className={styles.contentHeader}>
          <div className={styles.headerTitle}>
            <motion.h1 
              key={activeTab}
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
            >
              {menuItems.find(i => i.id === activeTab).label}
            </motion.h1>
            <p className={styles.breadCrumb}>System Ready // Node: Alpha-1</p>
          </div>
          
          <button className={styles.primaryBtn}>
            <Play size={18} fill="currentColor" /> 
            <span>Initialize GraphPlan</span>
          </button>
        </header>

        <div className={styles.canvasContainer}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%' }}
            >
              {activeTab === 'overview' && <OverviewPanel />}
              {activeTab === 'resources' && <ResourceGridPanel />}
              {activeTab === 'tasks' && <TaskMatrixPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// --- 1. MISSION CONTROL ---
const OverviewPanel = () => (
  <div className={styles.panelContainer}>
    <div className={styles.statsGrid}>
      <StatCard title="Total Waves" value="--" sub="Awaiting AI Calculation" icon={<Zap size={24} color="#f97316"/>} delay={0.1} />
      <StatCard title="Active Resources" value="0/5" sub="System Idle" icon={<Server size={24} color="#3b82f6"/>} delay={0.2} />
      <StatCard title="Risk Probability" value="0%" sub="Heuristic Analysis" color="#22c55e" icon={<Activity size={24} color="#22c55e"/>} delay={0.3} />
    </div>

    <div className={styles.uploadSectionWrapper}>
      <div className={styles.sectionHeader}>
        <div className={styles.glowDot}></div>
        <h3>Data Ingestion Protocol</h3>
      </div>
      <UploadCSV onUploadComplete={(f) => console.log("Uploaded", f)} />
    </div>
  </div>
);

// --- 2. RESOURCE GRID (New & Sleek) ---
const ResourceGridPanel = () => {
  const resources = [
    { id: 1, name: 'Robotic Arm A1', type: 'Hardware', status: 'Idle', load: 0 },
    { id: 2, name: 'Welding Unit X', type: 'Hardware', status: 'Idle', load: 0 },
    { id: 3, name: 'QA Engineer', type: 'Human', status: 'Available', load: 0 },
  ];

  return (
    <div className={styles.gridPanel}>
      <div className={styles.tableHeader}>
        <span>ID</span>
        <span>RESOURCE NAME</span>
        <span>TYPE</span>
        <span>STATUS</span>
        <span>LOAD</span>
      </div>
      <div className={styles.tableBody}>
        {resources.map((res, i) => (
          <motion.div 
            key={res.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={styles.tableRow}
          >
            <span className={styles.colId}>#{res.id}</span>
            <span className={styles.colName}>{res.name}</span>
            <span className={styles.colType}><span className={styles.tag}>{res.type}</span></span>
            <span className={styles.colStatus}>
              <span className={styles.statusDot}></span> {res.status}
            </span>
            <span className={styles.colLoad}>
              <div className={styles.progressBar}><div style={{width: `${res.load}%`}}></div></div>
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- 3. TASK MATRIX (Animated) ---
const TaskMatrixPanel = () => {
  const tasks = [
    { id: 'T-101', name: 'Chassis Assembly', depends: '-', dur: '2h' },
    { id: 'T-102', name: 'Circuit Solder', depends: 'T-101', dur: '1.5h' },
    { id: 'T-103', name: 'Firmware Flash', depends: 'T-102', dur: '0.5h' },
  ];

  return (
    <div className={styles.matrixContainer}>
      {tasks.map((task, i) => (
        <motion.div 
          key={task.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.15 }}
          className={styles.taskCard}
        >
          <div className={styles.taskIcon}><Cpu size={24} /></div>
          <div className={styles.taskInfo}>
            <h4>{task.name}</h4>
            <div className={styles.taskMeta}>
              <span>ID: {task.id}</span>
              <span><Clock size={12}/> {task.dur}</span>
            </div>
          </div>
          <div className={styles.taskDependency}>
            <span>Prereq</span>
            <strong>{task.depends}</strong>
          </div>
          <div className={styles.taskStatus}>
            <CheckCircle size={20} />
          </div>
        </motion.div>
      ))}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={styles.addMoreRow}
      >
        <span>+ Awaiting Data Import to Populate Matrix</span>
      </motion.div>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const StatCard = ({ title, value, sub, color, icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay }}
    className={styles.statCard}
  >
    <div className={styles.cardHeader}>
      <span>{title}</span>
      {icon}
    </div>
    <h2 style={{ color: color || '#f8fafc' }}>{value}</h2>
    <p>{sub}</p>
  </motion.div>
);

export default Dashboard;