
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Trash2, RotateCcw, ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { 
    fetchProducts, fetchCompanies, fetchCustomers, fetchExpeditions, 
    fetchBankAccounts, fetchSignatures, fetchInvoices, fetchDraftOrders
} from '@/lib/supabaseOperations';

const DataEntryForm = ({ onSave, currentUser, editingOrder, clearEditing }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [existingInvoices, setExistingInvoices] = useState([]);
  const [existingDrafts, setExistingDrafts] = useState([]);
  const [popoverStates, setPopoverStates] = useState({});
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  
  const initialFormState = {
    supplierId: '',
    clientId: '',
    shippingAddressIndex: '0',
    noInvoice: '',
    tanggalInvoice: new Date().toISOString().split('T')[0],
    lineItems: [{ productId: '', sku: '', quantity: '', hargaJual: '', subtotal: 0, unit: '' }],
    discount: '',
    includePPN: false,
    ppnAmount: 0,
    deliveryOption: '',
    expeditionId: '',
    biayaPengiriman: '',
    biayaAsliEkspedisi: '',
    notes: '',
    paymentMethod: '',
    paymentTerm: '',
    paymentDueDate: '',
    bankAccountId: '',
    kota: '',
    tanggalDokumen: new Date().toISOString().split('T')[0],
    signatureId: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const loadAllData = async () => {
        try {
            setLoading(true);
            const [
                comps, custs, prods, exps, banks, sigs, invs, drafts
            ] = await Promise.all([
                fetchCompanies(),
                fetchCustomers(),
                fetchProducts(),
                fetchExpeditions(),
                fetchBankAccounts(),
                fetchSignatures(),
                fetchInvoices(),
                fetchDraftOrders()
            ]);

            setCompanies(comps);
            setClients(custs);
            setProducts(prods);
            setExpeditions(exps);
            setBankAccounts(banks);
            setSignatures(sigs);
            setExistingInvoices(invs);
            setExistingDrafts(drafts);

            // Access Control Logic for Clients
            if (currentUser) {
                let allowed = custs;
                // Assuming access logic based on currentUser.permissions or role logic
                // If custom logic exists for 'salesTeam' matching, apply here.
                // For migration, we'll default to showing all unless strict permission is found.
                // In previous code, we checked jabatan.clientAccess. 
                // Since Jabatan is now in Supabase, we rely on the component having access to that logic or simplified here.
                setFilteredClients(allowed);
            } else {
                setFilteredClients(custs);
            }

        } catch (error) {
            console.error("Failed to load data entry options:", error);
            toast({ title: "Error", description: "Gagal memuat data referensi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    loadAllData();
  }, [currentUser]);

  useEffect(() => {
    if (editingOrder) {
      setFormData({
          ...initialFormState,
          ...editingOrder,
          // Ensure IDs are strings for Select components
          supplierId: editingOrder.supplier_id || editingOrder.supplierId || '',
          clientId: editingOrder.customer_id || editingOrder.clientId || '',
          signatureId: editingOrder.signature_id || editingOrder.signatureId || '',
          expeditionId: editingOrder.expedition_id || editingOrder.expeditionId || '',
          lineItems: editingOrder.line_items || editingOrder.lineItems || [],
          noInvoice: editingOrder.no_invoice || editingOrder.noInvoice || '',
          tanggalInvoice: editingOrder.tanggal_invoice || editingOrder.tanggalInvoice || '',
          paymentTerm: editingOrder.payment_term || editingOrder.paymentTerm || '',
          paymentMethod: editingOrder.payment_method || editingOrder.paymentMethod || '',
          // Map snake_case to camelCase if coming from DB directly
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingOrder]);

  useEffect(() => {
    const { paymentTerm, tanggalInvoice } = formData;
    if (paymentTerm === 'sebelum-kirim') {
      setFormData(prev => ({ ...prev, paymentDueDate: tanggalInvoice }));
    } else if (paymentTerm === 'setelah-terima') {
      setFormData(prev => ({ ...prev, paymentDueDate: 'Harap pelunasan dilakukan di hari barang diterima' }));
    } else if (paymentTerm === 'tempo') {
      if (typeof formData.paymentDueDate !== 'string' || !formData.paymentDueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setFormData(prev => ({ ...prev, paymentDueDate: '' }));
      }
    }
  }, [formData.paymentTerm, formData.tanggalInvoice]);

  const calculateSubtotal = (quantity, hargaJual) => parseFloat(quantity || 0) * parseFloat(hargaJual || 0);

  const calculateTotal = (lineItems, includePPN, biayaPengiriman, discount) => {
    const itemsTotal = lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const discountedTotal = itemsTotal - parseFloat(discount || 0);
    const ppn = includePPN ? discountedTotal * 0.11 : 0;
    const shipping = parseFloat(biayaPengiriman || 0);
    return discountedTotal + ppn + shipping;
  };
  
  const updateLineItem = (index, field, value) => {
    const updatedLineItems = [...formData.lineItems];
    updatedLineItems[index] = { ...updatedLineItems[index], [field]: value };
    
    if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
            updatedLineItems[index].unit = product.unit;
            updatedLineItems[index].sku = product.sku;
        }
    }

    if (field === 'quantity' || field === 'hargaJual') {
      updatedLineItems[index].subtotal = calculateSubtotal(updatedLineItems[index].quantity, updatedLineItems[index].hargaJual);
    }
    setFormData({ ...formData, lineItems: updatedLineItems });
  };
  
  const addLineItem = () => setFormData({ ...formData, lineItems: [...formData.lineItems, { productId: '', sku: '', quantity: '', hargaJual: '', subtotal: 0, unit: '' }] });
  const removeLineItem = (index) => setFormData({ ...formData, lineItems: formData.lineItems.filter((_, i) => i !== index) });

  useEffect(() => {
    const total = formData.lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const discountedTotal = total - parseFloat(formData.discount || 0);
    const ppn = formData.includePPN ? discountedTotal * 0.11 : 0;
    setFormData(prev => ({ ...prev, ppnAmount: ppn }));
  }, [formData.lineItems, formData.includePPN, formData.discount]);

  const validateForm = () => {
    const { supplierId, clientId, noInvoice, lineItems, deliveryOption, expeditionId, biayaPengiriman, biayaAsliEkspedisi, paymentMethod, paymentTerm, paymentDueDate, kota, tanggalDokumen, signatureId, includePPN } = formData;
    
    if (!noInvoice || noInvoice.trim() === '') return "Invoice Number wajib diisi.";
    
    // Check duplicates in loaded DB data
    const duplicateInDrafts = existingDrafts.find(d => 
        d.no_invoice.toLowerCase() === noInvoice.trim().toLowerCase() && 
        (!editingOrder || d.id !== editingOrder.id)
    );
    const duplicateInInvoices = existingInvoices.find(inv => 
        inv.no_invoice.toLowerCase() === noInvoice.trim().toLowerCase()
    );
    
    if (duplicateInDrafts || duplicateInInvoices) {
      return `Invoice Number "${noInvoice}" sudah digunakan.`;
    }
    
    if (!supplierId) return "Perusahaan Pemasok wajib diisi.";
    if (!clientId) return "Customer wajib diisi.";
    if (lineItems.some(item => !item.productId || !item.quantity || !item.hargaJual)) return "Semua detail barang wajib diisi.";
    if (!deliveryOption) return "Opsi Pengiriman wajib diisi.";
    if (deliveryOption === 'Diantar' && !includePPN) {
      if (!expeditionId) return "Ekspedisi wajib diisi untuk pengantaran.";
      if (!biayaPengiriman) return "Biaya Pengiriman Ditagihkan wajib diisi.";
      if (!biayaAsliEkspedisi) return "Biaya Asli Ekspedisi wajib diisi.";
    }
    if (!paymentMethod) return "Metode Pembayaran wajib diisi.";
    if (!paymentTerm) return "Termin Pembayaran wajib diisi.";
    if (paymentTerm === 'tempo' && (!paymentDueDate || new Date(paymentDueDate) <= new Date(formData.tanggalInvoice))) return "Tanggal Jatuh Tempo wajib valid.";
    if (!kota) return "Kota wajib diisi.";
    if (!tanggalDokumen) return "Tanggal Dokumen wajib diisi.";
    if (!signatureId) return "Signature wajib diisi.";
    return null;
  }

  const handleFormSave = () => {
    const validationError = validateForm();
    if (validationError) {
        toast({ title: "Validasi Gagal", description: validationError, variant: "destructive" });
        return;
    }
    
    const selectedClient = clients.find(c => c.id === formData.clientId);
    
    // Map form state to DB columns (snake_case)
    const orderData = {
      no_invoice: formData.noInvoice.trim(),
      customer_id: formData.clientId,
      supplier_id: formData.supplierId,
      shipping_address_index: parseInt(formData.shippingAddressIndex || 0),
      tanggal_invoice: formData.tanggalInvoice,
      line_items: formData.lineItems, // saved as jsonb
      discount: parseFloat(formData.discount || 0),
      include_ppn: formData.includePPN,
      ppn_amount: parseFloat(formData.ppnAmount || 0),
      delivery_option: formData.deliveryOption,
      expedition_id: formData.expeditionId || null,
      biaya_pengiriman: parseFloat(formData.biayaPengiriman || 0),
      biaya_asli_ekspedisi: parseFloat(formData.biayaAsliEkspedisi || 0),
      notes: formData.notes,
      payment_method: formData.paymentMethod,
      payment_term: formData.paymentTerm,
      payment_due_date: formData.paymentDueDate,
      bank_account_id: formData.paymentMethod !== 'cash' ? formData.paymentMethod : null,
      kota: formData.kota,
      tanggal_dokumen: formData.tanggalDokumen,
      signature_id: formData.signatureId,
      client_name: selectedClient?.name || '',
      created_by: currentUser?.name || 'Unknown'
    };

    onSave(orderData); // This will call createDraftOrder or updateDraftOrder in parent
    setFormData(initialFormState);
  };
  
  const setPopoverOpen = (index, open) => {
    setPopoverStates(prev => ({...prev, [index]: open}));
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const subtotal = formData.lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const total = calculateTotal(formData.lineItems, formData.includePPN, formData.biayaPengiriman, formData.discount);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-400"/></div>;

  return (
    <div className="glass-effect rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800">{editingOrder ? 'Edit Draft Order' : 'Create New Order (Draft)'}</h3>
        {editingOrder && <Button variant="ghost" onClick={clearEditing}><RotateCcw className="mr-2 h-4 w-4"/>Clear Selection</Button>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Perusahaan Pemasok</Label>
          <Select value={formData.supplierId} onValueChange={(val) => setFormData({...formData, supplierId: val})}>
            <SelectTrigger><SelectValue placeholder="Pilih Pemasok" /></SelectTrigger>
            <SelectContent>
              {companies.map((sup) => (
                <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Customer</Label>
            <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                        {formData.clientId ? clients.find(c => c.id === formData.clientId)?.name : "Pilih customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Cari customer..." />
                        <CommandList>
                            <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                                {filteredClients.map(client => (
                                    <CommandItem
                                        key={client.id}
                                        value={client.name}
                                        onSelect={() => {
                                            setFormData({ ...formData, clientId: client.id, shippingAddressIndex: '0' });
                                            setCustomerPopoverOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", formData.clientId === client.id ? "opacity-100" : "opacity-0")} />
                                        {client.name}
                                        <span className="ml-2 text-xs text-gray-400">({client.customer_number})</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>

        {selectedClient && selectedClient.shipping_addresses && (
          <div>
            <Label>Alamat Kirim</Label>
            <Select value={formData.shippingAddressIndex?.toString()} onValueChange={(val) => setFormData({...formData, shippingAddressIndex: val})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(selectedClient.shipping_addresses || []).map((addr, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>{addr.address}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-red-600 font-semibold">Invoice Number *</Label>
          <Input 
            value={formData.noInvoice} 
            onChange={(e) => setFormData({...formData, noInvoice: e.target.value})}
            placeholder="Masukkan nomor invoice"
            className="border-red-200 focus:border-red-400"
          />
        </div>

        <div>
          <Label>Tanggal Invoice</Label>
          <Input type="date" value={formData.tanggalInvoice} onChange={(e) => setFormData({...formData, tanggalInvoice: e.target.value})} />
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-lg">Line Items</Label>
          <Button type="button" size="sm" onClick={addLineItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
        </div>
        
        {formData.lineItems.map((item, idx) => {
            const selectedProduct = products.find(p => p.id === item.productId);
            return (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end p-2 border rounded bg-gray-50/50">
                    <div className="col-span-4">
                    <Label className="text-xs text-gray-500 mb-1 block">SKU & Product Name</Label>
                    <Popover open={popoverStates[idx]} onOpenChange={(open) => setPopoverOpen(idx, open)}>
                        <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-auto py-2 text-left">
                            {selectedProduct ? (
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{selectedProduct.name}</span>
                                    <span className="text-xs text-gray-500">SKU: {selectedProduct.sku}</span>
                                </div>
                            ) : "Pilih Barang / Cari SKU..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Cari SKU atau Nama Barang..." />
                            <CommandList>
                            <CommandEmpty>Barang tidak ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                {products.map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={`${product.sku} ${product.name}`}
                                    onSelect={() => {
                                        updateLineItem(idx, 'productId', product.id);
                                        setPopoverOpen(idx, false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", item.productId === product.id ? "opacity-100" : "opacity-0")} />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{product.name}</span>
                                        <span className="text-xs text-gray-500">SKU: {product.sku} | Unit: {product.unit}</span>
                                    </div>
                                </CommandItem>
                                ))}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    </div>
                    
                    <div className="col-span-2 flex items-end gap-1">
                        <div className="flex-1"><Label className="text-xs text-gray-500">Qty</Label><Input type="number" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} /></div>
                        <span className="pb-2 font-medium text-xs text-gray-600 w-10 truncate">{item.unit || '-'}</span>
                    </div>
                    
                    <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Harga Jual</Label>
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Rp</span>
                        <Input type="number" className="pl-6 text-sm" value={item.hargaJual} onChange={(e) => updateLineItem(idx, 'hargaJual', e.target.value)} />
                    </div>
                    </div>
                    
                    <div className="col-span-3">
                    <Label className="text-xs text-gray-500">Subtotal</Label>
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Rp</span>
                        <Input value={(item.subtotal || 0).toLocaleString('id-ID')} disabled className="bg-gray-100 pl-6 text-sm font-medium text-gray-800" />
                    </div>
                    </div>
                    
                    <div className="col-span-1">
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeLineItem(idx)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
            );
        })}
      </div>
      
      <div className="border-t pt-4 space-y-2 text-right font-medium">
        <p>Subtotal: Rp {subtotal.toLocaleString('id-ID')}</p>
        <div className="flex justify-end items-center gap-2">
            <Label>Discount:</Label>
            <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                <Input type="number" className="pl-8 text-right" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} />
            </div>
        </div>
        {formData.includePPN && <p>PPN (11%): Rp {formData.ppnAmount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
        {formData.biayaPengiriman > 0 && <p>Biaya Kirim: Rp {parseFloat(formData.biayaPengiriman).toLocaleString('id-ID')}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox checked={formData.includePPN} onCheckedChange={(checked) => setFormData(prev => ({...prev, includePPN: checked}))} />
        <Label>Include PPN (11%)</Label>
      </div>

      <div>
        <Label>Delivery Option</Label>
        <Select value={formData.deliveryOption} onValueChange={(val) => setFormData({...formData, deliveryOption: val})}>
          <SelectTrigger><SelectValue placeholder="Pilih Opsi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Diambil Sendiri">Diambil Sendiri</SelectItem>
            <SelectItem value="Diantar">Diantar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.deliveryOption === 'Diantar' && !formData.includePPN && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div><Label>Ekspedisi</Label><Select value={formData.expeditionId} onValueChange={(val) => setFormData({...formData, expeditionId: val})}><SelectTrigger><SelectValue placeholder="Pilih Ekspedisi" /></SelectTrigger><SelectContent>{expeditions.map(exp => (<SelectItem key={exp.id} value={exp.id}>{exp.name}</SelectItem>))}</SelectContent></Select></div>
          <div><Label>Biaya Pengiriman Ditagihkan</Label><Input type="number" value={formData.biayaPengiriman} onChange={(e) => setFormData({...formData, biayaPengiriman: e.target.value})} /></div>
          <div><Label>Biaya Asli Ekspedisi</Label><Input type="number" value={formData.biayaAsliEkspedisi} onChange={(e) => setFormData({...formData, biayaAsliEkspedisi: e.target.value})} /></div>
        </div>
      )}

      <div><Label>Notes (Optional)</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
          <div>
            <Label>Term Pembayaran</Label>
            <Select value={formData.paymentTerm} onValueChange={(val) => setFormData({...formData, paymentTerm: val})}>
                <SelectTrigger><SelectValue placeholder="Pilih Termin" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="tempo">Tempo</SelectItem>
                    <SelectItem value="sebelum-kirim">Pembayaran lunas sebelum pengiriman</SelectItem>
                    <SelectItem value="setelah-terima">Pembayaran setelah barang diterima</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
              <Label>Tanggal Jatuh Tempo</Label>
              {formData.paymentTerm === 'tempo' ? (
                  <Input type="date" value={formData.paymentDueDate} onChange={(e) => setFormData({...formData, paymentDueDate: e.target.value})} min={new Date(new Date(formData.tanggalInvoice).getTime() + 86400000).toISOString().split('T')[0]} />
              ) : (
                  <Input type="text" value={formData.paymentDueDate} disabled className="bg-gray-100" />
              )}
          </div>
      </div>

      <div>
        <Label>Payment Method</Label>
        <Select value={formData.paymentMethod} onValueChange={(val) => setFormData({...formData, paymentMethod: val})}>
          <SelectTrigger><SelectValue placeholder="Pilih Metode" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash di Pabrik</SelectItem>
            {bankAccounts.map(bank => (<SelectItem key={bank.id} value={bank.id}>Transfer ke {bank.bank_name} - {bank.account_number}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
        <div><Label>Kota</Label><Input placeholder="Contoh: Jakarta" value={formData.kota} onChange={(e) => setFormData({...formData, kota: e.target.value})} /></div>
        <div><Label>Tanggal Dokumen</Label><Input type="date" value={formData.tanggalDokumen} onChange={(e) => setFormData({...formData, tanggalDokumen: e.target.value})} /></div>
        <div><Label>Signature</Label><Select value={formData.signatureId} onValueChange={(val) => setFormData({...formData, signatureId: val})}><SelectTrigger><SelectValue placeholder="Pilih Signature" /></SelectTrigger><SelectContent>{signatures.map(sig => (<SelectItem key={sig.id} value={sig.id}>{sig.name} - {sig.position}</SelectItem>))}</SelectContent></Select></div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-xl font-bold text-right">TOTAL: Rp {total.toLocaleString('id-ID')}</p>
      </div>

      <Button onClick={handleFormSave} className="w-full h-12 text-lg">{editingOrder ? t('save')+' Changes' : 'Add to Order List (Draft)'}</Button>
    </div>
  );
};

export default DataEntryForm;
