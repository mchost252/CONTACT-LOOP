import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, User, Palette, Briefcase, RefreshCw, LogOut, ShieldCheck, Loader2, Share2, Timer, Zap, Download } from 'lucide-react';
import { Category } from '../../types';
import { playSound } from '../../lib/sounds';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, setDoc, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { cleanupExpiredContacts } from '../../services/cleanupService';
import OnboardingModal from './OnboardingModal';

interface DashboardProps {
  user: {
    name: string;
    phone: string;
    category: string;
    expiresAt: any;
    socialLink?: string | null;
    image?: string | null;
  };
  onSignOut: () => void;
  stats: {
    total: number;
    individual: number;
    creator: number;
    business: number;
  };
}

export default function Dashboard({ user, onSignOut, stats }: DashboardProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadedToday, setDownloadedToday] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isRenewing, setIsRenewing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const onboardingSeen = localStorage.getItem('loopOnboardingSeen');
    if (!onboardingSeen) {
      setTimeout(() => setShowOnboarding(true), 1500);
      localStorage.setItem('loopOnboardingSeen', 'true');
    }

    const saved = localStorage.getItem('loopDownloads');
    if (saved) {
      try {
        const { date, items } = JSON.parse(saved);
        if (date === new Date().toDateString()) {
          setDownloadedToday(items);
        }
      } catch (e) {
        console.error("Download state restore failed", e);
      }
    }

    // Live timer
    const timer = setInterval(() => {
      const expires = user.expiresAt?.toDate ? user.expiresAt.toDate() : new Date(user.expiresAt);
      const diff = expires.getTime() - new Date().getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    // Passive cleanup of expired records
    cleanupExpiredContacts();

    return () => clearInterval(timer);
  }, [user.expiresAt]);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  const handleRenew = async () => {
    if (isRenewing) return;
    setIsRenewing(true);
    playSound('click');
    toast.loading("UPDATING MEMBERSHIP...", { id: 'renew' });

    try {
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(now.toMillis() + (3 * 24 * 60 * 60 * 1000));
      const userRef = doc(db, 'users', user.phone);

      const payload = {
        ...user,
        updatedAt: now.toMillis(),
        expiresAt: expiresAt.toMillis()
      };

      // We use setDoc without merge: true partially to ensure the full document 
      // is written if it was previously purged by cleanup.
      await setDoc(userRef, {
        name: user.name,
        phone: user.phone,
        category: user.category,
        socialLink: user.socialLink || null,
        image: user.image || null,
        expiresAt: expiresAt,
        updatedAt: now
      });

      localStorage.setItem('loopUser', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('userJoined', { detail: payload }));
      
      toast.success("MEMBERSHIP EXTENDED: Active for 72 Hours.", { id: 'renew' });
    } catch (error) {
      console.error("Renewal Error:", error);
      toast.error("CONNECTION ERROR: Please try again.", { id: 'renew' });
    } finally {
      setIsRenewing(false);
    }
  };

  const handleDownload = async (cat: string) => {
    if (downloadedToday.includes(cat)) {
      playSound('error');
      toast.info("DROP EXHAUSTED: You've already synced this pack today. Check back tomorrow!", {
        description: "The archive refreshes every 24 hours."
      });
      return;
    }

    if (downloading) return;

    playSound('click');
    setDownloading(cat);
    
    try {
      // 1. Fetch real contacts from Firestore
      const usersRef = collection(db, 'users');
      let q;
      
      if (cat === 'all') {
        // Fetch all categories (limited for performance)
        q = query(usersRef, limit(100));
      } else {
        // Map lowercase cat back to stored category
        const firestoreCat = cat.charAt(0).toUpperCase() + cat.slice(1);
        q = query(usersRef, where('category', '==', firestoreCat), limit(100));
      }

      const querySnapshot = await getDocs(q);
      const contacts: string[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        // Skip current user's phone number
        if (data.phone === user.phone) return;

        // VCF format construction
        const name = data.name || "Loop Member";
        const phone = data.phone;
        const categoryTag = data.category ? ` [${data.category.toUpperCase()}]` : "";
        
        contacts.push("BEGIN:VCARD");
        contacts.push("VERSION:3.0");
        contacts.push(`FN:LOOP${categoryTag} ${name}`);
        contacts.push(`TEL;TYPE=CELL:${phone}`);
        contacts.push("END:VCARD");
      });

      if (contacts.length === 0) {
        toast.info("EMPTY PACK: No active members found in this category yet.");
        setDownloading(null);
        return;
      }

      const vcfContent = contacts.join("\n");
      const blob = new Blob([vcfContent], { type: 'text/vcard' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `loop_${cat}_${new Date().toISOString().split('T')[0]}.vcf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      playSound('success');
      
      const newDownloads = [...downloadedToday, cat];
      setDownloadedToday(newDownloads);
      localStorage.setItem('loopDownloads', JSON.stringify({
        date: new Date().toDateString(),
        items: newDownloads
      }));
      
      toast.success(`SUCCESS: ${Math.floor(contacts.length)} Contacts Ready.`);
    } catch (error) {
      console.error("Download Failure:", error);
      toast.error("DOWNLOAD FAILED: Please check your connection.");
    } finally {
      setDownloading(null);
    }
  };

  const handleShare = async () => {
    playSound('click');
    const shareData = {
      title: 'ContactLoop',
      text: 'Grow your WhatsApp status views daily! Join the loop here:',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.log('Share failed', err);
    }
  };

  const getDropDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // Yesterday's drop is available
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dropItems = [
    { id: 'all', label: 'All Contacts', icon: <Users />, color: 'orange', count: stats.total },
    { id: 'individual', label: 'Individual List', icon: <User />, color: 'blue', count: stats.individual },
    { id: 'creator', label: 'Creator Pack', icon: <Palette />, color: 'purple', count: stats.creator },
    { id: 'business', label: 'Business Hub', icon: <Briefcase />, color: 'emerald', count: stats.business },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
      {/* Player Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gamer-card relative h-auto min-h-[14rem] group overflow-hidden p-6 shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-brand-blue/10 animate-pulse duration-[4000ms] pointer-events-none" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rotate-45 translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 left-0 w-16 h-1 border-t-2 border-brand-orange/40" />

        <div className="relative h-full flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="relative group/avatar">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-orange shadow-inner overflow-hidden relative z-10 transition-transform duration-500 group-hover/avatar:scale-105">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={32} />
                  )}
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                </div>
                {/* Glow behind image */}
                <div className="absolute -inset-1 bg-brand-orange/20 blur-md rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
              </div>
              
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-xl tracking-tight leading-tight">{user.name}</h2>
                  <span className="text-lg opacity-80" title="Region Verified">{user.phone.startsWith('+234') ? '🇳🇬' : user.phone.startsWith('+233') ? '🇬🇭' : user.phone.startsWith('+254') ? '🇰🇪' : '🇿🇦'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isExpired ? 'bg-red-500' : 'bg-brand-orange'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isExpired ? 'bg-red-500' : 'bg-brand-orange'}`}></span>
                  </div>
                  <span className={`text-[9px] font-bold ${isExpired ? 'text-red-500' : 'text-brand-orange'} uppercase tracking-[0.2em]`}>
                    {isExpired ? 'Membership Expired' : 'Active Member'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleShare}
                className="p-2 hover:bg-white/5 rounded-lg text-brand-orange transition-all"
                title="Invite Friends"
              >
                <Share2 size={16} />
              </button>
              <button 
                onClick={() => { playSound('click'); onSignOut(); }}
                className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 group/btn transition-all"
                title="Logout"
              >
                <LogOut size={16} className="group-hover/btn:scale-110 transition-transform" />
              </button>
            </div>
          </div>

             <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-2">
                <div className="space-y-1">
                   <div className={`text-[9px] uppercase font-bold tracking-widest ${isExpired ? 'text-red-400 animate-pulse' : 'text-muted opacity-40'}`}>
                     {isExpired ? 'ACTION REQUIRED: Session Expired' : 'Active Time Remaining'}
                   </div>
                   <div className="flex items-center gap-2 sm:gap-3">
                     <div className={`font-display font-bold text-2xl sm:text-3xl tabular-nums leading-none ${isExpired ? 'text-red-500' : 'text-white'}`}>
                       {timeLeft.days}D<span className={`${isExpired ? 'text-red-500/30' : 'text-brand-orange/50'} px-0.5`}>:</span>
                       {timeLeft.hours.toString().padStart(2, '0')}H<span className={`${isExpired ? 'text-red-500/30' : 'text-brand-orange/50'} px-0.5`}>:</span>
                       {timeLeft.minutes.toString().padStart(2, '0')}M<span className={`${isExpired ? 'text-red-500/30' : 'text-brand-orange/50'} px-0.5`}>:</span>
                       <span className={isExpired ? 'text-red-500' : 'text-brand-orange'}>{timeLeft.seconds.toString().padStart(2, '0')}</span>S
                     </div>
                     <button
                       onClick={handleRenew}
                       disabled={isRenewing}
                       className={`p-1.5 sm:p-2 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-all active:scale-90 ${isExpired && 'ring-2 ring-brand-orange animate-bounce'}`}
                       title={isExpired ? 'Re-activate Membership' : 'Refresh Session'}
                     >
                       <RefreshCw size={14} className={isRenewing ? 'animate-spin' : ''} />
                     </button>
                   </div>
                </div>
                
                <div className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest text-muted whitespace-nowrap">
                  {user.category}
                </div>
             </div>

             {user.socialLink && (
               <div className="pt-4 border-t border-white/5">
                 <a 
                   href={user.socialLink.startsWith('http') ? user.socialLink : `https://${user.socialLink}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 text-brand-orange hover:text-brand-blue transition-colors text-[10px] font-bold uppercase tracking-widest"
                 >
                   <Share2 size={12} />
                   Identity Link Verified
                 </a>
               </div>
             )}
        </div>
      </motion.div>

      {/* Stats Quickbar */}
      <div className="grid grid-cols-2 gap-3">
         {[
           { label: 'Growth Status', val: 'Verified', icon: <ShieldCheck size={10} /> },
           { label: 'Network Class', val: user.category, icon: <Zap size={10} /> },
         ].map((s, i) => (
           <div key={i} className="gamer-card py-2 px-4 flex items-center justify-between bg-white/[0.01]">
             <div className="text-[8px] text-muted uppercase font-bold tracking-widest">{s.label}</div>
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-white uppercase tracking-wider">
               {s.icon}
               {s.val}
             </div>
           </div>
         ))}
      </div>

      {/* Main Actions Area */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-0.5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Drop Archive</h3>
            <div className="text-[8px] font-bold text-brand-orange/60 uppercase tracking-widest">BATCH: {getDropDate()}</div>
          </div>
          <div className="text-[9px] font-bold text-muted font-mono tracking-tighter text-right uppercase">Next Drop @ 11PM</div>
        </div>
        
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {dropItems.map((item) => {
            const isUsed = downloadedToday.includes(item.id);
            const isSelfDownloading = downloading === item.id;

            return (
              <motion.button
                key={item.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 10 },
                  visible: { opacity: 1, scale: 1, y: 0 }
                }}
                disabled={!!downloading}
                whileHover={isUsed ? { scale: 1.01 } : { scale: 1.02, y: -2 }}
                whileTap={isUsed ? { scale: 0.99 } : { scale: 0.98 }}
                onClick={() => {
                  if (isExpired) {
                    playSound('error');
                    toast.error("MEMBERSHIP EXPIRED", { description: "Please refresh your session to download contacts." });
                    return;
                  }
                  handleDownload(item.id);
                }}
                className={`gamer-card p-4 flex flex-col items-center gap-2.5 relative transition-all ${isUsed || isExpired ? 'opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : 'hover:bg-white/[0.03]'}`}
              >
                 <div className={`w-10 h-10 rounded-xl bg-brand-${item.color}/10 flex items-center justify-center text-brand-${item.color} ${!isUsed && 'group-hover:scale-105'} transition-transform`}>
                   {isSelfDownloading ? <Loader2 size={20} className="animate-spin" /> : React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                 </div>
                 <div className="space-y-0.5">
                   <div className="text-[10px] font-bold uppercase tracking-widest">{item.label}</div>
                   <div className="text-[8px] font-bold text-brand-orange uppercase text-center opacity-70 italic">{item.count} Contacts</div>
                 </div>

                 {isUsed && (
                   <div className="absolute top-2 right-2 text-brand-accent">
                     <ShieldCheck size={14} />
                   </div>
                 )}
                 {!isUsed && !isSelfDownloading && (
                   <div className="absolute bottom-2 right-3 opacity-10 group-hover:opacity-30 transition-opacity">
                     <Download size={14} />
                   </div>
                 )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Tip Banner */}
      <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
         <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-orange animate-pulse">
           <Zap size={16} />
         </div>
         <p className="text-[10px] font-bold text-muted uppercase leading-relaxed tracking-wider">
           Sync protocol: Once saved, manually refresh your WA contacts. New data drops every 24H.
         </p>
      </div>
    </div>
  );
}
