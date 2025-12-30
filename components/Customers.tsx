
import React, { useState } from 'react';
import { Customer } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus, 
  Edit2, 
  Trash2, 
  X, 
  Smartphone, 
  ShieldCheck, 
  Stethoscope, 
  History, 
  CheckCircle2, 
  PhoneCall, 
  CalendarDays,
  MoreVertical,
  AlertTriangle,
  FilterX,
  Calendar
} from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  onAdd: (customer: Customer) => void;
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.abhaId?.toLowerCase().includes(searchTerm.toLowerCase());

    const regDate = new Date(c.createdAt).setHours(0, 0, 0, 0);
    const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
    const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;

    const matchesStartDate = start ? regDate >= start : true;
    const matchesEndDate = end ? regDate <= end : true;

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phone') as string;

    if (phone.length !== 10) {
      alert("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    const customerData: Customer = {
      id: editingCustomer?.id || `CUST-${Date.now()}`,
      name: formData.get('name') as string,
      phone: phone,
      abhaId: formData.get('abhaId') as string || undefined,
      isChronic: formData.get('isChronic') === 'on',
      createdAt: editingCustomer?.createdAt || new Date().toISOString()
    };

    if (editingCustomer) onUpdate(customerData);
    else onAdd(customerData);
    
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white p-8 rounded-[44px] border border-slate-50 shadow-sm">
        <div className="flex-1 space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Global Patient Search</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, mobile, or ABHA ID..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="space-y-4 flex-1 md:w-48">
            <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">From Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full pl-4 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold text-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            </div>
          </div>
          <div className="space-y-4 flex-1 md:w-48">
            <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">To Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full pl-4 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            </div>
          </div>
          
          <div className="flex gap-2 self-end">
            {(startDate || endDate || searchTerm) && (
              <button 
                onClick={clearFilters}
                className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all group"
                title="Clear all filters"
              >
                <FilterX size={20} className="group-active:scale-90" />
              </button>
            )}
            <button 
              onClick={openAddModal}
              className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3 uppercase tracking-widest text-[10px]"
            >
              <UserPlus size={18} /> Register Patient
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white p-8 rounded-[44px] border border-slate-50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110 ${customer.isChronic ? 'bg-indigo-600' : 'bg-emerald-600'}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${customer.isChronic ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'}`}>
                <Users size={24} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditModal(customer)} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirmId(customer.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{customer.name}</h3>
            <div className="flex items-center gap-2 mb-6">
              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded tracking-widest border ${
                customer.isChronic ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}>
                {customer.isChronic ? 'Chronic Care' : 'General Care'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Smartphone size={16} className="text-slate-300" />
                <span className="text-sm font-bold">+91 {customer.phone}</span>
              </div>
              {customer.abhaId && (
                <div className="flex items-center gap-3 text-blue-600 bg-blue-50/50 p-2 rounded-xl border border-blue-50">
                  <ShieldCheck size={16} className="text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{customer.abhaId}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-400 pt-3 border-t border-slate-50">
                <CalendarDays size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Joined: {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            
            <div className="mt-8">
               <button className="w-full py-3 bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                 Visit History <History size={14} />
               </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 bg-white rounded-[48px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Users size={48} className="opacity-20 mb-4" />
            <p className="font-bold text-lg">No patient records found.</p>
            <p className="text-sm">Try adjusting your search criteria or date range.</p>
          </div>
        )}
      </div>

      {/* Register/Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[48px] w-full max-w-xl p-12 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                   {editingCustomer ? 'Update Patient Record' : 'Patient Registration'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                   <X size={32} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Patient Full Name</label>
                       <input 
                         required 
                         name="name" 
                         defaultValue={editingCustomer?.name} 
                         placeholder="e.g. Rahul Sharma"
                         className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" 
                       />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Mobile Number</label>
                          <div className="relative">
                            <input 
                              required 
                              name="phone" 
                              maxLength={10}
                              defaultValue={editingCustomer?.phone} 
                              placeholder="10 digit mobile"
                              className="w-full pl-12 pr-5 py-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" 
                            />
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">ABHA ID (Optional)</label>
                          <div className="relative">
                            <input 
                              name="abhaId" 
                              defaultValue={editingCustomer?.abhaId} 
                              placeholder="Health ID"
                              className="w-full pl-12 pr-5 py-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 font-black" 
                            />
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${editingCustomer?.isChronic ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300'} transition-colors`}>
                             <Stethoscope size={20} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-800">Chronic Patient Enrollment</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enable for refill tracking</p>
                          </div>
                       </div>
                       <input 
                         type="checkbox" 
                         name="isChronic" 
                         defaultChecked={editingCustomer?.isChronic}
                         className="w-6 h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-200" 
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-[28px] uppercase tracking-[0.2em] text-[10px]">Cancel</button>
                    <button type="submit" className="flex-1 py-5 bg-emerald-600 text-white font-black rounded-[28px] uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-600/20">
                      {editingCustomer ? 'Update Profile' : 'Confirm Registration'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[48px] w-full max-md p-10 text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="mx-auto w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">Delete Patient Record?</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
              This action will permanently remove the patient profile from the TrustMeds Master Registry. This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
              >
                No, Keep it
              </button>
              <button 
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="py-4 bg-rose-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
