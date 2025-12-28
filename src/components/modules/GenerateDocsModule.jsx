
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, ArrowLeft, Download, Mail, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { numberToWords } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
    fetchDraftOrders, deleteDraftOrder, createInvoice, 
    fetchSignatures, fetchCompanies, fetchCustomers, fetchProducts, fetchBankAccounts 
} from '@/lib/supabaseOperations';

const GenerateDocsModule = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [docTypes, setDocTypes] = useState({ Invoice: false, Kwitansi: false, DeliveryOrder: false, ProformaInvoice: false });
  const [kwitansiDate, setKwitansiDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [outputOptions, setOutputOptions] = useState({ download: true, email: false, whatsapp: false });

  // Data refs
  const [signatures, setSignatures] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [kwitansiSignatureId, setKwitansiSignatureId] = useState('');
  const [deliveryOrderInstructionFromId, setDeliveryOrderInstructionFromId] = useState('');

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  // ... other states

  useEffect(() => {
    const initData = async () => {
        try {
            setLoading(true);
            const [drafts, sigs, comps, custs, prods, banks] = await Promise.all([
                fetchDraftOrders(),
                fetchSignatures(),
                fetchCompanies(),
                fetchCustomers(),
                fetchProducts(),
                fetchBankAccounts()
            ]);
            
            setAvailableOrders(drafts);
            setSignatures(sigs);
            setCompanies(comps);
            setCustomers(custs);
            setProducts(prods);
            setBankAccounts(banks);

            if (sigs.length > 0) {
                setKwitansiSignatureId(sigs[0].id);
                setDeliveryOrderInstructionFromId(sigs[0].id);
            }
        } catch (e) {
            console.error("Failed to load generate docs data", e);
        } finally {
            setLoading(false);
        }
    };
    initData();
  }, [step]); // Re-fetch when step resets

  const handleNextStep = () => {
    if (!Object.values(docTypes).some(v => v)) {
      toast({ title: 'Error', description: 'Please select at least one document type.', variant: 'destructive' });
      return;
    }
    if (selectedOrders.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one order.', variant: 'destructive' });
      return;
    }
    setStep(2);
  };

  const processGeneration = async () => {
    try {
        toast({ title: 'Generating...', description: 'Creating invoices...' });
        
        const ordersToProcess = availableOrders.filter(o => selectedOrders.includes(o.id));
        
        // 1. Create Permanent Invoices
        for (const order of ordersToProcess) {
            // Map draft to invoice structure
            const invoiceData = {
                no_invoice: order.no_invoice,
                customer_id: order.customer_id,
                company_id: order.supplier_id,
                tanggal_invoice: order.tanggal_invoice,
                shipping_address_index: order.shipping_address_index,
                discount: order.discount,
                include_ppn: order.include_ppn,
                ppn_amount: order.ppn_amount,
                delivery_option: order.delivery_option,
                expedition_id: order.expedition_id,
                biaya_pengiriman: order.biaya_pengiriman,
                biaya_asli_ekspedisi: order.biaya_asli_ekspedisi,
                notes: order.notes,
                payment_method: order.payment_method,
                payment_term: order.payment_term,
                payment_due_date: order.payment_due_date,
                bank_account_id: order.bank_account_id,
                kota: order.kota,
                tanggal_dokumen: order.tanggal_dokumen,
                signature_id: order.signature_id,
                created_by: currentUser.name || 'System',
                generated_docs: docTypes, // Store what was generated
                status: 'pending' // Initial status
            };

            const lineItems = (order.line_items || []).map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                hargaJual: item.hargaJual,
                subtotal: item.subtotal,
                unit: item.unit
            }));

            // Insert into invoices and delete from drafts
            await createInvoice(invoiceData, lineItems);
            await deleteDraftOrder(order.id);
        }

        // 2. Generate PDF Files (Client-side generation for now)
        // ... (PDF generation logic would reuse the data fetching from props)
        
        toast({ title: 'Success', description: 'Invoices created and drafts moved.' });
        setStep(1);
        setSelectedOrders([]);
        // Re-fetch handled by useEffect dependency on step
    } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to process invoices.', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{t('generateDocs')}</h2>
          <p className="text-gray-600 mt-2">Generate final invoices from draft orders.</p>
        </div>
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">1. Select Document Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        <Checkbox checked={docTypes.Invoice} onCheckedChange={() => setDocTypes(p => ({...p, Invoice: !p.Invoice}))} />
                        <label>Invoice (Wajib)</label>
                    </div>
                    {/* Add other doc types as needed */}
                  </div>
                </div>
                
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">2. Select Draft Orders</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableOrders.length === 0 && <p className="text-gray-500">No draft orders found.</p>}
                    {availableOrders.map(order => (
                        <div key={order.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                          <Checkbox 
                            checked={selectedOrders.includes(order.id)} 
                            onCheckedChange={() => setSelectedOrders(p => p.includes(order.id) ? p.filter(id => id !== order.id) : [...p, order.id])}
                          />
                          <label className="flex-grow">
                            <p className="font-semibold text-sm">{order.no_invoice}</p>
                            <p className="text-xs">{order.client_name}</p>
                          </label>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-effect rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4">Confirm Generation</h3>
                  <p>You are about to generate invoices for {selectedOrders.length} orders.</p>
                  <p className="text-sm text-gray-500">These will be moved from "Drafts" to "Invoices" database.</p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2" /> Back</Button>
                <Button onClick={processGeneration} className="bg-green-600 hover:bg-green-700">Generate & Save</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default GenerateDocsModule;
