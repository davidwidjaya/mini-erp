
import React, { useState, useEffect } from 'react';
import { Building, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchCompanies, updateCompany, createCompany } from '@/lib/supabaseOperations';

const CompanyData = ({ currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', address: '', phone: '', website: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      try {
          const companies = await fetchCompanies();
          if (companies && companies.length > 0) {
              const company = companies[0]; // Assuming single company profile for now
              setFormData({
                  id: company.id,
                  name: company.name || '',
                  address: company.address || '',
                  phone: company.phone || '',
                  website: company.website || ''
              });
          }
      } catch (e) {
          console.error(e);
          toast({ title: "Error", description: "Failed to load company data.", variant: "destructive" });
      } finally {
          setLoading(false);
      }
  };

  const handleSave = async () => {
      setSaving(true);
      try {
          if (formData.id) {
              await updateCompany(formData.id, {
                  name: formData.name,
                  address: formData.address,
                  phone: formData.phone,
                  website: formData.website
              });
          } else {
              await createCompany({
                  name: formData.name,
                  address: formData.address,
                  phone: formData.phone,
                  website: formData.website
              });
          }
          toast({ title: t('success'), description: 'Company profile updated' });
          loadData(); // Reload to get ID if created
      } catch (e) {
          toast({ title: "Error", description: "Failed to save company data.", variant: "destructive" });
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-2xl">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><Building className="h-5 w-5" /> {t('companyData')}</h3>
      <div className="space-y-4 bg-white p-6 rounded-lg border">
        <div><Label>{t('companyName')}</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
        <div><Label>{t('address')}</Label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
        <div><Label>{t('phone')}</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
        <div><Label>Website</Label><Input value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} /></div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('save')}
        </Button>
      </div>
    </div>
  );
};

export default CompanyData;
