import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileCheck2, Hourglass, Truck, List, Trash2, Lock } from 'lucide-react';
import OutbondInput from '@/components/payment/OutbondInput';
import UnpaidInvoices from '@/components/payment/UnpaidInvoices';
import PaidInvoices from '@/components/payment/PaidInvoices';
import InvoiceValidationList from '@/components/payment/InvoiceValidationList';
import DeletedInvoices from '@/components/payment/DeletedInvoices';

const PaymentModule = ({ currentUser }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('');
    const [key, setKey] = useState(Date.now());

    const refreshData = () => {
        setKey(Date.now());
    };
    
    const hasAccess = (permissionKey) => {
        if (!currentUser) return false;
        if (currentUser.role === 'Owner') return true;
        
        const userPerms = currentUser.permissions || {};
        
        // STRICT Check: Only check the specific key.
        // Do NOT check parent keys (like 'payment').
        if (userPerms[permissionKey] && userPerms[permissionKey].includes('view')) {
            return true;
        }
        return false;
    };

    const paymentTabs = [
        { key: 'list', label: 'List Invoice', component: <InvoiceValidationList key={key} currentUser={currentUser} setActiveTab={setActiveTab} refreshData={refreshData} />, icon: List, accessKey: 'payment.validation' },
        { key: 'outbond', label: 'Masukkan Outbond', component: <OutbondInput key={key} currentUser={currentUser} setActiveTab={setActiveTab} refreshData={refreshData} />, icon: Truck, accessKey: 'payment.outbond' },
        { key: 'unpaid', label: 'Belum Lunas', component: <UnpaidInvoices key={key} currentUser={currentUser} />, icon: Hourglass, accessKey: 'payment.unpaid' },
        { key: 'paid', label: 'Lunas', component: <PaidInvoices key={key} currentUser={currentUser} />, icon: FileCheck2, accessKey: 'payment.paid' },
        { key: 'deleted', label: 'Invoice Dihapus', component: <DeletedInvoices key={key} currentUser={currentUser} refreshData={refreshData} />, icon: Trash2, accessKey: 'payment.deleted' },
    ];
    
    const visibleTabs = paymentTabs.filter(tab => hasAccess(tab.accessKey));

    // Set initial active tab
    useEffect(() => {
        if (visibleTabs.length > 0 && (!activeTab || !visibleTabs.find(t => t.key === activeTab))) {
            setActiveTab(visibleTabs[0].key);
        }
    }, [visibleTabs, activeTab]);

    const ActiveComponent = visibleTabs.find(tab => tab.key === activeTab)?.component;

    if (visibleTabs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Lock className="h-12 w-12 mb-4 text-gray-300"/>
                <p className="text-lg font-semibold">Akses Dibatasi</p>
                <p className="text-sm">Anda tidak memiliki izin untuk melihat modul pembayaran ini.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Pembayaran</h2>
                <p className="text-gray-600 mt-2">Lacak dan kelola status pembayaran semua invoice.</p>
            </div>

            <div className="w-full">
                <div className="mb-4 overflow-x-auto pb-2">
                    <div className="flex space-x-2 border-b">
                        {visibleTabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <Button
                                    key={tab.key}
                                    variant="ghost"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        'flex-shrink-0 justify-start h-auto px-4 py-3 rounded-none border-b-2 transition-all duration-200',
                                        activeTab === tab.key
                                            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    )}
                                >
                                    <Icon className="mr-2 h-5 w-5" />
                                    <span className="font-semibold">{tab.label}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-1 sm:p-4 bg-white rounded-lg shadow-sm border min-h-[400px]">
                    {ActiveComponent}
                </div>
            </div>
        </div>
    );
};

export default PaymentModule;