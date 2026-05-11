import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Users, ArrowUpRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, getCountFromServer } from 'firebase/firestore';

export default function Stats() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [activeCount, setActiveCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    // Real-time listener for active users
    const now = Timestamp.now();
    const qActive = query(collection(db, 'users'), where('expiresAt', '>=', now));
    
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      setActiveCount(snapshot.size);
    });

    // Statistics for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const qToday = query(collection(db, 'users'), where('createdAt', '>=', Timestamp.fromDate(startOfToday)));
    
    const unsubToday = onSnapshot(qToday, (snapshot) => {
      setDailyCount(snapshot.size);
    });

    // Batch countdown timer
    const timer = setInterval(() => {
      const now = new Date();
      const nextBatch = new Date();
      nextBatch.setHours(23, 0, 0, 0);
      
      if (now > nextBatch) nextBatch.setDate(nextBatch.getDate() + 1);

      const diff = nextBatch.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      unsubActive();
      unsubToday();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="stats">
      <motion.div 
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {/* Countdown Card */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          className="col-span-1 lg:col-span-2 gamer-card p-4 flex flex-col md:flex-row items-center gap-4 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
            <Clock size={20} />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-muted text-[8px] font-bold uppercase tracking-[0.2em] mb-1 opacity-50">Next Download drop</h3>
            <div className="text-xl font-bold mb-0.5 uppercase tracking-tight">Today at 11:00 PM</div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-40">Drop closes in</span>
            <div className="flex gap-1.5">
              {[
                { val: timeLeft.hours, label: 'H' },
                { val: timeLeft.minutes, label: 'M' },
                { val: timeLeft.seconds, label: 'S' },
              ].map((unit) => (
                <div key={unit.label} className="text-center">
                  <div className="w-11 h-12 bg-white/5 rounded-lg flex items-center justify-center text-lg font-display font-bold border border-white/5 shadow-inner">
                    {unit.val.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[7px] text-muted mt-1 uppercase font-bold tracking-widest opacity-30">{unit.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Join Stat Card */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          className="gamer-card p-4 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Users size={16} />
              </div>
              <div className="text-xl font-display font-bold">{(dailyCount).toLocaleString()}</div>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent text-[8px] font-bold uppercase flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-brand-accent animate-ping" />
              Live
            </div>
          </div>
          
          <div className="text-muted text-[8px] font-bold uppercase tracking-widest opacity-40 mb-3">People joined today</div>
          
          <div className="flex items-center justify-between mt-1">
             <div className="text-[8px] font-bold text-brand-accent uppercase tracking-widest opacity-60">Growth</div>
             {/* Sparkline Visualization */}
             <div className="flex items-end gap-0.5 h-6 w-20">
               {[30, 45, 25, 60, 40, 70, 50, 80].map((h, i) => (
                 <motion.div 
                   key={i} 
                   initial={{ height: 0 }}
                   animate={{ height: `${h}%` }}
                   className="flex-1 bg-brand-accent/20 group-hover:bg-brand-accent/40 transition-colors rounded-t-[1px]"
                 />
               ))}
             </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
