import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvoiceOngkirModule = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [ongkirInvoices, setOngkirInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [expeditions, setExpeditions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [formData, setFormData] = useState({
    expeditionId: '',
    biayaTagih: '',
    biayaAsli: '',
    paymentMethod: '',
    noInvoice: '',
    tanggalInvoice: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filtered = allInvoices.filter(inv => {
      const invDate = new Date(inv.tanggalInvoice);
      return inv.deliveryOption === 'Diantar' && inv.includePPN && invDate >= thirtyDaysAgo;
    });
    
    setInvoices(filtered);
    setOngkirInvoices(JSON.parse(localStorage.getItem('invoiceOngkirLogs') || '[]'));
    setExpeditions(JSON.parse(localStorage.getItem('expeditions') || '[]'));
    setBankAccounts(JSON.parse(localStorage.getItem('bankAccounts') || '[]'));
    setSignatures(JSON.parse(localStorage.getItem('signatures') || '[]'));
    setCompanies(JSON.parse(localStorage.getItem('companies') || '[]'));
  }, []);

  useEffect(() => {
    if (selectedInvoice) {
      setFormData(prev => ({
        ...prev,
        noInvoice: `IO-${selectedInvoice.noInvoice}`,
        expeditionId: selectedInvoice.expeditionId || '',
        paymentMethod: selectedInvoice.paymentMethod || '',
      }));
    }
  }, [selectedInvoice]);
  
  const getImageDimensions = (imgSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = imgSrc;
    });
  };

  const calculateImageSize = (originalWidth, originalHeight) => {
      const maxWidth = 180; // mm (18 cm)
      const maxHeight = 30; // mm (3 cm)
      const aspectRatio = originalWidth / originalHeight;

      let newWidth = maxWidth;
      let newHeight = newWidth / aspectRatio;

      if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = newHeight * aspectRatio;
      }
      
      return { width: newWidth, height: newHeight };
  };

  const handleGenerate = async (outputType) => {
    if (!selectedInvoice) {
      toast({ title: t('error'), description: t('pleaseSelectInvoice'), variant: 'destructive' });
      return;
    }

    if (!formData.expeditionId || !formData.biayaTagih || !formData.biayaAsli || !formData.paymentMethod) {
      toast({ title: t('error'), description: t('pleaseFillAllFields'), variant: 'destructive' });
      return;
    }

    const companyData = companies.find(c => c.id.toString() === selectedInvoice.supplierId.toString());
    const clientData = JSON.parse(localStorage.getItem('clients') || '[]').find(c => c.id.toString() === selectedInvoice.clientId);
    const bankAccountData = bankAccounts.find(b => b.id.toString() === formData.paymentMethod);
    const signatureData = signatures.find(s => s.id.toString() === selectedInvoice.signatureId);

    if (outputType === 'download') {
      const doc = new jsPDF();
      let yPos = 15;
      const leftMargin = 14;
      const rightMarginPaper = doc.internal.pageSize.width - 14;

      if (companyData?.logo) {
          const { width: origW, height: origH } = await getImageDimensions(companyData.logo);
          if (origW > 0) {
            const { width: imgWidth, height: imgHeight } = calculateImageSize(origW, origH);
            doc.addImage(companyData.logo, 'JPEG', leftMargin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 5;
          } else {
             yPos += 15;
          }
      } else {
          yPos += 15;
      }
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(companyData.name, leftMargin, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      const companyAddress = doc.splitTextToSize(companyData.address, 90);
      doc.text(companyAddress, leftMargin, yPos);
      yPos += (companyAddress.length * 4) + 1;
      doc.text(`${companyData.phone} | ${companyData.website}`, leftMargin, yPos);
      yPos += 10;
      doc.line(leftMargin, yPos, rightMarginPaper, yPos);
      yPos += 12;

      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICE', leftMargin, yPos);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Invoice No: ${formData.noInvoice}`, rightMarginPaper, yPos - 3, { align: 'right' });
      doc.text(`Ref. No: ${selectedInvoice.noInvoice}`, rightMarginPaper, yPos + 2, { align: 'right' });
      yPos += 10;

      if (clientData) {
          doc.text(`Bill To: ${clientData.name}`, leftMargin, yPos);
          yPos += 5;
          const clientAddress = clientData.shippingAddresses[selectedInvoice.shippingAddressIndex]?.address || clientData.domicile;
          const clientAddressLines = doc.splitTextToSize(clientAddress, 90);
          doc.text(clientAddressLines, leftMargin, yPos);
          yPos += (clientAddressLines.length * 4) + 5;
      }

      const head = [['Deskripsi', 'Total (Rp)']];
      const body = [['Biaya Pengiriman', parseFloat(formData.biayaTagih).toLocaleString('id-ID')]];

      doc.autoTable({ startY: yPos, head, body });
      
      let finalY = doc.autoTable.previous.finalY;
      doc.setFont(undefined, 'bold');
      doc.text('TOTAL:', 150, finalY + 10, { align: 'right' });
      doc.text(`Rp ${parseFloat(formData.biayaTagih).toLocaleString('id-ID')}`, rightMarginPaper, finalY + 10, { align: 'right' });

      // Add extra space (5 line breaks)
      const signatureY = finalY + 35;

      if (signatureData?.signature) {
          const { width, height } = await getImageDimensions(signatureData.signature);
          if (width > 0) {
            const aspectRatio = width / height;
            const imgWidth = 40;
            const imgHeight = imgWidth / aspectRatio;
            
            doc.text(`${selectedInvoice.kota || 'Jakarta'}, ${new Date(formData.tanggalInvoice).toLocaleDateString('id-ID')}`, rightMarginPaper - 65, signatureY);
            let sigImgY = signatureY + 5;
            doc.addImage(signatureData.signature, 'PNG', rightMarginPaper - 65, sigImgY, imgWidth, imgHeight);
            let sigTextY = sigImgY + imgHeight + 5;
            doc.text(signatureData.name, rightMarginPaper - 65, sigTextY);
            sigTextY += 2;
            doc.line(rightMarginPaper - 65, sigTextY, rightMarginPaper-5, sigTextY);
            sigTextY += 5;
            doc.text(signatureData.position, rightMarginPaper - 65, sigTextY);
          }
      }

      if (bankAccountData) {
          let paymentYPos = signatureY;
          doc.setFont(undefined, 'bold');
          doc.text('Mohon transfer ke:', 14, paymentYPos);
          doc.setFont(undefined, 'normal');
          paymentYPos += 5;
          doc.text(`${bankAccountData.bankName}: ${bankAccountData.accountNumber}`, 14, paymentYPos);
          paymentYPos += 5;
          doc.text(`a/n ${bankAccountData.accountHolder}`, 14, paymentYPos);
      }

      doc.save(`InvoiceOngkir_${selectedInvoice.noInvoice}.pdf`);
    }

    const invoiceOngkirData = {
      ...selectedInvoice, // Inherit data from main invoice
      id: Date.now(),
      noInvoice: formData.noInvoice,
      tanggalInvoice: formData.tanggalInvoice,
      lineItems: [{ productId: 'ONGKIR', quantity: 1, hargaJual: formData.biayaTagih, subtotal: parseFloat(formData.biayaTagih) }],
      includePPN: false,
      biayaPengiriman: 0, // Shipping cost is the main item
      isInvoiceOngkir: true,
      originalInvoiceId: selectedInvoice.id,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      payments: [] // Fresh payment array
    };
    
    const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    localStorage.setItem('invoices', JSON.stringify([...allInvoices, invoiceOngkirData]));

    const existingOngkirLogs = JSON.parse(localStorage.getItem('invoiceOngkirLogs') || '[]');
    const ongkirLog = {
      id: invoiceOngkirData.id,
      originalInvoiceId: selectedInvoice.id,
      ...formData,
    };
    localStorage.setItem('invoiceOngkirLogs', JSON.stringify([...existingOngkirLogs, ongkirLog]));

    setOngkirInvoices(prev => [...prev, ongkirLog]); 
    
    toast({ title: t('success'), description: 'Invoice Ongkir berhasil dibuat dan ditambahkan ke menu Pembayaran.' });

    setSelectedInvoice(null);
    setFormData({ expeditionId: '', biayaTagih: '', biayaAsli: '', paymentMethod: '', noInvoice: '', tanggalInvoice: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">{t('invoiceOngkir')}</h2>
        <p className="text-gray-600 mt-2">{t('invoiceOngkirSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{t('selectInvoice')}</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {invoices.map(invoice => {
              const relatedOngkir = ongkirInvoices.find(oi => oi.originalInvoiceId === invoice.id);
              return (
                <div key={invoice.id}>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedInvoice(invoice)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedInvoice?.id === invoice.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        <p className="font-semibold">{invoice.noInvoice}</p>
                        <p className="text-sm text-gray-600">{invoice.clientName}</p>
                        <p className="text-xs text-gray-500">{new Date(invoice.tanggalInvoice).toLocaleDateString('id-ID')}</p>
                    </motion.div>
                    {relatedOngkir && (
                        <div className="pl-6 ml-4 border-l-2 border-blue-300">
                             <div className="p-2 mt-1 bg-blue-50 rounded-r-lg text-xs">
                                <p className="font-semibold">Invoice Ongkir Terkait:</p>
                                <p>Biaya: Rp {parseFloat(relatedOngkir.biayaTagih).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    )}
                </div>
              );
            })}
            {invoices.length === 0 && (
              <p className="text-gray-500 text-center py-8">{t('noInvoicesFound')}</p>
            )}
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{t('shippingDetails')}</h3>
          <div className="space-y-4">
            <div>
              <Label>No. Invoice</Label>
              <Input value={formData.noInvoice} disabled />
            </div>
             <div>
              <Label>Tanggal Invoice</Label>
              <Input type="date" value={formData.tanggalInvoice} onChange={(e) => setFormData({...formData, tanggalInvoice: e.target.value})} />
            </div>
            <div>
              <Label>{t('expedition')}</Label>
              <Select value={formData.expeditionId} onValueChange={(val) => setFormData({...formData, expeditionId: val})}>
                <SelectTrigger><SelectValue placeholder={t('selectExpedition')} /></SelectTrigger>
                <SelectContent>
                  {expeditions.map(exp => (
                    <SelectItem key={exp.id} value={exp.id.toString()}>{exp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('chargedShippingCost')}</Label>
              <Input type="number" placeholder="0" value={formData.biayaTagih} onChange={(e) => setFormData({...formData, biayaTagih: e.target.value})} />
            </div>

            <div>
              <Label>{t('actualShippingCost')}</Label>
              <Input type="number" placeholder="0" value={formData.biayaAsli} onChange={(e) => setFormData({...formData, biayaAsli: e.target.value})} />
            </div>

            <div>
              <Label>{t('paymentMethod')}</Label>
              <Select value={formData.paymentMethod} onValueChange={(val) => setFormData({...formData, paymentMethod: val})}>
                <SelectTrigger><SelectValue placeholder={t('selectPaymentMethod')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('cash')}</SelectItem>
                  {bankAccounts.map(bank => (
                    <SelectItem key={bank.id} value={bank.id.toString()}>{t('transferTo')} {bank.bankName} - {bank.accountNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 space-y-2">
              <Button className="w-full" onClick={() => handleGenerate('download')}><Download className="mr-2 h-4 w-4" />{t('downloadPDF')}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceOngkirModule;