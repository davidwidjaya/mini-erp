import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const UserLogs = ({ currentUser }) => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setLogs(JSON.parse(localStorage.getItem('userLogs') || '[]').reverse());
  }, []);

  return (
    <div className="glass-effect rounded-xl p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('userLogs')}</h3>
      
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {logs.map(log => (
          <motion.div
            key={log.id}
            className="p-3 bg-white rounded-lg border border-gray-200"
          >
            <p className="font-semibold text-sm">{log.userName}</p>
            <p className="text-xs text-gray-600">{log.action}</p>
            <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString('id-ID')}</p>
          </motion.div>
        ))}
        {logs.length === 0 && (
          <p className="text-gray-500 text-center py-8">No logs yet</p>
        )}
      </div>
    </div>
  );
};

export default UserLogs;