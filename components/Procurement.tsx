
import React, { useState, useMemo } from 'react';
import { Medicine } from '../types';
import { 
  ClipboardList, 
  AlertCircle, 
  FilePlus, 
  Printer, 
  X, 
  CheckCircle2, 
  ShoppingCart,
  ArrowRight,
  IndianRupee,
  Zap
} from 'lucide-react';

interface ProcurementProps {
  medicines: Medicine[];
}

const Procurement: React.FC<ProcurementProps> = ({ medicines }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poNumber] = useState(`PO-${Date.now()}`);

  const calculateTotalStock = (med: Medicine) => med.batches.reduce((sum, b) => sum + b.stock, 0);

  const lowStockMedicines = useMemo(() => {
    return medicines.filter(med => calculateTotalStock(med) <= med.minThreshold);
  }, [medicines]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === lowStockMedicines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(lowStockMedicines.map(m => m.id)));
    }
  };

  const selectedMedicines = lowStockMedicines.filter(m => selectedIds.has(m.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Procurement & Purchase Orders</h2>
          <p className="text-slate-500 font-medium">Generate orders for items falling below minimum stock thresholds.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={selectAll}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors text-sm"
          >
            {selectedIds.size === lowStockMedicines.length ? 'Deselect All' : 'Select All Low Stock'}
          </button>
          <button 
            disabled={selectedIds.size === 0}
            onClick={() => setIsPOModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:bg-slate-200 disabled:shadow-none"
          >
            <FilePlus size={18} />
            Generate PO ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 no-print">
        {lowStockMedicines.length > 0 ? (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 w-12"></th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Medicine Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Manufacturer</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Min Threshold</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-12">Price (Unit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockMedicines.map(med => {
                  const currentStock = calculateTotalStock(med);
                  const isSelected = selectedIds.has(med.id);
                  return (
                    <tr 
                      key={med.id} 
                      className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`}
                      onClick={() => toggleSelection(med.id)}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{med.name}</p>
                        <p className="text-xs text-slate-400">{med.genericName}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{med.manufacturer}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${currentStock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500">{med.minThreshold}</td>
                      <td className="px-6 py-4 text-right pr-12 font-bold text-indigo-600">
                        ₹{med.price.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 bg-white rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-center px-6">
            <div className="bg-emerald-50 p-6 rounded-full mb-6">
              <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">All Stock Levels Normal</h3>
            <p className="max-w-md font-medium">No medicines currently fall below their minimum thresholds. Your inventory is healthy!</p>
          </div>
        )}
      </div>

      {/* Purchase Order Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-900 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black">Purchase Order Preview</h2>
                  <p className="text-indigo-200 text-sm font-medium">{poNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsPOModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">From:</p>
                  <p className="font-bold text-slate-800">MediStock Pro Pharmacy</p>
                  <p className="text-sm text-slate-500">123 Health Avenue, Suite 101</p>
                  <p className="text-sm text-slate-500">Pharma City, India - 54321</p>
                </div>
                <div className="space-y-1 md:text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Order Date:</p>
                  <p className="font-bold text-slate-800">{new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Item Description</th>
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Manufacturer</th>
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase text-right">Order Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedMedicines.map(med => {
                      const stock = calculateTotalStock(med);
                      const suggestedOrder = med.minThreshold * 2 - stock;
                      return (
                        <tr key={med.id}>
                          <td className="py-4">
                            <p className="font-bold text-slate-800">{med.name}</p>
                            <p className="text-xs text-slate-500">{med.genericName}</p>
                          </td>
                          <td className="py-4 font-medium text-slate-600">{med.manufacturer}</td>
                          <td className="py-4 text-right">
                            <input 
                              type="number" 
                              defaultValue={suggestedOrder > 0 ? suggestedOrder : med.minThreshold}
                              className="w-20 px-3 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase">Instructions:</p>
                <textarea 
                  placeholder="Add any special instructions for the supplier..."
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[100px]"
                />
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setIsPOModalOpen(false)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
              >
                <Printer size={20} /> Print Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Purchase Order */}
      <div className="print-only p-12 text-black bg-white min-h-screen">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                <Zap size={24} fill="white" />
            </div>
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-indigo-900">Purchase Order</h1>
                <p className="font-bold">{poNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-1">From</h2>
            <h2 className="text-lg font-black">MediStock Pro</h2>
            <p className="text-sm">123 Health Avenue, Suite 101</p>
            <p className="text-sm">Pharma City, India - 54321</p>
            <p className="text-sm font-bold mt-2">{new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 border-b pb-1 tracking-widest">Items Requested</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 text-sm font-bold uppercase">Medicine</th>
                <th className="py-2 text-sm font-bold uppercase">Manufacturer</th>
                <th className="py-2 text-sm font-bold text-right uppercase">Qty</th>
              </tr>
            </thead>
            <tbody>
              {selectedMedicines.map(med => (
                <tr key={med.id} className="border-b border-slate-200">
                  <td className="py-4">
                    <p className="font-bold">{med.name}</p>
                    <p className="text-xs">{med.genericName}</p>
                  </td>
                  <td className="py-4">{med.manufacturer}</td>
                  <td className="py-4 text-right font-bold text-lg">
                    {med.minThreshold * 2 - calculateTotalStock(med)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-32 flex justify-between items-end border-t border-slate-100 pt-12">
          <div className="space-y-4">
            <div className="w-64 h-px bg-black mb-2"></div>
            <p className="text-xs font-black uppercase tracking-widest">Authorized Purchase Signature</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 italic">This is an official procurement document generated via MediStock Pro.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Procurement;
