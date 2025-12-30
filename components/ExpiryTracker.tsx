
import React, { useState } from 'react';
import { Medicine, Batch, ReturnLog } from '../types';
import { 
  Calendar, 
  AlertTriangle, 
  Trash2, 
  CheckCircle,
  Clock,
  Layers,
  ArrowRightLeft,
  X,
  FileText,
  ClipboardCheck,
  Package
} from 'lucide-react';

interface ExpiryTrackerProps {
  medicines: Medicine[];
  onUpdateMedicine: (med: Medicine) => void;
  onAddReturnLog: (log: ReturnLog) => void;
  returnLogs: ReturnLog[];
}

const ExpiryTracker: React.FC<ExpiryTrackerProps> = ({ medicines, onUpdateMedicine, onAddReturnLog, returnLogs }) => {
  const [returnModalData, setReturnModalData] = useState<{ medicine: Medicine, batch: Batch } | null>(null);
  const [returnReason, setReturnReason] = useState('Expired');
  
  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(today.getMonth() + 3);
  
  // Extract all batches across all medicines that are expired or expiring soon
  const expiredBatches: { medicine: Medicine, batch: Batch }[] = [];
  const expiringSoonBatches: { medicine: Medicine, batch: Batch }[] = [];

  medicines.forEach(med => {
    med.batches.forEach(batch => {
      const expDate = new Date(batch.expiryDate);
      if (expDate < today) {
        expiredBatches.push({ medicine: med, batch });
      } else if (expDate <= threeMonthsFromNow) {
        expiringSoonBatches.push({ medicine: med, batch });
      }
    });
  });

  const handleOpenReturnModal = (medicine: Medicine, batch: Batch) => {
    setReturnReason('Expired');
    setReturnModalData({ medicine, batch });
  };

  const handleReturnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!returnModalData) return;

    const formData = new FormData(e.currentTarget);
    const returnQty = parseInt(formData.get('quantity') as string);
    const reasonSelection = formData.get('reason') as string;
    const otherReason = formData.get('otherReason') as string;
    
    const finalReason = reasonSelection === 'Other' ? otherReason : reasonSelection;

    const { medicine, batch } = returnModalData;

    // 1. Create Return Log
    const newLog: ReturnLog = {
      id: `RMA-${Date.now()}`,
      medicineId: medicine.id,
      medicineName: medicine.name,
      batchNumber: batch.batchNumber,
      quantity: returnQty,
      reason: finalReason,
      date: new Date().toISOString(),
      rmaNumber: `RMA-${Math.floor(100000 + Math.random() * 900000)}`,
      manufacturer: medicine.manufacturer
    };

    onAddReturnLog(newLog);

    // 2. Update Medicine Stock (deduct batch stock)
    const updatedBatches = medicine.batches.map(b => 
      b.id === batch.id ? { ...b, stock: b.stock - returnQty } : b
    );
    onUpdateMedicine({ ...medicine, batches: updatedBatches });

    setReturnModalData(null);
  };

  return (
    <div className="space-y-12 pb-20">
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 p-3 rounded-2xl">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Expired Batches</h2>
            <p className="text-slate-400 text-sm font-medium">Remove these from inventory immediately.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expiredBatches.length > 0 ? expiredBatches.map(({ medicine, batch }) => (
            <ExpiryBatchCard 
              key={`${medicine.id}-${batch.id}`} 
              medicine={medicine} 
              batch={batch} 
              status="expired" 
              onReturn={() => handleOpenReturnModal(medicine, batch)}
            />
          )) : (
            <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
               <CheckCircle size={48} className="text-emerald-400 mb-2 opacity-50" />
               <p className="font-bold">No expired batches found.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <Clock className="text-amber-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Expiring Soon (Next 90 Days)</h2>
            <p className="text-slate-400 text-sm font-medium">Items nearing end of life.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expiringSoonBatches.length > 0 ? expiringSoonBatches.map(({ medicine, batch }) => (
            <ExpiryBatchCard 
              key={`${medicine.id}-${batch.id}`} 
              medicine={medicine} 
              batch={batch} 
              status="expiring" 
              onReturn={() => handleOpenReturnModal(medicine, batch)}
            />
          )) : (
            <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
               <CheckCircle size={48} className="text-emerald-400 mb-2 opacity-50" />
               <p className="font-bold">All batches are safe for now.</p>
            </div>
          )}
        </div>
      </section>

      {/* Return History / RMA Log Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-3 rounded-2xl">
            <FileText className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">RMA Return History</h2>
            <p className="text-slate-400 text-sm font-medium">Tracked returns and supplier authorizations.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {returnLogs.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">RMA #</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Medicine / Batch</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Manufacturer</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-indigo-600">{log.rmaNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{log.medicineName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Batch: {log.batchNumber}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{log.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{log.manufacturer}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 italic bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        {log.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <ClipboardCheck size={40} className="mx-auto mb-2 opacity-20" />
              <p className="font-medium">No return logs available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Return Merchandise Authorization Modal */}
      {returnModalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <ArrowRightLeft size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black">Return Merchandise (RMA)</h2>
                  <p className="text-indigo-200 text-xs font-medium">Batch: {returnModalData.batch.batchNumber}</p>
                </div>
              </div>
              <button onClick={() => setReturnModalData(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-8 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <Package size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{returnModalData.medicine.name}</h4>
                  <p className="text-xs text-slate-500">Manufacturer: {returnModalData.medicine.manufacturer}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Available Stock</label>
                  <input readOnly value={returnModalData.batch.stock} className="w-full p-4 bg-slate-100 border-none rounded-2xl text-slate-400 font-bold outline-none cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Return Quantity</label>
                  <input 
                    required 
                    type="number" 
                    name="quantity" 
                    max={returnModalData.batch.stock} 
                    min="1" 
                    defaultValue={returnModalData.batch.stock}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Reason for Return</label>
                <select 
                  name="reason" 
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="Expired">Product Expired</option>
                  <option value="Near Expiry">Nearing Expiry - Supplier Buyback</option>
                  <option value="Damaged">Damaged Packaging</option>
                  <option value="Defective">Manufacturer Recall/Defect</option>
                  <option value="Overstock">Overstock Return</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {returnReason === 'Other' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-sm font-bold text-slate-700">Please specify</label>
                  <textarea 
                    name="otherReason" 
                    required 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[80px]" 
                    placeholder="Enter the specific reason for return..."
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setReturnModalData(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                  <ClipboardCheck size={20} /> Generate RMA Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface ExpiryBatchCardProps {
  medicine: Medicine;
  batch: Batch;
  status: 'expired' | 'expiring';
  onReturn: () => void;
}

const ExpiryBatchCard: React.FC<ExpiryBatchCardProps> = ({ medicine, batch, status, onReturn }) => {
  const daysLeft = Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  if (batch.stock <= 0) return null; // Don't show empty batches in expiry tracker

  return (
    <div className={`p-6 rounded-[32px] bg-white border ${status === 'expired' ? 'border-red-100' : 'border-amber-100'} shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}>
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 ${status === 'expired' ? 'bg-red-50' : 'bg-amber-50'} rounded-full opacity-50 group-hover:scale-110 transition-transform`} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            status === 'expired' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {status === 'expired' ? 'Expired' : `${daysLeft} Days Remaining`}
          </span>
          <Layers className="text-slate-300" size={18} />
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-1">{medicine.name}</h3>
        <p className="text-xs text-slate-400 mb-4">{medicine.genericName}</p>

        <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Batch #</p>
            <p className="font-mono text-xs font-bold text-slate-700">{batch.batchNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Stock</p>
            <p className="font-bold text-slate-700">{batch.stock} units</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6">
          <Calendar className="text-slate-300" size={14} /> Expiry: {new Date(batch.expiryDate).toLocaleDateString()}
        </div>

        <div className="flex gap-2">
          {status === 'expired' ? (
            <button className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
              <Trash2 size={16} /> Dispose Batch
            </button>
          ) : (
            <>
              <button className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20">
                Discount
              </button>
              <button 
                onClick={onReturn}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowRightLeft size={16} /> Return
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpiryTracker;
