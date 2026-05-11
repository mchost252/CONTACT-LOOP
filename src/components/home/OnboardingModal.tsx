import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, Send, X } from 'lucide-react';
import { playSound } from '../../lib/sounds';
import { toast } from 'sonner';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;

    setIsSubmitting(true);
    playSound('click');
    
    // In a real app, we'd save this to a feedback collection
    // For now, we'll just show a success message
    setTimeout(() => {
      toast.success("FEEDBACK RECEIVED: Protocol updated with your input.", {
        description: "Thank you for helping us evolve."
      });
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden"
          >
            <div className="gamer-card p-1 shadow-2xl relative overflow-hidden bg-deep-bg/40 backdrop-blur-2xl">
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-scanline pointer-events-none opacity-5" />
              
              <div className="relative p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                    <Sparkles size={24} />
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-1 hover:bg-white/5 rounded-lg text-muted transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white">
                    Membership <span className="text-brand-orange">Active</span>
                  </h2>
                  <p className="text-[12px] font-medium text-muted uppercase tracking-widest leading-loose">
                    Welcome to the community. You are now part of a global network of growth.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-brand-blue/5 border border-brand-blue/10 space-y-4">
                  <div className="flex items-center gap-2 text-brand-blue">
                    <MessageSquare size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Share Your Thoughts</span>
                  </div>
                  <p className="text-[11px] text-brand-blue/90 font-medium leading-relaxed">
                    "ContactLoop" is our current name. We love it, but do you have a better suggestion for the platform?
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <input 
                        type="text"
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        placeholder="Your suggestion..."
                        className="w-full bg-black/60 border border-white/10 rounded-lg py-2 px-3 text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all placeholder:text-white/20"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        type="submit"
                        disabled={!suggestion.trim() || isSubmitting}
                        className="flex-1 py-2 rounded-lg bg-brand-orange text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? 'Submitting...' : (
                          <>
                            Submit <Send size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] opacity-40">
                    Your growth journey starts here.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
