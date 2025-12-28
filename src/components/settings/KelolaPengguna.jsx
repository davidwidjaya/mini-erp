
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { fetchProfiles, updateProfile, fetchJabatans, fetchSalesTeams } from '@/lib/supabaseOperations';
import { supabase } from '@/lib/customSupabaseClient';

const KelolaPengguna = ({ currentUser }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [salesTeams, setSalesTeams] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: '', salesTeam: '', permissions: {}
  });

  const MODULE_STRUCTURE = [
    { id: 'home', label: 'Beranda' },
    { id: 'dataEntry', label: 'Input Data & List Order' },
    { id: 'generateDocs', label: 'Generate Dokumen' },
    { 
      id: 'payment', 
      label: 'Pembayaran',
      subModules: [
        { id: 'payment.validation', label: 'List Invoice' },
        { id: 'payment.outbond', label: 'Masukkan Outbond' },
        { id: 'payment.unpaid', label: 'Belum Lunas' },
        { id: 'payment.paid', label: 'Lunas' },
        { id: 'payment.deleted', label: 'Invoice Dihapus' },
      ]
    },
    { id: 'suratJalan', label: 'Surat Jalan' },
    { id: 'invoiceOngkir', label: 'Invoice Ongkir' },
    { id: 'fileHistory', label: 'File & Riwayat' },
    { 
      id: 'settings', 
      label: 'Pengaturan',
      subModules: [
         { id: 'settings.company', label: 'Data Perusahaan' },
         { id: 'settings.users', label: 'Kelola Pengguna' },
         { id: 'settings.jabatan', label: 'Jabatan' },
         { id: 'settings.bank', label: 'Rekening Bank' },
         { id: 'settings.supplier', label: 'Data Supplier' },
         { id: 'settings.product', label: 'Data Barang' },
         { id: 'settings.cost', label: 'Harga Modal' },
         { id: 'settings.sales', label: 'Data Sales' },
         { id: 'settings.signature', label: 'Tanda Tangan' },
         { id: 'settings.client', label: 'Data Klien' },
         { id: 'settings.expedition', label: 'Data Ekspedisi' },
         { id: 'settings.bottomPrice', label: 'Harga Bottom' },
      ]
    },
  ];
  
  const ACTIONS = ['view', 'edit', 'delete'];

  useEffect(() => {
    loadData();
    // Expand all by default
    const initialExpanded = {};
    MODULE_STRUCTURE.forEach(m => {
        if(m.subModules) initialExpanded[m.id] = true;
    });
    setExpandedModules(initialExpanded);
  }, []);

  const loadData = async () => {
      try {
          const [profs, jabs, teams] = await Promise.all([
              fetchProfiles(),
              fetchJabatans(),
              fetchSalesTeams()
          ]);
          setUsers(profs);
          setJabatans(jabs);
          setSalesTeams(teams.map(t => t.name));
      } catch (e) {
          console.error("Failed to load user management data", e);
      }
  };
  
  const resetForm = () => {
      setFormData({ name: '', email: '', password: '', role: '', salesTeam: '', permissions: {} });
      setEditingUser(null);
  }

  const handleSave = async () => {
    try {
        if (editingUser) {
             // Update existing profile
             await updateProfile(editingUser.id, {
                 name: formData.name,
                 role: formData.role,
                 permissions: formData.permissions
                 // email update requires auth api, skipping for profile metadata only
                 // salesTeam if you add column to profile
             });
             toast({ title: 'Sukses', description: 'Pengguna diperbarui' });
        } else {
             // Create new user via Edge Function
             if (!formData.email || !formData.password) {
                 toast({ title: 'Error', description: 'Email & Password wajib diisi untuk user baru', variant: 'destructive' });
                 return;
             }
             
             const { data, error } = await supabase.functions.invoke('create-user', {
                 body: {
                     email: formData.email,
                     password: formData.password,
                     userData: {
                         name: formData.name,
                         role: formData.role,
                         permissions: formData.permissions
                     }
                 }
             });

             if (error) throw new Error(error.message);
             toast({ title: 'Sukses', description: 'Pengguna baru berhasil dibuat. Email konfirmasi telah dikirim.' });
        }
        await loadData();
        setIsOpen(false);
        resetForm();
    } catch (e) {
        console.error("Save error", e);
        toast({ title: 'Gagal', description: e.message || 'Terjadi kesalahan saat menyimpan data.', variant: 'destructive' });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
        ...user,
        password: '', // Don't show password
        salesTeam: '' // Profile doesn't have salesTeam by default in schema, skipping map
    });
    setIsOpen(true);
  };

  const togglePermission = (moduleId, action) => {
    const currentPermissions = formData.permissions?.[moduleId] || [];
    let newPermissions;
    
    if (currentPermissions.includes(action)) {
      newPermissions = currentPermissions.filter(p => p !== action);
    } else {
      newPermissions = [...currentPermissions, action];
      if ((action === 'edit' || action === 'delete') && !newPermissions.includes('view')) {
          newPermissions.push('view');
      }
    }
    
    const updatedPermissions = {
        ...formData.permissions,
        [moduleId]: newPermissions,
    };

    if (action === 'view' && !newPermissions.includes('view')) {
        updatedPermissions[moduleId] = [];
    }

    setFormData(prev => ({ ...prev, permissions: updatedPermissions }));
  };

  const toggleModuleExpansion = (moduleId) => {
      setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const renderPermissionRow = (module, isSub = false) => {
    const isParent = !!module.subModules;

    return (
      <div key={module.id} className={`flex items-center py-2 border-b hover:bg-gray-50 ${isSub ? 'bg-gray-50' : ''} ${isParent ? 'bg-gray-100' : ''}`}>
        <div className={`flex-1 flex items-center ${isSub ? 'pl-8' : 'pl-2'}`}>
          {isParent && (
              <button onClick={() => toggleModuleExpansion(module.id)} className="mr-2 focus:outline-none">
                  {expandedModules[module.id] ? <ChevronDown className="h-4 w-4 text-gray-500"/> : <ChevronRight className="h-4 w-4 text-gray-500"/>}
              </button>
          )}
          <span className={`text-sm ${isSub ? 'text-gray-600' : 'font-bold text-gray-800'}`}>{module.label}</span>
        </div>
        <div className="flex space-x-8 pr-4">
          {!isParent ? (
            ACTIONS.map(action => (
              <div key={action} className="flex items-center space-x-2 w-16">
                <Checkbox
                  id={`${module.id}-${action}`}
                  checked={(formData.permissions?.[module.id] || []).includes(action)}
                  onCheckedChange={() => togglePermission(module.id, action)}
                />
                <Label htmlFor={`${module.id}-${action}`} className="text-xs capitalize cursor-pointer">{action}</Label>
              </div>
            ))
          ) : (
            <div className="w-full text-right text-xs text-gray-400 italic pr-4">
               Konfigurasi via sub-menu
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Kelola Pengguna</h3>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Tambah Pengguna</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingUser ? 'Edit' : 'Tambah'} Pengguna</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div><Label>Nama</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!!editingUser} /></div>
                {!editingUser && (
                    <div><Label>Password</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} /></div>
                )}
                
                <div>
                  <Label>Jabatan/Role</Label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Owner">Owner</SelectItem>
                        {jabatans.map(j => (
                            <SelectItem key={j.id} value={j.jabatan}>{j.jabatan}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border rounded-lg">
                <div className="bg-gray-100 p-3 border-b flex justify-between font-semibold text-sm text-gray-700">
                    <span className="pl-2">Nama Modul</span>
                    <span className="pr-24">Hak Akses</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {MODULE_STRUCTURE.map(module => (
                    <React.Fragment key={module.id}>
                        {renderPermissionRow(module)}
                        {module.subModules && expandedModules[module.id] && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {module.subModules.map(sub => renderPermissionRow(sub, true))}
                            </motion.div>
                        )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-4 pt-4 border-t">
                <Button onClick={handleSave} className="flex-1">Simpan</Button>
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">Batal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {users.map(user => (
          <motion.div key={user.id} className="p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-600">
                    {user.email} - <span className="font-medium text-blue-600">{user.role}</span>
                  </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /></Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default KelolaPengguna;
