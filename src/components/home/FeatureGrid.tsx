import React from 'react';
import { ShieldCheck, Timer, LineChart } from 'lucide-react';
import { motion } from 'motion/react';

export default function FeatureGrid() {
  const features = [
    {
      icon: <ShieldCheck className="text-brand-blue" />,
      title: 'Safe & Secure',
      desc: 'Your information is protected. We never share your data outside the active contact loop.'
    },
    {
      icon: <Timer className="text-brand-orange" />,
      title: '3-Day Active Cycle',
      desc: 'Your contact will be shared for exactly 72 hours, keeping the list fresh and high-quality.'
    },
    {
      icon: <LineChart className="text-brand-accent" />,
      title: 'Real People, Real Growth',
      desc: 'Join real status viewers and entrepreneurs looking to grow their WhatsApp reach daily.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 border-t border-white/5">
      <motion.div 
        className="grid md:grid-cols-3 gap-4"
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
        {features.map((f, i) => (
          <motion.div 
            key={i} 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="gamer-card p-5 flex items-start gap-4 hover:bg-white/[0.04] transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {React.cloneElement(f.icon as React.ReactElement, { size: 20 })}
            </div>
            <div>
              <h3 className="text-xs font-bold mb-1 uppercase tracking-tighter">{f.title}</h3>
              <p className="text-[9px] text-muted leading-relaxed uppercase tracking-widest font-bold opacity-40">
                {f.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
