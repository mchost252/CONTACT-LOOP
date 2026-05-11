import React from 'react';

export default function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-white/5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-base tracking-tighter italic uppercase text-white/80">
              Contact<span className="text-brand-orange">Loop</span>
            </span>
          </div>
          <p className="hidden md:block text-[9px] text-muted font-bold uppercase tracking-[0.2em] opacity-30">
            Africa's #1 Status Growth Network
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {['Privacy', 'Terms', 'Contact'].map((link) => (
            <a 
              key={link} 
              href="#" 
              className="text-[9px] uppercase font-bold tracking-[0.1em] text-muted hover:text-brand-orange transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
        
        <div className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-20 text-center md:text-right">
          © 2024 ContactLoop
        </div>
      </div>
    </footer>
  );
}
