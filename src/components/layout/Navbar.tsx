import React from 'react';
import { motion } from 'motion/react';
import { Share2, UserPlus, LogIn } from 'lucide-react';

export default function Navbar() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-deep-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-orange group-hover:rotate-12 transition-transform shadow-lg">
            <Share2 size={18} className="md:w-5 md:h-5" />
          </div>
          <span className="font-display font-black text-base md:text-2xl tracking-tighter italic uppercase whitespace-nowrap">
            Contact<span className="text-brand-orange">Loop</span>
          </span>
        </div>
        
        <div className="hidden lg:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
          <a href="#" className="hover:text-brand-orange transition-colors">Home</a>
          <a href="#stats" className="hover:text-brand-orange transition-colors">Network</a>
          <a href="#downloads" className="hover:text-brand-orange transition-colors">Drops</a>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => scrollToSection('reactivate')}
            className="flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 border border-white/5 md:border-transparent hover:border-white/10 transition-all text-muted hover:text-white"
          >
            <UserPlus size={12} className="text-brand-blue" />
            <span className="hidden xs:inline">Re-Sync</span>
            <span className="xs:hidden">Sync</span>
          </button>
          <button 
            onClick={() => scrollToSection('join')}
            className="flex items-center gap-2 px-4 py-2 md:px-7 md:py-3 bg-brand-orange text-white text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-xl shadow-[0_4px_20px_rgba(255,122,0,0.3)] hover:scale-105 active:scale-95 transition-all border-none"
          >
            Join
          </button>
        </div>
      </div>
    </nav>
  );
}
