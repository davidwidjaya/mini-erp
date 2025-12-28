import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download } from 'lucide-react';

const MonthlyReport = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [month, setMonth] = useState('');
  const [reportType, setReportType] = useState('');

  const generateData = () => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const [year, mth] = month.split('-');
    
    return invoices
        .filter(inv => new Date(inv.tanggalInvoice).getMonth() + 1 === parseInt(mth) && new Date(inv.tanggalInvoice).getFullYear() === parseInt(year))
        .flatMap(inv => 
            inv.lineItems.map(item => {
                const product = products.find(p => p.id.toString() === item.productId.toString());
                return {
                    date: inv.tanggalInvoice,
                    invoice: inv.noInvoice,
                    client: inv.clientName,
                    productName: product?.name || 'N/A',
                    productCategory: product?.category || 'Uncategorized',
                    sales: item.subtotal,
                    shipping: parseFloat(inv.biayaPengiriman || 0) / inv.lineItems.length, // distribute shipping cost
                    shippingCost: parseFloat(inv.biayaAsliEkspedisi || 0) / inv.lineItems.length, // distribute shipping cost
                };
            })
        );
  }

  const handleDownload = (format) => {
    if (!month || !reportType) {
      toast({ title: t('error'), description: 'Please select month and report type', variant: 'destructive' });
      return;
    }

    const data = generateData();
    if (data.length === 0) {
        toast({ title: 'No Data', description: 'No data found for the selected month.', variant: 'destructive'});
        return;
    }

    // This is where you would filter `data` based on `reportType`
    // For now, we'll use all columns for demonstration
    const reportData = data;
    const headers = ['Date', 'Invoice', 'Client', 'Product', 'Category', 'Sales', 'Shipping', 'Shipping Cost'];
    const body = reportData.map(d => [d.date, d.invoice, d.client, d.productName, d.productCategory, d.sales, d.shipping, d.shippingCost]);

    if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(`Monthly Report - ${month}`, 14, 15);
        doc.autoTable({
            head: [headers],
            body: body,
        });
        doc.save(`MonthlyReport_${month}.pdf`);
    } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(d => ({
            'Date': d.date,
            'Invoice': d.invoice,
            'Client': d.client,
            'Product': d.productName,
            'Category': d.productCategory,
            'Sales': d.sales,
            'Shipping': d.shipping,
            'Shipping Cost': d.shippingCost,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        XLSX.writeFile(workbook, `MonthlyReport_${month}.xlsx`);
    }

    toast({
      title: t('success'),
      description: `Report for ${month} downloaded as ${format.toUpperCase()}`
    });
  };

  return (
    <div className="glass-effect rounded-xl p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('monthlyReport')}</h3>
      
      <div className="space-y-4">
        <div>
          <Label>Select Month</Label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>

        <div>
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger><SelectValue placeholder="Select report type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Hanya Penjualan</SelectItem>
              <SelectItem value="salesShipping">Penjualan & Ongkir</SelectItem>
              <SelectItem value="salesShippingCost">Penjualan, Ongkir, & Cost</SelectItem>
              <SelectItem value="shippingCost">Hanya Ongkir & Cost + Detail Ekspedisi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button className="flex-1" onClick={() => handleDownload('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-800" onClick={() => handleDownload('excel')}>
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;