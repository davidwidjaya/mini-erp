import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import Sidebar from '@/components/dashboard/Sidebar';
    import Header from '@/components/dashboard/Header';
    import SettingsModule from '@/components/modules/SettingsModule';
    import DataEntryModule from '@/components/modules/DataEntryModule';
    import SuratJalanModule from '@/components/modules/SuratJalanModule';
    import InvoiceOngkirModule from '@/components/modules/InvoiceOngkirModule';
    import FileHistoryModule from '@/components/modules/FileHistoryModule';
    import DashboardHome from '@/components/dashboard/DashboardHome';
    import GenerateDocsModule from '@/components/modules/GenerateDocsModule';
    import PaymentModule from '@/components/modules/PaymentModule';

    const Dashboard = ({ currentUser, onLogout }) => {
      const [activeModule, setActiveModule] = useState('home');

      const renderModule = () => {
        switch (activeModule) {
          case 'home':
            return <DashboardHome currentUser={currentUser} />;
          case 'settings':
            return <SettingsModule currentUser={currentUser} />;
          case 'dataEntry':
            return <DataEntryModule currentUser={currentUser} />;
          case 'generateDocs':
            return <GenerateDocsModule currentUser={currentUser} />;
          case 'suratJalan':
            return <SuratJalanModule currentUser={currentUser} />;
          case 'invoiceOngkir':
            return <InvoiceOngkirModule currentUser={currentUser} />;
          case 'payment':
            return <PaymentModule currentUser={currentUser} />;
          case 'fileHistory':
            return <FileHistoryModule currentUser={currentUser} />;
          default:
            return <DashboardHome currentUser={currentUser} />;
        }
      };

      return (
        <div className="min-h-screen flex bg-gray-50">
          <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} currentUser={currentUser} />
          
          <div className="flex-1 flex flex-col">
            <Header currentUser={currentUser} onLogout={onLogout} />
            
            <main className="flex-1 p-6 overflow-auto">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderModule()}
              </motion.div>
            </main>
          </div>
        </div>
      );
    };

    export default Dashboard;