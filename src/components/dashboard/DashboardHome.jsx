import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, FileClock, Hourglass, BadgePercent } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { format, parseISO, startOfToday } from 'date-fns';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardHome = ({ currentUser }) => {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({ revenueProspect: 0, monthlyRevenue: 0, payable: 0, grossProfit: 0, excessCash: 0 });
  const [grossProfitDetails, setGrossProfitDetails] = useState({ byCategory: {}, shippingProfit: 0, totalDiscount: 0 });
  const [excessCashDetails, setExcessCashDetails] = useState({ byCategory: {}, shippingProfit: 0, totalDiscount: 0 });
  const [revenueDetails, setRevenueDetails] = useState({ byCategory: {}, shippingRevenue: 0, totalDiscount: 0 });
  const [historicalData, setHistoricalData] = useState([]);
  const [products, setProducts] = useState([]);

  const months = Array.from({length: 12}, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const getActivePrice = (priceList, productId, date) => {
        const prices = priceList
            .filter(p => p.productId === productId && new Date(p.activeDate) <= date)
            .sort((a, b) => new Date(b.activeDate) - new Date(a.activeDate) || b.id - a.id);
        return prices[0];
    };

    const calculateMetrics = () => {
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const productData = JSON.parse(localStorage.getItem('products') || '[]');
      setProducts(productData);
      const productCosts = JSON.parse(localStorage.getItem('productCosts') || '[]');
      const bottomPrices = JSON.parse(localStorage.getItem('bottomPrices') || '[]');

      const revenueProspect = invoices
          .filter(inv => !inv.outbondDate && new Date(inv.tanggalInvoice).getMonth() === currentMonth && new Date(inv.tanggalInvoice).getFullYear() === currentYear)
          .reduce((sum, inv) => sum + (inv.lineItems.reduce((s, i) => s + i.subtotal, 0) - (inv.discount || 0)), 0);

      const payable = invoices
          .filter(inv => {
              if (!inv.outbondDate) return false;
              const totalToPay = (inv.lineItems.reduce((acc, item) => acc + item.subtotal, 0) - (inv.discount || 0));
              const alreadyPaid = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
              return alreadyPaid < totalToPay;
          })
          .reduce((sum, inv) => {
              const totalToPay = (inv.lineItems.reduce((acc, item) => acc + item.subtotal, 0) - (inv.discount || 0));
              const alreadyPaid = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
              return sum + (totalToPay - alreadyPaid);
          }, 0);

      const monthlyInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.tanggalInvoice);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      });

      let totalRevenue = 0;
      let totalGrossProfit = 0;
      let totalExcessCash = 0;
      
      const gpByCategory = {};
      let gpShippingProfit = 0;
      let gpTotalDiscount = 0;

      const ecByCategory = {};
      let ecShippingProfit = 0;
      let ecTotalDiscount = 0;

      let revShipping = 0;
      let revDiscount = 0;
      const revByCategory = {};

      monthlyInvoices.forEach(inv => {
        const itemsTotal = inv.lineItems.reduce((sum, item) => sum + item.subtotal, 0);
        const discount = parseFloat(inv.discount || 0);
        const discountedTotal = itemsTotal - discount;
        const shipping = parseFloat(inv.biayaPengiriman || 0);
        totalRevenue += discountedTotal + shipping;
        
        revShipping += shipping;
        revDiscount += discount;
        inv.lineItems.forEach(item => {
            const product = productData.find(p => p.id.toString() === item.productId);
            const category = product?.category || 'Uncategorized';
            if (!revByCategory[category]) revByCategory[category] = 0;
            revByCategory[category] += item.subtotal;
        });

        const invoiceDate = new Date(inv.tanggalInvoice);
        let itemsGrossProfit = 0;
        let itemsExcessCash = 0;

        inv.lineItems.forEach(item => {
          const product = productData.find(p => p.id.toString() === item.productId);
          const relevantCost = getActivePrice(productCosts, item.productId, invoiceDate);
          const costPrice = parseFloat(relevantCost?.costPrice || 0);
          
          const relevantBottomPrice = getActivePrice(bottomPrices, item.productId, invoiceDate);
          const bottomPrice = parseFloat(relevantBottomPrice?.price || costPrice);
          
          const sellPrice = parseFloat(item.hargaJual);
          
          const itemProfit = (sellPrice - costPrice) * item.quantity;
          itemsGrossProfit += itemProfit;
          
          const itemExcessCash = (sellPrice - bottomPrice) * item.quantity;
          
          const category = product?.category || 'Uncategorized';
          if (!gpByCategory[category]) gpByCategory[category] = 0;
          gpByCategory[category] += itemProfit;

          if (!ecByCategory[category]) ecByCategory[category] = 0;
          ecByCategory[category] += itemExcessCash;
        });

        const currentShippingProfit = parseFloat(inv.biayaPengiriman || 0) - parseFloat(inv.biayaAsliEkspedisi || 0);
        totalGrossProfit += itemsGrossProfit + currentShippingProfit - discount;
        totalExcessCash += itemsExcessCash + currentShippingProfit - discount;
        
        gpShippingProfit += currentShippingProfit;
        gpTotalDiscount += discount;
        
        ecShippingProfit += currentShippingProfit;
        ecTotalDiscount += discount;
      });

      setStats({ revenueProspect, monthlyRevenue: totalRevenue, payable, grossProfit: totalGrossProfit, excessCash: totalExcessCash });
      setGrossProfitDetails({ byCategory: gpByCategory, shippingProfit: gpShippingProfit, totalDiscount: gpTotalDiscount });
      setExcessCashDetails({ byCategory: ecByCategory, shippingProfit: ecShippingProfit, totalDiscount: ecTotalDiscount });
      setRevenueDetails({ byCategory: revByCategory, shippingRevenue: revShipping, totalDiscount: revDiscount });

      const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1);
      const historicalInvoices = invoices.filter(inv => new Date(inv.tanggalInvoice) >= twelveMonthsAgo);
      const monthlyAggregates = {};
      for (let i = 0; i < 12; i++) {
          const date = new Date(currentYear, currentMonth - i, 1);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          monthlyAggregates[monthKey] = { month: date.toLocaleString('default', { month: 'short' }), year: date.getFullYear(), grossProfit: 0, turnover: 0, byCategory: {} };
      }
      historicalInvoices.forEach(inv => {
          const invDate = new Date(inv.tanggalInvoice);
          const monthKey = `${invDate.getFullYear()}-${invDate.getMonth()}`;
          if (monthlyAggregates[monthKey]) {
              const itemsTotal = inv.lineItems.reduce((sum, item) => sum + item.subtotal, 0);
              const discount = parseFloat(inv.discount || 0);
              monthlyAggregates[monthKey].turnover += itemsTotal - discount;
              let itemsGrossProfit = 0;
              inv.lineItems.forEach(item => {
                  const product = productData.find(p => p.id.toString() === item.productId);
                  const relevantCost = getActivePrice(productCosts, item.productId, invDate);
                  const costPrice = parseFloat(relevantCost?.costPrice || 0);
                  const itemProfit = (item.hargaJual - costPrice) * item.quantity;
                  itemsGrossProfit += itemProfit;
                  const category = product?.category || 'Uncategorized';
                  if (!monthlyAggregates[monthKey].byCategory[category]) monthlyAggregates[monthKey].byCategory[category] = 0;
                  monthlyAggregates[monthKey].byCategory[category] += item.subtotal;
              });
              const currentShippingProfit = parseFloat(inv.biayaPengiriman || 0) - parseFloat(inv.biayaAsliEkspedisi || 0);
              monthlyAggregates[monthKey].grossProfit += itemsGrossProfit + currentShippingProfit - discount;
          }
      });
      setHistoricalData(Object.values(monthlyAggregates).reverse());
    }

    calculateMetrics();

    window.addEventListener('storage', calculateMetrics);
    return () => {
      window.removeEventListener('storage', calculateMetrics);
    };

  }, [currentMonth, currentYear]);

  const statCards = [
    { icon: FileClock, label: 'Prospek Pendapatan', value: `Rp ${stats.revenueProspect.toLocaleString('id-ID')}`, color: 'from-blue-500 to-cyan-500' },
    { icon: TrendingUp, label: t('monthlyRevenue'), value: `Rp ${stats.monthlyRevenue.toLocaleString('id-ID')}`, color: 'from-green-500 to-emerald-500', isDialog: true, dialogType: 'revenue' },
    { icon: DollarSign, label: 'Gross Profit', value: `Rp ${stats.grossProfit.toLocaleString('id-ID')}`, color: 'from-yellow-500 to-amber-500', isDialog: true, dialogType: 'grossProfit' },
    { icon: BadgePercent, label: 'Excess Cash', value: `Rp ${stats.excessCash.toLocaleString('id-ID')}`, color: 'from-purple-500 to-pink-500', isDialog: true, dialogType: 'excessCash' },
    { icon: Hourglass, label: 'Piutang', value: `Rp ${stats.payable.toLocaleString('id-ID')}`, color: 'from-orange-500 to-red-500' },
  ];
  
  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Trend 12 Bulan Terakhir' } },
    scales: { y: { ticks: { callback: value => `Rp ${value/1000000} Jt` } } }
  };
  const profitTurnoverChartData = { labels: historicalData.map(d => d.month), datasets: [ { label: 'Gross Profit', data: historicalData.map(d => d.grossProfit), backgroundColor: 'rgba(255, 206, 86, 0.5)' }, { label: 'Total Omset', data: historicalData.map(d => d.turnover), backgroundColor: 'rgba(75, 192, 192, 0.5)' } ] };
  const categorySalesData = useMemo(() => {
    const allCategories = [...new Set(products.map(p => p.category || 'Uncategorized'))];
    const datasets = allCategories.map((cat, index) => {
        const colors = ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)'];
        return { label: cat, data: historicalData.map(d => d.byCategory[cat] || 0), backgroundColor: colors[index % colors.length] };
    });
    return { labels: historicalData.map(d => d.month), datasets };
  }, [historicalData, products]);
  
  const RevenueDialogContent = () => (
      <>
        <DialogHeader><DialogTitle>Rincian Pendapatan Bulanan</DialogTitle></DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-bold text-lg mb-2">Pendapatan per Kategori</h4>
                {Object.keys(revenueDetails.byCategory).length > 0 ? Object.entries(revenueDetails.byCategory).map(([cat, amount]) => (
                    <p key={cat} className="flex justify-between text-sm"><span>{cat}:</span> <span className="font-medium">Rp {amount.toLocaleString('id-ID')}</span></p>
                )) : <p className="text-sm text-gray-500">Tidak ada data.</p>}
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
                <p className="flex justify-between"><span>Pendapatan Ongkir:</span> <span className="font-medium">Rp {revenueDetails.shippingRevenue.toLocaleString('id-ID')}</span></p>
                <p className="flex justify-between"><span>Total Discount:</span> <span className="font-medium text-red-600">- Rp {revenueDetails.totalDiscount.toLocaleString('id-ID')}</span></p>
            </div>
        </div>
      </>
  );

  const GrossProfitDialogContent = () => (
    <>
      <DialogHeader><DialogTitle>Rincian Gross Profit</DialogTitle></DialogHeader>
      <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-bold text-lg mb-2">Gross Profit per Kategori</h4>
               <p className="text-xs text-gray-500 mb-2">(Harga Jual Barang - Harga Modal)</p>
              {Object.keys(grossProfitDetails.byCategory).length > 0 ? Object.entries(grossProfitDetails.byCategory).map(([cat, profit]) => (
                  <p key={cat} className="flex justify-between text-sm"><span>{cat}:</span> <span className="font-medium">Rp {profit.toLocaleString('id-ID')}</span></p>
              )) : <p className="text-sm text-gray-500">Tidak ada data.</p>}
          </div>
          <div className="p-4 border rounded-lg bg-gray-50">
              <p className="flex justify-between"><span>Kelebihan Ongkir:</span> <span className="font-medium">Rp {grossProfitDetails.shippingProfit.toLocaleString('id-ID')}</span></p>
              <p className="flex justify-between"><span>Total Discount:</span> <span className="font-medium text-red-600">- Rp {grossProfitDetails.totalDiscount.toLocaleString('id-ID')}</span></p>
          </div>
      </div>
    </>
  );

  const ExcessCashDialogContent = () => (
    <>
      <DialogHeader><DialogTitle>Rincian Excess Cash</DialogTitle></DialogHeader>
      <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-bold text-lg mb-2">Excess Cash per Kategori</h4>
              <p className="text-xs text-gray-500 mb-2">(Harga Jual Barang - Harga Bottom)</p>
              {Object.keys(excessCashDetails.byCategory).length > 0 ? Object.entries(excessCashDetails.byCategory).map(([cat, profit]) => (
                  <p key={cat} className="flex justify-between text-sm"><span>{cat}:</span> <span className="font-medium">Rp {profit.toLocaleString('id-ID')}</span></p>
              )) : <p className="text-sm text-gray-500">Tidak ada data.</p>}
          </div>
          <div className="p-4 border rounded-lg bg-gray-50">
              <p className="flex justify-between"><span>Kelebihan Ongkir:</span> <span className="font-medium">Rp {excessCashDetails.shippingProfit.toLocaleString('id-ID')}</span></p>
              <p className="flex justify-between"><span>Total Discount:</span> <span className="font-medium text-red-600">- Rp {excessCashDetails.totalDiscount.toLocaleString('id-ID')}</span></p>
          </div>
      </div>
    </>
  );

  const getDialogContent = (type) => {
    switch (type) {
        case 'revenue':
            return <RevenueDialogContent />;
        case 'grossProfit':
            return <GrossProfitDialogContent />;
        case 'excessCash':
            return <ExcessCashDialogContent />;
        default:
            return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-gray-800">{t('dashboardOverview')}</h2>
            <p className="text-gray-600 mt-2">{t('dashboardSubtitle')}</p>
        </div>
        <div className="flex gap-2 items-center">
            <Select value={currentMonth.toString()} onValueChange={val => setCurrentMonth(parseInt(val))}><SelectTrigger className="w-[140px]"><SelectValue/></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent></Select>
            <Select value={currentYear.toString()} onValueChange={val => setCurrentYear(parseInt(val))}><SelectTrigger className="w-[100px]"><SelectValue/></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const cardContent = (
            <motion.div key={index} className="glass-effect rounded-xl p-6 card-hover h-full flex flex-col">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}><stat.icon className="h-6 w-6 text-white" /></div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </motion.div>
          );
          if (stat.isDialog) {
            return (
              <Dialog key={index}>
                <DialogTrigger asChild><div className="cursor-pointer">{cardContent}</div></DialogTrigger>
                <DialogContent className="max-w-2xl">
                    {getDialogContent(stat.dialogType)}
                </DialogContent>
              </Dialog>
            );
          }
          return cardContent;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Gross Profit vs Omset</h3>
          {historicalData.length > 0 ? <Bar options={chartOptions} data={profitTurnoverChartData} /> : <p>Loading chart...</p>}
        </div>
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Trend Penjualan per Kategori</h3>
          {historicalData.length > 0 ? <Bar options={{...chartOptions, scales: {...chartOptions.scales, x: {stacked: true}, y: {...chartOptions.scales.y, stacked: true}}}} data={categorySalesData} /> : <p>Loading chart...</p>}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;