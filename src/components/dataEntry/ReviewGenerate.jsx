import React, { useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, Mail, MessageSquare, Edit, Trash2, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ReviewGenerate = ({ orders, onEdit, onDelete, currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const toggleOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const generatePDF = (order, docType) => {
    const doc = new jsPDF();
    const companyData = JSON.parse(localStorage.getItem('companyData') || '{}');
    const signatureData = JSON.parse(localStorage.getItem('signatures') || '[]').find(s => s.id.toString() === order.signatureId);

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(docType.replace(/([A-Z])/g, ' $1').trim(), 14, 22);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(companyData.name || 'Your Company', 200, 15, { align: 'right' });
    doc.text(companyData.address || 'Company Address', 200, 20, { align: 'right' });
    doc.text(companyData.phone || 'Company Phone', 200, 25, { align: 'right' });

    // Invoice Details
    doc.text(`Invoice No: ${order.noInvoice}`, 14, 40);
    doc.text(`Date: ${new Date(order.tanggalInvoice).toLocaleDateString('id-ID')}`, 14, 45);

    // Line items table
    const head = [['Product', 'Qty', 'Unit', 'Price (Rp)', 'Subtotal (Rp)']];
    const body = order.lineItems.map(item => {
      const product = JSON.parse(localStorage.getItem('products') || '[]').find(p => p.id.toString() === item.productId);
      return [
        product?.name || 'Unknown',
        item.quantity,
        product?.unit || '',
        parseFloat(item.hargaJual).toLocaleString('id-ID'),
        item.subtotal.toLocaleString('id-ID')
      ];
    });
    
    let finalY = 0;
    doc.autoTable({ startY: 55, head, body, didDrawPage: (data) => { finalY = data.cursor.y; } });
    finalY = doc.autoTable.previous.finalY;

    // Totals
    const itemsTotal = order.lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const ppn = order.includePPN ? itemsTotal * 0.11 : 0;
    const shipping = parseFloat(order.biayaPengiriman || 0);
    const grandTotal = itemsTotal + ppn + shipping;
    
    doc.setFontSize(10);
    doc.text('Subtotal:', 150, finalY + 10, { align: 'right' });
    doc.text(`Rp ${itemsTotal.toLocaleString('id-ID')}`, 200, finalY + 10, { align: 'right' });

    if (order.includePPN) {
        doc.text('PPN (11%):', 150, finalY + 15, { align: 'right' });
        doc.text(`Rp ${ppn.toLocaleString('id-ID', {minimumFractionDigits: 2})}`, 200, finalY + 15, { align: 'right' });
    }

    if (shipping > 0) {
        doc.text('Shipping:', 150, finalY + 20, { align: 'right' });
        doc.text(`Rp ${shipping.toLocaleString('id-ID')}`, 200, finalY + 20, { align: 'right' });
    }

    doc.setFont(undefined, 'bold');
    doc.text('Total:', 150, finalY + 25, { align: 'right' });
    doc.text(`Rp ${grandTotal.toLocaleString('id-ID')}`, 200, finalY + 25, { align: 'right' });
    doc.setFont(undefined, 'normal');

    // Signature
    if (signatureData) {
      if (signatureData.signatureImage) {
        doc.addImage(signatureData.signatureImage, 'JPEG', 150, finalY + 40, 30, 15);
      }
      doc.text(signatureData.name, 150, finalY + 60);
      doc.text(signatureData.position, 150, finalY + 65);
    }
    
    doc.save(`${docType}_${order.noInvoice}.pdf`);
  };

  const handleGenerate = () => {
    if (selectedOrders.length === 0) {
      toast({ title: t('error'), description: 'Please select at least one order', variant: 'destructive' });
      return;
    }
    
    const ordersToProcess = orders.filter(o => selectedOrders.includes(o.id));
    
    ordersToProcess.forEach(order => {
        // For simplicity, this example just generates an 'Invoice'.
        // In a full implementation, you'd check which docs to create.
        generatePDF(order, 'Invoice');
    });

    const ordersToSave = orders.filter(o => selectedOrders.includes(o.id));
    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    localStorage.setItem('invoices', JSON.stringify([...existingInvoices, ...ordersToSave]));
    
    // This is where you would remove the orders from the temporary list
    // onDelete(order.id) would be called for each processed order.

    toast({
      title: t('success'),
      description: `Documents generated and downloaded.`
    });

    setSelectedOrders([]);
  };

  const promptDelete = (order) => {
    if(currentUser.permissions.includes('all') || currentUser.permissions.includes('delete')){
        setOrderToDelete(order);
        setIsDeleteDialogOpen(true);
    } else {
        toast({ title: t('error'), description: "You don't have permission to delete.", variant: 'destructive'});
    }
  };

  const confirmDelete = () => {
    if (!deleteReason) {
      toast({ title: t('error'), description: 'Please provide a reason for deletion.', variant: 'destructive' });
      return;
    }

    const deletedLog = JSON.parse(localStorage.getItem('deletedFiles') || '[]');
    deletedLog.push({
      id: orderToDelete.id,
      fileName: orderToDelete.noInvoice,
      deletedBy: currentUser.name,
      deletedAt: new Date().toISOString(),
      reason: deleteReason,
    });
    localStorage.setItem('deletedFiles', JSON.stringify(deletedLog));

    onDelete(orderToDelete.id);
    setIsDeleteDialogOpen(false);
    setOrderToDelete(null);
    setDeleteReason('');
    toast({ title: 'Success', description: 'Order deleted and logged.' });
  };
  
  const canEdit = currentUser.permissions.includes('all') || currentUser.permissions.includes('edit');

  return (
    <div className="glass-effect rounded-xl p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Review & Generate Documents</h3>
      
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {orders.map(order => (
          <motion.div
            key={order.id}
            whileHover={{ scale: 1.01 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-start space-x-4">
              <Checkbox 
                checked={selectedOrders.includes(order.id)}
                onCheckedChange={() => toggleOrder(order.id)}
              />
              <div className="flex-1">
                <p className="font-semibold">{order.noInvoice}</p>
                <p className="text-sm text-gray-600">{order.clientName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.tanggalInvoice).toLocaleDateString('id-ID')}
                </p>
                <div className="mt-2 space-y-1">
                  {order.lineItems.map((item, idx) => {
                    const product = JSON.parse(localStorage.getItem('products') || '[]').find(p => p.id.toString() === item.productId);
                    return (
                      <p key={idx} className="text-xs text-gray-600">
                        {product?.name || 'Unknown'} - {item.quantity} {item.unit} x Rp {parseFloat(item.hargaJual).toLocaleString('id-ID')}
                      </p>
                    );
                  })}
                </div>
                <p className="text-sm font-semibold mt-2">
                  Total: Rp {order.lineItems.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}
                  {order.includePPN && ` + PPN Rp ${order.ppnAmount.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="flex space-x-2">
                {canEdit && (
                  <Button variant="outline" size="icon" onClick={() => onEdit(order.id, order)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="destructive" size="icon" onClick={() => promptDelete(order)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <Button className="flex-1" onClick={handleGenerate}>
          <FileText className="mr-2 h-4 w-4" />
          Generate & Download PDF
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => toast({ description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" })}>
          <Mail className="mr-2 h-4 w-4" />
          {t('sendEmail')}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => toast({ description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" })}>
          <MessageSquare className="mr-2 h-4 w-4" />
          {t('sendWhatsApp')}
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reason for Deletion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <Label htmlFor="deleteReason">Please provide a reason for deleting this order.</Label>
                <Textarea id="deleteReason" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDelete}>Confirm Delete</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewGenerate;