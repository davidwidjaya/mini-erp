import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const UserManagement = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: '', permissions: []
  });

  const allModules = [
    { id: 'home', label: 'Beranda' },
    { id: 'dataEntry', label: 'Input Data & List Order' },
    { id: 'generateDocs', label: 'Generate Dokumen' },
    { id: 'payment', label: 'Pembayaran', sheets: [
        { id: 'payment.outbond', label: 'Masukkan Outbond' },
        { id: 'payment.unpaid', label: 'Belum Lunas' },
        { id: 'payment.paid', label: 'Lunas' },
    ]},
    { id: 'suratJalan', label: 'Surat Jalan' },
    { id: 'invoiceOngkir', label: 'Invoice Ongkir' },
    { id: 'fileHistory', label: 'File & Riwayat', sheets: [
        { id: 'fileHistory.invoiceList', label: 'List Invoice' },
        { id: 'fileHistory.history', label: 'Riwayat File' },
        { id: 'fileHistory.report', label: 'Laporan Bulanan' },
        { id: 'fileHistory.deleted', label: 'File Terhapus' },
        { id: 'fileHistory.logs', label: 'Log Pengguna' },
    ]},
    { id: 'settings', label: 'Pengaturan', sheets: [
        // CEO
        { id: 'settings.company', label: 'Data Perusahaan (CEO)' },
        { id: 'settings.users', label: 'Kelola Pengguna (CEO)' },
        { id: 'settings.jabatan', label: 'Jabatan (CEO)' },
        { id: 'settings.bank', label: 'Rekening Bank (CEO)' },
        // Supply Chain
        { id: 'settings.suppliers', label: 'Data Supplier (SC)' },
        { id: 'settings.products', label: 'Data Barang (SC)' },
        { id: 'settings.cost', label: 'Harga Modal (SC)' },
        // Front End
        { id: 'settings.sales', label: 'Tim Sales (FE)' },
        { id: 'settings.signature', label: 'Tanda Tangan (FE)' },
        { id: 'settings.clients', label: 'Data Klien (FE)' },
        { id: 'settings.expedition', label: 'Data Ekspedisi (FE)' },
        { id: 'settings.bottomPrice', label: 'Harga Bottom (FE)' },
    ]},
  ];

  useEffect(() => {
    setUsers(JSON.parse(localStorage.getItem('users') || '[]'));
  }, []);

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast({ title: t('error'), description: t('pleaseFillAllFields'), variant: 'destructive' });
      return;
    }
    let updatedUsers;
    const userPayload = { ...formData, id: editingUser ? editingUser.id : Date.now() };
    if (editingUser) {
      updatedUsers = users.map(u => u.id === editingUser.id ? userPayload : u);
    } else {
      updatedUsers = [...users, userPayload];
    }
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setIsOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: '', permissions: [] });
    toast({ title: t('success'), description: editingUser ? t('userUpdated') : t('userAdded') });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData(user);
    setIsOpen(true);
  };

  const handleDelete = (userId) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    toast({ title: t('success'), description: t('userDeleted') });
  };

  const togglePermission = (permission) => {
    const isParent = allModules.find(m => m.id === permission && m.sheets);
    let newPermissions = [...formData.permissions];

    if (newPermissions.includes(permission)) {
      newPermissions = newPermissions.filter(p => p !== permission);
      if (isParent) { // Uncheck all children if parent is unchecked
        newPermissions = newPermissions.filter(p => !p.startsWith(permission + '.'));
      }
    } else {
      newPermissions.push(permission);
    }
    setFormData(prev => ({ ...prev, permissions: newPermissions }));
  };

  const areAllChildrenChecked = (parent) => {
      if(!parent.sheets) return false;
      return parent.sheets.every(sheet => formData.permissions.includes(sheet.id));
  };
  
  const handleParentCheckboxChange = (parent) => {
      let newPermissions = [...formData.permissions];
      const allChildrenChecked = areAllChildrenChecked(parent);
      
      if(allChildrenChecked){ // Uncheck all children
          newPermissions = newPermissions.filter(p => !p.startsWith(parent.id + '.'));
      } else { // Check all children
          parent.sheets.forEach(sheet => {
              if(!newPermissions.includes(sheet.id)) newPermissions.push(sheet.id);
          });
      }
      setFormData(prev => ({...prev, permissions: newPermissions}));
  };

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">{t('userManagement')}</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', password: '', role: '', permissions: [] }); }}><Plus className="mr-2 h-4 w-4" />{t('addUser')}</Button></DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>{editingUser ? t('editUser') : t('addUser')}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><Label>{t('name')}</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div><Label>{t('email')}</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                <div><Label>{t('password')}</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} /></div>
                <div><Label>{t('role')}</Label><Input value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <Label className="mb-2 block">Hak Akses</Label>
                <div className="flex items-center space-x-2 p-2 rounded bg-blue-50"><Checkbox checked={formData.permissions.includes('all')} onCheckedChange={() => togglePermission('all')} id="all-access" /><Label htmlFor="all-access" className="font-bold text-blue-800">Akses Penuh</Label></div>
                <div className="space-y-3 max-h-64 overflow-y-auto p-2">
                  {allModules.map(module => (
                    <div key={module.id}>
                      <div className="flex items-center space-x-2">
                        {!module.sheets ? (
                            <>
                                <Checkbox checked={formData.permissions.includes(module.id)} onCheckedChange={() => togglePermission(module.id)} id={`perm-${module.id}`} />
                                <Label htmlFor={`perm-${module.id}`} className="font-semibold">{module.label}</Label>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Checkbox checked={areAllChildrenChecked(module)} onCheckedChange={() => handleParentCheckboxChange(module)} id={`perm-parent-${module.id}`} />
                                <Label htmlFor={`perm-parent-${module.id}`} className="font-semibold">{module.label}</Label>
                            </div>
                        )}
                      </div>
                      {module.sheets && (
                        <div className="pl-6 mt-2 space-y-2">
                          {module.sheets.map(sheet => (
                            <div key={sheet.id} className="flex items-center space-x-2">
                              <Checkbox checked={formData.permissions.includes(sheet.id)} onCheckedChange={() => togglePermission(sheet.id)} id={`perm-${sheet.id}`} />
                              <Label htmlFor={`perm-${sheet.id}`} className="text-sm">{sheet.label}</Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-4"><Button onClick={handleSave} className="flex-1">{t('save')}</Button><Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">{t('cancel')}</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {users.map(user => (
          <motion.div key={user.id} whileHover={{ scale: 1.01 }} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div><p className="font-semibold">{user.name}</p><p className="text-sm text-gray-600">{user.email} - {user.role}</p></div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /></Button>
              {user.role !== 'Owner' && (<Button variant="destructive" size="icon" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4" /></Button>)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;