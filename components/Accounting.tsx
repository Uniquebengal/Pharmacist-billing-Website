
import React, { useState } from 'react';
import { Expense, Invoice } from '../types';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  PieChart, 
  IndianRupee, 
  Download,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Zap
} from 'lucide-react';

interface AccountingProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  invoices: Invoice[];
}

const Accounting: React.FC<AccountingProps> = ({ expenses, setExpenses, invoices }) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalGstCollected = invoices.reduce((acc, inv) => acc + (inv.totalAmount * 0.12), 0); // Simulated 12% GST
  const totalExpenseAmount = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netProfit = (totalRevenue * 0.2) - totalExpenseAmount; // Estimating 20% margin

  const addExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExp: Expense = {
      id: `EXP-${Date.now()}`,
      date: new Date().toISOString(),
      category: formData.get('category') as any,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      paymentMode: formData.get('paymentMode') as any,
    };
    setExpenses([newExp, ...expenses]);
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard title="Total Sales" value={totalRevenue} icon={<ArrowUpRight className="text-emerald-500" />} color="bg-emerald-50" />
        <SummaryCard title="GST Liability" value={totalGstCollected} icon={<FileText className="text-blue-500" />} color="bg-blue-50" />
        <SummaryCard title="Store Expenses" value={totalExpenseAmount} icon={<ArrowDownRight className="text-rose-500" />} color="bg-rose-50" />
        <SummaryCard title="Est. Net Profit" value={netProfit} icon={<PieChart className="text-indigo-500" />} color="bg-indigo-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <Wallet className="text-indigo-600" /> General Ledger
              </h3>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl text-[10px] uppercase tracking-widest flex items-center gap-2"
              >
                <Plus size={16} /> Log Expense
              </button>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Memo</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {expenses.length > 0 ? expenses.map(exp => (
                       <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5 text-sm font-bold text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="px-8 py-5">
                             <span className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded-lg uppercase">{exp.category}</span>
                          </td>
                          <td className="px-8 py-5 text-sm font-black text-slate-800">{exp.description}</td>
                          <td className="px-8 py-5 text-right font-black text-rose-600">₹{exp.amount.toLocaleString('en-IN')}</td>
                       </tr>
                    )) : (
                       <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">No entries found</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <Building2 className="text-indigo-600" /> GST Compliance
           </h3>
           <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
              <Zap className="absolute -right-8 -bottom-8 text-white/5" size={200} fill="currentColor" />
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-6">Tax Liability Summary</p>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                       <span className="text-xs font-bold text-indigo-300 uppercase">GSTR-1 (Sales)</span>
                       <span className="font-black text-xl">₹{totalGstCollected.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                       <span className="text-xs font-bold text-indigo-300 uppercase">ITC (Input Tax)</span>
                       <span className="font-black text-xl">₹{(totalGstCollected * 0.4).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-4 flex justify-between items-center">
                       <span className="text-xs font-black uppercase tracking-widest">Payable CGST/SGST</span>
                       <span className="font-black text-3xl text-emerald-400">₹{(totalGstCollected * 0.6).toLocaleString('en-IN')}</span>
                    </div>
                 </div>
                 <button className="w-full mt-10 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 transition-all uppercase tracking-widest text-[10px]">
                    Generate GST Report
                 </button>
              </div>
           </div>
        </div>
      </div>

      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl">
              <h2 className="text-2xl font-black text-slate-800 mb-8">Record Expenditure</h2>
              <form onSubmit={addExpense} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Category</label>
                    <select name="category" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold">
                       <option>Supplies</option>
                       <option>Rent</option>
                       <option>Salary</option>
                       <option>Electricity</option>
                       <option>Other</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Description</label>
                    <input required name="description" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Amount (₹)</label>
                    <input required type="number" name="amount" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold" />
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20">Post Transaction</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
    <div className={`${color} p-3 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <h4 className="text-2xl font-black text-slate-900 tracking-tighter">₹{value.toLocaleString('en-IN')}</h4>
  </div>
);

export default Accounting;
