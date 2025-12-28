import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

const InvoicePreviewDialog = ({ isOpen, setIsOpen, invoice }) => {
    if (!invoice) return null;

    // Safely calculate totals, providing default values for missing data
    const safeLineItems = invoice.lineItems || [];
    const totalSubtotal = safeLineItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const discount = invoice.discount || 0;
    const subtotalAfterDiscount = totalSubtotal - discount;
    const ppnAmount = invoice.includePPN ? subtotalAfterDiscount * 0.11 : 0;
    const shippingCost = invoice.biayaPengiriman || 0;
    const grandTotal = subtotalAfterDiscount + ppnAmount + shippingCost;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Preview Invoice: {invoice.noInvoice || 'N/A'}</DialogTitle>
                </DialogHeader>
                <div className="p-4 border rounded-lg bg-white text-sm">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-4 border-b">
                        <div>
                            <p className="font-bold text-lg">{invoice.company?.name || 'Nama Perusahaan'}</p>
                            <p>{invoice.company?.address || 'Alamat Perusahaan'}</p>
                            <p>Telp: {invoice.company?.phone || '-'}</p>
                            <p>Website: {invoice.company?.website || '-'}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold uppercase text-gray-800">Invoice</h2>
                            <p>No: <span className="font-semibold">{invoice.noInvoice || 'N/A'}</span></p>
                            <p>Tanggal: {invoice.tanggalInvoice ? format(new Date(invoice.tanggalInvoice), 'dd MMMM yyyy') : 'N/A'}</p>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div>
                            <p className="font-semibold text-gray-500">Kepada Yth:</p>
                            <p className="font-bold">{invoice.clientName || 'N/A'}</p>
                            <p>{invoice.clientAddress || 'N/A'}</p>
                        </div>
                        {invoice.shippingAddress && (
                             <div>
                                <p className="font-semibold text-gray-500">Alamat Pengiriman:</p>
                                <p className="font-bold">{invoice.shippingAddress}</p>
                            </div>
                        )}
                    </div>

                    {/* Line Items Table */}
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="bg-gray-100 font-semibold">
                                <th className="p-2">No</th>
                                <th className="p-2">Nama Barang</th>
                                <th className="p-2 text-right">Jumlah</th>
                                <th className="p-2">Satuan</th>
                                <th className="p-2 text-right">Harga Satuan (Rp)</th>
                                <th className="p-2 text-right">Subtotal (Rp)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeLineItems.map((item, index) => (
                                <tr key={item.id || index} className="border-b">
                                    <td className="p-2">{index + 1}</td>
                                    <td className="p-2">{item.productName || 'N/A'}</td>
                                    <td className="p-2 text-right">{item.quantity || 0}</td>
                                    <td className="p-2">{item.unit || 'N/A'}</td>
                                    <td className="p-2 text-right">{(item.price || 0).toLocaleString('id-ID')}</td>
                                    <td className="p-2 text-right">{(item.subtotal || 0).toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div className="flex justify-end pt-4">
                        <div className="w-full max-w-sm space-y-2">
                             <div className="flex justify-between"><span>Subtotal</span><span>{totalSubtotal.toLocaleString('id-ID')}</span></div>
                             {discount > 0 && <div className="flex justify-between"><span>Diskon</span><span>- {discount.toLocaleString('id-ID')}</span></div>}
                             {invoice.includePPN && <div className="flex justify-between"><span>PPN 11%</span><span>{ppnAmount.toLocaleString('id-ID')}</span></div>}
                             {shippingCost > 0 && <div className="flex justify-between"><span>Biaya Pengiriman</span><span>{shippingCost.toLocaleString('id-ID')}</span></div>}
                             <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Grand Total</span><span>{grandTotal.toLocaleString('id-ID')}</span></div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t text-xs text-gray-500">
                        <p>Dibuat oleh: {invoice.createdBy || 'N/A'}</p>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InvoicePreviewDialog;