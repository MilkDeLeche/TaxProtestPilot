import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '../lib/utils';

export const DragDropZone = ({ onFileAccepted, acceptedFile }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileAccepted(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  }, [onFileAccepted]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileAccepted(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  }, [onFileAccepted]);

  const handleRemoveFile = () => {
    onFileAccepted(null);
  };

  return (
    <AnimatePresence mode="wait">
      {acceptedFile ? (
        <motion.div
          key="file-accepted"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 p-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{acceptedFile.name}</p>
                <p className="text-sm text-slate-500">
                  {(acceptedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              data-testid="remove-file-btn"
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="drop-zone"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: isDragging ? [1, 1.02, 1] : 1,
          }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.3,
            scale: isDragging ? { repeat: Infinity, duration: 2 } : { duration: 0.2 }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200",
            isDragging 
              ? "border-[#1e40af] bg-blue-50/80 scale-[1.02]" 
              : "border-slate-300 bg-slate-50/50 hover:border-[#1e40af]/50 hover:bg-blue-50/30"
          )}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
            data-testid="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <motion.div
              animate={isDragging ? { y: [0, -10, 0] } : { y: 0 }}
              transition={{ repeat: isDragging ? Infinity : 0, duration: 1 }}
              className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors",
                isDragging ? "bg-[#1e40af] text-white" : "bg-slate-200 text-slate-500"
              )}
            >
              {isDragging ? <DocumentTextIcon className="w-8 h-8" /> : <ArrowUpTrayIcon className="w-8 h-8" />}
            </motion.div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {isDragging ? 'Drop your file here' : 'Drag & Drop CSV File'}
            </h3>
            <p className="text-slate-500 mb-4">
              or click to browse from your computer
            </p>
            <p className="text-xs text-slate-400">
              Supports: .csv files only
            </p>
          </label>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
