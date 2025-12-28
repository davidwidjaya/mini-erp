import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Download, Upload, FileDown, History, Undo, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { format, parseISO, startOfToday, isBefore } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const BottomPrice = ({ currentUser }) => {
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [bottomPrices, setBottomPrices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [priceInputs, setPriceInputs] = useState({});
    const [dateInputs, setDateInputs] = useState({});
    const fileInputRef = useRef(null);
    const [lastChange, setLastChange] = useState(null);

    useEffect(() => {
        setProducts(JSON.parse(localStorage.getItem('products') || '[]'));
        setBottomPrices(JSON.parse(localStorage.getItem('bottomPrices') || '[]'));
        setCategories([...new Set(JSON.parse(localStorage.getItem('products') || '[]').map(p => p.category))].filter(Boolean));
    }, []);

    const handlePriceChange = (productId, value) => {
        if (/^\d*\.?\d*$/.test(value)) {
            setPriceInputs(prev => ({ ...prev, [productId]: value }));
        }
    };

    const handleDateChange = (productId, value) => {
        setDateInputs(prev => ({ ...prev, [productId]: value }));
    };

    const handleSavePrice = (productId) => {
        const newPrice = priceInputs[productId];
        const activeDate = dateInputs[productId] || format(new Date(), 'yyyy-MM-dd');

        if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
            toast({ title: "Error", description: "Please enter a valid positive price.", variant: "destructive" });
            return;
        }
        if (isBefore(new Date(activeDate), startOfToday())) {
            toast({ title: "Error", description: "Active date cannot be in the past.", variant: "destructive" });
            return;
        }

        const newEntry = {
            id: Date.now(),
            productId,
            price: parseFloat(newPrice),
            activeDate,
            user: currentUser.name,
            timestamp: new Date().toISOString(),
        };

        const previousState = [...bottomPrices];
        const updatedPrices = [...bottomPrices, newEntry];
        
        localStorage.setItem('bottomPrices', JSON.stringify(updatedPrices));
        setBottomPrices(updatedPrices);
        setLastChange({ previousState, productId });

        setPriceInputs(prev => ({ ...prev, [productId]: '' }));
        setDateInputs(prev => ({ ...prev, [productId]: '' }));
        toast({ title: "Success", description: "Bottom price saved." });
        window.dispatchEvent(new Event('storage'));
    };

    const handleUndo = () => {
        if (!lastChange) {
            toast({ title: "Info", description: "No recent change to undo." });
            return;
        }
        localStorage.setItem('bottomPrices', JSON.stringify(lastChange.previousState));
        setBottomPrices(lastChange.previousState);
        setLastChange(null);
        toast({ title: "Success", description: "Last change has been undone." });
        window.dispatchEvent(new Event('storage'));
    };

    const productsByCategory = useMemo(() => {
        const grouped = {};
        products.forEach(p => {
            const category = p.category || 'Uncategorized';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(p);
        });
        return grouped;
    }, [products]);

    const getLatestPrice = (productId) => {
        const today = new Date();
        return bottomPrices
            .filter(p => p.productId === productId && !isBefore(today, new Date(p.activeDate)))
            .sort((a, b) => new Date(b.activeDate) - new Date(a.activeDate) || b.id - a.id)[0];
    };

    const downloadLog = (productId = null) => {
        const pricesToExport = productId ? bottomPrices.filter(p => p.productId === productId) : bottomPrices;
        const data = pricesToExport.map(p => {
            const product = products.find(prod => prod.id === p.productId);
            return {
                'SKU': product?.sku,
                'Kategori': product?.category,
                'Nama Barang': product?.name,
                'Harga Bottom': p.price,
                'Tanggal Aktif': p.activeDate,
                'Diubah Oleh': p.user,
                'Waktu Perubahan': format(parseISO(p.timestamp), 'yyyy-MM-dd HH:mm:ss')
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Log Harga Bottom");
        XLSX.writeFile(wb, productId ? `Log_Harga_Bottom_${products.find(p=>p.id===productId)?.sku || 'Unknown'}.csv` : "Log_Harga_Bottom_Semua.csv");
    };

    const handleExport = () => downloadLog(null);

    const downloadFormat = () => {
        const formatData = [{ 'SKU': '', 'Harga Bottom': '', 'Tanggal Aktif (YYYY-MM-DD)': '' }];
        const ws = XLSX.utils.json_to_sheet(formatData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Format Import");
        XLSX.writeFile(wb, "Format_Import_Harga_Bottom.xlsx");
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {raw: false});

                const newPrices = [];
                for (const row of json) {
                    const product = products.find(p => p.sku === row['SKU']);
                    if (!product) continue;
                    const price = parseFloat(row['Harga Bottom']);
                    const activeDate = row['Tanggal Aktif (YYYY-MM-DD)'];
                    if (!price || isNaN(price) || !activeDate || isBefore(new Date(activeDate), startOfToday())) {
                        continue;
                    }
                    newPrices.push({
                        id: Date.now() + Math.random(),
                        productId: product.id,
                        price,
                        activeDate,
                        user: currentUser.name,
                        timestamp: new Date().toISOString(),
                    });
                }
                
                const previousState = [...bottomPrices];
                const updatedPrices = [...bottomPrices, ...newPrices];
                localStorage.setItem('bottomPrices', JSON.stringify(updatedPrices));
                setBottomPrices(updatedPrices);
                setLastChange({ previousState, productId: null });
                toast({ title: "Import Successful", description: `${newPrices.length} prices imported.` });
                window.dispatchEvent(new Event('storage'));
            } catch (error) {
                toast({ title: "Import Failed", description: "File format is incorrect.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null;
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export Semua Log</Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import Data</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Konfirmasi Import</AlertDialogTitle><AlertDialogDescription>Anda akan mengimpor data harga baru. Ini akan menambahkan entri baru dan tidak dapat dibatalkan secara massal. Lanjutkan?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => fileInputRef.current.click()}>Lanjutkan</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImport} />
                <Button variant="outline" onClick={downloadFormat}><FileDown className="mr-2 h-4 w-4" />Download Format</Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" disabled={!lastChange}><Undo className="mr-2 h-4 w-4" />Undo</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Konfirmasi Undo</AlertDialogTitle><AlertDialogDescription>Anda akan membatalkan perubahan harga terakhir. Aksi ini tidak dapat diulang. Lanjutkan?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUndo}>Lanjutkan</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="space-y-2">
                {categories.sort().map(category => (
                    <div key={category}>
                        <button
                            className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex justify-between items-center"
                            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                        >
                            <span className="font-semibold">{category}</span>
                            <ChevronRight className={cn('transform transition-transform', activeCategory === category && 'rotate-90')} />
                        </button>
                        <AnimatePresence>
                            {activeCategory === category && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="p-4 border border-t-0 rounded-b-lg">
                                        <div className="grid grid-cols-1 divide-y">
                                            {(productsByCategory[category] || []).map(p => {
                                                const latestPrice = getLatestPrice(p.id);
                                                return (
                                                    <div key={p.id} className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                        <div className="md:col-span-1">
                                                            <p className="font-semibold text-sm">{p.name}</p>
                                                            <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                                                            {latestPrice ? (
                                                                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                                                                    Aktif: Rp {latestPrice.price.toLocaleString('id-ID')} (mulai {format(new Date(latestPrice.activeDate), 'dd MMM yyyy')})
                                                                </span>
                                                            ) : (
                                                                <span className="inline-block bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                                                                    Harga bottom belum di set
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                                                            <Input type="text" className="w-32" placeholder="Harga baru" value={priceInputs[p.id] || ''} onChange={(e) => handlePriceChange(p.id, e.target.value)} />
                                                            <Input type="date" className="w-40" value={dateInputs[p.id] || ''} onChange={(e) => handleDateChange(p.id, e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />
                                                            <Button size="sm" onClick={() => handleSavePrice(p.id)}><Save className="h-4 w-4 mr-2"/>Simpan</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => downloadLog(p.id)}><History className="h-4 w-4"/></Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BottomPrice;