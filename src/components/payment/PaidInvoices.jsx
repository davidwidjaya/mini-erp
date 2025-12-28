import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import InvoicePreviewDialog from '@/components/payment/InvoicePreviewDialog';
import { motion } from 'framer-motion';

const PaidInvoices = ({ currentUser }) => {
    const { toast } = useToast();
    const [allInvoices, setAllInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        clientName: 'all',
    });
    const [previewingInvoice, setPreviewingInvoice] = useState(null);

    useEffect(() => {
        const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const storedClients = JSON.parse(localStorage.getItem('clients') || '[]');
        setAllInvoices(storedInvoices);
        setClients(storedClients);
    }, []);

    const filteredInvoices = useMemo(() => {
        return allInvoices.filter(invoice => {
            const totalToPay = (invoice.lineItems.reduce((acc, item) => acc + item.subtotal, 0) - (invoice.discount || 0)) * (invoice.includePPN ? 1.11 : 1) + (invoice.biayaPengiriman || 0);
            const alreadyPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const isPaid = alreadyPaid >= totalToPay;
            if (!isPaid) return false;

            const invoiceDate = new Date(invoice.tanggalInvoice);
            const monthMatch = invoiceDate.getMonth() + 1 === filters.month;
            const yearMatch = invoiceDate.getFullYear() === filters.year;
            const clientMatch = filters.clientName === 'all' || invoice.clientName === filters.clientName;
            
            return monthMatch && yearMatch && clientMatch;
        });
    }, [allInvoices, filters]);

    const handleExport = () => {
        if (filteredInvoices.length === 0) {
            toast({ title: 'No Data', description: 'Tidak ada data untuk diekspor pada periode ini.', variant: 'destructive' });
            return;
        }
        const dataToExport = filteredInvoices.map(inv => {
            const totalPaid = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const lastPayment = (inv.payments || []).slice(-1)[0];
            return {
                'No Invoice': inv.noInvoice,
                'Tanggal Invoice': format(new Date(inv.tanggalInvoice), 'dd-MM-yyyy'),
                'Nama Pembeli': inv.clientName,
                'Total Tagihan': inv.lineItems.reduce((acc, item) => acc + item.subtotal, 0),
                'Total Terbayar': totalPaid,
                'Tanggal Lunas': lastPayment ? format(new Date(lastPayment.date), 'dd-MM-yyyy') : 'N/A',
            };
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Invoice Lunas");
        XLSX.writeFile(wb, `Invoice_Lunas_${filters.clientName}_${filters.month}-${filters.year}.xlsx`);
        toast({ title: "Export Berhasil", description: "Daftar invoice lunas berhasil diekspor." });
    };

    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(0, i), 'MMMM') }));
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="p-1">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold">Arsip Invoice Lunas</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={filters.month.toString()} onValueChange={(val) => setFilters(f => ({ ...f, month: parseInt(val) }))}>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="Bulan" /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={filters.year.toString()} onValueChange={(val) => setFilters(f => ({ ...f, year: parseInt(val) }))}>
                        <SelectTrigger className="w-[100px]"><SelectValue placeholder="Tahun" /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={filters.clientName} onValueChange={(val) => setFilters(f => ({ ...f, clientName: val }))}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Nama Pembeli" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Pembeli</SelectItem>
                            {clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
                </div>
            </div>
            <div className="space-y-3">
                {filteredInvoices.map(invoice => {
                    const totalInvoice = invoice.lineItems.reduce((acc, item) => acc + item.subtotal, 0);
                    const itemsDescription = invoice.lineItems.map(item => item.productName).join(', ');
                    return (
                        <motion.div
                            key={invoice.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setPreviewingInvoice(invoice)}
                            className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-green-400 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex-1">
                                <p className="font-bold text-base">{invoice.clientName} - <span className="font-normal">{invoice.noInvoice}</span></p>
                                <p className="text-sm text-gray-700 truncate" title={itemsDescription}>Barang: {itemsDescription}</p>
                                <p className="text-xs text-gray-500">
                                    {format(new Date(invoice.tanggalInvoice), 'dd MMM yyyy')} - Dibuat oleh: {invoice.createdBy}
                                </p>
                                <p className="font-semibold text-gray-800 mt-1">Total: Rp {totalInvoice.toLocaleString('id-ID')}</p>
                                <p className="text-sm text-green-600">Lunas pada: {invoice.payments && invoice.payments.length > 0 ? format(new Date(invoice.payments.slice(-1)[0].date), 'dd MMM yyyy') : 'N/A'}</p>
                            </div>
                        </motion.div>
                    );
                })}
                {filteredInvoices.length === 0 && (
                    <div className="text-center py-10"><p className="text-gray-500">Tidak ada arsip invoice lunas untuk periode ini.</p></div>
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

export default PaidInvoices;