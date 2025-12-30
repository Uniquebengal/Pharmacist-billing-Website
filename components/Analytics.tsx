
import React from 'react';
import { Medicine, Invoice } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  History, 
  Timer, 
  CheckCircle2, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalyticsProps {
  medicines: Medicine[];
  invoices: Invoice[];
}

const Analytics: React.FC<AnalyticsProps> = ({ medicines, invoices }) => {
  // Mock performance data
  const performanceData = [
    { name: 'Amoxicillin', sales: 45 },
    { name: 'Paracetamol', sales: 92 },
    { name: 'Dettol', sales: 18 },
    { name: 'Cough Care', sales: 12 },
    { name: 'Aspirin', sales: 67 },
  ].sort((a,b) => b.sales - a.sales);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <TrendingUp className="text-indigo-600" /> Sales Velocity (Units)
              </h3>
              <select className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none">
                 <option>Last 30 Days</option>
                 <option>By Brand</option>
              </select>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px'}}
                    />
                    <Bar dataKey="sales" radius={[12, 12, 12, 12]} barSize={40}>
                       {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#E2E8F0'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8">
                 <Zap className="text-indigo-600" /> AI Insights
              </h3>
              <div className="space-y-6">
                 <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 flex items-start gap-4">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white mt-1">
                       <CheckCircle2 size={16} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Stock Optimization</p>
                       <p className="text-xs font-bold text-indigo-700 leading-relaxed">Paracetamol velocity is up 12%. Reorder stripping is suggested 3 days earlier than schedule.</p>
                    </div>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 flex items-start gap-4">
                    <div className="bg-slate-400 p-2 rounded-xl text-white mt-1">
                       <Timer size={16} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ageing Alert</p>
                       <p className="text-xs font-bold text-slate-600 leading-relaxed">Cough Care Batch #CC-012 has reached 180 days. Move to "Clearance" to protect margins.</p>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-10 py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all text-[10px] uppercase tracking-widest">
                 Full Audit Log <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <MetricBox label="Least Selling Items" value="4" sub="Last 6 months" status="warning" />
         <MetricBox label="New Customers Acquired" value="124" sub="+14% this month" status="success" />
         <MetricBox label="Avg Transaction Value" value="₹840" sub="Max: ₹14,200" status="neutral" />
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, sub, status }: any) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between h-56">
    <div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
       <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h4>
    </div>
    <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl w-fit ${
      status === 'success' ? 'bg-emerald-50 text-emerald-600' :
      status === 'warning' ? 'bg-rose-50 text-rose-600' :
      'bg-slate-50 text-slate-500'
    }`}>
      {sub}
    </div>
  </div>
);

export default Analytics;
