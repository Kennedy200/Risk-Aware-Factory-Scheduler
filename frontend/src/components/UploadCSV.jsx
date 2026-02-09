import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadCSV } from '../api';
import styles from './UploadCSV.module.css';

const UploadCSV = ({ onUploadComplete }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [errorMsg, setErrorMsg] = useState('');
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
        // Clear any previous error
        setStatus('idle');
        setErrorMsg('');
        
        // Check file extension
        const fileName = selectedFile.name.toLowerCase();
        if (!fileName.endsWith('.csv')) {
            setStatus('error');
            setErrorMsg('Invalid format. CSV required.');
            setFile(null);
            return;
        }
        
        // Valid file
        setFile(selectedFile);
    };

    const uploadFile = async () => {
        if (!file) return;
        setStatus('uploading');
        setErrorMsg('');

        try {
            const result = await uploadCSV(file);
            setStatus('success');
            if (onUploadComplete) onUploadComplete(result.tasks);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Upload failed. Please try again.');
            console.error('Upload failed:', err);
        }
    };

    const reset = () => {
        setFile(null);
        setStatus('idle');
        setErrorMsg('');
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
                        <button onClick={reset} className={styles.resetBtn}>
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
                                <div className={styles.supported}>Supported: .csv files</div>
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
                                        <button type="button" onClick={reset} className={styles.cancelBtn}>Cancel</button>
                                        <button type="button" onClick={uploadFile} className={styles.uploadBtn}>Upload to Core</button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {status === 'error' && errorMsg && (
                            <div className={styles.errorMsg}>
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UploadCSV;
