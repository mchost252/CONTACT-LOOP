import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Zap, AlertCircle, ChevronDown, Rocket } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { playSound } from '../../lib/sounds';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', prefix: '+234', flag: '🇳🇬', hint: '801 000 0000', length: 10 },
  { code: 'GH', name: 'Ghana', prefix: '+233', flag: '🇬🇭', hint: '24 000 0000', length: 9 },
  { code: 'KE', name: 'Kenya', prefix: '+254', flag: '🇰🇪', hint: '700 000 000', length: 9 },
  { code: 'ZA', name: 'South Africa', prefix: '+27', flag: '🇿🇦', hint: '82 000 0000', length: 9 }
];

export default function Reactivate() {
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'not-found'>('idle');

  const handleReactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("RE-SYNC ATTEMPT:", phone);
    
    const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length < 8) {
      playSound('error');
      toast.error(`INVALID LENGTH: Verify your frequency.`);
      return;
    }

    setStatus('loading');
    playSound('click');
    
    try {
      const fullPhone = `${selectedCountry.prefix}${digits}`;
      console.log("SEARCHING FREQUENCY:", fullPhone);
      
      toast.loading("VERIFYING IDENTITY...", { id: 'reactivate' });
      
      const userRef = doc(db, 'users', fullPhone);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.warn("IDENTITY NOT FOUND:", fullPhone);
        toast.dismiss('reactivate');
        setStatus('not-found');
        playSound('error');
        toast.error("PROTOCOL REJECTION: Number not found.");
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }

      const userData = userDoc.data();
      console.log("DATA RETRIEVED, RESTORING SESSION...");
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(now.toMillis() + (3 * 24 * 60 * 60 * 1000));

      const payload = {
        ...userData,
        createdAt: userData.createdAt?.toMillis ? userData.createdAt.toMillis() : userData.createdAt,
        expiresAt: expiresAt.toMillis(),
        updatedAt: now.toMillis()
      };

      await updateDoc(userRef, {
        expiresAt: expiresAt,
        updatedAt: now
      });

      console.log("SESSION PERSISTED:", fullPhone);
      toast.dismiss('reactivate');
      localStorage.setItem('loopUser', JSON.stringify(payload));
      
      setStatus('success');
      toast.success("SYNC RESTORED: Access Granted!");
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('userJoined', { detail: payload }));
        setPhone('');
      }, 800);
    } catch (error) {
      console.error("PROTOCOL FAILURE:", error);
      toast.dismiss('reactivate');
      setStatus('error');
      toast.error("LINK FAILED: Connection Interrupted.");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8" id="reactivate">
      <div className="bg-gradient-to-br from-brand-orange/5 to-brand-blue/5 border border-white/5 rounded-[32px] p-6 text-center relative overflow-hidden group shadow-xl">
        <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange mx-auto mb-4 shadow-lg">
          <Rocket size={24} className={status === 'loading' ? 'animate-bounce' : ''} />
        </div>
        
        <h3 className="text-xl font-bold mb-1.5 tracking-tight">Access Locked?</h3>
        <p className="text-muted text-xs mb-6 opacity-60">Enter your synced number to restore your session.</p>
        
        <form 
          onSubmit={handleReactivate} 
          className="flex flex-col gap-3"
          noValidate
        >
          <div className="relative group/input mb-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
              <button
                type="button"
                onClick={() => setShowCountries(!showCountries)}
                className="flex items-center gap-1 px-1.5 py-1 hover:bg-white/5 rounded transition-colors"
              >
                <span className="text-xs">{selectedCountry.flag}</span>
                <ChevronDown size={8} className="text-muted" />
              </button>
              <div className="h-3 w-[1px] bg-white/10 mx-1" />
              <span className="text-[10px] font-bold text-muted">{selectedCountry.prefix}</span>
            </div>
            
            <AnimatePresence>
              {showCountries && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 w-full bg-deep-bg border border-white/10 rounded-2xl p-1 z-[60] shadow-2xl"
                >
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setSelectedCountry(c); setShowCountries(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${selectedCountry.code === c.code ? 'bg-brand-orange/20 text-brand-orange' : 'hover:bg-white/5 text-muted'}`}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="ml-auto opacity-40 font-normal">{c.prefix}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
 
            <input 
              type="tel" 
              placeholder={selectedCountry.hint}
              className="w-full bg-deep-bg/50 border border-white/10 rounded-xl py-3.5 pl-24 pr-4 outline-none focus:border-brand-orange/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10 text-xs font-bold tracking-widest"
              value={phone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= selectedCountry.length + 1) {
                  setPhone(val);
                }
              }}
              required
            />
          </div>
 
          <button 
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 hover:border-brand-orange/50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-lg uppercase tracking-widest text-[10px] relative z-10"
          >
            {status === 'loading' ? (
              <RefreshCw size={16} className="animate-spin opacity-40" />
            ) : status === 'success' ? (
              <span className="text-brand-accent flex items-center gap-2">
                <Zap size={16} fill="currentColor" />
                Linked
              </span>
            ) : (
              <>
                <RefreshCw size={16} className="text-brand-blue" />
                Restore Sync
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-4 opacity-10">
          <div className="h-px w-full bg-white" />
          <Zap size={12} className="shrink-0" />
          <div className="h-px w-full bg-white" />
        </div>

        {status === 'not-found' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-6 p-3 rounded-xl bg-brand-orange/5 border border-brand-orange/10 text-[10px] text-brand-orange flex items-start gap-2 text-left"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span className="font-bold uppercase tracking-wider leading-relaxed">
              DEVICE NOT RECOGNIZED: This number is not in the current loop. Please join as a new member below.
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
