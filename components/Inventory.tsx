
import React, { useState } from 'react';
import { Medicine, Category, Batch } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  BrainCircuit, 
  Layers, 
  AlertTriangle, 
  Scan, 
  CheckCircle2, 
  ArrowRight,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Tag,
  Building2,
  Box,
  LayoutGrid,
  PlusCircle,
  MinusCircle,
  CalendarDays,
  History,
  X,
  Barcode as BarcodeIcon,
  Maximize2
} from 'lucide-react';
import { getMedicalInsights } from '../services/geminiService';
import ScannerModal from './ScannerModal';

interface InventoryProps {
  medicines: Medicine[];
  onAdd: (med: Medicine) => void;
  onUpdate: (med: Medicine) => void;
  onDelete: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ medicines, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isInternalScannerOpen, setIsInternalScannerOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [selectedMedForBatch, setSelectedMedForBatch] = useState<Medicine | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [scannedBarcode, setScannedBarcode] = useState('');

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.barcode?.includes(searchTerm)
  );

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const calculateTotalStock = (med: Medicine) => med.batches.reduce((sum, b) => sum + b.stock, 0);

  const openAddModal = () => {
    setEditingMed(null);
    setScannedBarcode('');
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medicine) => {
    setEditingMed(med);
    setScannedBarcode(med.barcode || '');
    setIsModalOpen(true);
  };

  const openAddBatchModal = (med: Medicine) => {
    setSelectedMedForBatch(med);
    setIsBatchModalOpen(true);
  };

  const handleStockAdjustment = (med: Medicine, batchId: string, delta: number) => {
    const updatedBatches = med.batches.map(b => {
      if (b.id === batchId) {
        return { ...b, stock: Math.max(0, b.stock + delta) };
      }
      return b;
    });
    onUpdate({ ...med, batches: updatedBatches });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const initialBatch: Batch = {
      id: `b-${Date.now()}`,
      batchNumber: formData.get('batchNumber') as string,
      expiryDate: formData.get('expiryDate') as string,
      stock: parseInt(formData.get('stock') as string) || 0,
      purchasePrice: parseFloat(formData.get('purchasePrice') as string) || 0,
      adjustmentHistory: []
    };

    const newMed: Medicine = {
      id: editingMed?.id || Date.now().toString(),
      name: formData.get('name') as string,
      genericName: formData.get('genericName') as string,
      brand: formData.get('brand') as string,
      department: formData.get('department') as any,
      category: formData.get('category') as Category,
      manufacturer: formData.get('manufacturer') as string,
      price: parseFloat(formData.get('price') as string),
      minThreshold: parseInt(formData.get('minThreshold') as string),
      barcode: scannedBarcode || formData.get('barcode') as string || undefined,
      ingredients: formData.get('ingredients') as string || undefined,
      batches: editingMed?.batches || [initialBatch]
    };

    if (editingMed) onUpdate(newMed);
    else onAdd(newMed);
    setIsModalOpen(false);
  };

  const handleAddBatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMedForBatch) return;

    const formData = new FormData(e.currentTarget);
    const newBatch: Batch = {
      id: `b-${Date.now()}`,
      batchNumber: formData.get('batchNumber') as string,
      expiryDate: formData.get('expiryDate') as string,
      stock: parseInt(formData.get('stock') as string) || 0,
      purchasePrice: parseFloat(formData.get('purchasePrice') as string) || 0,
      adjustmentHistory: []
    };

    const updatedMed = {
      ...selectedMedForBatch,
      batches: [...selectedMedForBatch.batches, newBatch]
    };

    onUpdate(updatedMed);
    setIsBatchModalOpen(false);
    setSelectedMedForBatch(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex gap-4 flex-1 max-w-2xl">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Lookup by Brand, Formula or SKU..." 
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-3xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-black font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
              <button onClick={() => setViewMode('List')} className={`p-3 rounded-xl transition-all ${viewMode === 'List' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><Box size={18} /></button>
              <button onClick={() => setViewMode('Grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'Grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
           </div>
        </div>
        <button 
          onClick={openAddModal}
          className="px-8 py-4 bg-emerald-600 text-white font-black rounded-3xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/20 flex items-center gap-3 uppercase tracking-widest text-[10px]"
        >
          <Plus size={18} /> New Item Master
        </button>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-50 overflow-hidden shadow-2xl shadow-emerald-900/5">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Product Details</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Brand/Mfg</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Availability</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Price</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Options</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredMedicines.map(med => (
                  <React.Fragment key={med.id}>
                     <tr className={`hover:bg-slate-50/50 transition-colors group ${expandedRows.has(med.id) ? 'bg-emerald-50/30' : ''}`}>
                        <td className="px-10 py-8">
                           <div className="flex items-start gap-4">
                              <button onClick={() => toggleRow(med.id)} className="mt-1 text-slate-300 group-hover:text-emerald-600 transition-colors">
                                 {expandedRows.has(med.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                              <div>
                                 <p className="font-black text-slate-900 text-lg tracking-tight mb-1">{med.name}</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{med.genericName}</p>
                                 <div className="mt-3 flex gap-2">
                                    <span className="px-2 py-0.5 bg-emerald-50 text-[8px] font-black text-emerald-600 rounded uppercase tracking-tighter border border-emerald-100">{med.department}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 rounded uppercase tracking-tighter border border-slate-200">{med.category}</span>
                                    {med.barcode && <span className="px-2 py-0.5 bg-amber-50 text-[8px] font-black text-amber-600 rounded uppercase tracking-tighter border border-amber-100 flex items-center gap-1"><BarcodeIcon size={8} /> {med.barcode}</span>}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-xl text-slate-400"><Tag size={16} /></div>
                              <div>
                                 <p className="font-black text-slate-800 text-sm">{med.brand}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{med.manufacturer}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                           <div className={`inline-flex flex-col px-5 py-2 rounded-2xl ${calculateTotalStock(med) <= med.minThreshold ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                              <span className="text-xl font-black">{calculateTotalStock(med)}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest leading-none">In Stock</span>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-right font-black text-emerald-600 text-xl tracking-tighter">
                           ₹{med.price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-10 py-8 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditModal(med)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-lg rounded-2xl transition-all"><Edit2 size={18} /></button>
                              <button onClick={() => onDelete(med.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-white hover:shadow-lg rounded-2xl transition-all"><Trash2 size={18} /></button>
                           </div>
                        </td>
                     </tr>
                     {expandedRows.has(med.id) && (
                        <tr className="bg-emerald-50/20">
                           <td colSpan={5} className="p-10">
                              <div className="bg-white rounded-[40px] p-8 border border-emerald-100 shadow-xl shadow-emerald-900/5 grid grid-cols-1 lg:grid-cols-2 gap-10">
                                 <div>
                                    <div className="flex items-center justify-between mb-6">
                                       <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.3em]">Inventory Ageing / Batch Breakdown</h4>
                                       <button 
                                          onClick={() => openAddBatchModal(med)}
                                          className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800"
                                       >
                                          <PlusCircle size={14} /> New Batch
                                       </button>
                                    </div>
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                       {med.batches.map(batch => (
                                          <div key={batch.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-slate-100 group/batch">
                                             <div className="flex items-center gap-4">
                                                <div className="bg-white p-3 rounded-2xl border border-slate-100 text-slate-300 group-hover/batch:text-emerald-600 transition-colors">
                                                   <Box size={20} />
                                                </div>
                                                <div>
                                                   <p className="text-xs font-black text-slate-800 tracking-tight">Batch {batch.batchNumber}</p>
                                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Exp: {new Date(batch.expiryDate).toLocaleDateString()}</p>
                                                </div>
                                             </div>
                                             <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100">
                                                   <button 
                                                      onClick={() => handleStockAdjustment(med, batch.id, -1)}
                                                      className="text-slate-400 hover:text-rose-500 transition-colors"
                                                   >
                                                      <MinusCircle size={18} />
                                                   </button>
                                                   <span className="w-8 text-center font-black text-slate-900">{batch.stock}</span>
                                                   <button 
                                                      onClick={() => handleStockAdjustment(med, batch.id, 1)}
                                                      className="text-slate-400 hover:text-emerald-600 transition-colors"
                                                   >
                                                      <PlusCircle size={18} />
                                                   </button>
                                                </div>
                                                <div className="text-right min-w-[60px]">
                                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                                                </div>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                                 <div className="flex flex-col">
                                    <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.3em] mb-6">Pharmacological Master Data</h4>
                                    <div className="flex-1 bg-slate-50 rounded-[40px] p-8 border border-emerald-100 flex flex-col items-center justify-center text-center">
                                       <div className="w-16 h-16 bg-white rounded-[24px] shadow-sm flex items-center justify-center text-emerald-600 mb-6">
                                          <BrainCircuit size={32} />
                                       </div>
                                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Scientific Composition</p>
                                       <p className="text-sm font-black text-slate-800 leading-relaxed max-w-[200px]">
                                          {med.ingredients || 'Composition not updated in master record.'}
                                       </p>
                                       <div className="mt-8 flex gap-3">
                                          <button className="px-6 py-3 bg-white text-emerald-600 font-black rounded-2xl border border-emerald-100 text-[10px] uppercase tracking-widest shadow-sm hover:shadow-emerald-600/10 transition-all">
                                             Generate Label
                                          </button>
                                          <button className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-sm hover:bg-black transition-all">
                                             Audit History
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </td>
                        </tr>
                     )}
                  </React.Fragment>
               ))}
            </tbody>
         </table>
      </div>

      {/* Main Item Master Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
           <div className="bg-white rounded-[48px] w-full max-w-5xl p-12 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{editingMed ? 'Edit Item Master' : 'Inventory Registration Master'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={32} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Product Name</label>
                       <input required name="name" defaultValue={editingMed?.name} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Generic Formula</label>
                       <input required name="genericName" defaultValue={editingMed?.genericName} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Brand Name</label>
                       <input required name="brand" defaultValue={editingMed?.brand} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Manufacturer</label>
                       <input required name="manufacturer" defaultValue={editingMed?.manufacturer} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Barcode Identifier</label>
                       <div className="flex gap-2">
                          <input 
                            name="barcode" 
                            value={scannedBarcode}
                            onChange={(e) => setScannedBarcode(e.target.value)}
                            placeholder="UPC / EAN / SKU" 
                            className="flex-1 p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" 
                          />
                          <button 
                            type="button"
                            onClick={() => setIsInternalScannerOpen(true)}
                            className="p-5 bg-emerald-100 text-emerald-600 rounded-[28px] hover:bg-emerald-200 transition-all flex items-center justify-center"
                          >
                            <Scan size={24} />
                          </button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Department</label>
                       <select name="department" defaultValue={editingMed?.department} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none font-black">
                          <option>Pharmacy</option>
                          <option>Surgical</option>
                          <option>FMCG</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Category</label>
                       <select name="category" defaultValue={editingMed?.category} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none font-black">
                          {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Unit Price (₹)</label>
                       <input required type="number" step="0.01" name="price" defaultValue={editingMed?.price} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Min Stock Threshold</label>
                       <input required type="number" name="minThreshold" defaultValue={editingMed?.minThreshold} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="lg:col-span-3 space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Active Ingredients / Composition</label>
                       <textarea name="ingredients" defaultValue={editingMed?.ingredients} className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold h-24 resize-none" />
                    </div>
                 </div>

                 {/* Initial Batch Section */}
                 {!editingMed && (
                    <div className="bg-emerald-50/50 p-10 rounded-[40px] border border-emerald-100">
                       <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                          <CalendarDays size={20} /> Opening Stock / Initial Batch
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-emerald-400 px-4 tracking-widest">Batch Number</label>
                             <input required name="batchNumber" placeholder="e.g. BT-992" className="w-full p-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-emerald-400 px-4 tracking-widest">Expiry Date</label>
                             <input required type="date" name="expiryDate" className="w-full p-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-emerald-400 px-4 tracking-widest">Opening Qty</label>
                             <input required type="number" name="stock" className="w-full p-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-emerald-400 px-4 tracking-widest">Purchase Price (₹)</label>
                             <input required type="number" step="0.01" name="purchasePrice" className="w-full p-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                          </div>
                       </div>
                    </div>
                 )}

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-[28px] uppercase tracking-[0.2em] text-[10px]">Abandon Draft</button>
                    <button type="submit" className="flex-1 py-5 bg-emerald-600 text-white font-black rounded-[28px] uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-600/20">Commit to Master</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Add New Batch Modal */}
      {isBatchModalOpen && selectedMedForBatch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[48px] w-full max-w-2xl p-12 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Register New Batch</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{selectedMedForBatch.name}</p>
                 </div>
                 <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddBatch} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-widest">Batch Number</label>
                       <input required name="batchNumber" className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-widest">Expiry Date</label>
                       <input required type="date" name="expiryDate" className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-widest">Initial Qty</label>
                       <input required type="number" name="stock" className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-widest">Purchase Price (₹)</label>
                       <input required type="number" step="0.01" name="purchasePrice" className="w-full p-5 bg-slate-50 border-none rounded-[28px] focus:ring-2 focus:ring-emerald-500 outline-none text-black font-black" />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsBatchModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20">Add Batch</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isInternalScannerOpen && (
        <ScannerModal 
          onScan={(code) => {
            setScannedBarcode(code);
            setIsInternalScannerOpen(false);
          }} 
          onClose={() => setIsInternalScannerOpen(false)} 
          title="Scan Product Code" 
        />
      )}
    </div>
  );
};

export default Inventory;
