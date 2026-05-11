/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/home/Hero';
import Stats from './components/home/Stats';
import DownloadCards from './components/home/DownloadCards';
import JoinForm from './components/home/JoinForm';
import Reactivate from './components/home/Reactivate';
import FeatureGrid from './components/home/FeatureGrid';
import Onboarding from './components/home/Onboarding';
import Dashboard from './components/home/Dashboard';
import Footer from './components/layout/Footer';
import { Toaster, toast } from 'sonner';
import { playSound } from './lib/sounds';
import { AnimatePresence, motion } from 'motion/react';
import { db } from './lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc } from 'firebase/firestore';

export default function App() {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    individual: 0,
    creator: 0,
    business: 0
  });

  const handleSignOut = () => {
    playSound('transition');
    localStorage.removeItem('loopUser');
    setActiveUser(null);
    toast.info("Session Terminated. Sync Offline.");
  };

  useEffect(() => {
    // Sync active counts
    const now = Timestamp.now();
    const q = query(collection(db, 'users'), where('expiresAt', '>=', now));
    const unsubStats = onSnapshot(q, (snapshot) => {
      const newStats = { total: snapshot.size, individual: 0, creator: 0, business: 0 };
      snapshot.docs.forEach(doc => {
        const cat = doc.data().category;
        if (cat === 'Individual') newStats.individual++;
        if (cat === 'Creator') newStats.creator++;
        if (cat === 'Business') newStats.business++;
      });
      setStats(newStats);
    });

    let unsubUser: (() => void) | null = null;

    const startUserSync = (phone: string) => {
      if (unsubUser) unsubUser();
      unsubUser = onSnapshot(doc(db, 'users', phone), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
          
          if (expiresAt <= new Date()) {
            handleSignOut();
            return;
          }

          const updatedUser = {
            ...data,
            expiresAt: expiresAt.toISOString(),
            createdAt: data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          };
          setActiveUser(updatedUser);
          localStorage.setItem('loopUser', JSON.stringify(updatedUser));
        } else {
          handleSignOut();
        }
      }, (error) => {
        console.error("User sync error:", error);
        handleSignOut();
      });
    };

    const saved = localStorage.getItem('loopUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        const expires = new Date(user.expiresAt);
        if (expires > new Date()) {
          setActiveUser(user);
          startUserSync(user.phone);
        } else {
          localStorage.removeItem('loopUser');
        }
      } catch (e) {
        console.error("State restore failed", e);
      }
    }
    
    const handleJoined = (e: any) => {
      const user = e.detail;
      setActiveUser(user);
      startUserSync(user.phone);
      playSound('success');
      toast.success("LEVEL UP! Protocol Initialized.");
    };

    window.addEventListener('userJoined', handleJoined);

    return () => {
      unsubStats();
      if (unsubUser) unsubUser();
      window.removeEventListener('userJoined', handleJoined);
    };
  }, []);

  return (
    <div className="min-h-screen bg-deep-bg text-white font-sans selection:bg-brand-orange/30">
      <Toaster 
        position="top-center" 
        theme="dark" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: 'rgba(15, 20, 30, 0.4)',
            backdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            padding: '12px 16px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          },
        }}
      />
      <Onboarding />
      <AnimatePresence>
        {!activeUser && <Navbar />}
      </AnimatePresence>
      
      <main className={!activeUser ? "pt-20" : ""}>
        <AnimatePresence mode="wait">
          {activeUser ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Dashboard user={activeUser} onSignOut={handleSignOut} stats={stats} />
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.4 }}
            >
              <Hero />
              <Stats />
              <JoinForm />
              <Reactivate />
              <DownloadCards />
              <FeatureGrid />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <AnimatePresence>
        {!activeUser && <Footer />}
      </AnimatePresence>
    </div>
  );
}
