
import React from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertCircle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ShoppingCart,
  Clock,
  IndianRupee,
  CalendarCheck,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { DashboardStats, Medicine, Invoice } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  stats: DashboardStats;
  medicines: Medicine[];
  invoices: Invoice[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, medicines, invoices }) => {
  const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 6000 },
    { name: 'Thu', sales: 8000 },
    { name: 'Fri', sales: 5000 },
    { name: 'Sat', sales: stats.todaySales },
    { name: 'Sun', sales: 0 },
  ];

  // Logic for Refill Pipeline (Chronic Patients)
  const upcomingRefills = invoices
    .filter(inv => inv.isChronic && inv.treatmentDuration)
    .map(inv => {
      const invoiceDate = new Date(inv.date);
      const refillDate = new Date(invoiceDate);
      refillDate.setDate(invoiceDate.getDate() + (inv.treatmentDuration || 0));
      
      const today = new Date();
      const diffTime = refillDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return { ...inv, refillDate, diffDays };
    })
    // Only show if running out in the next 7 days (including already ran out)
    .filter(item => item.diffDays <= 7)
    .sort((a, b) => a.diffDays - b.diffDays);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="Stock Value" 
          value={`₹${stats.totalStockValue.toLocaleString('en-IN')}`} 
          icon={<Package className="text-blue-600" size={24} />} 
          trend="+5.4%"
          color="bg-blue-50"
        />
        <StatCard 
          title="Low Stock" 
          value={stats.outOfStockCount.toString()} 
          icon={<AlertCircle className="text-red-600" size={24} />} 
          trend="Critical"
          color="bg-red-50"
        />
        <StatCard 
          title="Today's Sales" 
          value={`₹${stats.todaySales.toLocaleString('en-IN')}`} 
          icon={<TrendingUp className="text-emerald-600" size={24} />} 
          trend="+12%"
          color="bg-emerald-50"
        />
        <StatCard 
          title="Near Expiry (90d)" 
          value={stats.expiringSoonCount.toString()} 
          icon={<AlertCircle className="text-amber-600" size={24} />} 
          trend="Monitor"
          color="bg-amber-50"
        />
        <StatCard 
          title="Expiring Soon (30d)" 
          value={stats.expiringWithin30DaysCount.toString()} 
          icon={<Clock className="text-rose-600" size={24} />} 
          trend="Urgent"
          color="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Velocity</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600">Weekly</button>
               <button className="px-4 py-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">Monthly</button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, "Sales"]}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px'}} 
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Refill Pipeline Widget */}
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <CalendarCheck className="text-indigo-600" size={24} />
               Refill Pipeline
             </h3>
             <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{upcomingRefills.length} Due</span>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {upcomingRefills.length > 0 ? upcomingRefills.map((item) => (
              <div key={item.id} className="p-5 bg-slate-50 rounded-[32px] border border-transparent hover:border-indigo-100 transition-all group">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-indigo-600 border border-slate-100 shadow-sm">
                         <UserCheck size={20} />
                      </div>
                      <div>
                         <p className="font-black text-slate-900 text-sm leading-none mb-1">{item.customerName}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.customerPhone}</p>
                      </div>
                   </div>
                   <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${
                      item.diffDays <= 0 ? 'bg-rose-100 text-rose-600' : 
                      item.diffDays <= 3 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                   }`}>
                      {item.diffDays <= 0 ? 'Out of Meds' : `Refill in ${item.diffDays}d`}
                   </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                   <div className="text-[9px] font-bold text-slate-400">
                      Expected Refill: <span className="text-slate-600">{item.refillDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                   </div>
                   <button className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:scale-110 transition-transform">
                      <PhoneCall size={14} />
                   </button>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center px-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                   <CalendarCheck size={40} className="opacity-10" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">No Chronic Refills Pending Action</p>
              </div>
            )}
          </div>
          
          {/* Fix: ArrowRight was used here but not imported */}
          <button className="w-full mt-8 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all">
             Full Care Management <ArrowRight size={14} className="inline ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: string, color: string }) => (
  <div className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100 transition-all hover:shadow-xl group">
    <div className="flex justify-between items-start mb-6">
      <div className={`${color} p-4 rounded-2xl shadow-inner`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : trend === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
        {trend}
      </span>
    </div>
    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{title}</p>
    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
  </div>
);

export default Dashboard;
