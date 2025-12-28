import React, { useState } from 'react';
    import { useLanguage } from '@/contexts/LanguageContext';
    import { cn } from '@/lib/utils';
    import { Button } from '@/components/ui/button';
    import { Library, Trash, Users, FileText } from 'lucide-react';
    import FileHistory from '@/components/fileHistory/FileHistory';
    import DeletedFiles from '@/components/fileHistory/DeletedFiles';
    import UserLogs from '@/components/fileHistory/UserLogs';
    import MonthlyReport from '@/components/fileHistory/MonthlyReport';
    import InvoiceList from '@/components/fileHistory/InvoiceList';

    const FileHistoryModule = ({ currentUser }) => {
      const { t } = useLanguage();
      const [activeTab, setActiveTab] = useState('history');

      const historyTabs = [
        { key: 'invoiceList', label: 'List Invoice', component: <InvoiceList currentUser={currentUser} />, icon: FileText },
        { key: 'history', label: t('fileHistory'), component: <FileHistory currentUser={currentUser} />, icon: Library },
        { key: 'report', label: t('monthlyReport'), component: <MonthlyReport currentUser={currentUser} />, icon: FileText },
        { key: 'deleted', label: t('deletedFiles'), component: <DeletedFiles currentUser={currentUser} />, icon: Trash },
        { key: 'logs', label: t('userLogs'), component: <UserLogs currentUser={currentUser} />, icon: Users },
      ];

      const ActiveComponent = historyTabs.find(tab => tab.key === activeTab)?.component;

      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{t('fileHistoryModule')}</h2>
            <p className="text-gray-600 mt-2">{t('fileHistorySubtitle')}</p>
          </div>

          <div className="w-full">
            <div className="mb-4 overflow-x-auto pb-2">
                <div className="flex space-x-2 border-b">
                {historyTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                    <Button
                        key={tab.key}
                        variant="ghost"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                        'flex-shrink-0 justify-start h-auto px-4 py-3 rounded-none border-b-2',
                        activeTab === tab.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        )}
                    >
                        <Icon className="mr-2 h-5 w-5" />
                        <span className="font-semibold">{tab.label}</span>
                    </Button>
                    );
                })}
                </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-inner min-h-[400px]">
                {ActiveComponent}
            </div>
          </div>
        </div>
      );
    };

    export default FileHistoryModule;