import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Timer, Users, X, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
  };

  const steps = [
    {
      icon: <Zap className="text-brand-orange" />,
      title: "Welcome to ContactLoop",
      desc: "The fastest way to grow your WhatsApp status views by exchanging contacts with verified users."
    },
    {
      icon: <Timer className="text-brand-blue" />,
      title: "The 3-Day Cycle",
      desc: "To keep our pool fresh, you're active for 3 days. After that, just 're-stream' to stay in the loop!"
    },
    {
      icon: <Users className="text-brand-accent" />,
      title: "Daily Contact Packs",
      desc: "Every day at 11 PM, we release a new batch of contacts. Save them to see your views skyrocket."
    }
  ];

  return (
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-deep-bg/90 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20, filter: 'blur(10px)' }}
                animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ scale: 0.9, y: 20, filter: 'blur(10px)' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-white/5 border border-white/10 rounded-[40px] p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  <button onClick={dismiss} className="p-2 hover:bg-white/5 rounded-full text-muted transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={step}
                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
                        className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center"
                      >
                        {React.cloneElement(steps[step].icon as React.ReactElement, { size: 40 })}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={step}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-center space-y-3"
                    >
                      <h3 className="text-2xl font-bold font-display">{steps[step].title}</h3>
                      <p className="text-muted leading-relaxed">{steps[step].desc}</p>
                    </motion.div>
                  </AnimatePresence>

              <div className="flex items-center justify-between pt-4">
                <div className="flex gap-2">
                  {steps.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-8 bg-brand-orange' : 'w-2 bg-white/10'}`} />
                  ))}
                </div>

                <button 
                  onClick={() => step === steps.length - 1 ? dismiss() : setStep(s => s + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-orange font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  {step === steps.length - 1 ? 'Get Started' : 'Next'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
