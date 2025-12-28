import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
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


const SignatureManagement = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [signatures, setSignatures] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', position: '', signature: '' });
  const [editingSig, setEditingSig] = useState(null);

  useEffect(() => {
    setSignatures(JSON.parse(localStorage.getItem('signatures') || '[]'));
  }, []);

  const resetForm = () => {
    setFormData({ name: '', position: '', signature: '' });
    setEditingSig(null);
  };

  const handleSave = () => {
    let updated;
    if (editingSig) {
      updated = signatures.map(s => s.id === editingSig.id ? { ...formData, id: editingSig.id } : s);
      toast({ title: t('success'), description: 'Signature updated' });
    } else {
      const newSig = { ...formData, id: Date.now() };
      updated = [...signatures, newSig];
      toast({ title: t('success'), description: 'Signature added' });
    }
    
    localStorage.setItem('signatures', JSON.stringify(updated));
    setSignatures(updated);
    setIsOpen(false);
    resetForm();
  };
  
  const handleEdit = (sig) => {
    setEditingSig(sig);
    setFormData({ name: sig.name, position: sig.position, signature: sig.signature });
    setIsOpen(true);
  };

  const handleDelete = (id) => {
    const updated = signatures.filter(s => s.id !== id);
    localStorage.setItem('signatures', JSON.stringify(updated));
    setSignatures(updated);
    toast({ title: t('success'), description: 'Signature deleted' });
  };


  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">{t('signatures')}</h3>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />{t('addSignature')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSig ? t('editSignature') : t('addSignature')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t('name')}</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div><Label>{t('position')}</Label><Input value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} /></div>
              <div>
                <Label>{t('signature')}</Label>
                <Input type="file" accept="image/png, image/jpeg" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData({...formData, signature: reader.result});
                    reader.readAsDataURL(file);
                  }
                }} />
                {formData.signature && <img src={formData.signature} alt="Signature Preview" className="mt-2 h-16 object-contain border p-1 rounded" />}
              </div>
              <Button onClick={handleSave} className="w-full">{t('save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {signatures.map(sig => (
          <motion.div key={sig.id} className="p-4 bg-white rounded-lg border flex justify-between items-center">
            <div className="flex items-center gap-4">
                {sig.signature && <img src={sig.signature} alt={sig.name} className="h-12 w-24 object-contain" />}
                <div>
                    <p className="font-semibold">{sig.name}</p>
                    <p className="text-sm text-gray-600">{sig.position}</p>
                </div>
            </div>
             <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(sig)}><Edit className="h-4 w-4" /></Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the signature.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(sig.id)}>Delete</AlertDialogAction>
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

export default SignatureManagement;