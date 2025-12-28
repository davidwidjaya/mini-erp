import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Download, Upload, FileDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';

const ExpeditionData = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [expeditions, setExpeditions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpedition, setEditingExpedition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  
  const initialFormState = { 
    name: '', 
    addresses: [''], 
    phones: [''], 
    bankAccount: '',
    area: '',
    status: 'active',
    notes: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setExpeditions(JSON.parse(localStorage.getItem('expeditions') || '[]'));
  }, []);

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingExpedition(null);
  };

  const handleSave = () => {
    let updatedExpeditions;
    if (editingExpedition) {
      updatedExpeditions = expeditions.map(e => e.id === editingExpedition.id ? { ...formData, id: editingExpedition.id } : e);
      toast({ title: t('success'), description: 'Expedition updated' });
    } else {
      updatedExpeditions = [...expeditions, { ...formData, id: Date.now() }];
      toast({ title: t('success'), description: 'Expedition added' });
    }
    localStorage.setItem('expeditions', JSON.stringify(updatedExpeditions));
    setExpeditions(updatedExpeditions);
    setIsOpen(false);
    resetForm();
  };
  
  const handleEdit = (exp) => {
    setEditingExpedition(exp);
    setFormData({
        ...exp,
        // Ensure new fields exist for older data
        area: exp.area || '',
        status: exp.status || 'active',
        notes: exp.notes || ''
    });
    setIsOpen(true);
  };
  
  const handleDelete = (expId) => {
      const updated = expeditions.filter(e => e.id !== expId);
      localStorage.setItem('expeditions', JSON.stringify(updated));
      setExpeditions(updated);
      setSelectedIds(selectedIds.filter(id => id !== expId));
      toast({ title: t('success'), description: 'Expedition deleted' });
  };

  const handleBulkDelete = () => {
      const updated = expeditions.filter(e => !selectedIds.includes(e.id));
      localStorage.setItem('expeditions', JSON.stringify(updated));
      setExpeditions(updated);
      setSelectedIds([]);
      toast({ title: t('success'), description: `${selectedIds.length} Expeditions deleted` });
  };

  const handleDeleteAll = () => {
      localStorage.setItem('expeditions', JSON.stringify([]));
      setExpeditions([]);
      setSelectedIds([]);
      toast({ title: t('success'), description: 'All expeditions deleted' });
  };

  const toggleSelection = (id) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === filteredExpeditions.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredExpeditions.map(e => e.id));
      }
  };
  
  const handleExport = () => {
    const dataToExport = expeditions.map(e => ({
        'Nama Ekspedisi': e.name,
        'Alamat': e.addresses.join('; '),
        'Telepon': e.phones.join('; '),
        'No. Rekening': e.bankAccount,
        'Area Jangkauan': e.area || '',
        'Status': e.status === 'active' ? 'Aktif' : 'Non Aktif',
        'Notes': e.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Ekspedisi");
    XLSX.writeFile(wb, "Data_Ekspedisi.xlsx");
    toast({ title: "Export Successful", description: "Expedition data exported to Excel."});
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            const newExpeditions = json.map(row => ({
                id: Date.now() + Math.random(),
                name: row['Nama Ekspedisi'] || '',
                addresses: (row['Alamat'] || '').split(';').map(a => a.trim()),
                phones: (row['Telepon'] || '').split(';').map(p => p.trim()),
                bankAccount: row['No. Rekening'] || '',
                area: row['Area Jangkauan'] || '',
                status: (row['Status'] && row['Status'].toLowerCase() === 'non aktif') ? 'inactive' : 'active',
                notes: row['Notes'] || ''
            }));
            
            const updatedExpeditions = [...expeditions, ...newExpeditions];
            localStorage.setItem('expeditions', JSON.stringify(updatedExpeditions));
            setExpeditions(updatedExpeditions);
            toast({ title: "Import Successful", description: `${newExpeditions.length} new expeditions have been added.`});

        } catch (error) {
            console.error(error);
            toast({ title: "Import Failed", description: "File format is incorrect or data is corrupted.", variant: "destructive" });
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null;
  };
  
  const downloadFormat = () => {
    const format = [{'Nama Ekspedisi': '', 'Alamat': '', 'Telepon': '', 'No. Rekening': '', 'Area Jangkauan': '', 'Status': 'Aktif/Non Aktif', 'Notes': ''}];
    const ws = XLSX.utils.json_to_sheet(format);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Format Import Ekspedisi");
    XLSX.writeFile(wb, "Format_Import_Ekspedisi.xlsx");
  };

  const filteredExpeditions = expeditions.filter(exp => 
    (exp.name && exp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (exp.area && exp.area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-2xl font-bold text-gray-800">{t('expeditionData')}</h3>
        <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
                placeholder="Cari Nama / Area..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
            />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="flex-1 min-w-[140px]" onClick={resetForm}><Plus className="mr-2 h-4 w-4" />{t('addExpedition')}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingExpedition ? 'Edit' : t('addExpedition')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>{t('expeditionName')}</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                        <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Non Aktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
              
              <div><Label>{t('address')}</Label><Input value={formData.addresses[0]} onChange={(e) => setFormData({...formData, addresses: [e.target.value]})} /></div>
              <div><Label>Area Jangkauan</Label><Input value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} placeholder="Contoh: Jabodetabek, Jawa Barat" /></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><Label>{t('phone')}</Label><Input value={formData.phones[0]} onChange={(e) => setFormData({...formData, phones: [e.target.value]})} /></div>
                 <div><Label>{t('bankAccountNumber')}</Label><Input value={formData.bankAccount} onChange={(e) => setFormData({...formData, bankAccount: e.target.value})} /></div>
              </div>
              
              <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div>
              
              <Button onClick={handleSave} className="w-full">{t('save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" className="flex-1 min-w-[100px]" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
        <Button variant="outline" className="flex-1 min-w-[100px]" onClick={() => fileInputRef.current.click()}><Upload className="mr-2 h-4 w-4" />Import</Button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
        <Button variant="outline" className="flex-1 min-w-[100px]" onClick={downloadFormat}><FileDown className="mr-2 h-4 w-4" />Format</Button>
      </div>

      {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-red-50 p-2 rounded mb-4 border border-red-100">
              <span className="text-sm text-red-600 ml-2">{selectedIds.length} item dipilih</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Hapus Terpilih</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus Massal</AlertDialogTitle>
                        <AlertDialogDescription>Apakah anda yakin ingin menghapus {selectedIds.length} data ekspedisi yang dipilih? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-600 items-center">
            <div className="col-span-1 flex justify-center">
                <Checkbox 
                    checked={filteredExpeditions.length > 0 && selectedIds.length === filteredExpeditions.length}
                    onCheckedChange={toggleSelectAll}
                />
            </div>
            <div className="col-span-3">Nama & Status</div>
            <div className="col-span-3">Kontak & Area</div>
            <div className="col-span-3">Detail & Notes</div>
            <div className="col-span-2 text-right">
                 {expeditions.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="sm" className="text-red-500 h-8 px-2 hover:text-red-700 hover:bg-red-50">Delete All</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus SEMUA Data?</AlertDialogTitle>
                                <AlertDialogDescription>Peringatan: Ini akan menghapus SELURUH data ekspedisi. Tindakan ini sangat berbahaya dan tidak dapat dibatalkan.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">Hapus Semua</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
            </div>
        </div>

        {/* Table Body */}
        <div className="max-h-[600px] overflow-y-auto">
            {filteredExpeditions.length > 0 ? (
                filteredExpeditions.map(exp => (
                <motion.div 
                    key={exp.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`grid grid-cols-12 gap-4 p-4 border-b items-center hover:bg-gray-50 transition-colors ${selectedIds.includes(exp.id) ? 'bg-blue-50/50' : ''}`}
                >
                    <div className="col-span-1 flex justify-center">
                        <Checkbox 
                            checked={selectedIds.includes(exp.id)}
                            onCheckedChange={() => toggleSelection(exp.id)}
                        />
                    </div>
                    <div className="col-span-3">
                        <p className="font-semibold text-gray-800">{exp.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${exp.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {exp.status === 'inactive' ? 'Non Aktif' : 'Aktif'}
                        </span>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Tel:</span> {exp.phones[0] || '-'}</p>
                        <p><span className="font-medium">Area:</span> {exp.area || '-'}</p>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600 space-y-1">
                        <p className="truncate"><span className="font-medium">Alamat:</span> {exp.addresses[0] || '-'}</p>
                        {exp.bankAccount && <p className="truncate"><span className="font-medium">Bank:</span> {exp.bankAccount}</p>}
                        {exp.notes && <p className="text-xs text-gray-400 italic truncate">"{exp.notes}"</p>}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Ekspedisi?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Anda yakin ingin menghapus <strong>{exp.name}</strong>?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(exp.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </motion.div>
                ))
            ) : (
                <div className="p-8 text-center text-gray-500 italic">
                    {searchTerm ? 'Tidak ada ekspedisi yang cocok dengan pencarian.' : 'Belum ada data ekspedisi.'}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ExpeditionData;