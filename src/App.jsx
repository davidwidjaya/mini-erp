
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPage from '@/pages/LoginPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';
import Dashboard from '@/pages/Dashboard';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, isAuthenticated, loading, signOut, passwordRecoveryMode } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Connecting to System...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <Helmet>
        <title>Distribution Admin System - Professional ERP Dashboard</title>
        <meta name="description" content="Advanced web-based distribution administration system with multi-user access, document generation, and comprehensive reporting" />
      </Helmet>
      
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginPage />
          </motion.div>
        ) : passwordRecoveryMode ? (
          <motion.div
            key="update-password"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <UpdatePasswordPage />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard currentUser={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <Toaster />
    </LanguageProvider>
  );
}

export default App;
