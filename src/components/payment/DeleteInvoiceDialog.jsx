import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const DeleteInvoiceDialog = ({ isOpen, setIsOpen, invoice, currentUser, onSuccess }) => {
    const [reason, setReason] = useState('');
    const { toast } = useToast();

    const handleDelete = () => {
        if (!reason.trim()) {
            toast({ title: 'Error', description: 'Alasan penghapusan wajib diisi.', variant: 'destructive' });
            return;
        }

        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const deletedInvoices = JSON.parse(localStorage.getItem('deletedInvoices') || '[]');

        const invoiceToDelete = allInvoices.find(inv => inv.id === invoice.id);
        if (!invoiceToDelete) return;

        const updatedInvoices = allInvoices.filter(inv => inv.id !== invoice.id);
        const newDeletedRecord = {
            ...invoiceToDelete,
            deletedBy: { id: currentUser.id, name: currentUser.name },
            deletionReason: reason,
            deletionDate: new Date().toISOString(),
        };
        const updatedDeletedInvoices = [...deletedInvoices, newDeletedRecord];

        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        localStorage.setItem('deletedInvoices', JSON.stringify(updatedDeletedInvoices));

        toast({ title: 'Sukses', description: 'Invoice berhasil dihapus dan dipindahkan ke arsip.' });
        setIsOpen(false);
        setReason('');
        if (onSuccess) onSuccess();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Invoice {invoice.noInvoice}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Invoice ini akan dipindahkan ke arsip "Invoice Dihapus". Tindakan ini tidak dapat dibatalkan secara langsung, namun dapat dipulihkan dari sana.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid w-full items-center gap-1.5 py-4">
                    <Label htmlFor="reason">Alasan Penghapusan (Wajib Diisi)</Label>
                    <Textarea 
                        id="reason" 
                        placeholder="Contoh: Salah input data, permintaan klien, dll." 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteInvoiceDialog;