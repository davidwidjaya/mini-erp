import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Eye } from 'lucide-react';
import DeleteInvoiceDialog from '@/components/payment/DeleteInvoiceDialog';
import InvoicePreviewDialog from '@/components/payment/InvoicePreviewDialog';
import { format } from 'date-fns';

const InvoiceValidationList = ({ currentUser, setActiveTab, refreshData }) => {
    const { toast } = useToast();
    const [invoices, setInvoices] = useState([]);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [previewingInvoice, setPreviewingInvoice] = useState(null);

    const fetchInvoices = () => {
        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const pendingValidation = allInvoices.filter(inv => !inv.status);
        const uniqueInvoices = Array.from(new Map(pendingValidation.map(item => [item.id, item])).values());
        setInvoices(uniqueInvoices);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleValidate = (e, invoiceId) => {
        e.stopPropagation();
        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const updatedInvoices = allInvoices.map(inv => 
            inv.id === invoiceId ? { ...inv, status: 'valid' } : inv
        );
        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        toast({ title: "Sukses", description: "Invoice divalidasi dan dipindahkan ke 'Masukkan Outbond'." });
        fetchInvoices();
        setActiveTab('outbond');
        refreshData();
    };

    const handleOpenDeleteDialog = (e, invoice) => {
        e.stopPropagation();
        setInvoiceToDelete(invoice);
        setDeleteDialogOpen(true);
    };
    
    const handlePreview = (invoice) => {
        setPreviewingInvoice(invoice);
    };

    return (
        <div className="p-1">
            <h3 className="text-lg font-bold mb-4">Invoice Baru Menunggu Validasi</h3>
            <div className="space-y-4">
                {invoices.map(invoice => {
                    const totalInvoice = invoice.lineItems.reduce((acc, item) => acc + item.subtotal, 0);
                    const itemsDescription = invoice.lineItems.map(item => item.productName).join(', ');

                    return (
                        <motion.div
                            key={invoice.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handlePreview(invoice)}
                            className="p-4 bg-white rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex-1">
                                <p className="font-bold text-base">{invoice.clientName} - <span className="font-normal">{invoice.noInvoice}</span></p>
                                <p className="text-sm text-gray-700 truncate" title={itemsDescription}>Barang: {itemsDescription}</p>
                                <p className="text-xs text-gray-500">
                                    {format(new Date(invoice.tanggalInvoice), 'dd MMM yyyy')} - Dibuat oleh: {invoice.createdBy}
                                </p>
                                <p className="font-semibold text-gray-800 mt-1">Total: Rp {totalInvoice.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={(e) => handleValidate(e, invoice.id)}>
                                    <Check className="mr-2 h-4 w-4" /> Valid
                                </Button>
                                <Button variant="destructive" onClick={(e) => handleOpenDeleteDialog(e, invoice)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            </div>
                        </motion.div>
                    );
                })}
                {invoices.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Tidak ada invoice baru yang menunggu validasi.</p>
                    </div>
                )}
            </div>
            {invoiceToDelete && (
                <DeleteInvoiceDialog
                    isOpen={isDeleteDialogOpen}
                    setIsOpen={setDeleteDialogOpen}
                    invoice={invoiceToDelete}
                    currentUser={currentUser}
                    onSuccess={() => {
                        fetchInvoices();
                        refreshData();
                    }}
                />
            )}
             <InvoicePreviewDialog 
                isOpen={!!previewingInvoice}
                setIsOpen={() => setPreviewingInvoice(null)}
                invoice={previewingInvoice}
            />
        </div>
    );
};

export default InvoiceValidationList;