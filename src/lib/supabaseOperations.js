
import { supabase } from '@/lib/customSupabaseClient';

// --- Customers ---
export const fetchCustomers = async () => {
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) throw error;
  return data || [];
};
export const createCustomer = async (data) => {
  const { data: res, error } = await supabase.from('customers').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const updateCustomer = async (id, data) => {
  const { data: res, error } = await supabase.from('customers').update({ ...data, updated_at: new Date() }).eq('id', id).select().single();
  if (error) throw error;
  return res;
};
export const deleteCustomer = async (id) => {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
};

// --- Products ---
export const fetchProducts = async () => {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return data || [];
};
export const createProduct = async (data) => {
  const { data: res, error } = await supabase.from('products').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const updateProduct = async (id, data) => {
  const { data: res, error } = await supabase.from('products').update({ ...data, updated_at: new Date() }).eq('id', id).select().single();
  if (error) throw error;
  return res;
};
export const deleteProduct = async (id) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

// --- Companies ---
export const fetchCompanies = async () => {
  const { data, error } = await supabase.from('companies').select('*').order('name');
  if (error) throw error;
  return data || [];
};
export const createCompany = async (data) => {
  const { data: res, error } = await supabase.from('companies').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const updateCompany = async (id, data) => {
  const { data: res, error } = await supabase.from('companies').update({ ...data, updated_at: new Date() }).eq('id', id).select().single();
  if (error) throw error;
  return res;
};
export const deleteCompany = async (id) => {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
};

// --- Suppliers ---
export const fetchSuppliers = async () => {
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) throw error;
  return data || [];
};
export const createSupplier = async (data) => {
  const { data: res, error } = await supabase.from('suppliers').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const updateSupplier = async (id, data) => {
  const { data: res, error } = await supabase.from('suppliers').update({ ...data, updated_at: new Date() }).eq('id', id).select().single();
  if (error) throw error;
  return res;
};
export const deleteSupplier = async (id) => {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
};

// --- Sales Persons ---
export const fetchSalesPersons = async () => {
  const { data, error } = await supabase.from('sales_persons').select('*').order('name');
  if (error) throw error;
  return data || [];
};
export const createSalesPerson = async (data) => {
  const { data: res, error } = await supabase.from('sales_persons').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const updateSalesPerson = async (id, data) => {
  const { data: res, error } = await supabase.from('sales_persons').update({ ...data, updated_at: new Date() }).eq('id', id).select().single();
  if (error) throw error;
  return res;
};
export const deleteSalesPerson = async (id) => {
  const { error } = await supabase.from('sales_persons').delete().eq('id', id);
  if (error) throw error;
};

// --- Sales Teams ---
export const fetchSalesTeams = async () => {
  const { data, error } = await supabase.from('sales_teams').select('*').order('name');
  if (error) throw error;
  return data || [];
};
export const createSalesTeam = async (name) => {
  const { data, error } = await supabase.from('sales_teams').insert([{ name }]).select().single();
  if (error) throw error;
  return data;
};

// --- Jabatans ---
export const fetchJabatans = async () => {
  const { data, error } = await supabase.from('jabatan').select('*').order('jabatan');
  if (error) throw error;
  return data || [];
};
export const createJabatan = async (data) => {
  const { data: res, error } = await supabase.from('jabatan').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const updateJabatan = async (id, data) => {
  const { data: res, error } = await supabase.from('jabatan').update(data).eq('id', id).select().single();
  if (error) throw error;
  return res;
};
export const deleteJabatan = async (id) => {
  const { error } = await supabase.from('jabatan').delete().eq('id', id);
  if (error) throw error;
};

// --- Profiles / Users ---
export const fetchProfiles = async () => {
  const { data, error } = await supabase.from('profiles').select('*').order('name');
  if (error) throw error;
  return data || [];
};
export const updateProfile = async (id, data) => {
  const { data: res, error } = await supabase.from('profiles').update({ ...data, updated_at: new Date() }).eq('id', id).select().single();
  if (error) throw error;
  return res;
};
export const deleteProfile = async (id) => {
    // Note: This only deletes the profile record, not the auth user (requires admin)
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if(error) throw error;
}

// --- Bank Accounts ---
export const fetchBankAccounts = async () => {
  const { data, error } = await supabase.from('bank_accounts').select('*');
  if (error) throw error;
  return data || [];
};
export const createBankAccount = async (data) => {
  const { data: res, error } = await supabase.from('bank_accounts').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const updateBankAccount = async (id, data) => {
    const { data: res, error } = await supabase.from('bank_accounts').update(data).eq('id', id).select().single();
    if(error) throw error;
    return res;
}
export const deleteBankAccount = async (id) => {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    if(error) throw error;
}

// --- Expeditions ---
export const fetchExpeditions = async () => {
  const { data, error } = await supabase.from('expeditions').select('*');
  if (error) throw error;
  return data || [];
};
export const createExpedition = async (data) => {
  const { data: res, error } = await supabase.from('expeditions').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const updateExpedition = async (id, data) => {
    const { data: res, error } = await supabase.from('expeditions').update({ name: data.name }).eq('id', id).select().single();
    if (error) throw error;
    return res;
};
export const deleteExpedition = async (id) => {
    const { error } = await supabase.from('expeditions').delete().eq('id', id);
    if(error) throw error;
}

// --- Signatures ---
export const fetchSignatures = async () => {
  const { data, error } = await supabase.from('signatures').select('*');
  if (error) throw error;
  return data || [];
};
export const createSignature = async (data) => {
  const { data: res, error } = await supabase.from('signatures').insert([data]).select().single();
  if (error) throw error;
  return res;
};
export const deleteSignature = async (id) => {
  const { error } = await supabase.from('signatures').delete().eq('id', id);
  if (error) throw error;
};

// --- Invoices (Orders) ---
export const fetchInvoices = async (filters = {}) => {
  let query = supabase.from('invoices').select(`
    *,
    invoice_items (*),
    customer:customers(*),
    company:companies(*)
  `).order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Transform for frontend compatibility if needed (e.g. mapping invoice_items to lineItems)
  return data.map(inv => ({
    ...inv,
    lineItems: inv.invoice_items?.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      hargaJual: item.harga_jual,
      subtotal: item.subtotal,
      unit: item.unit
    })) || []
  }));
};

export const createInvoice = async (invoiceData, lineItems) => {
  // 1. Insert Invoice
  const { data: invoice, error: invError } = await supabase.from('invoices').insert([invoiceData]).select().single();
  if (invError) throw invError;

  // 2. Insert Items
  if (lineItems && lineItems.length > 0) {
    const items = lineItems.map(item => ({
      invoice_id: invoice.id,
      product_id: item.productId,
      quantity: item.quantity,
      harga_jual: item.hargaJual,
      subtotal: item.subtotal,
      unit: item.unit
    }));
    const { error: itemsError } = await supabase.from('invoice_items').insert(items);
    if (itemsError) throw itemsError;
  }
  return invoice;
};

export const updateInvoice = async (id, invoiceData, lineItems) => {
  const { data: invoice, error: invError } = await supabase.from('invoices').update({...invoiceData, updated_at: new Date()}).eq('id', id).select().single();
  if (invError) throw invError;

  if (lineItems) {
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    if (lineItems.length > 0) {
      const items = lineItems.map(item => ({
        invoice_id: id,
        product_id: item.productId,
        quantity: item.quantity,
        harga_jual: item.hargaJual,
        subtotal: item.subtotal,
        unit: item.unit
      }));
      await supabase.from('invoice_items').insert(items);
    }
  }
  return invoice;
};

export const deleteInvoice = async (id, currentUser, reason) => {
    // Archive
    const { data: inv } = await supabase.from('invoices').select('*, invoice_items(*)').eq('id', id).single();
    if (inv) {
        await supabase.from('deleted_invoices').insert([{
            original_invoice_id: id,
            invoice_data: inv,
            deleted_by_id: currentUser?.id || 'unknown',
            deleted_by_name: currentUser?.name || 'unknown',
            deletion_reason: reason || 'Deleted by user',
            deletion_date: new Date()
        }]);
    }
    // Delete
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
};

// --- Draft Orders (Temp Orders) ---
export const fetchDraftOrders = async () => {
    const { data, error } = await supabase.from('draft_orders').select('*').order('created_at', { ascending: false });
    if(error) throw error;
    // Map snake_case to camelCase for frontend consistency if needed, but keeping snake_case in component is safer for now or mapping manually
    // We will return raw data and map in component
    return data || [];
};

export const createDraftOrder = async (orderData) => {
    const { data, error } = await supabase.from('draft_orders').insert([orderData]).select().single();
    if(error) throw error;
    return data;
};

export const updateDraftOrder = async (id, orderData) => {
    const { data, error } = await supabase.from('draft_orders').update(orderData).eq('id', id).select().single();
    if(error) throw error;
    return data;
};

export const deleteDraftOrder = async (id) => {
    const { error } = await supabase.from('draft_orders').delete().eq('id', id);
    if(error) throw error;
};

// --- Invoice Ongkir Logs ---
// Using `invoice_ongkir` table instead of logs json in local storage
export const fetchInvoiceOngkirs = async () => {
    const { data, error } = await supabase.from('invoice_ongkir').select('*');
    if(error) throw error;
    return data || [];
};

export const createInvoiceOngkir = async (data) => {
    const { data: res, error } = await supabase.from('invoice_ongkir').insert([data]).select().single();
    if(error) throw error;
    return res;
};

// --- Logs ---
export const fetchUserLogs = async () => {
    const { data, error } = await supabase.from('user_logs').select('*').order('timestamp', { ascending: false }).limit(100);
    if(error) throw error;
    return data || [];
};
export const createUserLog = async (log) => {
    await supabase.from('user_logs').insert([log]);
};

// --- Costs & Prices ---
export const fetchProductCosts = async () => {
    const { data, error } = await supabase.from('product_costs').select('*').order('timestamp', { ascending: false });
    if(error) throw error;
    return data || [];
};
export const createProductCost = async (data) => {
    const { error } = await supabase.from('product_costs').insert([data]);
    if(error) throw error;
};

export const fetchBottomPrices = async () => {
    const { data, error } = await supabase.from('bottom_prices').select('*').order('timestamp', { ascending: false });
    if(error) throw error;
    return data || [];
};
export const createBottomPrice = async (data) => {
    const { error } = await supabase.from('bottom_prices').insert([data]);
    if(error) throw error;
};

// --- Recovered ---
export const fetchDeletedInvoices = async () => {
    const { data, error } = await supabase.from('deleted_invoices').select('*').order('deletion_date', { ascending: false });
    if(error) throw error;
    return data || [];
}
