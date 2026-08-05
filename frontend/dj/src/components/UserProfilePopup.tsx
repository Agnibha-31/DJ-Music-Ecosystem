import { motion, AnimatePresence } from 'motion/react';
import { LogOut, StopCircle } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface UserProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onLogout: () => void;
  onEndSession?: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export const UserProfilePopup = memo(function UserProfilePopup({
  isOpen,
  onClose,
  username,
  onLogout,
  onEndSession,
  buttonRef
}: UserProfilePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, buttonRef]);

  const popup = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop to catch clicks */}
          <div
            className="fixed inset-0 z-[9998]"
            style={{ pointerEvents: 'auto' }}
            onClick={onClose}
          />

          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className="fixed w-56"
            style={{
              top: `${position.top}px`,
              right: `${position.right}px`,
              zIndex: 9999,
              pointerEvents: 'auto'
            }}
          >
            <div
              className="rounded-lg border shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom right, #423b9ba9, #433d95dd, #3d369bfb)',
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* Username */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white mb-1">Logged in as</p>
                <p className="text-base font-bold text-green-400 truncate">{username}</p>
              </div>

              {/* Logout Button */}
              <div className="p-2 space-y-2">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm"
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff'
                  }}
                  whileHover={{ scale: 1.02, backgroundColor: '#b91c1c' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-4 h-4" style={{ color: '#ffffff' }} />
                  <span>Logout</span>
                </motion.button>

                {onEndSession && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEndSession();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm"
                    style={{
                      backgroundColor: '#b45309',
                      color: '#ffffff'
                    }}
                    whileHover={{ scale: 1.02, backgroundColor: '#92400e' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <StopCircle className="w-4 h-4" style={{ color: '#ffffff' }} />
                    <span>End Session</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(popup, document.body);
});
