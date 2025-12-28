import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Header = ({ currentUser, onLogout }) => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-effect border-b border-gray-200 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('welcome')}</h1>
          <p className="text-sm text-gray-600">{currentUser.name} - {currentUser.role}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-1 p-1 rounded-full bg-gray-200">
            <Button size="sm" onClick={() => setLanguage('en')} className={`rounded-full ${language === 'en' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}>EN</Button>
            <Button size="sm" onClick={() => setLanguage('id')} className={`rounded-full ${language === 'id' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}>ID</Button>
          </div>

          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-700">{currentUser.email}</span>
          </div>

          <Button
            variant="destructive"
            onClick={onLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('logout')}</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;