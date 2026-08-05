import { motion } from 'motion/react';
import { TrendingUp, Users, Music } from 'lucide-react';

interface AnalyticsCardsProps {
  totalRequests: number;
  totalVotes: number;
  activeGenres: number;
}

export function AnalyticsCards({ totalRequests, totalVotes, activeGenres }: AnalyticsCardsProps) {
  const cards = [
    {
      icon: Music,
      title: 'Requests',
      value: totalRequests,
      color: 'from-cyan-500 to-blue-500',
      shadowColor: 'rgba(6, 182, 212, 0.4)',
      iconColor: 'text-cyan-400',
    },
    {
      icon: TrendingUp,
      title: 'Votes',
      value: totalVotes,
      color: 'from-purple-500 to-pink-500',
      shadowColor: 'rgba(168, 85, 247, 0.4)',
      iconColor: 'text-purple-400',
    },
    {
      icon: Users,
      title: 'Genres',
      value: activeGenres,
      color: 'from-pink-500 to-rose-500',
      shadowColor: 'rgba(236, 72, 153, 0.4)',
      iconColor: 'text-pink-400',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.08,
          }}
        >
          <motion.div
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/20"
            whileHover={{
              scale: 1.03,
              boxShadow: `0 15px 30px ${card.shadowColor}`,
              transition: { duration: 0.2 },
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <div className="text-xs text-gray-300 mb-1">{card.title}</div>
            <div className="text-2xl font-black text-white">{card.value}</div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
