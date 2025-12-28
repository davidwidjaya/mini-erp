import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Download, Mail, MessageSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SuratJalanModule = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [formData, setFormData] = useState({
    tanggalKirim: new Date().toISOString().split('T')[0],
    noArmada: '',
    namaSopir: '',
    notes: '',
    senderCompanyId: ''
  });

  useEffect(() => {
    const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // UPDATED: Removed the condition "inv.deliveryOption === 'Diantar'"
    // Now showing all generated invoices from the last 30 days regardless of delivery method
    const filtered = allInvoices.filter(inv => {
      const invDate = new Date(inv.tanggalInvoice);
      return inv.generatedDocs?.Invoice && invDate >= thirtyDaysAgo;
    });
    
    const uniqueInvoices = Array.from(new Map(filtered.map(item => [item.id, item])).values());
    setInvoices(uniqueInvoices);

    const storedCompanies = JSON.parse(localStorage.getItem('companies') || '[]');
    setCompanies(storedCompanies);
    if (storedCompanies.length > 0) {
      setFormData(prev => ({...prev, senderCompanyId: storedCompanies[0].id.toString()}));
    }
  }, []);

  const handleInvoiceSelection = (invoiceId) => {
    if (selectedInvoiceIds.includes(invoiceId)) {
      // Deselecting
      setSelectedInvoiceIds(ids => ids.filter(id => id !== invoiceId));
    } else {
      // Selecting
      setSelectedInvoiceIds(ids => [...ids, invoiceId]);
    }
  };

  const generatePdfForInvoice = (invoice, sjNumber) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPos = margin;

    // Load data from localStorage
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    const companyData = companies.find(c => c.id.toString() === formData.senderCompanyId);
    const clientData = clients.find(c => c.id.toString() === invoice.clientId);
    const shippingAddress = clientData?.shippingAddresses[invoice.shippingAddressIndex];

    // 1. Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('SURAT JALAN', pageWidth / 2, yPos + 7, { align: 'center' });
    yPos += 20;

    // 2. Document Details
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    doc.text(`No: ${sjNumber}`, pageWidth - margin, margin, { align: 'right' });
    doc.text(`Tanggal: ${new Date(formData.tanggalKirim).toLocaleDateString('id-ID')}`, pageWidth - margin, margin + 4, { align: 'right' });

    // 3. Address Info
    const halfWidth = pageWidth / 2;
    doc.text(`Kepada Yth:`, margin, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(shippingAddress?.recipientName || clientData?.name || 'N/A', margin, yPos + 4);
    doc.setFont(undefined, 'normal');
    const addressLines = doc.splitTextToSize(shippingAddress?.address || 'Alamat tidak tersedia', halfWidth - margin - 5);
    doc.text(addressLines, margin, yPos + 8);
    let addressHeight = addressLines.length * 3.5;

    doc.text(`Dari:`, halfWidth, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(companyData?.name || 'N/A', halfWidth, yPos + 4);
    doc.setFont(undefined, 'normal');
    const companyAddressLines = doc.splitTextToSize(companyData?.address || 'Alamat tidak tersedia', halfWidth - margin - 5);
    doc.text(companyAddressLines, halfWidth, yPos + 8);
    
    yPos += Math.max(addressHeight, (companyAddressLines.length * 3.5)) + 10;

    // 4. Item Table
    const tableHeader = [['Jenis Barang', 'Quantity', 'Satuan', 'Ref. Invoice']];
    const tableBody = [];
    invoice.lineItems.forEach(item => {
        const product = products.find(p => p.id.toString() === item.productId);
        tableBody.push([
          product?.name || 'Unknown Product',
          item.quantity,
          item.unit,
          invoice.noInvoice
        ]);
    });

    doc.autoTable({
      startY: yPos,
      head: tableHeader,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
      margin: { left: margin, right: margin }
    });

    yPos = doc.autoTable.previous.finalY + 5;

    // 5. Notes Section
    if (formData.notes) {
      doc.setFont(undefined, 'bold');
      doc.text('Catatan:', margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.rect(margin, yPos + 2, pageWidth - (margin * 2), 15); // Box for notes
      const noteLines = doc.splitTextToSize(formData.notes, pageWidth - (margin * 2) - 4);
      doc.text(noteLines, margin + 2, yPos + 6);
      yPos += 20;
    }

    // 6. Signatures
    const signatureY = pageHeight - 35;
    const signatureBlockWidth = (pageWidth - (margin * 2)) / 3;
    
    doc.text('Disiapkan Oleh,', margin + (signatureBlockWidth / 2), signatureY, { align: 'center' });
    doc.text(formData.namaSopir, margin + (signatureBlockWidth / 2), signatureY + 20, { align: 'center' });
    doc.line(margin + 5, signatureY + 21, margin + signatureBlockWidth - 5, signatureY + 21);
    doc.text(`(Sopir - ${formData.noArmada})`, margin + (signatureBlockWidth / 2), signatureY + 24, { align: 'center' });

    doc.text('Diterima Oleh,', margin + signatureBlockWidth + (signatureBlockWidth / 2), signatureY, { align: 'center' });
    doc.line(margin + signatureBlockWidth + 5, signatureY + 21, margin + (2 * signatureBlockWidth) - 5, signatureY + 21);
    doc.text('(Penerima)', margin + signatureBlockWidth + (signatureBlockWidth / 2), signatureY + 24, { align: 'center' });

    doc.text('Mengetahui,', margin + (2 * signatureBlockWidth) + (signatureBlockWidth / 2), signatureY, { align: 'center' });
    doc.line(margin + (2 * signatureBlockWidth) + 5, signatureY + 21, pageWidth - margin - 5, signatureY + 21);
    doc.text('(Gudang)', margin + (2 * signatureBlockWidth) + (signatureBlockWidth / 2), signatureY + 24, { align: 'center' });

    doc.save(`SuratJalan_${(clientData?.name || 'Client').replace(/\s/g, '')}_${invoice.noInvoice.replace(/[/]/g, '-')}.pdf`);
  };

  const handleGenerate = async (outputType) => {
    if (selectedInvoiceIds.length === 0) {
      toast({ title: t('error'), description: t('pleaseSelectInvoice'), variant: 'destructive' });
      return;
    }

    if (!formData.tanggalKirim || !formData.noArmada || !formData.namaSopir || !formData.senderCompanyId) {
      toast({ title: t('error'), description: t('pleaseFillAllFields'), variant: 'destructive' });
      return;
    }
    
    const selectedInvoices = invoices.filter(inv => selectedInvoiceIds.includes(inv.id));
    const existingSuratJalan = JSON.parse(localStorage.getItem('suratJalan') || '[]');
    let newSuratJalanEntries = [];

    if (outputType === 'download') {
      selectedInvoices.forEach((invoice, index) => {
        const sjNumber = `SJ-${invoice.noInvoice.split('/')[1]}-${Date.now().toString().slice(-4)}-${index+1}`;
        generatePdfForInvoice(invoice, sjNumber);

        const suratJalan = {
          id: Date.now() + index,
          invoiceIds: [invoice.id],
          sjNumber: sjNumber,
          ...formData,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString()
        };
        newSuratJalanEntries.push(suratJalan);
      });
    }

    localStorage.setItem('suratJalan', JSON.stringify([...existingSuratJalan, ...newSuratJalanEntries]));

    toast({ title: t('success'), description: `${newSuratJalanEntries.length} ${t('suratJalanGenerated')}` });
    
    if (outputType !== 'download') {
      toast({ description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" });
    }

    setSelectedInvoiceIds([]);
    setFormData(prev => ({ 
        ...prev,
        noArmada: '', 
        namaSopir: '', 
        notes: '' 
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">{t('suratJalan')}</h2>
        <p className="text-gray-600 mt-2">{t('suratJalanSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{t('selectInvoice')}</h3>
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
            {invoices.map(invoice => (
              <div
                key={invoice.id}
                onClick={() => handleInvoiceSelection(invoice.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4 ${
                  selectedInvoiceIds.includes(invoice.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <Checkbox
                  checked={selectedInvoiceIds.includes(invoice.id)}
                  onCheckedChange={() => handleInvoiceSelection(invoice.id)}
                  aria-label={`Select invoice ${invoice.noInvoice}`}
                />
                <div>
                  <p className="font-semibold">{invoice.noInvoice}</p>
                  <p className="text-sm text-gray-600">{invoice.clientName}</p>
                  <p className="text-xs text-gray-500">{new Date(invoice.tanggalInvoice).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="text-gray-500 text-center py-8">{t('noInvoicesFound')}</p>
            )}
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{t('deliveryDetails')}</h3>
          <div className="space-y-4">
            <div>
              <Label>Pengirim (Alamat Perusahaan)</Label>
              <Select value={formData.senderCompanyId} onValueChange={(val) => setFormData({...formData, senderCompanyId: val})}>
                <SelectTrigger><SelectValue placeholder="Pilih Alamat Pengirim" /></SelectTrigger>
                <SelectContent>
                  {companies.map(comp => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>{comp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('deliveryDate')}</Label>
              <Input type="date" value={formData.tanggalKirim} onChange={(e) => setFormData({...formData, tanggalKirim: e.target.value})} />
            </div>

            <div>
              <Label>{t('vehicleNumber')}</Label>
              <Input placeholder={t('vehicleNumberPlaceholder')} value={formData.noArmada} onChange={(e) => setFormData({...formData, noArmada: e.target.value})} />
            </div>

            <div>
              <Label>{t('driverName')}</Label>
              <Input placeholder={t('driverNamePlaceholder')} value={formData.namaSopir} onChange={(e) => setFormData({...formData, namaSopir: e.target.value})} />
            </div>
            
            <div>
              <Label>Catatan</Label>
              <Textarea placeholder="Tambahkan catatan untuk surat jalan..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>

            <div className="pt-4 space-y-2">
              <Button className="w-full" onClick={() => handleGenerate('download')} disabled={selectedInvoiceIds.length === 0}><Download className="mr-2 h-4 w-4" />{t('downloadPDF')}</Button>
              <Button variant="outline" className="w-full" onClick={() => handleGenerate('email')} disabled={selectedInvoiceIds.length === 0}><Mail className="mr-2 h-4 w-4" />{t('sendEmail')}</Button>
              <Button variant="outline" className="w-full" onClick={() => handleGenerate('whatsapp')} disabled={selectedInvoiceIds.length === 0}><MessageSquare className="mr-2 h-4 w-4" />{t('sendWhatsApp')}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuratJalanModule;