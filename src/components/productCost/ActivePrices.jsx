import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Download, Upload, FileDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

const ActivePrices = ({ products: initialProducts, costs: initialCosts }) => {
    const { toast } = useToast();
    const [products, setProducts] = useState(initialProducts);
    const [costs, setCosts] = useState(initialCosts);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const fileInputRef = useRef(null);
    
    useEffect(() => {
        setProducts(initialProducts);
        setCosts(initialCosts);
        setCategories(JSON.parse(localStorage.getItem('productCategories') || '[]'));
    }, [initialProducts, initialCosts]);

    const productsByCategory = useMemo(() => {
        const grouped = {};
        products.forEach(p => {
            const category = p.category || 'Uncategorized';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(p);
        });
        return grouped;
    }, [products]);

    const handleExport = (category) => {
        const productsInCategory = productsByCategory[category];
        if (!productsInCategory) return;

        const dataToExport = [];
        productsInCategory.forEach(p => {
            const productCosts = costs.filter(c => c.productId === p.id.toString()).sort((a,b) => new Date(b.activeDate) - new Date(a.activeDate));
            if (productCosts.length > 0) {
                 productCosts.forEach(c => {
                    dataToExport.push({
                        'Kategori': category,
                        'SKU': p.sku,
                        'Nama Barang': p.name,
                        'Harga Modal': c.costPrice,
                        'Tanggal Aktif': c.activeDate,
                    });
                 });
            } else {
                 dataToExport.push({
                    'Kategori': category,
                    'SKU': p.sku,
                    'Nama Barang': p.name,
                    'Harga Modal': '',
                    'Tanggal Aktif': '',
                });
            }
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Harga Aktif - ${category}`);
        XLSX.writeFile(wb, `Harga_Aktif_${category}.xlsx`);
        toast({ title: "Export Successful", description: `Data for ${category} exported.` });
    };

    const handleImport = (e, category) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                let importedCount = 0;
                const currentCosts = JSON.parse(localStorage.getItem('productCosts') || '[]');
                const allProducts = JSON.parse(localStorage.getItem('products') || '[]');

                json.forEach(row => {
                    if (row['Kategori'] !== category) return;
                    const product = allProducts.find(p => p.sku === row['SKU']);
                    if (product && row['Harga Modal'] && row['Tanggal Aktif']) {
                        const costData = {
                            productId: product.id.toString(),
                            costPrice: row['Harga Modal'],
                            activeDate: row['Tanggal Aktif'],
                            id: Date.now() + Math.random(),
                        };
                        currentCosts.push(costData);
                        importedCount++;
                    }
                });

                localStorage.setItem('productCosts', JSON.stringify(currentCosts));
                toast({ title: "Import Successful", description: `${importedCount} prices have been added for ${category}.` });
                window.dispatchEvent(new Event('storage'));

            } catch (error) {
                toast({ title: "Import Failed", description: "File format is incorrect.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null; // Reset file input
    };

    const downloadFormat = (category) => {
        const format = [{ 'Kategori': category, 'SKU': '', 'Nama Barang': '', 'Harga Modal': '', 'Tanggal Aktif': 'YYYY-MM-DD' }];
        const ws = XLSX.utils.json_to_sheet(format);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Format Import - ${category}`);
        XLSX.writeFile(wb, `Format_Import_Harga_${category}.xlsx`);
    };

    return (
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
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 border border-t-0 rounded-b-lg space-y-3">
                                     <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleExport(category)}><Download className="mr-2 h-4 w-4" />Export</Button>
                                        <Button size="sm" variant="outline" onClick={() => fileInputRef.current.click()}><Upload className="mr-2 h-4 w-4" />Import</Button>
                                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={(e) => handleImport(e, category)} />
                                        <Button size="sm" variant="outline" onClick={() => downloadFormat(category)}><FileDown className="mr-2 h-4 w-4" />Format</Button>
                                    </div>
                                    {(productsByCategory[category] || []).map(p => {
                                        const productCosts = costs.filter(c => c.productId === p.id.toString()).sort((a,b) => new Date(b.activeDate) - new Date(a.activeDate));
                                        return (
                                            <div key={p.id} className="p-2 border-b">
                                                <p className="font-semibold text-sm">{p.name} <span className="text-gray-500 font-normal">({p.sku})</span></p>
                                                {productCosts.length > 0 ? (
                                                    <div className="text-xs pl-4 mt-1">
                                                        {productCosts.map(c => (
                                                            <p key={c.id} className="text-gray-700">Rp {parseInt(c.costPrice).toLocaleString('id-ID')} - Aktif: {new Date(c.activeDate).toLocaleDateString('id-ID')}</p>
                                                        ))}
                                                    </div>
                                                ) : <p className="text-xs text-red-500 pl-4 mt-1">Belum ada harga</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
};

export default ActivePrices;