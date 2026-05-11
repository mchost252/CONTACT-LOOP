import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Users, User, Palette, Briefcase, Calendar } from 'lucide-react';
import { Category } from '../../types';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { playSound } from '../../lib/sounds';
import { toast } from 'sonner';

interface CardProps {
  category: Category;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  glowClass: string;
  key?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100 }
  }
};

function DownloadCard({ category, count, icon, colorClass, glowClass }: CardProps) {
  const downloadVcf = () => {
    playSound('click');
    const saved = localStorage.getItem('loopUser');
    let user = null;
    try {
      if (saved && saved !== 'null' && saved !== 'undefined') {
        user = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Parse check failed user", e);
    }
    
    if (!user) {
      playSound('error');
      toast.error("IDENTITY UNPROCESSED", {
        description: "Join the loop first to unlock access."
      });
      
      const el = document.getElementById('join');
      if (el) {
        window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
        el.classList.add('ring-4', 'ring-brand-orange/40', 'ring-offset-4', 'ring-offset-deep-bg', 'animate-pulse');
        setTimeout(() => el.classList.remove('ring-4', 'ring-brand-orange/40', 'ring-offset-4', 'ring-offset-deep-bg', 'animate-pulse'), 3000);
      }
      return;
    }
    
    toast.success(`DECRYPTING: ${category} PACK SYNCING...`);
    
    try {
      const vcfContent = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:LOOP ${category.toUpperCase()} Member 1`,
        "TEL;TYPE=CELL:+2348000000000",
        "END:VCARD",
        "\nBEGIN:VCARD",
        "VERSION:3.0",
        `FN:LOOP ${category.toUpperCase()} Member 2`,
        "TEL;TYPE=CELL:+2548000000000",
        "END:VCARD"
      ].join("\n");

      const blob = new Blob([vcfContent], { type: 'text/vcard' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `loop_${category.toLowerCase()}_contacts.vcf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("VCF Generation failed", error);
      toast.error("Download failed. Please try again.");
    }
  };

  return (
    <motion.div 
      variants={cardVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="gamer-card p-5 flex flex-col items-center text-center relative overflow-hidden group border-none shadow-xl bg-white/[0.01]"
    >
      <div className={`absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity ${colorClass} pointer-events-none`} />
      
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${colorClass.replace('bg-', 'bg-')}/10 ${glowClass} shadow-[0_0_15px_transparent] group-hover:shadow-${glowClass.split('-')[1]}/30`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      
      <h3 className="text-sm font-bold mb-1 uppercase tracking-tight">{category === 'All' ? 'All Contacts' : `${category}s`}</h3>
      <p className="text-muted text-[9px] mb-5 max-w-[140px] opacity-50 font-bold uppercase tracking-wider leading-relaxed">
        {category === 'All' ? 'Everyone active in pool' : `Only verified ${category.toLowerCase()}s`}
      </p>
      
      <div className="text-2xl font-display font-bold mb-6">
        {count.toLocaleString()} 
        <div className="text-[9px] font-sans font-bold text-muted uppercase tracking-[0.1em] opacity-30 mt-0.5">active in pool</div>
      </div>
      
      <button 
        onClick={downloadVcf}
        className={`w-full py-3.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 ${colorClass} text-white shadow-lg uppercase tracking-widest hover:brightness-110 relative z-10`}
      >
        <Download size={14} />
        Download
      </button>
    </motion.div>
  );
}

export default function DownloadCards() {
  const [counts, setCounts] = useState<Record<string, number>>({
    'All': 0,
    'Individual': 0,
    'Creator': 0,
    'Business': 0
  });

  useEffect(() => {
    const now = Timestamp.now();
    const q = query(collection(db, 'users'), where('expiresAt', '>=', now));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCounts: Record<string, number> = {
        'All': snapshot.size,
        'Individual': 0,
        'Creator': 0,
        'Business': 0,
        'Other': 0
      };
      
      snapshot.docs.forEach(doc => {
        const cat = doc.data().category;
        if (newCounts[cat] !== undefined) {
          newCounts[cat]++;
        }
      });
      
      setCounts(newCounts);
    });

    return () => unsubscribe();
  }, []);

  const cards: CardProps[] = [
    { 
      category: 'All', 
      count: counts['All'], 
      icon: <Users size={24} className="text-brand-orange" />, 
      colorClass: 'bg-brand-orange',
      glowClass: 'glow-orange'
    },
    { 
      category: 'Individual', 
      count: counts['Individual'], 
      icon: <User size={24} className="text-[#10B981]" />, 
      colorClass: 'bg-[#10B981]',
      glowClass: 'glow-accent'
    },
    { 
      category: 'Creator', 
      count: counts['Creator'], 
      icon: <Palette size={24} className="text-[#3B82F6]" />, 
      colorClass: 'bg-[#3B82F6]',
      glowClass: 'glow-blue'
    },
    { 
      category: 'Business', 
      count: counts['Business'], 
      icon: <Briefcase size={24} className="text-[#A855F7]" />, 
      colorClass: 'bg-[#A855F7]',
      glowClass: 'glow-purple'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20" id="downloads">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-12 gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-bold flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange">
              <Download size={18} className="md:w-5 md:h-5" />
            </div>
            Active Contact Packs
          </h2>
          <p className="text-muted text-xs mt-1 md:mt-2 opacity-50">Verified network refreshed every 24 hours.</p>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest text-muted">
          <Calendar size={12} className="text-brand-orange" />
          Active Session
        </div>
      </div>
      
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
      >
        {cards.map((card, i) => (
          <DownloadCard 
            key={`${card.category}-${i}`} 
            category={card.category}
            count={card.count}
            icon={card.icon}
            colorClass={card.colorClass}
            glowClass={card.glowClass}
          />
        ))}
      </motion.div>

      <div className="mt-12 p-8 rounded-[32px] border border-white/5 bg-gradient-to-r from-brand-orange/5 to-brand-blue/5 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <div className="font-bold text-lg mb-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
            Quick Reminder
          </div>
          <p className="text-muted text-sm">You can download each pack only once per day. Come back tomorrow for a new set of contacts to keep your views growing!</p>
        </div>
        <div className="flex -space-x-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-10 h-10 rounded-full bg-white/10 border-2 border-deep-bg" />
          ))}
          <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center font-bold text-xs border-2 border-deep-bg">
            50+
          </div>
        </div>
      </div>
    </div>
  );
}
