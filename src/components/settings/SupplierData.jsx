
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/supabaseOperations';

const SupplierData = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', warehouse_address: '', office_address: '', phone: '', pic: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      try {
          const data = await fetchSuppliers();
          setSuppliers(data);
      } catch (e) {
          toast({ title: "Error", description: "Failed to load suppliers.", variant: "destructive" });
      }
  }

  const resetForm = () => {
    setFormData({ name: '', warehouse_address: '', office_address: '', phone: '', pic: '' });
    setEditingSupplier(null);
  }

  const handleSave = async () => {
      try {
        if (editingSupplier) {
            await updateSupplier(editingSupplier.id, formData);
            toast({ title: t('success'), description: 'Supplier updated' });
        } else {
            await createSupplier(formData);
            toast({ title: t('success'), description: 'Supplier added' });
        }
        await loadData();
        setIsOpen(false);
        resetForm();
      } catch (e) {
        toast({ title: "Error", description: "Failed to save supplier.", variant: "destructive" });
      }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setIsOpen(true);
  }

  const handleDelete = async (id) => {
    try {
        await deleteSupplier(id);
        await loadData();
        toast({ title: t('success'), description: 'Supplier deleted' });
    } catch (e) {
        toast({ title: "Error", description: "Failed to delete supplier.", variant: "destructive" });
    }
  }

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2"><Truck className="h-5 w-5" /> {t('supplierData')}</h3>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />{t('addSupplier')}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSupplier ? t('edit') : t('addSupplier')}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>{t('supplierName')}</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div><Label>Warehouse Address</Label><Input value={formData.warehouse_address} onChange={(e) => setFormData({...formData, warehouse_address: e.target.value})} /></div>
              <div><Label>Office Address</Label><Input value={formData.office_address} onChange={(e) => setFormData({...formData, office_address: e.target.value})} /></div>
              <div><Label>{t('phone')}</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div><Label>PIC</Label><Input value={formData.pic} onChange={(e) => setFormData({...formData, pic: e.target.value})} /></div>
              <Button onClick={handleSave} className="w-full">{t('save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {suppliers.map(supplier => (
          <motion.div key={supplier.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white rounded-lg border flex justify-between items-center">
            <div>
              <p className="font-semibold">{supplier.name}</p>
              <p className="text-sm text-gray-500">{supplier.warehouse_address}</p>
              <p className="text-xs text-gray-400">PIC: {supplier.pic} | Tel: {supplier.phone}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}><Edit className="h-4 w-4" /></Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the supplier.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(supplier.id)}>Delete</AlertDialogAction>
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

export default SupplierData;
