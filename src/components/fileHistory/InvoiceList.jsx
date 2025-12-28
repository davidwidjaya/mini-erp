import React, { useState, useEffect, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { useToast } from '@/components/ui/use-toast';
    import { CheckCircle, Circle, Trash2, User, Calendar, Download } from 'lucide-react';
    import { Button } from '@/components/ui/button';
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
    import {
      Popover,
      PopoverContent,
      PopoverTrigger,
    } from "@/components/ui/popover";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import * as XLSX from 'xlsx';

    const InvoiceList = ({ currentUser }) => {
        const { toast } = useToast();
        const [invoices, setInvoices] = useState([]);
        const [filter, setFilter] = useState({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
        });

        const fetchInvoices = () => {
            const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            setInvoices(allInvoices);
        };

        useEffect(() => {
            fetchInvoices();
        }, []);

        const filteredInvoices = useMemo(() => {
            return invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.tanggalInvoice);
                return invoiceDate.getMonth() + 1 === filter.month && invoiceDate.getFullYear() === filter.year;
            });
        }, [invoices, filter]);

        const handleExport = () => {
            if (filteredInvoices.length === 0) {
                toast({ title: 'No Data', description: 'There is no data to export for the selected period.', variant: 'destructive' });
                return;
            }
            const dataToExport = filteredInvoices.map(invoice => ({
                'No Invoice': invoice.noInvoice,
                'Tanggal Invoice': new Date(invoice.tanggalInvoice).toLocaleDateString('id-ID'),
                'Nama Klien': invoice.clientName,
                'Total': invoice.lineItems.reduce((sum, item) => sum + item.subtotal, 0) + (invoice.includePPN ? invoice.lineItems.reduce((sum, item) => sum + item.subtotal, 0) * 0.11 : 0) + parseFloat(invoice.biayaPengiriman || 0),
                'Pembuat Order': invoice.createdBy,
            }));
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "List Invoice");
            XLSX.writeFile(wb, `List_Invoice_${filter.month}_${filter.year}.xlsx`);
            toast({ title: "Export Successful", description: "Invoice list exported to Excel."});
        };

        const handleDelete = (invoiceId) => {
            const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
            localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
            setInvoices(updatedInvoices);
            
            const deletedLogs = JSON.parse(localStorage.getItem('deletedFiles') || '[]');
            const deletedInvoice = invoices.find(inv => inv.id === invoiceId);
            deletedLogs.push({
                id: Date.now(),
                fileName: deletedInvoice?.noInvoice || 'Unknown',
                deletedBy: currentUser.name,
                deletedAt: new Date().toISOString(),
                reason: 'Deleted from Invoice List'
            });
            localStorage.setItem('deletedFiles', JSON.stringify(deletedLogs));

            toast({ title: 'Success', description: 'Invoice has been deleted.' });
        };
        
        const canDelete = currentUser.permissions.includes('all') || currentUser.permissions.includes('delete');
        
        const DocStatusIcon = ({ status }) => {
            return status ? <CheckCircle className="h-5 w-5 text-green-500"/> : <Circle className="h-5 w-5 text-gray-300"/>;
        };

        const renderHistoryPopover = (history) => (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="link" size="sm" className="p-0 h-auto">View ({Object.keys(history || {}).length})</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Document History</h4>
                            <p className="text-sm text-muted-foreground">
                                All generation events for this sales order.
                            </p>
                        </div>
                        <div className="grid gap-2 max-h-48 overflow-y-auto">
                            {Object.entries(history || {}).map(([docName, events]) => (
                                <div key={docName}>
                                    <p className="font-semibold text-sm">{docName}:</p>
                                    {events.map((event, index) => (
                                        <div key={index} className="text-xs text-gray-600 pl-2">
                                            <div className="flex items-center gap-1"><User className="h-3 w-3"/> {event.user}</div>
                                            <div className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {new Date(event.date).toLocaleString('id-ID')}</div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            {Object.keys(history || {}).length === 0 && <p className="text-xs text-center text-gray-500">No documents generated yet.</p>}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );

        const months = Array.from({length: 12}, (_, i) => i + 1);
        const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

        return (
            <div className="p-4">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                    <h3 className="text-xl font-bold">Archived Invoice List</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={filter.month.toString()} onValueChange={(value) => setFilter(f => ({...f, month: parseInt(value)}))}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m} value={m.toString()}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filter.year.toString()} onValueChange={(value) => setFilter(f => ({...f, year: parseInt(value)}))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleExport}><Download className="mr-2 h-4 w-4"/>Export</Button>
                    </div>
                </div>
                <div className="space-y-3">
                    {filteredInvoices.map(invoice => (
                        <motion.div
                            key={invoice.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-white rounded-lg border"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{invoice.noInvoice}</p>
                                    <p className="text-sm text-gray-700">{invoice.clientName}</p>
                                    <p className="text-xs text-gray-500">
                                        Created on: {new Date(invoice.createdAt).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                                {canDelete && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-red-500 flex-shrink-0"><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action will permanently delete the invoice record. This cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(invoice.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                            <div className="border-t mt-3 pt-3">
                                <p className="text-sm font-semibold mb-2">Document Status</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                    <div className="flex items-center gap-2"><DocStatusIcon status={invoice.generatedDocs?.Invoice}/> Invoice</div>
                                    <div className="flex items-center gap-2"><DocStatusIcon status={invoice.generatedDocs?.Kwitansi}/> Kwitansi</div>
                                    <div className="flex items-center gap-2"><DocStatusIcon status={invoice.generatedDocs?.DeliveryOrder}/> Delivery Order</div>
                                    <div className="flex items-center gap-2"><DocStatusIcon status={invoice.generatedDocs?.ProformaInvoice}/> Proforma</div>
                                </div>
                                <div className="mt-2">
                                    {renderHistoryPopover(invoice.docHistory)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {filteredInvoices.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No archived invoices found for the selected period.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    export default InvoiceList;