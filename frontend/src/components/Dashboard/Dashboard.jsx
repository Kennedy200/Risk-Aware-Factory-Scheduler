import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Database, Cpu, LogOut, Play, 
  Menu, ChevronLeft, ChevronRight, Zap, Server, 
  Activity, AlertTriangle, CheckCircle, Clock,
  BarChart3
} from 'lucide-react';
import UploadCSV from '../UploadCSV';
import { createSchedule } from '../../api';
import styles from './Dashboard.module.css';

const Dashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [plan, setPlan] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState(null);

  const menuItems = [
    { id: 'overview', label: 'Mission Control', icon: <LayoutDashboard size={22} /> },
    { id: 'resources', label: 'Resource Grid', icon: <Database size={22} /> },
    { id: 'tasks', label: 'Task Matrix', icon: <Cpu size={22} /> },
    { id: 'schedule', label: 'Schedule View', icon: <BarChart3 size={22} /> },
  ];

  const handleUploadComplete = (uploadedTasks) => {
    setTasks(uploadedTasks);
    setError(null);
  };

  const handleRunScheduler = async () => {
    if (tasks.length === 0) {
      setError('Please upload tasks first');
      return;
    }

    setIsScheduling(true);
    setError(null);

    try {
      const result = await createSchedule(tasks);
      setPlan(result);
      setActiveTab('schedule');
    } catch (err) {
      setError(err.message || 'Failed to generate schedule');
    } finally {
      setIsScheduling(false);
    }
  };

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
          
          <button 
            className={styles.primaryBtn}
            onClick={handleRunScheduler}
            disabled={isScheduling || tasks.length === 0}
          >
            {isScheduling ? (
              <><Clock size={18} className={styles.spin} /> Processing...</>
            ) : (
              <><Play size={18} fill="currentColor" /> Initialize GraphPlan</>
            )}
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
              {activeTab === 'overview' && (
                <OverviewPanel 
                  tasks={tasks}
                  plan={plan}
                  onUploadComplete={handleUploadComplete}
                />
              )}
              {activeTab === 'resources' && <ResourceGridPanel />}
              {activeTab === 'tasks' && <TaskMatrixPanel tasks={tasks} />}
              {activeTab === 'schedule' && <SchedulePanel plan={plan} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// --- 1. MISSION CONTROL ---
const OverviewPanel = ({ tasks, plan, onUploadComplete }) => (
  <div className={styles.panelContainer}>
    <div className={styles.statsGrid}>
      <StatCard 
        title="Total Tasks" 
        value={tasks.length || '--'} 
        sub={tasks.length > 0 ? 'Ready for Scheduling' : 'Awaiting Data Import'}
        icon={<Zap size={24} color="#f97316"/>} 
        delay={0.1} 
      />
      <StatCard 
        title="Schedule Waves" 
        value={plan?.waves?.length || '--'} 
        sub={plan ? 'GraphPlan Optimized' : 'Not Generated'}
        icon={<Server size={24} color="#3b82f6"/>} 
        delay={0.2} 
      />
      <StatCard 
        title="Risk Level" 
        value={plan ? `${(plan.avg_risk * 100).toFixed(0)}%` : '--'} 
        sub={plan ? (plan.avg_risk > 0.5 ? 'High - Review Required' : 'Acceptable Range') : 'Pending Analysis'}
        color={plan?.avg_risk > 0.5 ? '#ef4444' : '#22c55e'}
        icon={<Activity size={24} color={plan?.avg_risk > 0.5 ? '#ef4444' : '#22c55e'}/>} 
        delay={0.3} 
      />
    </div>

    <div className={styles.uploadSectionWrapper}>
      <div className={styles.sectionHeader}>
        <div className={styles.glowDot}></div>
        <h3>Data Ingestion Protocol</h3>
      </div>
      <UploadCSV onUploadComplete={onUploadComplete} />
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

// --- 3. TASK MATRIX ---
const TaskMatrixPanel = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Cpu size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <h3>No Tasks Loaded</h3>
        <p>Upload a CSV file in the Mission Control tab to populate the task matrix.</p>
      </div>
    );
  }

  return (
    <div className={styles.matrixContainer}>
      {tasks.map((task, i) => (
        <motion.div 
          key={task.task_id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={styles.taskCard}
        >
          <div className={styles.taskIcon}><Cpu size={24} /></div>
          <div className={styles.taskInfo}>
            <h4>Task {task.task_id}</h4>
            <div className={styles.taskMeta}>
              <span>Duration: {task.duration}min</span>
              <span><Clock size={12}/> Deadline: {task.deadline || 'None'}</span>
            </div>
          </div>
          <div className={styles.taskDependency}>
            <span>Resources</span>
            <strong>CPU:{task.resource_cpu} P:{task.resource_person}</strong>
          </div>
          <div className={styles.taskDependency}>
            <span>Prereq</span>
            <strong>{task.predecessors || '-'}</strong>
          </div>
          <div className={styles.taskStatus}>
            <CheckCircle size={20} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// --- 4. SCHEDULE VIEW ---
const SchedulePanel = ({ plan }) => {
  if (!plan) {
    return (
      <div className={styles.emptyState}>
        <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <h3>No Schedule Generated</h3>
        <p>Upload tasks and run the GraphPlan scheduler to see the schedule.</p>
      </div>
    );
  }

  return (
    <div className={styles.scheduleContainer}>
      <div className={styles.scheduleHeader}>
        <div>
          <h3>Schedule Plan: {plan.plan_id}</h3>
          <p>Generated: {new Date(plan.created_at).toLocaleString()}</p>
          <p>Total Makespan: {plan.total_makespan.toFixed(0)} minutes</p>
        </div>
      </div>

      <div className={styles.wavesContainer}>
        <h4>Execution Waves</h4>
        {plan.waves.map((wave, index) => (
          <motion.div 
            key={wave.wave_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={styles.waveCard}
          >
            <div className={styles.waveHeader}>
              <span className={styles.waveNumber}>Wave {wave.wave_id + 1}</span>
              <span className={styles.waveTime}>
                {wave.start_time.toFixed(0)} - {wave.end_time.toFixed(0)} min
              </span>
            </div>
            <div className={styles.waveTasks}>
              {wave.tasks.map(taskId => {
                const task = plan.tasks[taskId];
                const riskColor = task.risk_score > 0.7 ? '#ef4444' : task.risk_score > 0.4 ? '#f97316' : '#22c55e';
                return (
                  <div key={taskId} className={styles.waveTask} style={{ borderLeftColor: riskColor }}>
                    <span className={styles.taskName}>{taskId}</span>
                    <span className={styles.taskDuration}>{task.duration.toFixed(0)}min</span>
                    <span className={styles.taskRisk} style={{ color: riskColor }}>
                      {(task.risk_score * 100).toFixed(0)}% risk
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
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