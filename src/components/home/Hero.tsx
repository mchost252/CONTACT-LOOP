import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Users, TrendingUp, ChevronRight, User } from 'lucide-react';
import { playSound } from '../../lib/sounds';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';

export default function Hero() {
  const [stats, setStats] = useState({ total: 0, today: 0 });

  useEffect(() => {
    const unsubTotal = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, total: snapshot.size }));
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const qToday = query(collection(db, 'users'), where('createdAt', '>=', startOfToday.getTime()));
    const unsubToday = onSnapshot(qToday, (snapshot) => {
      setStats(prev => ({ ...prev, today: snapshot.size }));
    });

    return () => { unsubTotal(); unsubToday(); };
  }, []);

  const scrollToJoin = () => {
    playSound('click');
    document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative pt-24 pb-12 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-orange/10 blur-[120px] rounded-full pointer-events-none animate-float" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-blue/10 blur-[120px] rounded-full pointer-events-none animate-float" style={{ animationDelay: '-3s' }} />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.2, 0],
              y: [-20, -100],
              x: Math.random() * 100 - 50 
            }}
            transition={{ 
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-1 h-1 bg-brand-orange rounded-full"
            style={{ 
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center md:text-left grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-orange text-[10px] font-bold uppercase tracking-widest mb-4 italic">
              <Zap size={12} className="fill-current" />
              Verified Status Growth Protocol
            </div>
            
            <h1 className="text-4xl md:text-7xl font-bold leading-[1.0] mb-6 uppercase tracking-tighter">
              Level Up Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-[#FFDD00]">
                Social Reach.
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-muted mb-10 max-w-sm mx-auto md:mx-0 font-bold uppercase tracking-widest leading-relaxed opacity-60">
              The exchange loop for growth-minded people. Verified human contacts. No bots.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start mb-12">
               <motion.button 
                 onClick={scrollToJoin}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="gamer-card bg-brand-orange text-white px-8 py-4 flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_20px_rgba(255,122,0,0.2)] border-none"
               >
                 <span className="text-xs font-bold uppercase tracking-[0.3em]">Join The Sync</span>
                 <ChevronRight size={18} />
               </motion.button>

               <div className="flex items-center gap-3">
                 <div className="flex -space-x-3">
                   {[...Array(4)].map((_, i) => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-deep-bg bg-white/5 flex items-center justify-center overflow-hidden">
                       <User size={14} className="text-white/20" />
                     </div>
                   ))}
                 </div>
                 <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Members</div>
               </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
               <div className="gamer-card px-4 py-2 flex items-center gap-3 bg-white/[0.02]">
                  <div className="w-6 h-6 rounded-lg bg-brand-blue/20 flex items-center justify-center text-brand-blue">
                    <Users size={12} />
                  </div>
                  <div className="text-left leading-none">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Pool</div>
                    <div className="text-sm font-bold">{(stats.total).toLocaleString()} Members</div>
                  </div>
               </div>
               <div className="gamer-card px-4 py-2 flex items-center gap-3 bg-white/[0.02]">
                  <div className="w-6 h-6 rounded-lg bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                    <TrendingUp size={12} />
                  </div>
                  <div className="text-left leading-none">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Syncs</div>
                    <div className="text-sm font-bold">{(stats.today).toLocaleString()} Newly Synced</div>
                  </div>
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative group">
              {/* Outer Glows */}
              <div className="absolute -inset-4 bg-brand-orange/20 blur-[60px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-1000 animate-pulse" />
              <div className="absolute -inset-4 bg-brand-blue/20 blur-[60px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-1000 animate-pulse" style={{ animationDelay: '-2s' }} />
              
              {/* The Globe Image */}
              <div className="relative z-10 w-full max-w-[500px] aspect-square rounded-full overflow-hidden border border-white/5 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop"
                  alt="Global Connection Protocol"
                  className="w-full h-full object-cover scale-110 animate-float"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-deep-bg/60 via-transparent to-transparent" />
                
                {/* Scanning lines */}
                <div className="absolute inset-x-0 h-[1px] bg-brand-orange/30 top-1/4 blur-sm animate-scan" />
                <div className="absolute inset-x-0 h-[1px] bg-brand-blue/30 top-3/4 blur-sm animate-scan" style={{ animationDelay: '-1.5s' }} />
              </div>

              {/* Data Floating Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 -right-6 gamer-card px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 z-20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange">Global Sync Active</span>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-8 gamer-card px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 z-20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Node Connection</span>
                  <span className="text-[10px] font-bold text-brand-blue">99.9%</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
