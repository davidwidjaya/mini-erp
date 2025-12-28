import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Users, Banknote, Package, DollarSign, Truck, User, FileSignature, Briefcase, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import CompanyData from '@/components/settings/CompanyData';
import BankAccountData from '@/components/settings/BankAccountData';
import SupplierData from '@/components/settings/SupplierData';
import ProductData from '@/components/settings/ProductData';
import ProductCost from '@/components/settings/ProductCost';
import SalesData from '@/components/settings/SalesData';
import SignatureManagement from '@/components/settings/SignatureManagement';
import ClientData from '@/components/settings/ClientData';
import ExpeditionData from '@/components/settings/ExpeditionData';
import BottomPrice from '@/components/settings/BottomPrice';
import JabatanManagement from '@/components/settings/JabatanManagement';
import KelolaPengguna from '@/components/settings/KelolaPengguna';


const SettingsModule = ({ currentUser }) => {
    const { t } = useLanguage();
    const [activeGroup, setActiveGroup] = useState(null);
    const [activeSubmenu, setActiveSubmenu] = useState(null);

    const hasAccess = (permissionKey) => {
        if (!currentUser) return false;
        if (currentUser.role === 'Owner') return true;
        
        const userPerms = currentUser.permissions || {};
        
        // STRICT Check: Only check the specific key. 
        // Do NOT check parent keys (like 'settings').
        // Access is now granular and determined solely by sub-menu permissions.
        if (userPerms[permissionKey] && userPerms[permissionKey].includes('view')) {
            return true;
        }
        
        return false;
    };

    const settingsConfig = [
        {
            group: 'CEO',
            icon: Briefcase,
            submenus: [
                { key: 'companyData', label: t('companyData'), icon: Building, component: <CompanyData currentUser={currentUser} />, accessKey: 'settings.company' },
                { key: 'kelolaPengguna', label: 'Kelola Pengguna', icon: Users, component: <KelolaPengguna currentUser={currentUser} />, accessKey: 'settings.users' },
                { key: 'jabatanManagement', label: 'Jabatan', icon: Briefcase, component: <JabatanManagement currentUser={currentUser} />, accessKey: 'settings.jabatan' },
                { key: 'bankAccounts', label: t('bankAccounts'), icon: Banknote, component: <BankAccountData currentUser={currentUser} />, accessKey: 'settings.bank' },
            ]
        },
        {
            group: 'Supply Chain',
            icon: Package,
            submenus: [
                { key: 'supplierData', label: t('supplierData'), icon: Truck, component: <SupplierData currentUser={currentUser} />, accessKey: 'settings.supplier' },
                { key: 'productData', label: t('productData'), icon: Package, component: <ProductData currentUser={currentUser} />, accessKey: 'settings.product' },
                { key: 'productCost', label: 'Harga Modal Barang', icon: DollarSign, component: <ProductCost currentUser={currentUser} />, accessKey: 'settings.cost' },
            ]
        },
        {
            group: 'Front End',
            icon: User,
            submenus: [
                { key: 'salesData', label: 'Data Sales', icon: User, component: <SalesData currentUser={currentUser} />, accessKey: 'settings.sales' },
                { key: 'signatures', label: t('signatures'), icon: FileSignature, component: <SignatureManagement currentUser={currentUser} />, accessKey: 'settings.signature' },
                { key: 'clientData', label: t('clientData'), icon: Users, component: <ClientData currentUser={currentUser} />, accessKey: 'settings.client' },
                { key: 'expeditionData', label: t('expeditionData'), icon: Truck, component: <ExpeditionData currentUser={currentUser} />, accessKey: 'settings.expedition' },
                { key: 'bottomPrice', label: 'Harga Bottom', icon: DollarSign, component: <BottomPrice currentUser={currentUser} />, accessKey: 'settings.bottomPrice' },
            ]
        }
    ];

    // Filter groups that have at least one visible submenu
    const visibleGroups = settingsConfig.filter(group => 
        group.submenus.some(submenu => hasAccess(submenu.accessKey))
    );

    const handleGroupClick = (group) => {
        setActiveGroup(activeGroup === group ? null : group);
        setActiveSubmenu(null);
    };

    const handleSubmenuClick = (key) => {
        setActiveSubmenu(key);
    };

    const ActiveComponent = settingsConfig
        .flatMap(g => g.submenus)
        .find(s => s.key === activeSubmenu)?.component;

    return (
        <div className="flex h-full bg-gray-50">
            <aside className="w-72 bg-white p-4 border-r overflow-y-auto">
                <h2 className="text-xl font-bold mb-6">{t('settings')}</h2>
                <nav className="space-y-2">
                    {visibleGroups.length === 0 && (
                        <div className="text-gray-500 text-sm p-2">
                            <p>Akses dibatasi.</p>
                            <p className="text-xs mt-1">Anda tidak memiliki izin untuk melihat menu pengaturan.</p>
                        </div>
                    )}
                    
                    {visibleGroups.map(group => (
                        <div key={group.group}>
                            <button
                                onClick={() => handleGroupClick(group.group)}
                                className="w-full flex items-center justify-between p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                <div className="flex items-center">
                                    <div className="bg-blue-50 p-1.5 rounded-md mr-3">
                                        <group.icon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="font-semibold">{group.group}</span>
                                </div>
                                <ChevronRight className={cn('h-4 w-4 transform transition-transform text-gray-400', activeGroup === group.group && 'rotate-90')} />
                            </button>
                            <AnimatePresence>
                                {activeGroup === group.group && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden pl-2"
                                    >
                                        <div className="py-1 space-y-0.5 ml-3 border-l border-gray-200">
                                            {group.submenus.map(submenu => {
                                                if (!hasAccess(submenu.accessKey)) return null;
                                                return (
                                                    <button
                                                        key={submenu.key}
                                                        onClick={() => handleSubmenuClick(submenu.key)}
                                                        className={cn(
                                                            'w-full flex items-center px-4 py-2 text-sm border-l-2 -ml-[1px] transition-colors',
                                                            activeSubmenu === submenu.key
                                                                ? 'border-blue-500 text-blue-600 bg-blue-50 font-medium'
                                                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                                        )}
                                                    >
                                                        {submenu.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSubmenu || 'empty'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {ActiveComponent ? ActiveComponent : (
                            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md">
                                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Briefcase className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Pengaturan Sistem</h3>
                                    {visibleGroups.length > 0 ? (
                                        <p className="text-gray-500 mt-2 text-sm">Silakan pilih menu dari panel sebelah kiri untuk mengelola konfigurasi sistem.</p>
                                    ) : (
                                        <p className="text-red-500 mt-2 text-sm">Anda tidak memiliki akses ke sub-menu pengaturan apapun.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default SettingsModule;