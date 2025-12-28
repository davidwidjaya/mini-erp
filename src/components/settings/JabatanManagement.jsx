import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const JabatanManagement = () => {
  const { toast } = useToast();
  const [jabatans, setJabatans] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingJabatan, setEditingJabatan] = useState(null);
  const [formData, setFormData] = useState({
    jabatan: '',
    level: '',
    komisi: '',
    clientAccess: 'all'
  });

  useEffect(() => {
    setJabatans(JSON.parse(localStorage.getItem('jabatans') || '[]'));
  }, []);

  const resetForm = () => {
    setFormData({ jabatan: '', level: '', komisi: '', clientAccess: 'all' });
    setEditingJabatan(null);
  };

  const handleSave = () => {
    if (!formData.jabatan || !formData.level || !formData.komisi) {
      toast({ title: 'Error', description: 'Semua field wajib diisi.', variant: 'destructive' });
      return;
    }

    let updatedJabatans;
    if (editingJabatan) {
      updatedJabatans = jabatans.map(j => j.id === editingJabatan.id ? { ...formData, id: editingJabatan.id } : j);
      toast({ title: 'Sukses', description: 'Jabatan berhasil diperbarui.' });
    } else {
      updatedJabatans = [...jabatans, { ...formData, id: Date.now() }];
      toast({ title: 'Sukses', description: 'Jabatan baru berhasil ditambahkan.' });
    }
    localStorage.setItem('jabatans', JSON.stringify(updatedJabatans));
    setJabatans(updatedJabatans);
    setIsOpen(false);
    resetForm();
  };

  const handleEdit = (jabatan) => {
    setEditingJabatan(jabatan);
    setFormData({
      ...jabatan,
      clientAccess: jabatan.clientAccess || 'all'
    });
    setIsOpen(true);
  };

  const handleDelete = (jabatanId) => {
    const updated = jabatans.filter(j => j.id !== jabatanId);
    localStorage.setItem('jabatans', JSON.stringify(updated));
    setJabatans(updated);
    toast({ title: 'Sukses', description: 'Jabatan berhasil dihapus.' });
  };

  const getAccessLabel = (value) => {
    switch(value) {
      case 'team': return 'Tim Sales';
      case 'own': return 'Terkait Langsung';
      default: return 'Semua Data';
    }
  };

  return (
    <div className="p-4">
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4" onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Tambah Jabatan</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingJabatan ? 'Edit' : 'Tambah'} Jabatan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nama Jabatan</Label>
              <Input value={formData.jabatan} onChange={(e) => setFormData({...formData, jabatan: e.target.value})} placeholder="e.g. Sales Senior" />
            </div>
            <div>
              <Label>Level</Label>
              <Input type="number" value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} placeholder="e.g. 1" />
            </div>
            <div>
              <Label>Komisi (%)</Label>
              <Input type="number" value={formData.komisi} onChange={(e) => setFormData({...formData, komisi: e.target.value})} placeholder="e.g. 5" />
            </div>
            <div>
              <Label>Hak Akses Search Data Klien</Label>
              <Select 
                value={formData.clientAccess} 
                onValueChange={(val) => setFormData({...formData, clientAccess: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Hak Akses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">(1) Bisa search semua data klien</SelectItem>
                  <SelectItem value="team">(2) Hanya bisa search data klien dalam tim sales user</SelectItem>
                  <SelectItem value="own">(3) Hanya bisa search data klien terkait langsung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
        {jabatans.map(jabatan => (
          <motion.div key={jabatan.id} className="p-3 bg-white rounded-lg border flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{jabatan.jabatan}</p>
              <p className="text-xs text-gray-600">
                Level: {jabatan.level} | Komisi: {jabatan.komisi}% | <span className="text-blue-600 font-medium">Akses Klien: {getAccessLabel(jabatan.clientAccess)}</span>
              </p>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(jabatan)}><Edit className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Aksi ini tidak dapat dibatalkan. Ini akan menghapus data jabatan secara permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(jabatan.id)}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default JabatanManagement;