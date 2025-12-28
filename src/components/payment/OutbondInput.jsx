import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import DeleteInvoiceDialog from '@/components/payment/DeleteInvoiceDialog';
import InvoicePreviewDialog from '@/components/payment/InvoicePreviewDialog';

const OutbondInput = ({ currentUser, setActiveTab, refreshData }) => {
    const { toast } = useToast();
    const [invoices, setInvoices] = useState([]);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [previewingInvoice, setPreviewingInvoice] = useState(null);

    const fetchInvoices = () => {
        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const validForOutbond = allInvoices.filter(inv => inv.status === 'valid' && !inv.outbondDate);
        setInvoices(validForOutbond);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);
    
    const handleOpenDeleteDialog = (e, invoice) => {
        e.stopPropagation();
        setInvoiceToDelete(invoice);
        setDeleteDialogOpen(true);
    };
    
    const handleDateUpdate = (invoiceId, date) => {
        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const targetInvoice = allInvoices.find(inv => inv.id === invoiceId);

        if (new Date(date) < new Date(targetInvoice.tanggalInvoice)) {
            toast({
                title: "Error Validasi",
                description: "Tanggal outbond tidak boleh sebelum tanggal invoice.",
                variant: "destructive",
            });
            return;
        }

        const updatedInvoices = allInvoices.map(inv => 
            inv.id === invoiceId ? { ...inv, outbondDate: date } : inv
        );
        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        
        toast({ title: "Sukses", description: "Tanggal outbond berhasil disimpan." });
        
        refreshData();
        setActiveTab('unpaid');
    };
    
    const handlePreview = (invoice) => {
        setPreviewingInvoice(invoice);
    };

    return (
        <div className="p-1">
            <h3 className="text-lg font-bold mb-4">Invoice Valid Menunggu Tanggal Keluar Barang</h3>
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
                            className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-400 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex-1 min-w-[200px]">
                                <p className="font-bold text-base">{invoice.clientName} - <span className="font-normal">{invoice.noInvoice}</span></p>
                                <p className="text-sm text-gray-700 truncate" title={itemsDescription}>Barang: {itemsDescription}</p>
                                <p className="text-xs text-gray-500">
                                    {format(new Date(invoice.tanggalInvoice), 'dd MMM yyyy')} - Dibuat oleh: {invoice.createdBy}
                                </p>
                                <p className="font-semibold text-gray-800 mt-1">Total: Rp {totalInvoice.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-[200px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            Tanggal Outbond
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            onSelect={(date) => handleDateUpdate(invoice.id, date.toISOString().split('T')[0])}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Button variant="destructive" size="icon" onClick={(e) => handleOpenDeleteDialog(e, invoice)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    );
                })}
                {invoices.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Tidak ada invoice yang perlu di-outbond.</p>
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

export default OutbondInput;