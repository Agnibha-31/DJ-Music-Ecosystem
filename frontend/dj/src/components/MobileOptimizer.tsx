import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Monitor } from 'lucide-react';

export const MobileOptimizer = memo(function MobileOptimizer() {
  const [isMobile, setIsMobile] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 3000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-50 pointer-events-none"
        >
          <motion.div
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl border border-white/20 backdrop-blur-xl"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 10px 40px rgba(168, 85, 247, 0.3)',
                '0 10px 40px rgba(236, 72, 153, 0.5)',
                '0 10px 40px rgba(168, 85, 247, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              {isMobile ? (
                <Smartphone className="w-5 h-5 text-cyan-300" />
              ) : (
                <Monitor className="w-5 h-5 text-cyan-300" />
              )}
              <div className="text-white text-sm">
                <p className="font-black">
                  {isMobile ? 'Mobile Mode' : 'Desktop Mode'}
                </p>
                <p className="text-xs text-cyan-200">Optimized for {isMobile ? 'touch' : 'your screen'}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
