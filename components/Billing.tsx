import React, { useState, useEffect, useRef } from 'react';
import { Medicine, Invoice, InvoiceItem } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  Minus, 
  CheckCircle2, 
  X, 
  Scan, 
  AlertTriangle, 
  Download, 
  ArrowRight, 
  Zap, 
  QrCode, 
  Receipt, 
  History, 
  Loader2, 
  FileDown, 
  MessageCircle, 
  Stethoscope, 
  BellRing, 
  Award, 
  ShieldCheck, 
  MapPin, 
  PhoneCall, 
  Globe,
  CreditCard,
  Settings2,
  AlertCircle,
  Printer,
  CalendarDays,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import ScannerModal from './ScannerModal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { checkDrugInteractions } from '../services/geminiService';

interface BillingProps {
  medicines: Medicine[];
  onInvoiceCreated: (invoice: Invoice) => void;
}

const Billing: React.FC<BillingProps> = ({ medicines, onInvoiceCreated }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [abhaId, setAbhaId] = useState('');
  const [refillReminder, setRefillReminder] = useState(false);
  const [isChronic, setIsChronic] = useState(false);
  const [treatmentDuration, setTreatmentDuration] = useState('30');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('UPI');
  const [merchantVpa, setMerchantVpa] = useState('trustmeds@okaxis');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showInteractionBlock, setShowInteractionBlock] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [interactionAlert, setInteractionAlert] = useState<string | null>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scanMessage) {
      const timer = setTimeout(() => setScanMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanMessage]);

  useEffect(() => {
    const triggerInteractionCheck = async () => {
      if (cart.length > 1) {
        setIsCheckingInteractions(true);
        const medNames = cart.map(item => item.name);
        const alert = await checkDrugInteractions(medNames);
        if (alert && !alert.toLowerCase().includes("no significant interactions")) {
          setInteractionAlert(alert);
        } else {
          setInteractionAlert(null);
        }
        setIsCheckingInteractions(false);
      } else {
        setInteractionAlert(null);
      }
    };

    const timer = setTimeout(triggerInteractionCheck, 1200);
    return () => clearTimeout(timer);
  }, [cart]);

  const calculateTotalStock = (med: Medicine) => med.batches.reduce((sum, b) => sum + b.stock, 0);

  const availableMedicines = medicines.filter(m => {
    const totalStock = calculateTotalStock(m);
    return totalStock > 0 && 
    (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.brand.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const addToCart = (med: Medicine) => {
    const existing = cart.find(item => item.medicineId === med.id);
    const totalAvailable = calculateTotalStock(med);

    if (totalAvailable <= 0) {
      setScanMessage({ text: `"${med.name}" is currently out of stock!`, type: 'error' });
      return false;
    }

    if (existing) {
      if (existing.quantity >= totalAvailable) {
        setScanMessage({ text: `Maximum available stock reached for "${med.name}"`, type: 'info' });
        return false;
      }
      setCart(prevCart => prevCart.map(item => 
        item.medicineId === med.id 
        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.pricePerUnit }
        : item
      ));
    } else {
      setCart(prevCart => [...prevCart, {
        medicineId: med.id,
        name: med.name,
        quantity: 1,
        pricePerUnit: med.price,
        total: med.price,
        gstRate: 12
      }]);
    }
    setScanMessage({ text: `Added "${med.name}" to cart`, type: 'success' });
    return true;
  };

  const handleBarcodeScan = (barcode: string) => {
    const matchedMedicine = medicines.find(m => m.barcode === barcode);
    if (matchedMedicine) {
      const added = addToCart(matchedMedicine);
      if (added) setIsScannerOpen(false);
    } else {
      setScanMessage({ text: "Product code not recognized.", type: 'error' });
    }
  };

  const updateQuantity = (id: string, newVal: number) => {
    const med = medicines.find(m => m.id === id);
    const totalAvailable = med ? calculateTotalStock(med) : 0;
    const finalQty = Math.max(1, Math.min(totalAvailable, newVal));
    setCart(cart.map(item => 
      item.medicineId === id 
      ? { ...item, quantity: finalQty, total: finalQty * item.pricePerUnit }
      : item
    ));
  };

  const finalizeTransaction = () => {
    const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);
    const gstTotal = cart.reduce((acc, item) => acc + (item.total * (item.gstRate || 0) / 100), 0);

    const invoice: Invoice = {
      id: `INV-${Date.now()}`,
      customerName,
      customerPhone,
      abhaId: abhaId.trim() || undefined,
      date: new Date().toISOString(),
      items: [...cart],
      totalAmount,
      gstTotal,
      paymentMethod,
      refillReminder,
      isChronic,
      treatmentDuration: isChronic ? parseInt(treatmentDuration) : undefined
    };

    onInvoiceCreated(invoice);
    setLastInvoice(invoice);
    setRecentInvoices(prev => [invoice, ...prev].slice(0, 10));
    setIsSuccessModalOpen(true);
    setShowInteractionBlock(false);
    
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setAbhaId('');
    setRefillReminder(false);
    setIsChronic(false);
    setTreatmentDuration('30');
    setInteractionAlert(null);
  };

  const handleCheckout = () => {
    if (cart.length === 0 || !customerName || customerPhone.length !== 10) return;

    // Safety Interlock: If Gemini found a dangerous interaction, block the simple checkout
    if (interactionAlert) {
      setShowInteractionBlock(true);
      return;
    }

    finalizeTransaction();
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current || !lastInvoice) return;
    setIsGeneratingPDF(true);
    try {
      const element = invoiceRef.current;
      const originalDisplay = element.style.display;
      element.style.display = 'block';
      element.style.width = '210mm'; 
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '0';
      const canvas = await html2canvas(element, { scale: 4, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: 1000 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`TrustMeds_Invoice_${lastInvoice.id.split('-')[1]}.pdf`);
      element.style.display = originalDisplay;
      element.style.position = '';
      element.style.left = '';
      element.style.width = '';
    } catch (error) {
      console.error("PDF Fail:", error);
      alert("PDF generation failed.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const printInvoice = () => {
    if (!lastInvoice) return;
    window.print();
  };

  const shareWhatsAppPayment = () => {
    if (!lastInvoice) return;
    const upiLink = `upi://pay?pa=${merchantVpa}&pn=TrustMeds%20Pharmacy&am=${lastInvoice.totalAmount}&cu=INR&tn=Invoice-${lastInvoice.id.split('-')[1]}`;
    const text = `*TrustMeds Digital Bill*\n\n` +
      `*Invoice:* #${lastInvoice.id.split('-')[1]}\n` +
      `*Patient:* ${lastInvoice.customerName}\n` +
      `*Payable:* ₹${lastInvoice.totalAmount.toLocaleString('en-IN')}\n\n` +
      `*UPI PAYMENT LINK:* \n${upiLink}\n\n` +
      `_Thank you!_`;
    const cleanPhone = lastInvoice.customerPhone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const downloadTXT = (invoice: Invoice | null = lastInvoice) => {
    if (!invoice) return;
    let content = `TRUSTMEDS OFFICIAL INVOICE\nID: ${invoice.id}\nDate: ${invoice.date}\nCustomer: ${invoice.customerName}\nTotal: ₹${invoice.totalAmount}\nItems:\n`;
    invoice.items.forEach(i => content += `- ${i.name} (x${i.quantity}) ₹${i.total}\n`);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.id}.txt`;
    link.click();
  };

  const isPhoneValid = customerPhone.length === 10;

  return (
    <div className="space-y-12">
      {scanMessage && (
        <div className={`fixed top-24 right-10 z-[110] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 ${
          scanMessage.type === 'success' ? 'bg-emerald-600 text-white' : 
          scanMessage.type === 'error' ? 'bg-rose-600 text-white' : 
          'bg-indigo-600 text-white'
        }`}>
          {scanMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-bold text-sm">{scanMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative no-print">
        {interactionAlert && (
          <div className="lg:col-span-5 bg-rose-50 border-2 border-rose-200 rounded-[32px] p-6 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500 ring-4 ring-rose-500/20 ring-offset-0 animate-pulse">
            <div className="bg-rose-500 p-2 rounded-xl text-white shadow-lg shadow-rose-200">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-rose-900 font-black uppercase text-[10px] tracking-widest mb-1">Pharmacist Advisory: Dangerous Interaction Detected</p>
              <p className="text-rose-700 font-bold text-sm leading-relaxed">{interactionAlert}</p>
            </div>
          </div>
        )}

        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search inventory by medicine, brand or salt..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="px-6 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-700 transition-all flex items-center gap-2 font-black uppercase text-xs shadow-lg shadow-emerald-600/20"
            >
              <Scan size={20} />
              <span>TrustLens</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {availableMedicines.map(med => (
              <button
                key={med.id}
                onClick={() => addToCart(med)}
                className="p-6 bg-white border border-slate-100 rounded-[36px] text-left hover:border-emerald-300 hover:shadow-xl transition-all group flex items-start gap-4"
              >
                <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                  <Plus size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-800 text-base">{med.name}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3">{med.genericName}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-black text-emerald-600 text-lg">₹{med.price.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase bg-slate-100 text-slate-400">
                      S: {calculateTotalStock(med)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[44px] p-8 shadow-2xl shadow-emerald-900/5 border border-slate-50 flex flex-col h-full max-h-[900px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <Receipt className="text-emerald-600" size={24} />
                Billing Terminal
              </h3>
              <div className="flex items-center gap-2">
                {isCheckingInteractions && <Loader2 className="animate-spin text-emerald-400" size={18} />}
                <button 
                  onClick={() => setShowPaymentSettings(!showPaymentSettings)}
                  className={`p-2 rounded-xl transition-all ${showPaymentSettings ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <Settings2 size={20} />
                </button>
              </div>
            </div>

            {showPaymentSettings && (
              <div className="mb-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest mb-2 block">Store UPI VPA</label>
                <div className="flex gap-2">
                  <input 
                    value={merchantVpa}
                    onChange={(e) => setMerchantVpa(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="pharmacy@upi"
                  />
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 mb-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-[0.2em]">Patient Record</label>
                <input 
                  placeholder="Full Name" 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-black text-black"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input 
                      placeholder="Mobile (10 Digits)" 
                      maxLength={10}
                      className={`w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 outline-none text-sm font-black text-black transition-all ${
                        customerPhone.length > 0 && !isPhoneValid ? 'ring-2 ring-rose-400' : 'focus:ring-emerald-500'
                      }`}
                      value={customerPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setCustomerPhone(val);
                      }}
                    />
                    <Smartphone className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      customerPhone.length > 0 && !isPhoneValid ? 'text-rose-400' : 'text-slate-300'
                    }`} size={18} />
                    {isPhoneValid && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                    )}
                  </div>
                  <div className="relative">
                     <input 
                      placeholder="ABHA ID" 
                      className="w-full px-6 py-4 bg-blue-50/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-black text-blue-900 placeholder:text-blue-300"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                    />
                    <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200" size={16} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} className={isChronic ? "text-indigo-600" : "text-slate-300"} />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Chronic Care Enrollment</span>
                    </div>
                    <button 
                      onClick={() => setIsChronic(!isChronic)}
                      className={`w-10 h-6 rounded-full transition-all relative ${isChronic ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isChronic ? 'left-5' : 'left-1'}`} />
                    </button>
                 </div>
                 
                 {isChronic && (
                    <div className="flex items-center gap-4 animate-in slide-in-from-top-2 duration-200 pt-2 border-t border-slate-100">
                       <div className="flex-1">
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Days of Supply (Duration)</label>
                          <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                value={treatmentDuration}
                                onChange={(e) => setTreatmentDuration(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                             />
                             <span className="text-[10px] font-bold text-slate-400">Days</span>
                          </div>
                       </div>
                       <CalendarDays className="text-indigo-100" size={32} />
                    </div>
                 )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-8 custom-scrollbar">
              {cart.map(item => (
                <div key={item.medicineId} className="flex items-center justify-between group bg-slate-50/50 p-4 rounded-[28px] border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex-1">
                    <p className="font-black text-slate-800 text-sm">{item.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">₹{item.pricePerUnit.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
                      <button onClick={() => updateQuantity(item.medicineId, item.quantity - 1)} className="p-2 text-slate-400 hover:text-rose-500"><Minus size={14} strokeWidth={3} /></button>
                      <input 
                        type="number"
                        className="w-12 text-center text-sm font-black text-black bg-transparent border-none focus:ring-0 p-0"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.medicineId, parseInt(e.target.value) || 1)}
                      />
                      <button onClick={() => updateQuantity(item.medicineId, item.quantity + 1)} className="p-2 text-slate-400 hover:text-emerald-600"><Plus size={14} strokeWidth={3} /></button>
                    </div>
                    <button onClick={() => setCart(cart.filter(i => i.medicineId !== item.medicineId))} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-6">
              <div className="flex justify-between items-center px-2">
                <div className="flex flex-col">
                  <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Total Payable</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                      <CreditCard size={10} className="text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500">{merchantVpa}</span>
                  </div>
                </div>
                <span className="text-slate-900 text-4xl font-black tracking-tighter">₹{cart.reduce((a,b)=>a+b.total,0).toLocaleString('en-IN')}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || !customerName || !isPhoneValid}
                className={`w-full py-6 font-black rounded-[32px] transition-all shadow-2xl disabled:opacity-50 ${
                  interactionAlert 
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                {interactionAlert ? 'Review Risks & Complete' : 'Complete Transaction'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Interlock Modal for Drug Interactions */}
      {showInteractionBlock && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md no-print">
          <div className="bg-white rounded-[56px] w-full max-w-xl p-12 text-center shadow-2xl border-4 border-rose-500/20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-rose-300 to-rose-500" />
             <div className="mx-auto w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-8 border border-rose-100">
               <ShieldAlert size={40} strokeWidth={2.5} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Clinical Safety Lock</h2>
             <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
               The current combination of medicines carries a significant clinical risk according to the TrustMeds AI Guardian. 
               Please review the warning below before proceeding.
             </p>
             
             <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100 text-left mb-10">
                <p className="text-rose-900 font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                   <AlertCircle size={14} /> AI Clinical Advisory
                </p>
                <p className="text-rose-800 font-bold text-sm italic">"{interactionAlert}"</p>
             </div>

             <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={finalizeTransaction} 
                  className="w-full py-5 bg-rose-600 text-white font-black rounded-3xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 text-xs uppercase tracking-widest"
                >
                  Clinical Override: Proceed Anyway
                </button>
                <button 
                  onClick={() => setShowInteractionBlock(false)} 
                  className="w-full py-4 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-[0.4em] transition-all"
                >
                  Return to Edit Cart
                </button>
             </div>
          </div>
        </div>
      )}

      {isSuccessModalOpen && lastInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl no-print">
          <div className="bg-white rounded-[56px] w-full max-w-2xl p-14 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-50 rounded-full opacity-30" />
            <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-8 border border-emerald-100 shadow-inner relative z-10">
              <CheckCircle2 size={48} strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter relative z-10">Sale Finalized</h2>
            
            <div className="grid grid-cols-1 gap-4 mb-8 relative z-10">
              <button 
                onClick={printInvoice} 
                className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                <Printer size={24} strokeWidth={2.5} /> Print Physical Receipt
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={downloadPDF} 
                  disabled={isGeneratingPDF}
                  className="py-5 bg-white border-2 border-slate-100 text-slate-900 font-black rounded-3xl flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  {isGeneratingPDF ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />} 
                  Digital PDF
                </button>
                <button 
                  onClick={shareWhatsAppPayment} 
                  className="py-5 bg-[#25D366] text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  <MessageCircle size={20} /> Share via WA
                </button>
              </div>
            </div>

            <button onClick={() => setIsSuccessModalOpen(false)} className="px-10 py-4 text-slate-400 hover:text-emerald-600 font-black rounded-2xl text-[9px] uppercase tracking-[0.4em] transition-all flex items-center gap-2 mx-auto">
              Start New Order <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Professional Hidden Invoice Template for Capture/Print */}
      <div id="invoice-template" ref={invoiceRef} className="print-only" style={{ background: '#ffffff' }}>
        <div style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#000000', fontFamily: "'Inter', sans-serif" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #10b981', paddingBottom: '10mm', marginBottom: '12mm' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8mm' }}>
              <div style={{ background: '#10b981', width: '22mm', height: '22mm', borderRadius: '7mm', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                <Zap size={48} color="#ffffff" fill="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: '36pt', fontWeight: 900, margin: 0, letterSpacing: '-2px', color: '#064e3b' }}>TrustMeds</h1>
                <p style={{ fontSize: '11pt', fontWeight: 800, margin: 0, color: '#10b981', textTransform: 'uppercase', letterSpacing: '3px' }}>Pharma Excellence</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '22pt', fontWeight: 900, textTransform: 'uppercase', margin: 0, color: '#0f172a', letterSpacing: '1px' }}>Tax Invoice</h2>
              <div style={{ marginTop: '3mm' }}>
                <span style={{ fontSize: '11pt', color: '#64748b', fontWeight: 600 }}>Reference: </span>
                <span style={{ fontSize: '14pt', fontWeight: 900, color: '#10b981' }}>#{lastInvoice?.id.split('-')[1]}</span>
              </div>
              <p style={{ fontSize: '10pt', color: '#94a3b8', margin: '2mm 0', fontWeight: 500 }}>{lastInvoice ? new Date(lastInvoice.date).toLocaleDateString('en-IN', { dateStyle: 'long' }) : ''}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15mm', marginBottom: '16mm' }}>
            <div style={{ background: '#f8fafc', padding: '10mm', borderRadius: '10mm', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '5mm', letterSpacing: '2px' }}>Patient Details</p>
              <h3 style={{ fontSize: '20pt', fontWeight: 900, margin: '0 0 3mm 0', color: '#0f172a' }}>{lastInvoice?.customerName}</h3>
              <div style={{ fontSize: '12pt', color: '#475569', fontWeight: 600 }}>+91 {lastInvoice?.customerPhone}</div>
              {lastInvoice?.isChronic && (
                <div style={{ fontSize: '9pt', color: '#1e40af', background: '#eff6ff', padding: '1mm 3mm', borderRadius: '2mm', display: 'inline-block', marginTop: '3mm', fontWeight: 700 }}>
                   Chronic Care: {lastInvoice.treatmentDuration} Days Supply
                </div>
              )}
            </div>
            <div style={{ padding: '4mm 10mm' }}>
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '5mm', letterSpacing: '2px' }}>Store Address</p>
              <h3 style={{ fontSize: '16pt', fontWeight: 900, margin: '0 0 2mm 0', color: '#0f172a' }}>TrustMeds Health Hub</h3>
              <p style={{ fontSize: '11pt', color: '#64748b', margin: 0, lineHeight: 1.8 }}>Delhi Business District, NCR - 110001</p>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20mm' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '6mm', textAlign: 'left', borderRadius: '5mm 0 0 0' }}>Description</th>
                <th style={{ padding: '6mm', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '6mm', textAlign: 'right', borderRadius: '0 5mm 0 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lastInvoice?.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <td style={{ padding: '7mm 6mm' }}><div style={{ fontWeight: 800 }}>{item.name}</div></td>
                  <td style={{ padding: '7mm 4mm', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '7mm 6mm', textAlign: 'right', fontWeight: 900 }}>₹{item.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <div style={{ width: '100mm', background: '#0f172a', padding: '7mm 10mm', borderRadius: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff' }}>
                <span style={{ fontSize: '14pt', fontWeight: 900 }}>Total Payable</span>
                <span style={{ fontSize: '28pt', fontWeight: 900 }}>₹{lastInvoice?.totalAmount.toLocaleString('en-IN')}</span>
             </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '30mm' }}>
            <p style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>Healing Happens Here.</p>
          </div>
        </div>
      </div>

      <div className="no-print">
         <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
           <History size={18} className="text-emerald-600" /> Recent Terminal Activity
         </h3>
         <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
               <tbody className="divide-y divide-slate-100">
                  {recentInvoices.length > 0 ? recentInvoices.map(inv => (
                     <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-black text-emerald-600 text-xs">{inv.id.split('-')[1]}</td>
                        <td className="px-8 py-5 font-bold text-slate-800 text-sm">{inv.customerName}</td>
                        <td className="px-8 py-5 font-black text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="px-8 py-5 text-right">
                           <button onClick={() => downloadTXT(inv)} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"><Download size={16} /></button>
                        </td>
                     </tr>
                  )) : (
                    <tr><td className="px-8 py-10 text-center text-slate-300 font-bold italic" colSpan={4}>Empty session. No transactions detected.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {isScannerOpen && <ScannerModal onScan={handleBarcodeScan} onClose={() => setIsScannerOpen(false)} title="Product Lookup" />}
    </div>
  );
};

export default Billing;
