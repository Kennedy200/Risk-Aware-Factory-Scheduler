import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import styles from './UploadCSV.module.css';

const UploadCSV = ({ onUploadComplete }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
            setStatus('error');
            return;
        }
        setFile(selectedFile);
        setStatus('idle');
    };

    const uploadFile = async () => {
        if (!file) return;
        setStatus('uploading');

        // Simulate API call for UI testing (Replace with real API later)
        setTimeout(() => {
            setStatus('success');
            if (onUploadComplete) onUploadComplete(file);
        }, 1500);
        
        // REAL API CODE (Uncomment when backend is ready):
        /*
        try {
            await api.uploadTasks(file);
            setStatus('success');
            onUploadComplete();
        } catch (err) {
            setStatus('error');
        }
        */
    };

    return (
        <div className={styles.container}>
            <AnimatePresence>
                {status === 'success' ? (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={styles.successState}
                    >
                        <CheckCircle size={50} className={styles.iconSuccess} />
                        <h3>Data Ingested</h3>
                        <p>GraphPlan Engine is ready to process.</p>
                        <button onClick={() => { setFile(null); setStatus('idle'); }} className={styles.resetBtn}>
                            Upload New Dataset
                        </button>
                    </motion.div>
                ) : (
                    <motion.form 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`${styles.uploadBox} ${dragActive ? styles.active : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <input 
                            ref={inputRef}
                            type="file" 
                            accept=".csv"
                            onChange={handleChange} 
                            className={styles.hiddenInput} 
                        />
                        
                        {!file ? (
                            <div className={styles.placeholder} onClick={() => inputRef.current.click()}>
                                <div className={styles.iconWrapper}>
                                    <UploadCloud size={40} />
                                </div>
                                <h3>Initialize Data Stream</h3>
                                <p>Drag & Drop CSV or <span>Click to Browse</span></p>
                                <div className={styles.supported}>Supported: factory_tasks.csv</div>
                            </div>
                        ) : (
                            <div className={styles.fileSelected}>
                                <FileText size={40} className={styles.fileIcon} />
                                <div className={styles.fileInfo}>
                                    <span className={styles.fileName}>{file.name}</span>
                                    <span className={styles.fileSize}>{(file.size / 1024).toFixed(2)} KB</span>
                                </div>
                                
                                {status === 'uploading' ? (
                                    <div className={styles.loading}>
                                        <Loader2 className={styles.spinner} /> Processing...
                                    </div>
                                ) : (
                                    <div className={styles.actions}>
                                        <button onClick={() => setFile(null)} className={styles.cancelBtn}>Cancel</button>
                                        <button onClick={uploadFile} className={styles.uploadBtn}>Upload to Core</button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {status === 'error' && (
                            <div className={styles.errorMsg}>
                                <AlertCircle size={16} /> Invalid format. CSV required.
                            </div>
                        )}
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UploadCSV;