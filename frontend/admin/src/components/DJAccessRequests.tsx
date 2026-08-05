import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Shield, Check, X, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useVenue } from '../context/VenueContext';

export function DJAccessRequests() {
  const { djAccessRequests, approveDjAccess, denyDjAccess, venues } = useAdmin();
  const { activeVenueId } = useVenue();
  const [selectedVenueByRequest, setSelectedVenueByRequest] = useState<Record<string, string>>({});
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});

  const handleApprove = async (requestId: string, venueId: string) => {
    // Clear previous error
    setRequestErrors((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });

    try {
      await approveDjAccess(requestId, venueId);
    } catch (error: any) {
      let message = "Failed to approve request.";
      try {
        if (error.message) {
          const errData = JSON.parse(error.message);
          if (errData.error === 'venue_occupied') {
            message = "There is already an active DJ session in this venue !";
          } else {
            message = errData.message || error.message;
          }
        }
      } catch (e) {
        message = error.message || message;
      }
      setRequestErrors((prev) => ({ ...prev, [requestId]: message }));
    }
  };

  const pendingRequests = djAccessRequests.filter((req) => req.status === 'pending');

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-br from-purple-900/80 to-pink-900/70 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">DJ Access Requests</h2>
            <p className="text-purple-300 text-xs font-semibold">
              {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {pendingRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4 mb-3 last:mb-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-yellow-500/20 flex-shrink-0">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm mb-1">{request.djName}</h3>
                    <p className="text-purple-300 text-xs font-medium mb-2">
                      Username: <span className="text-cyan-400">{request.djUsername}</span>
                    </p>
                    <p className="text-gray-400 text-xs">
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={selectedVenueByRequest[request.id] ?? activeVenueId ?? ''}
                    onChange={(event) => setSelectedVenueByRequest((prev) => ({ ...prev, [request.id]: event.target.value }))}
                    className="px-2 py-2 rounded-lg bg-slate-800 border border-purple-500/30 text-white text-xs"
                  >
                    <option value="">Select venue</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </select>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const venueId = selectedVenueByRequest[request.id] ?? activeVenueId ?? '';
                      if (!venueId) {
                        return;
                      }
                      handleApprove(request.id, venueId);
                    }}
                    disabled={!(selectedVenueByRequest[request.id] ?? activeVenueId)}
                    className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors group"
                    title="Approve"
                  >
                    <Check className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => denyDjAccess(request.id)}
                    className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-colors group"
                    title="Deny"
                  >
                    <X className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                  </motion.button>
                </div>
              </div>
              {requestErrors[request.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-center gap-2 overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 text-white shrink-0" />
                  <p className="text-white text-xs font-medium">{requestErrors[request.id]}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
