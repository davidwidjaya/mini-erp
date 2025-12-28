import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarPlus as CalendarIcon, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import InvoicePreviewDialog from '@/components/payment/InvoicePreviewDialog';

const UnpaidInvoices = ({ currentUser }) => {
    const { toast } = useToast();
    const [invoices, setInvoices] = useState([]);
    const [filters, setFilters] = useState({ showNoReceived: false });
    const [previewingInvoice, setPreviewingInvoice] = useState(null);

    const fetchInvoices = () => {
        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const invoicesWithOutbond = allInvoices.filter(inv => inv.outbondDate);
        const sortedInvoices = invoicesWithOutbond.sort((a, b) => new Date(b.tanggalInvoice) - new Date(a.tanggalInvoice));
        setInvoices(sortedInvoices);
    };

    useEffect(() => { 
        fetchInvoices();
        const handleStorageChange = () => fetchInvoices();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateInvoiceData = (invoiceId, field, value) => {
        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const targetInvoice = allInvoices.find(inv => inv.id === invoiceId);

        if (field === 'receivedDate' && value && targetInvoice.outbondDate && new Date(value) < new Date(targetInvoice.outbondDate)) {
             toast({ title: "Error", description: "Tanggal diterima tidak boleh sebelum tanggal outbond.", variant: "destructive" });
             return;
        }

        const updatedInvoices = allInvoices.map(inv => {
            if (inv.id === invoiceId) {
                return { ...inv, [field]: value };
            }
            return inv;
        });
        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        fetchInvoices();
    };

    const addPayment = (invoiceId, paymentAmount, paymentDate) => {
        const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const invoice = allInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const totalToPay = (invoice.lineItems.reduce((acc, item) => acc + item.subtotal, 0) - (invoice.discount || 0));
        const alreadyPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
        const remainingBalance = totalToPay - alreadyPaid;

        if (paymentAmount > remainingBalance) {
            toast({ title: "Error", description: `Pembayaran tidak boleh melebihi sisa tagihan (Rp ${remainingBalance.toLocaleString('id-ID')}).`, variant: "destructive" });
            return;
        }

        const newPayment = { date: paymentDate, amount: paymentAmount, by: currentUser.name };
        const updatedPayments = [...(invoice.payments || []), newPayment];
        
        const updatedInvoices = allInvoices.map(inv => {
            if (inv.id === invoiceId) {
                return { ...inv, payments: updatedPayments };
            }
            return inv;
        });

        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        fetchInvoices();
        toast({ title: "Success", description: "Pembayaran berhasil dicatat." });
    };

    const getDueDateAndStatus = (invoice) => {
        let dueDate;
        switch (invoice.paymentTerm) {
            case 'tempo': dueDate = invoice.paymentDueDate ? new Date(invoice.paymentDueDate) : null; break;
            case 'sebelum-kirim': dueDate = invoice.outbondDate ? new Date(invoice.outbondDate) : null; break;
            case 'setelah-terima': dueDate = invoice.receivedDate ? new Date(invoice.receivedDate) : null; break;
            default: dueDate = null;
        }
        if (!dueDate) return { colorClass: '', statusText: 'Menunggu info' };

        const daysOverdue = differenceInDays(new Date(), dueDate);
        if (daysOverdue <= 10) return { colorClass: 'border-l-4 border-gray-400', statusText: `Jatuh tempo pada ${format(dueDate, 'dd MMM yyyy')}` };
        if (daysOverdue <= 30) return { colorClass: 'bg-yellow-50 border-l-4 border-yellow-400', statusText: `${daysOverdue} hari telat` };
        return { colorClass: 'bg-red-50 border-l-4 border-red-400', statusText: `${daysOverdue} hari telat` };
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const totalToPay = (invoice.lineItems.reduce((acc, item) => acc + item.subtotal, 0) - (invoice.discount || 0));
            const alreadyPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const isUnpaid = alreadyPaid < totalToPay;
            
            const passesFilter = !filters.showNoReceived || !invoice.receivedDate;

            return isUnpaid && passesFilter;
        });
    }, [invoices, filters]);


    return (
        <div className="p-1">
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <h3 className="text-lg font-bold">Daftar Invoice Belum Lunas</h3>
                <div className="flex items-center space-x-2"><Checkbox id="filterReceived" checked={filters.showNoReceived} onCheckedChange={(c) => setFilters(f => ({ ...f, showNoReceived: c }))} /><Label htmlFor="filterReceived">Belum Diterima</Label></div>
            </div>
            <div className="space-y-4">
                {filteredInvoices.map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} getDueDateAndStatus={getDueDateAndStatus} updateInvoiceData={updateInvoiceData} addPayment={addPayment} onPreview={() => setPreviewingInvoice(invoice)} />)}
                {filteredInvoices.length === 0 && <p className="text-center text-gray-500 py-8">Tidak ada invoice yang perlu ditangani.</p>}
            </div>
             <InvoicePreviewDialog 
                isOpen={!!previewingInvoice}
                setIsOpen={() => setPreviewingInvoice(null)}
                invoice={previewingInvoice}
            />
        </div>
    );
};

const InvoiceCard = ({ invoice, getDueDateAndStatus, updateInvoiceData, addPayment, onPreview }) => {
    const totalToPay = (invoice.lineItems.reduce((acc, item) => acc + item.subtotal, 0) - (invoice.discount || 0));
    const alreadyPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const remainingBalance = totalToPay - alreadyPaid;
    const { colorClass, statusText } = getDueDateAndStatus(invoice);
    const itemsDescription = invoice.lineItems.map(item => item.productName).join(', ');
    
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const handleAddPayment = () => {
        if (!paymentAmount || !paymentDate) return;
        addPayment(invoice.id, parseFloat(paymentAmount), paymentDate);
        setPaymentAmount('');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 bg-white rounded-lg shadow-sm ${colorClass}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Info Column */}
                <div className="md:col-span-1 space-y-1 cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={onPreview}>
                    <p className="font-bold text-base">{invoice.clientName} - <span className="font-normal">{invoice.noInvoice}</span></p>
                    <p className="text-sm text-gray-700 truncate" title={itemsDescription}>Barang: {itemsDescription}</p>
                    <p className="text-xs text-gray-500">
                        {format(new Date(invoice.tanggalInvoice), 'dd MMM yyyy')} - Dibuat oleh: {invoice.createdBy}
                    </p>
                    <p className="font-semibold text-lg mt-2">Rp {totalToPay.toLocaleString('id-ID')}</p>
                    <p className={`text-sm font-medium ${statusText.includes('telat') ? 'text-red-600' : 'text-gray-600'}`}>{statusText}</p>
                </div>
                {/* Dates Column */}
                <div className="md:col-span-1 space-y-2">
                    <DatePicker label="Tgl Outbond" date={invoice.outbondDate} onDateChange={() => {}} disabled={true} />
                    <DatePicker label="Tgl Diterima" date={invoice.receivedDate} onDateChange={(d) => updateInvoiceData(invoice.id, 'receivedDate', d ? d.toISOString().split('T')[0] : null)} />
                </div>
                {/* Payment Column */}
                <div className="md:col-span-1 space-y-2">
                    <p className="text-sm">Sisa Tagihan: <span className="font-bold">Rp {remainingBalance.toLocaleString('id-ID')}</span></p>
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                             <Label className="absolute -top-2 left-2 text-xs bg-white px-1 text-gray-500">Tgl Bayar</Label>
                             <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                        </div>
                        <Input type="number" placeholder="Nominal" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                        <Button size="icon" onClick={handleAddPayment}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                        {(invoice.payments || []).map((p, i) => <p key={i}>Dibayar Rp {p.amount.toLocaleString('id-ID')} pada {format(new Date(p.date), 'dd/MM/yy')} oleh {p.by}</p>)}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const DatePicker = ({ label, date, onDateChange, disabled=false }) => (
    <div className="flex items-center gap-2">
        <Label className="w-24 text-sm">{label}</Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"} disabled={disabled} className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(new Date(date), "PPP") : <span>Pilih tanggal</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date ? new Date(date) : undefined} onSelect={onDateChange} initialFocus /></PopoverContent>
        </Popover>
    </div>
);

export default UnpaidInvoices;