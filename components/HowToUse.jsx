'use client';

import React, { useState } from 'react';
import { HelpCircle, X, QrCode, Smartphone, Cloud, Camera, Download, ShieldCheck, Lock, Trash2, Eye } from 'lucide-react';

const HowToUse = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'privacy'

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
      >
        <span className="text-[10px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase">Help & Privacy</span>
        <HelpCircle size={24} strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* The Modal Card */}
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header with Tabs */}
        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter">RETRO<span className="text-red-500">CAM</span></h2>
            
            {/* TABS */}
            <div className="flex gap-4 mt-3">
                <button 
                    onClick={() => setActiveTab('manual')}
                    className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${activeTab === 'manual' ? 'text-white border-red-500' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}
                >
                    User Manual
                </button>
                <button 
                    onClick={() => setActiveTab('privacy')}
                    className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'privacy' ? 'text-white border-green-500' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}
                >
                    <ShieldCheck size={12} /> Privacy
                </button>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Area (Scrollable if needed) */}
        <div className="overflow-y-auto pr-2 space-y-6">
          
          {/* === TAB 1: MANUAL === */}
          {activeTab === 'manual' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                {/* Party Mode */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="bg-red-600 w-2 h-2 rounded-full animate-pulse"></span> 
                        PARTY MODE
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        <Step icon={<Cloud size={18}/>} step="1" text="Host creates event" />
                        <Step icon={<QrCode size={18}/>} step="2" text="Friends scan QR" />
                        <Step icon={<Smartphone size={18}/>} step="3" text="Photos sync to Drive" />
                    </div>
                </div>

                <div className="w-full h-px bg-white/10"></div>

                {/* Solo Mode */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-neutral-300">SOLO MODE</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <Step icon={<Camera size={18}/>} step="1" text="Open Camera" />
                        <Step icon={<Smartphone size={18}/>} step="2" text="Snap Retro Photos" />
                        <Step icon={<Download size={18}/>} step="3" text="Save to Device" />
                    </div>
                </div>
            </div>
          )}

          {/* === TAB 2: PRIVACY === */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg flex items-start gap-3">
                    <ShieldCheck className="text-green-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-green-400 mb-1">Your Data is Safe</h4>
                        <p className="text-[10px] text-green-200/80 leading-relaxed">
                            We act as a secure tunnel between your camera and Google Drive. We do not store your personal photos on our servers.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <PrivacyItem 
                        icon={<Lock size={16} />} 
                        title="Google Security" 
                        desc="Party photos are uploaded directly to the Host's private Google Drive using encrypted connections." 
                    />
                    <PrivacyItem 
                        icon={<Eye size={16} />} 
                        title="Private by Default" 
                        desc="Solo Mode photos never leave your device. They are processed locally in your browser." 
                    />
                    <PrivacyItem 
                        icon={<Trash2 size={16} />} 
                        title="Auto-Cleanup" 
                        desc="Temporary event connection data is automatically wiped from our database after 24 hours." 
                    />
                </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 text-center pt-4 border-t border-white/5">
            <button 
                onClick={() => setIsOpen(false)}
                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 transition-colors text-xs tracking-widest uppercase"
            >
                Close
            </button>
        </div>

      </div>
    </div>
  );
};

// Helper Components
const Step = ({ icon, step, text }) => (
  <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center text-center gap-2 border border-white/5">
    <div className="text-neutral-400 mb-1">{icon}</div>
    <p className="text-[10px] font-bold text-white leading-tight">{text}</p>
  </div>
);

const PrivacyItem = ({ icon, title, desc }) => (
    <div className="flex gap-3 items-start p-2 hover:bg-white/5 rounded-lg transition-colors">
        <div className="mt-1 text-neutral-500">{icon}</div>
        <div>
            <h5 className="text-xs font-bold text-white mb-0.5">{title}</h5>
            <p className="text-[10px] text-neutral-400 leading-normal">{desc}</p>
        </div>
    </div>
);

export default HowToUse;