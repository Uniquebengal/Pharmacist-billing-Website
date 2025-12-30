
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  AlertTriangle, 
  Settings, 
  Search, 
  Plus, 
  Menu, 
  X,
  TrendingUp,
  Clock,
  ShoppingCart,
  Zap,
  ClipboardList,
  Wallet,
  BarChart3,
  Users,
  Cloud
} from 'lucide-react';
import { Medicine, Category, Invoice, DashboardStats, Batch, ReturnLog, Expense, Transaction, Customer } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Billing from './components/Billing';
import ExpiryTracker from './components/ExpiryTracker';
import Procurement from './components/Procurement';
import Accounting from './components/Accounting';
import Analytics from './components/Analytics';
import Customers from './components/Customers';

// Mock Initial Data
const INITIAL_MEDICINES: Medicine[] = [
  { 
    id: '1', 
    name: 'Amoxicillin', 
    genericName: 'Amoxicillin 500mg', 
    brand: 'Novamox',
    department: 'Pharmacy',
    category: Category.CAPSULE, 
    manufacturer: 'PharmaCorp', 
    price: 150.00, 
    minThreshold: 20,
    barcode: '123456789',
    ingredients: 'Amoxicillin Trihydrate',
    batches: [
      { id: 'b1', batchNumber: 'AMX-202', expiryDate: '2025-05-01', stock: 100, purchasePrice: 110 }
    ]
  },
  { 
    id: '2', 
    name: 'Dettol Antiseptic', 
    genericName: 'Chloroxylenol', 
    brand: 'Dettol',
    department: 'FMCG',
    category: Category.GENERAL, 
    manufacturer: 'Reckitt', 
    price: 85.00, 
    minThreshold: 10,
    batches: [
      { id: 'b3', batchNumber: 'DET-99', expiryDate: '2026-12-15', stock: 50, purchasePrice: 60 }
    ]
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-1',
    name: 'Aravind Swamy',
    phone: '9876543210',
    abhaId: 'AB-1234-5678',
    isChronic: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'CUST-2',
    name: 'Priya Verma',
    phone: '8765432109',
    isChronic: false,
    createdAt: new Date().toISOString()
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'billing' | 'accounting' | 'analytics' | 'expiry' | 'procurement' | 'customers'>('dashboard');
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTotalStock = (med: Medicine) => med.batches.reduce((sum, b) => sum + b.stock, 0);

  const stats: DashboardStats = useMemo(() => {
    const today = new Date();
    let stockValue = 0;
    let expiring90 = 0;
    let lowStock = 0;

    medicines.forEach(med => {
      const totalStock = getTotalStock(med);
      stockValue += med.price * totalStock;
      if (totalStock <= med.minThreshold) lowStock++;
      med.batches.forEach(batch => {
        const expDate = new Date(batch.expiryDate);
        if (expDate > today && expDate <= new Date(today.getTime() + 90*24*60*60*1000)) expiring90++;
      });
    });

    const todaySales = invoices
        .filter(inv => new Date(inv.date).toDateString() === today.toDateString())
        .reduce((acc, inv) => acc + inv.totalAmount, 0);

    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    return {
      totalStockValue: stockValue,
      expiringSoonCount: expiring90,
      expiringWithin30DaysCount: 0,
      outOfStockCount: lowStock,
      todaySales,
      monthlyProfit: (todaySales * 0.2) - totalExpenses // Simple 20% margin estimation
    };
  }, [medicines, invoices, expenses]);

  const updateMedicine = (updatedMed: Medicine) => {
    setMedicines(medicines.map(m => m.id === updatedMed.id ? updatedMed : m));
  };

  const createInvoice = (invoice: Invoice) => {
    setInvoices([invoice, ...invoices]);
    const updatedMeds = medicines.map(med => {
      const soldItem = invoice.items.find(item => item.medicineId === med.id);
      if (soldItem) {
        let remainingToDeduct = soldItem.quantity;
        const sortedBatches = [...med.batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        const newBatches = sortedBatches.map(batch => {
          if (remainingToDeduct <= 0) return batch;
          if (batch.stock >= remainingToDeduct) {
            const updated = { ...batch, stock: batch.stock - remainingToDeduct };
            remainingToDeduct = 0;
            return updated;
          } else {
            remainingToDeduct -= batch.stock;
            return { ...batch, stock: 0 };
          }
        });
        return { ...med, batches: newBatches };
      }
      return med;
    });
    setMedicines(updatedMeds);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: 'Inventory Master', icon: <Package size={20} /> },
    { id: 'billing', label: 'Billing/POS', icon: <Receipt size={20} /> },
    { id: 'customers', label: 'Patient Master', icon: <Users size={20} /> },
    { id: 'accounting', label: 'Accounting/GST', icon: <Wallet size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'expiry', label: 'Expiry Tracker', icon: <Clock size={20} /> },
    { id: 'procurement', label: 'Procurement', icon: <ClipboardList size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-24'} bg-[#0F172A] transition-all duration-500 flex flex-col no-print`}>
        <div className="p-8 flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-xl shadow-emerald-500/30">
            <Zap className="text-white" size={24} fill="white" />
          </div>
          {isSidebarOpen && <span className="text-white font-black text-2xl tracking-tighter">Trust<span className="text-emerald-500">Meds</span></span>}
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 flex flex-col gap-4">
           <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isOnline ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400' : 'border-rose-900 bg-rose-950 text-rose-400'}`}>
              <Cloud size={16} />
              {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Cloud Synced' : 'Offline Mode'}</span>}
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 text-slate-500 hover:text-white rounded-xl flex items-center justify-center">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 no-print z-10">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
               <Users size={12} />
               Admin Session • TrustMeds Central
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Global Inventory Search..." className="pl-12 pr-6 py-3 bg-slate-50 rounded-2xl text-xs font-bold border-none focus:ring-2 focus:ring-emerald-500 w-72 transition-all" />
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Anand D.</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1">Lead Pharmacist</p>
              </div>
              <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg border-2 border-slate-100 shadow-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeTab === 'dashboard' && <Dashboard stats={stats} medicines={medicines} invoices={invoices} />}
          {activeTab === 'inventory' && <Inventory medicines={medicines} onUpdate={updateMedicine} onAdd={(m)=>setMedicines([...medicines, m])} onDelete={(id)=>setMedicines(medicines.filter(x=>x.id!==id))} />}
          {activeTab === 'billing' && <Billing medicines={medicines} onInvoiceCreated={createInvoice} />}
          {activeTab === 'accounting' && <Accounting expenses={expenses} setExpenses={setExpenses} invoices={invoices} />}
          {activeTab === 'analytics' && <Analytics medicines={medicines} invoices={invoices} />}
          {activeTab === 'expiry' && <ExpiryTracker medicines={medicines} onUpdateMedicine={updateMedicine} onAddReturnLog={()=>{}} returnLogs={[]} />}
          {activeTab === 'procurement' && <Procurement medicines={medicines} />}
          {activeTab === 'customers' && <Customers customers={customers} onAdd={(c)=>setCustomers([...customers, c])} onUpdate={(c)=>setCustomers(customers.map(x=>x.id===c.id?c:x))} onDelete={(id)=>setCustomers(customers.filter(x=>x.id!==id))} />}
        </div>
      </main>
    </div>
  );
};

export default App;
