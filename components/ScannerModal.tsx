
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface ScannerModalProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onScan, onClose, title = "Scan Barcode" }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Create the scanner instance
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string) => {
      // Audio feedback (optional but nice)
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2216/2216-preview.mp3');
        audio.play();
      } catch (e) {}
      
      onScan(decodedText);
      onClose();
    };

    const onScanFailure = (error: string) => {
      // Failures happen every frame a code isn't found, usually ignore
    };

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 bg-indigo-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Camera size={20} />
            <h2 className="font-black tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8">
          <div id="qr-reader" className="rounded-3xl overflow-hidden border-4 border-indigo-50"></div>
          
          <div className="mt-8 text-center space-y-2">
            <p className="text-slate-500 font-medium">Position the barcode inside the frame</p>
            <p className="text-xs text-slate-400">Scanner works best in good lighting</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;
