import React from 'react';
import { motion } from 'framer-motion';
import { Settings, FileText, Truck, Receipt, FolderOpen, Home, FilePlus, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Sidebar = ({ activeModule, setActiveModule, currentUser }) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'home', icon: Home, label: t('home'), permission: 'home' },
    { id: 'dataEntry', icon: FileText, label: t('dataEntry'), permission: 'dataEntry' },
    { id: 'generateDocs', icon: FilePlus, label: t('generateDocs'), permission: 'generateDocs' },
    { id: 'suratJalan', icon: Truck, label: t('suratJalan'), permission: 'suratJalan' },
    { id: 'invoiceOngkir', icon: Receipt, label: t('invoiceOngkir'), permission: 'invoiceOngkir' },
    { id: 'payment', icon: Wallet, label: 'Pembayaran', permission: 'payment' },
    { id: 'fileHistory', icon: FolderOpen, label: t('fileHistory'), permission: 'fileHistory' },
    { id: 'settings', icon: Settings, label: t('settings'), permission: 'settings' },
  ];

  const hasPermission = (moduleId) => {
    if (!currentUser || !currentUser.permissions) return false;
    // Owner/admin with full access might not have the object structure, but a simple flag.
    if (Array.isArray(currentUser.permissions) && currentUser.permissions.includes('all')) return true;
    
    // Check for new object-based permissions
    const userPermissions = currentUser.permissions[moduleId];
    // A user has access to a module if they have at least 'view' permission for it.
    return userPermissions && userPermissions.includes('view');
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 glass-effect border-r border-gray-200 flex flex-col"
    >
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Admin ERP
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) return null;
          
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left justify-start ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;