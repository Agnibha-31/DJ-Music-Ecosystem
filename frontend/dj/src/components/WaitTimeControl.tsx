import { motion } from 'motion/react';
import { Clock, Minus, Plus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WaitTimeControlProps {
  targetWaitTime: number;
  onApplyWaitTime: (time: number) => void;
}

export function WaitTimeControl({ targetWaitTime, onApplyWaitTime }: WaitTimeControlProps) {
  const [tempTime, setTempTime] = useState(targetWaitTime);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTempTime(targetWaitTime);
    setHasChanges(false);
  }, [targetWaitTime]);

  const handleDecrease = () => {
    if (tempTime > 5) {
      setTempTime(tempTime - 5);
      setHasChanges(true);
    }
  };

  const handleIncrease = () => {
    if (tempTime < 60) {
      setTempTime(tempTime + 5);
      setHasChanges(true);
    }
  };

  const handleApply = () => {
    onApplyWaitTime(tempTime);
    setHasChanges(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <motion.div
        className="bg-gradient-to-br from-yellow-500/15 to-orange-500/15 backdrop-blur-xl rounded-xl p-3 border border-white/20"
        whileHover={{
          scale: 1.01,
          boxShadow: '0 15px 30px rgba(251, 191, 36, 0.2)',
          transition: { duration: 0.2 },
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="text-xs text-gray-300 font-bold">Avg Wait Time Control</div>
              <div className="text-[10px] text-gray-500">Adjust & apply to update dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleDecrease}
              disabled={tempTime <= 5}
              className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Minus className="w-3 h-3" />
            </motion.button>

            <div className="text-2xl font-black text-white min-w-[60px] text-center">
              {tempTime}m
            </div>

            <motion.button
              onClick={handleIncrease}
              disabled={tempTime >= 60}
              className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-3 h-3" />
            </motion.button>

            {/* Apply/Tick Button */}
            <motion.button
              onClick={handleApply}
              disabled={!hasChanges}
              className={`p-1.5 rounded-lg text-white transition-all ${
                hasChanges
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-600 cursor-pointer'
                  : 'bg-gray-600 opacity-30 cursor-not-allowed'
              }`}
              whileHover={hasChanges ? { scale: 1.15, boxShadow: '0 8px 20px rgba(6, 182, 212, 0.5)' } : {}}
              whileTap={hasChanges ? { scale: 0.95 } : {}}
              animate={hasChanges ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                scale: { duration: 0.8, repeat: hasChanges ? Infinity : 0 },
              }}
            >
              <Check className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
