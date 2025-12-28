import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, FileDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

const NoPriceYet = () => {
    const { toast } = useToast();
    const [productsWithoutPrice, setProductsWithoutPrice] = useState([]);
    const fileInputRef = useRef(null);

    const fetchData = () => {
        const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const allCosts = JSON.parse(localStorage.getItem('productCosts') || '[]');
        const productsWithPriceIds = new Set(allCosts.map(c => c.productId));
        const filtered = allProducts.filter(p => !productsWithPriceIds.has(p.id.toString()));
        setProductsWithoutPrice(filtered);
    };

    useEffect(() => {
        fetchData();
        // Listen for changes in localStorage from other components
        window.addEventListener('storage', fetchData);
        return () => window.removeEventListener('storage', fetchData);
    }, []);

    const handleExport = () => {
        if (productsWithoutPrice.length === 0) {
            toast({ title: 'Info', description: 'Semua barang sudah memiliki harga.' });
            return;
        }
        const dataToExport = productsWithoutPrice.map(p => ({
            'SKU': p.sku,
            'Nama Barang': p.name,
            'Harga Modal': '',
            'Tanggal Aktif': '',
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Barang Belum Berharga");
        XLSX.writeFile(wb, "Barang_Belum_Berharga.xlsx");
        toast({ title: "Export Successful", description: "Data exported to Excel." });
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
                const json = XLSX.utils.sheet_to_json(worksheet);

                let importedCount = 0;
                const currentCosts = JSON.parse(localStorage.getItem('productCosts') || '[]');
                const allProducts = JSON.parse(localStorage.getItem('products') || '[]');

                json.forEach(row => {
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
                toast({ title: "Import Successful", description: `${importedCount} prices have been added.` });
                fetchData(); // Refresh the list
                window.dispatchEvent(new Event('storage')); // Notify other components

            } catch (error) {
                toast({ title: "Import Failed", description: "File format is incorrect.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null;
    };

    const downloadFormat = () => {
        const format = [{ 'SKU': '', 'Nama Barang': '', 'Harga Modal': '', 'Tanggal Aktif': 'YYYY-MM-DD' }];
        const ws = XLSX.utils.json_to_sheet(format);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Format Import Harga");
        XLSX.writeFile(wb, "Format_Import_Harga.xlsx");
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Button variant="outline" className="flex-1" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current.click()}><Upload className="mr-2 h-4 w-4" />Import</Button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                <Button variant="outline" className="flex-1" onClick={downloadFormat}><FileDown className="mr-2 h-4 w-4" />Format</Button>
            </div>
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {productsWithoutPrice.length > 0 ? productsWithoutPrice.map(product => (
                    <motion.div key={product.id} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                        </div>
                    </motion.div>
                )) : (
                    <div className="text-center py-10 flex flex-col items-center justify-center text-gray-500">
                        <AlertTriangle className="w-10 h-10 mb-2 text-green-500"/>
                        <p className="font-semibold">Bagus!</p>
                        <p>Semua barang sudah memiliki harga.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoPriceYet;