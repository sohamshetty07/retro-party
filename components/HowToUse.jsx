'use client';

import React, { useState } from 'react';
import { HelpCircle, X, QrCode, Smartphone, Cloud, Camera, Download } from 'lucide-react';

const HowToUse = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
      >
        <span className="text-[10px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase">Manual</span>
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

      {/* The "Manual" Card */}
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter">RETRO<span className="text-red-500">CAM</span></h2>
            <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-1">Quick Start Guide</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          
          {/* Section 1: Party Mode (The USP) */}
          <div className="space-y-3">
             <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="bg-red-600 w-2 h-2 rounded-full animate-pulse"></span> 
                PARTY MODE
             </h3>
             <div className="grid grid-cols-3 gap-2">
                <Step icon={<Cloud size={18}/>} step="1" text="Host logins & creates event" />
                <Step icon={<QrCode size={18}/>} step="2" text="Friends scan QR to join" />
                <Step icon={<Smartphone size={18}/>} step="3" text="Photos upload to Host's Drive" />
             </div>
          </div>

          <div className="w-full h-px bg-white/10"></div>

          {/* Section 2: Solo Mode */}
          <div className="space-y-3">
             <h3 className="text-sm font-bold text-neutral-300">SOLO MODE</h3>
             <div className="grid grid-cols-3 gap-2">
                <Step icon={<Camera size={18}/>} step="1" text="Open Camera (No Login)" />
                <Step icon={<Smartphone size={18}/>} step="2" text="Snap Retro Photos" />
                <Step icon={<Download size={18}/>} step="3" text="Save directly to Device" />
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
            <button 
                onClick={() => setIsOpen(false)}
                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 transition-colors text-xs tracking-widest uppercase"
            >
                Got it
            </button>
        </div>

      </div>
    </div>
  );
};

// Helper Component for the steps
const Step = ({ icon, step, text }) => (
  <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center text-center gap-2 border border-white/5">
    <div className="text-neutral-400 mb-1">{icon}</div>
    <p className="text-[10px] font-bold text-white leading-tight">{text}</p>
  </div>
);

export default HowToUse;