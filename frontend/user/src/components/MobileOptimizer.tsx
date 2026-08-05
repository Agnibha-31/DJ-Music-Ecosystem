import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Monitor, Zap } from 'lucide-react';

function MobileOptimizerComponent() {
  const [isMobile, setIsMobile] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [isLowPerf, setIsLowPerf] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const updateViewportMetrics = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const footerHeight = footer?.getBoundingClientRect().height ?? 0;
      const mainAvailable = Math.max(viewportHeight - headerHeight - footerHeight, 0);

      root.style.setProperty('--viewport-width', `${viewportWidth}px`);
      root.style.setProperty('--viewport-height', `${viewportHeight}px`);
      root.style.setProperty('--groove-header-height', `${headerHeight}px`);
      root.style.setProperty('--groove-footer-height', `${footerHeight}px`);
      root.style.setProperty('--groove-main-available', `${mainAvailable}px`);

      const dynamicGap = Math.max(mainAvailable * 0.02, 10);
      const dynamicPadding = Math.max(viewportWidth * 0.02, 8);
      const cardHeight = Math.max((mainAvailable - dynamicGap) / 2, 120);

      root.style.setProperty('--groove-mobile-gap', `${dynamicGap}px`);
      root.style.setProperty('--groove-mobile-padding', `${dynamicPadding}px`);
      root.style.setProperty('--groove-card-height', `${cardHeight}px`);
    };

    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      const cores = navigator.hardwareConcurrency || 4;
      const memory = (navigator as any).deviceMemory || 8;
      const lowPerf = cores <= 2 || memory <= 2 || window.innerWidth < 480;
      setIsLowPerf(lowPerf);

      root.style.setProperty('--animation-duration-multiplier', lowPerf ? '2' : '1');

      requestAnimationFrame(updateViewportMetrics);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice, { passive: true });

    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 4000);

    return () => {
      window.removeEventListener('resize', checkDevice);
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
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl border border-white/20 backdrop-blur-xl max-w-xs"
            animate={{
              scale: [1, 1.03, 1],
              boxShadow: [
                '0 10px 40px rgba(168, 85, 247, 0.3)',
                '0 10px 40px rgba(236, 72, 153, 0.4)',
                '0 10px 40px rgba(168, 85, 247, 0.3)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              {isLowPerf ? (
                <Zap className="w-5 h-5 text-yellow-300 flex-shrink-0" />
              ) : isMobile ? (
                <Smartphone className="w-5 h-5 text-cyan-300 flex-shrink-0" />
              ) : (
                <Monitor className="w-5 h-5 text-cyan-300 flex-shrink-0" />
              )}
              <div className="text-white text-sm">
                <p className="font-black">
                  {isLowPerf ? 'Lite Mode' : isMobile ? 'Mobile Mode' : 'Desktop Mode'}
                </p>
                <p className="text-xs text-cyan-200">
                  {isLowPerf ? 'Performance optimized' : `Optimized for ${isMobile ? 'touch' : 'your screen'}`}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const MobileOptimizer = memo(MobileOptimizerComponent);
