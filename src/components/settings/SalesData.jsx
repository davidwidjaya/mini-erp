import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { differenceInDays, parseISO } from 'date-fns';

const SalesData = ({ currentUser }) => {
  const { toast } = useToast();
  const [sales, setSales] = useState([]);
  const [salesTeams, setSalesTeams] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [jabatans, setJabatans] = useState([]); // New state for positions
  const [isOpen, setIsOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [editingSales, setEditingSales] = useState(null);
  const [newTeam, setNewTeam] = useState('');
  
  const [formData, setFormData] = useState({ 
    team: '', name: '', personalPhone: '', address: '', idNumber: '', businessPhone: '', workLocation: '', jabatanId: ''
  });

  useEffect(() => {
    setSales(JSON.parse(localStorage.getItem('sales') || '[]'));
    setSalesTeams(JSON.parse(localStorage.getItem('salesTeams') || '[]'));
    setClients(JSON.parse(localStorage.getItem('clients') || '[]'));
    setInvoices(JSON.parse(localStorage.getItem('invoices') || '[]'));
    setJabatans(JSON.parse(localStorage.getItem('jabatans') || '[]')); // Load positions
  }, []);

  const resetForm = () => {
    setFormData({ team: '', name: '', personalPhone: '', address: '', idNumber: '', businessPhone: '', workLocation: '', jabatanId: '' });
    setEditingSales(null);
  }

  const handleSave = () => {
    let updatedSales;
    if (editingSales) {
      updatedSales = sales.map(s => s.id === editingSales.id ? { ...formData, id: editingSales.id } : s);
      toast({ title: 'Sukses', description: 'Data sales diperbarui.' });
    } else {
      updatedSales = [...sales, { ...formData, id: Date.now() }];
      toast({ title: 'Sukses', description: 'Sales baru ditambahkan.' });
    }
    localStorage.setItem('sales', JSON.stringify(updatedSales));
    setSales(updatedSales);
    setIsOpen(false);
    resetForm();
  };
  
  const handleEdit = (sale) => {
    setEditingSales(sale);
    setFormData(sale);
    setIsOpen(true);
  }

  const handleDelete = (saleId) => {
      const updated = sales.filter(s => s.id !== saleId);
      localStorage.setItem('sales', JSON.stringify(updated));
      setSales(updated);
      toast({ title: 'Sukses', description: 'Data sales dihapus.' });
  }

  const handleAddTeam = () => {
      if(newTeam && !salesTeams.includes(newTeam)){
          const updatedTeams = [...salesTeams, newTeam];
          setSalesTeams(updatedTeams);
          localStorage.setItem('salesTeams', JSON.stringify(updatedTeams));
          setNewTeam('');
          setIsTeamOpen(false);
          toast({ title: 'Sukses', description: 'Tim sales baru ditambahkan.' });
      } else {
          toast({ title: 'Error', description: 'Nama tim sudah ada atau kosong.', variant: 'destructive' });
      }
  }

  const getClientCountsForSales = (salesName) => {
      const now = new Date('2025-10-26');
      const assignedClients = clients.filter(c => c.salesName === salesName);
      const counts = { active: 0, warning: 0, inactive: 0 };
      
      assignedClients.forEach(client => {
          const clientInvoices = invoices.filter(inv => inv.clientId === client.id.toString()).sort((a,b) => new Date(b.tanggalInvoice) - new Date(a.tanggalInvoice));
          if(clientInvoices.length === 0){
              counts.inactive++;
              return;
          }
          const lastTransactionDate = parseISO(clientInvoices[0].tanggalInvoice);
          const daysSinceLastTransaction = differenceInDays(now, lastTransactionDate);

          if(daysSinceLastTransaction <= 45) counts.active++;
          else if (daysSinceLastTransaction <= 90) counts.warning++;
          else counts.inactive++;
      });
      return counts;
  }
  
  const getJabatanName = (jabatanId) => {
    const jabatan = jabatans.find(j => j.id.toString() === jabatanId?.toString());
    return jabatan ? jabatan.jabatan : 'N/A';
  }

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
         <Dialog open={isTeamOpen} onOpenChange={setIsTeamOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">Tambah Tim Sales</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Tambah Tim Sales Baru</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div><Label>Nama Tim</Label><Input value={newTeam} onChange={(e) => setNewTeam(e.target.value)} /></div>
                    <Button onClick={handleAddTeam} className="w-full">Simpan</Button>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1" onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Tambah Sales</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingSales ? 'Edit' : 'Tambah'} Sales</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nama Sales</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div>
                  <Label>Tim Sales</Label>
                  <Select value={formData.team} onValueChange={(val) => setFormData({...formData, team: val})}>
                      <SelectTrigger><SelectValue placeholder="Pilih Tim" /></SelectTrigger>
                      <SelectContent>{salesTeams.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label>Jabatan</Label>
                  <Select value={formData.jabatanId} onValueChange={(val) => setFormData({...formData, jabatanId: val})}>
                      <SelectTrigger><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger>
                      <SelectContent>{jabatans.map(jabatan => <SelectItem key={jabatan.id} value={jabatan.id.toString()}>{jabatan.jabatan}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Nomor Telepon Pribadi</Label><Input value={formData.personalPhone} onChange={(e) => setFormData({...formData, personalPhone: e.target.value})} /></div>
                <div><Label>Nomor Telepon Bisnis</Label><Input value={formData.businessPhone} onChange={(e) => setFormData({...formData, businessPhone: e.target.value})} /></div>
              </div>
              <div><Label>Alamat Tinggal</Label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-4">
                <div><Label>Nomor KTP</Label><Input value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} /></div>
                <div><Label>Lokasi Kerja</Label><Input value={formData.workLocation} onChange={(e) => setFormData({...formData, workLocation: e.target.value})} /></div>
              </div>
              <Button onClick={handleSave} className="w-full">Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
        {sales.map(s => {
            const counts = getClientCountsForSales(s.name);
            return (
              <motion.div key={s.id} className="p-4 bg-white rounded-lg border">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-base">{s.name} <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{s.team}</span></p>
                        <p className="text-sm text-gray-700 font-medium">{getJabatanName(s.jabatanId)}</p>
                        <p className="text-xs text-gray-600">Lokasi: {s.workLocation}</p>
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
                 <div className="flex justify-end gap-4 mt-2 text-xs">
                    <span className="text-green-600 font-medium">Aktif: {counts.active}</span>
                    <span className="text-yellow-600 font-medium">Warning: {counts.warning}</span>
                    <span className="text-red-600 font-medium">Non-Aktif: {counts.inactive}</span>
                </div>
              </motion.div>
            )
        })}
      </div>
    </div>
  );
};

export default SalesData;