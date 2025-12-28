import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import InvoicePreviewDialog from '@/components/payment/InvoicePreviewDialog';

const DeletedInvoices = ({ currentUser, refreshData }) => {
    const { toast } = useToast();
    const [deletedInvoices, setDeletedInvoices] = useState([]);
    const [previewingInvoice, setPreviewingInvoice] = useState(null);

    const fetchDeletedInvoices = () => {
        const deleted = JSON.parse(localStorage.getItem('deletedInvoices') || '[]');
        setDeletedInvoices(deleted);
    };

    useEffect(() => {
        fetchDeletedInvoices();
    }, []);

    const handleRecover = (e, invoiceId) => {
        e.stopPropagation();
        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        let deleted = JSON.parse(localStorage.getItem('deletedInvoices') || '[]');
        
        const invoiceToRecover = deleted.find(inv => inv.id === invoiceId);
        if (!invoiceToRecover) return;

        const { deletedBy, deletionReason, deletionDate, ...originalInvoice } = invoiceToRecover;
        const recoveredInvoice = { ...originalInvoice, status: null }; 
        
        const updatedInvoices = [...allInvoices, recoveredInvoice];
        const updatedDeleted = deleted.filter(inv => inv.id !== invoiceId);

        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        localStorage.setItem('deletedInvoices', JSON.stringify(updatedDeleted));

        toast({ title: "Sukses", description: "Invoice berhasil dipulihkan ke 'List Invoice'." });
        fetchDeletedInvoices();
        refreshData();
    };

    return (
        <div className="p-1">
            <h3 className="text-lg font-bold mb-4">Arsip Invoice yang Dihapus</h3>
            <div className="space-y-4">
                {deletedInvoices.map(invoice => {
                    const totalInvoice = invoice.lineItems.reduce((acc, item) => acc + item.subtotal, 0);
                    const itemsDescription = invoice.lineItems.map(item => item.productName).join(', ');

                    return (
                        <motion.div
                            key={invoice.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setPreviewingInvoice(invoice)}
                            className="p-4 bg-red-50 rounded-lg shadow-sm border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-bold text-base">{invoice.clientName} - <span className="font-normal">{invoice.noInvoice}</span></p>
                                    <p className="text-sm text-gray-700 truncate" title={itemsDescription}>Barang: {itemsDescription}</p>
                                    <p className="font-semibold text-gray-800 mt-1">Total: Rp {totalInvoice.toLocaleString('id-ID')}</p>
                                    <p className="text-sm text-gray-700 mt-2">Dibuat oleh: {invoice.createdBy} pada {format(new Date(invoice.tanggalInvoice), 'dd MMM yyyy')}</p>
                                    <p className="text-sm text-red-700 mt-1">Dihapus oleh <span className="font-semibold">{invoice.deletedBy.name}</span>: {invoice.deletionReason}</p>
                                </div>
                                <Button size="sm" onClick={(e) => handleRecover(e, invoice.id)}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Recover
                                </Button>
                            </div>
                        </motion.div>
                    );
                })}
                {deletedInvoices.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Tidak ada invoice yang dihapus.</p>
                    </div>
                )}
            </div>
             <InvoicePreviewDialog 
                isOpen={!!previewingInvoice}
                setIsOpen={() => setPreviewingInvoice(null)}
                invoice={previewingInvoice}
            />
        </div>
    );
};

export default DeletedInvoices;