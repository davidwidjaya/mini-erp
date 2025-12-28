import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const FileHistory = ({ currentUser }) => {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    setInvoices(JSON.parse(localStorage.getItem('invoices') || '[]'));
  }, []);

  return (
    <div className="glass-effect rounded-xl p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('fileHistory')}</h3>
      
      <div className="space-y-2">
        {invoices.map(invoice => (
          <motion.div
            key={invoice.id}
            whileHover={{ scale: 1.01 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <p className="font-semibold">{invoice.noInvoice}</p>
            <p className="text-sm text-gray-600">{invoice.clientName}</p>
            <p className="text-xs text-gray-500">Created by: {invoice.createdBy}</p>
            <p className="text-xs text-gray-500">{new Date(invoice.createdAt).toLocaleString('id-ID')}</p>
          </motion.div>
        ))}
        {invoices.length === 0 && (
          <p className="text-gray-500 text-center py-8">No files yet</p>
        )}
      </div>
    </div>
  );
};

export default FileHistory;