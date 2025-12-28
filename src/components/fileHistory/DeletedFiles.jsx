import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const DeletedFiles = ({ currentUser }) => {
  const { t } = useLanguage();
  const [deletedFiles, setDeletedFiles] = useState([]);

  useEffect(() => {
    setDeletedFiles(JSON.parse(localStorage.getItem('deletedFiles') || '[]').reverse());
  }, []);

  return (
    <div className="glass-effect rounded-xl p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('deletedFiles')}</h3>
      
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {deletedFiles.map(file => (
          <motion.div
            key={file.id}
            className="p-4 bg-red-50 rounded-lg border border-red-200"
          >
            <p className="font-semibold">{file.fileName}</p>
            <p className="text-sm text-gray-600">Deleted by: {file.deletedBy}</p>
            <p className="text-xs text-gray-500">On: {new Date(file.deletedAt).toLocaleString('id-ID')}</p>
            <p className="text-sm text-gray-700 mt-2 p-2 bg-red-100 rounded">Reason: {file.reason}</p>
          </motion.div>
        ))}
        {deletedFiles.length === 0 && (
          <p className="text-gray-500 text-center py-8">No deleted files</p>
        )}
      </div>
    </div>
  );
};

export default DeletedFiles;