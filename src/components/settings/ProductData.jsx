
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/lib/supabaseOperations';

const ProductData = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ sku: '', name: '', unit: '', category: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
      try {
          const data = await fetchProducts();
          setProducts(data);
      } catch(e) {
          toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
      }
  }

  const resetForm = () => {
    setFormData({ sku: '', name: '', unit: '', category: '' });
    setEditingProduct(null);
  }

  const handleSave = async () => {
    if (!formData.name || !formData.unit) {
        toast({ title: "Validation Error", description: "Name and Unit are required.", variant: "destructive" });
        return;
    }

    try {
        if (editingProduct) {
            await updateProduct(editingProduct.id, formData);
            toast({ title: t('success'), description: 'Product updated' });
        } else {
            await createProduct(formData);
            toast({ title: t('success'), description: 'Product added' });
        }
        await loadProducts();
        setIsOpen(false);
        resetForm();
    } catch(e) {
        toast({ title: "Save Error", description: "Failed to save product.", variant: "destructive" });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ 
        sku: product.sku || '', 
        name: product.name, 
        unit: product.unit, 
        category: product.category || '' 
    });
    setIsOpen(true);
  }

  const handleDelete = async (id) => {
    try {
        await deleteProduct(id);
        await loadProducts();
        toast({ title: t('success'), description: 'Product deleted' });
    } catch (e) {
          toast({ title: "Delete Error", description: "Failed to delete product.", variant: "destructive" });
    }
  }

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2"><Package className="h-5 w-5" /> {t('productData')}</h3>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />{t('addProduct')}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingProduct ? t('edit') : t('addProduct')}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>SKU/Code</Label><Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="e.g. PRD-001" /></div>
              <div><Label>{t('productName')} <span className="text-red-500">*</span></Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div><Label>Category</Label><Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} /></div>
              <div>
                <Label>{t('unit')} <span className="text-red-500">*</span></Label>
                <Select value={formData.unit} onValueChange={(val) => setFormData({...formData, unit: val})}>
                  <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="DRUM">DRUM</SelectItem>
                    <SelectItem value="PAIL">PAIL</SelectItem>
                    <SelectItem value="SAK">SAK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">{t('save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {products.map(product => (
          <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white rounded-lg border flex justify-between items-center">
            <div>
              <p className="font-semibold">{product.name} <span className="text-sm font-normal text-gray-500">({product.sku || 'No SKU'})</span></p>
              <p className="text-sm text-gray-500">{product.category} - {product.unit}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the product.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(product.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </div>
          </motion.div>
        ))}
        {products.length === 0 && <div className="text-center text-gray-500 py-8">No products found.</div>}
      </div>
    </div>
  );
};

export default ProductData;
