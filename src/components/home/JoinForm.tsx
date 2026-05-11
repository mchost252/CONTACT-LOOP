import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, Tag, Sparkles, ShieldCheck, CheckCircle2, Loader2, Upload, ChevronDown, Smartphone, Share2 } from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { db } from '../../lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { playSound } from '../../lib/sounds';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', prefix: '+234', flag: '🇳🇬', hint: '801 000 0000', length: 10 },
  { code: 'GH', name: 'Ghana', prefix: '+233', flag: '🇬🇭', hint: '24 000 0000', length: 9 },
  { code: 'KE', name: 'Kenya', prefix: '+254', flag: '🇰🇪', hint: '700 000 000', length: 9 },
  { code: 'ZA', name: 'South Africa', prefix: '+27', flag: '🇿🇦', hint: '82 000 0000', length: 9 }
];

export default function JoinForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    category: 'Individual',
    socialLink: '',
  });

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);

  const africanNames = [
    'Chukwudi Obi', 'Adebayo Smith', 'Fatima Yusuf', 'Amaka Okafor', 
    'Kofi Mensah', 'Zanele Khumalo', 'Kwame Nkrumah', 'Mansa Musa'
  ];
  const [nameHint] = useState(() => africanNames[Math.floor(Math.random() * africanNames.length)]);

  useEffect(() => {
    const saved = localStorage.getItem('loopUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          phone: user.phone?.replace(selectedCountry.prefix, '') || ''
        }));
      } catch (e) {
        console.error("Auto-fill restoration failed", e);
      }
    }
  }, [selectedCountry.prefix]);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error("FILE TOO LARGE: Max 1MB allowed for protocol sync.");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      playSound('success');
    }
  };

  const handleFirestoreError = (error: any, operation: string, path: string) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType: operation,
      path: path,
      authInfo: { userId: null }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    playSound('error');
    toast.error("PROTOCOL FAILURE: Connection Interrupted.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const digitsOnly = formData.phone.replace(/\D/g, '').replace(/^0+/, '');
    if (digitsOnly.length !== selectedCountry.length && digitsOnly.length !== selectedCountry.length - 1) {
      playSound('error');
      toast.error(`INVALID FREQUENCY: Check your number.`);
      return;
    }

    if (!formData.name) {
      playSound('error');
      toast.error("IDENTITY MISSING: Protocol requires full credentials.");
      return;
    }

    playSound('click');
    setStatus('loading');
    
    try {
      const fullPhone = `${selectedCountry.prefix}${digitsOnly}`;
      
      const userRef = doc(db, 'users', fullPhone);
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(now.toMillis() + (3 * 24 * 60 * 60 * 1000));

      const payload = {
        name: formData.name.trim(),
        phone: fullPhone,
        category: formData.category,
        socialLink: formData.socialLink.trim() || null,
        image: imagePreview || null,
        createdAt: now.toMillis(), 
        expiresAt: expiresAt.toMillis(),
        updatedAt: now.toMillis()
      };

      await setDoc(userRef, {
        ...payload,
        createdAt: now,
        expiresAt: expiresAt,
        updatedAt: now
      }, { merge: true });

      localStorage.setItem('loopUser', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('userJoined', { detail: payload }));

      setStatus('success');
      setFormData({ name: '', phone: '', category: 'Individual', socialLink: '' });
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      handleFirestoreError(error, 'write', 'users');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12" id="join">
      <div className="gamer-card p-0.5 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-orange via-brand-blue to-brand-orange rounded-lg opacity-10 blur-sm group-hover:opacity-30 transition-opacity pointer-events-none" />
        
        <div className="relative bg-deep-bg rounded-lg p-6 md:p-8 overflow-hidden">
          <div className="relative z-10 text-center mb-6">
            <h2 className="text-xl md:text-3xl font-bold mb-1 uppercase tracking-tighter">
              Join the <span className="text-brand-orange">Loop</span>
            </h2>
            <div className="h-0.5 w-12 bg-brand-orange/40 mx-auto mb-2" />
            <p className="text-[8px] text-muted font-bold uppercase tracking-[0.2em] opacity-30">
              Verified Status Growth Network
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            <div className="space-y-3">
              <div className="group space-y-1">
                <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted group-focus-within:text-brand-orange transition-colors">
                  <User size={10} />
                  Full Name / Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${nameHint}`}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-orange/50 focus:bg-white/[0.08] transition-all text-xs font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="group space-y-1">
                <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted group-focus-within:text-brand-orange transition-colors">
                  <Share2 size={10} />
                  Social Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Instagram, TikTok or Website"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-orange/50 focus:bg-white/[0.08] transition-all text-xs font-bold"
                  value={formData.socialLink}
                  onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                />
              </div>

              <div className="group space-y-1">
                <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted group-focus-within:text-brand-blue transition-colors">
                  <Smartphone size={10} />
                  WhatsApp Number
                </label>
                <div className="relative">
                   <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                     <button
                       type="button"
                       onClick={() => setShowCountries(!showCountries)}
                       className="flex items-center gap-1 px-1.5 py-1 hover:bg-white/5 rounded transition-colors"
                     >
                       <span className="text-xs">{selectedCountry.flag}</span>
                       <ChevronDown size={8} className="text-muted" />
                     </button>
                     <div className="h-3 w-[1px] bg-white/10 mx-1" />
                     <span className="text-[9px] font-bold text-muted tracking-tight">{selectedCountry.prefix}</span>
                   </div>
                   
                   <AnimatePresence>
                     {showCountries && (
                       <motion.div
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute bottom-full left-0 mb-2 w-full bg-deep-bg border border-white/10 rounded-xl p-1 z-50 shadow-2xl"
                       >
                         {COUNTRIES.map(c => (
                           <button
                             key={c.code}
                             type="button"
                             onClick={() => { setSelectedCountry(c); setShowCountries(false); }}
                             className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors ${selectedCountry.code === c.code ? 'bg-brand-orange/20 text-brand-orange' : 'hover:bg-white/5 text-muted'}`}
                           >
                             <span className="text-sm">{c.flag}</span>
                             <span>{c.name}</span>
                             <span className="ml-auto opacity-40 font-normal">{c.prefix}</span>
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <input
                    type="tel"
                    required
                    placeholder={selectedCountry.hint}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-22 pr-3 py-2.5 focus:outline-none focus:border-brand-blue/50 focus:bg-white/[0.08] transition-all text-xs font-bold tracking-widest"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= selectedCountry.length + 1) {
                        setFormData({ ...formData, phone: val });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="group space-y-1">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted group-focus-within:text-brand-orange transition-colors">
                    <Tag size={10} />
                    Category
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-orange/50 focus:bg-white/[0.08] transition-all text-xs font-bold appearance-none cursor-pointer"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-deep-bg text-white">{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={12} />
                  </div>
                </div>

                <div className="group space-y-1 focus-within:opacity-100 transition-opacity">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted group-focus-within:text-brand-orange transition-colors">
                    <Upload size={10} />
                    Verification
                  </label>
                  <div 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className={`w-full h-[38px] bg-white/5 border border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all relative z-10 ${imagePreview ? 'border-brand-orange/40 bg-brand-orange/5' : ''}`}
                  >
                    <input 
                      id="image-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    {imagePreview ? (
                      <CheckCircle2 size={14} className="text-brand-accent" />
                    ) : (
                      <Upload size={14} className="text-muted" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={status === 'loading'}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-orange to-orange-600 text-white font-bold uppercase tracking-[0.1em] shadow-lg transition-all flex items-center justify-center gap-2 text-[10px] relative z-10"
            >
              {status === 'loading' ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <>
                  <Sparkles size={14} />
                  Complete Sync
                </>
              )}
            </motion.button>

            <div className="flex items-center justify-center gap-3 opacity-10 py-1">
               <div className="h-px w-full bg-white/20" />
               <ShieldCheck size={10} className="shrink-0" />
               <div className="h-px w-full bg-white/20" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
