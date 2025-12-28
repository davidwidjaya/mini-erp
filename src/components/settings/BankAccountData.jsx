
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Banknote } from 'lucide-react';
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
import { fetchBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from '@/lib/supabaseOperations';

const BankAccountData = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ bank_name: '', account_number: '', account_holder: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const data = await fetchBankAccounts();
        setBankAccounts(data);
    } catch(e) {
        toast({ title: "Error", description: "Failed to load bank accounts", variant: "destructive" });
    }
  }

  const resetForm = () => {
    setFormData({ bank_name: '', account_number: '', account_holder: '' });
    setEditingAccount(null);
  }

  const handleSave = async () => {
    try {
        if (editingAccount) {
             await updateBankAccount(editingAccount.id, formData);
             toast({ title: t('success'), description: 'Account updated' });
        } else {
             await createBankAccount(formData);
             toast({ title: t('success'), description: 'Account added' });
        }
        await loadData();
        setIsOpen(false);
        resetForm();
    } catch (e) {
        toast({ title: "Error", description: "Failed to save bank account", variant: "destructive" });
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData(account);
    setIsOpen(true);
  }

  const handleDelete = async (id) => {
    try {
          await deleteBankAccount(id);
          await loadData();
          toast({ title: t('success'), description: 'Account deleted' });
    } catch (e) {
          toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
    }
  }

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2"><Banknote className="h-5 w-5" /> {t('bankAccounts')}</h3>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />{t('addAccount')}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingAccount ? t('edit') : t('addAccount')}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>{t('bankName')}</Label><Input value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} /></div>
              <div><Label>{t('accountNumber')}</Label><Input value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} /></div>
              <div><Label>{t('accountHolder')}</Label><Input value={formData.account_holder} onChange={(e) => setFormData({...formData, account_holder: e.target.value})} /></div>
              <Button onClick={handleSave} className="w-full">{t('save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {bankAccounts.map(account => (
          <motion.div key={account.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white rounded-lg border flex justify-between items-center">
            <div>
              <p className="font-semibold">{account.bank_name} - {account.account_number}</p>
              <p className="text-sm text-gray-500">{account.account_holder}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}><Edit className="h-4 w-4" /></Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the bank account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(account.id)}>Delete</AlertDialogAction>
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

export default BankAccountData;
