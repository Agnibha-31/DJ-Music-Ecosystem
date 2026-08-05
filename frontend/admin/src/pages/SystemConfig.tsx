import { motion } from 'motion/react';
import { Settings, Building2, Bell, Database, Save, Check, User, Music, Phone, Mail, Key, RefreshCw, ShieldCheck, CheckCircle, Plus, Repeat, Trash2, X } from 'lucide-react';
import { useAdmin, type VenueInfo, type DJInfo, type SystemConfig as SystemConfigType } from '../context/AdminContext';
import { useVenue } from '../context/VenueContext';
import { useEffect, useState, useMemo, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { DJAccessRequests } from '../components/DJAccessRequests';

export function SystemConfig() {
  const { venue, updateVenue, venues, addVenue, deleteVenue, djs, addDj, deleteDj, updateDjAuthKey, authenticateDj, systemConfig, updateSystemConfig, downloadBackup, liveSessions } = useAdmin();
  const { activeVenueId, setActiveVenue } = useVenue();
  const [venueChanged, setVenueChanged] = useState(false);
  const [venueAdded, setVenueAdded] = useState(false);
  const [venueActivated, setVenueActivated] = useState(false);
  const [djAdded, setDjAdded] = useState(false);

  // Venue State
  const [venueForm, setVenueForm] = useState<VenueInfo>({
    id: venue.id ?? '',
    name: venue.name,
    logo: venue.logo,
    accentColor: venue.accentColor,
    address: venue.address,
    city: venue.city,
    state: venue.state,
    zipCode: venue.zipCode,
    phone: venue.phone,
    email: venue.email
  });
  const [selectedVenueId, setSelectedVenueId] = useState('');

  // DJ State
  const [djForm, setDjForm] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    bio: '',
  });

  const djList = djs;

  // Authentication State
  const [selectedDjId, setSelectedDjId] = useState<string>('');
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [qrCopied, setQrCopied] = useState(false);
  const [djQrCopied, setDjQrCopied] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const djQrContainerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const djQrCodeRef = useRef<QRCodeStyling | null>(null);

  const [config, setConfig] = useState<SystemConfigType>(systemConfig);

  // Deduplicate venues for display
  const uniqueVenues = useMemo(() => {
    const seen = new Set<string>();
    return venues.filter((venue) => {
      const key = `${venue.name}::${venue.address}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [venues]);

  const queueAppBaseUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    // Queue app is served at the root of the same origin (unified app)
    // Always use the current origin, ignoring potential misconfigured env vars
    return window.location.origin.replace(/\/$/, '');
  }, []);

  const qrVenueId = selectedVenueId || activeVenueId || '';

  const generatedUserUrl = useMemo(() => {
    if (!queueAppBaseUrl || !qrVenueId) return '';

    // Find active session for this venue
    const activeSession = liveSessions.find(s => s.venueId === qrVenueId && s.status === 'active');

    let url = `${queueAppBaseUrl}?venue=${encodeURIComponent(qrVenueId)}`;
    if (activeSession) {
      url += `&live_session_id=${encodeURIComponent(activeSession.id)}`;
    }
    return url;
  }, [queueAppBaseUrl, qrVenueId, liveSessions]);

  const djAppBaseUrl = useMemo(() => {
    const env = (import.meta as any).env ?? {};
    const envBase = String(env.VITE_DJ_APP_URL ?? '').trim();
    if (envBase) return envBase.replace(/\/$/, '');

    if (typeof window === 'undefined') return '';
    return window.location.origin.replace(/\/$/, '');
  }, []);

  const generatedDjEntryUrl = useMemo(() => {
    if (!djAppBaseUrl) return '';
    return `${djAppBaseUrl}/dj/login`;
  }, [djAppBaseUrl]);

  const centerMusicIcon = useMemo(
    () =>
      `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><text x="44" y="74" text-anchor="middle" font-family="Arial, sans-serif" font-size="62" fill="#53c1fd">♪</text><text x="76" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="68" fill="#cb3feb">♪</text></svg>`
      )}`,
    []
  );

  const djCenterLabel = useMemo(
    () =>
      `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect x="18" y="38" rx="14" ry="14" width="84" height="44" fill="#000000" fill-opacity="0.82"/><text x="60" y="67" text-anchor="middle" font-family="Lucida Handwriting, sans-serif" font-size="40" font-weight="700" fill="#ffffff">DJ</text></svg>`
      )}`,
    []
  );

  useEffect(() => {
    const container = qrContainerRef.current;
    if (!container) return;

    if (!generatedUserUrl) {
      container.innerHTML = '';
      qrCodeRef.current = null;
      return;
    }

    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: 240,
        height: 240,
        type: 'svg',
        data: generatedUserUrl,
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'Q'
        },
        image: centerMusicIcon,
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 3,
          imageSize: 0.26,
          hideBackgroundDots: true
        },
        dotsOptions: {
          type: 'rounded',
          gradient: {
            type: 'linear',
            rotation: Math.PI / 6,
            colorStops: [
              { offset: 0, color: '#ff4d6d' },
              { offset: 0.14, color: '#ff6b3d' },
              { offset: 0.28, color: '#ff9f1c' },
              { offset: 0.42, color: '#ffd166' },
              { offset: 0.56, color: '#06d6a0' },
              { offset: 0.7, color: '#00c2ff' },
              { offset: 0.84, color: '#7c3aed' },
              { offset: 1, color: '#ff4db8' }
            ]
          }
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          gradient: {
            type: 'linear',
            rotation: Math.PI / 3,
            colorStops: [
              { offset: 0, color: '#ff4d6d' },
              { offset: 0.14, color: '#ff6b3d' },
              { offset: 0.28, color: '#ff9f1c' },
              { offset: 0.42, color: '#ffd166' },
              { offset: 0.56, color: '#06d6a0' },
              { offset: 0.7, color: '#00c2ff' },
              { offset: 0.84, color: '#7c3aed' },
              { offset: 1, color: '#ff4db8' }
            ]
          }
        },
        cornersDotOptions: {
          type: 'dot',
          gradient: {
            type: 'linear',
            rotation: Math.PI / 2,
            colorStops: [
              { offset: 0, color: '#ff4db8' },
              { offset: 0.14, color: '#7c3aed' },
              { offset: 0.28, color: '#00c2ff' },
              { offset: 0.42, color: '#06d6a0' },
              { offset: 0.56, color: '#ffd166' },
              { offset: 0.7, color: '#ff9f1c' },
              { offset: 0.84, color: '#ff6b3d' },
              { offset: 1, color: '#ff4d6d' }
            ]
          }
        },
        backgroundOptions: {
          color: '#000000'
        }
      });
      container.innerHTML = '';
      qrCodeRef.current.append(container);
      return;
    }

    qrCodeRef.current.update({
      data: generatedUserUrl,
      image: centerMusicIcon,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 3,
        imageSize: 0.26,
        hideBackgroundDots: true
      },
      dotsOptions: {
        type: 'rounded',
        gradient: {
          type: 'linear',
          rotation: Math.PI / 6,
          colorStops: [
            { offset: 0, color: '#ff4d6d' },
            { offset: 0.14, color: '#ff6b3d' },
            { offset: 0.28, color: '#ff9f1c' },
            { offset: 0.42, color: '#ffd166' },
            { offset: 0.56, color: '#06d6a0' },
            { offset: 0.7, color: '#00c2ff' },
            { offset: 0.84, color: '#7c3aed' },
            { offset: 1, color: '#ff4db8' }
          ]
        }
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        gradient: {
          type: 'linear',
          rotation: Math.PI / 3,
          colorStops: [
            { offset: 0, color: '#ff4d6d' },
            { offset: 0.14, color: '#ff6b3d' },
            { offset: 0.28, color: '#ff9f1c' },
            { offset: 0.42, color: '#ffd166' },
            { offset: 0.56, color: '#06d6a0' },
            { offset: 0.7, color: '#00c2ff' },
            { offset: 0.84, color: '#7c3aed' },
            { offset: 1, color: '#ff4db8' }
          ]
        }
      },
      cornersDotOptions: {
        type: 'dot',
        gradient: {
          type: 'linear',
          rotation: Math.PI / 2,
          colorStops: [
            { offset: 0, color: '#ff4db8' },
            { offset: 0.14, color: '#7c3aed' },
            { offset: 0.28, color: '#00c2ff' },
            { offset: 0.42, color: '#06d6a0' },
            { offset: 0.56, color: '#ffd166' },
            { offset: 0.7, color: '#ff9f1c' },
            { offset: 0.84, color: '#ff6b3d' },
            { offset: 1, color: '#ff4d6d' }
          ]
        }
      },
      backgroundOptions: {
        color: '#000000'
      }
    });
  }, [generatedUserUrl, centerMusicIcon]);

  useEffect(() => {
    const container = djQrContainerRef.current;
    if (!container) return;

    if (!generatedDjEntryUrl) {
      container.innerHTML = '';
      djQrCodeRef.current = null;
      return;
    }

    if (!djQrCodeRef.current) {
      djQrCodeRef.current = new QRCodeStyling({
        width: 240,
        height: 240,
        type: 'svg',
        data: generatedDjEntryUrl,
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'Q'
        },
        image: djCenterLabel,
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 3,
          imageSize: 0.26,
          hideBackgroundDots: true
        },
        dotsOptions: {
          type: 'rounded',
          gradient: {
            type: 'linear',
            rotation: Math.PI / 6,
            colorStops: [
              { offset: 0, color: '#ff0033' },
              { offset: 0.14, color: '#ff6a00' },
              { offset: 0.28, color: '#ffd500' },
              { offset: 0.42, color: '#7fff00' },
              { offset: 0.56, color: '#00d4ff' },
              { offset: 0.7, color: '#0066ff' },
              { offset: 0.84, color: '#7a00ff' },
              { offset: 1, color: '#ff00c8' }
            ]
          }
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          gradient: {
            type: 'linear',
            rotation: Math.PI / 3,
            colorStops: [
              { offset: 0, color: '#ff00c8' },
              { offset: 0.14, color: '#7a00ff' },
              { offset: 0.28, color: '#0066ff' },
              { offset: 0.42, color: '#00d4ff' },
              { offset: 0.56, color: '#7fff00' },
              { offset: 0.7, color: '#ffd500' },
              { offset: 0.84, color: '#ff6a00' },
              { offset: 1, color: '#ff0033' }
            ]
          }
        },
        cornersDotOptions: {
          type: 'dot',
          gradient: {
            type: 'linear',
            rotation: Math.PI / 2,
            colorStops: [
              { offset: 0, color: '#ff0033' },
              { offset: 0.14, color: '#ff6a00' },
              { offset: 0.28, color: '#ffd500' },
              { offset: 0.42, color: '#7fff00' },
              { offset: 0.56, color: '#00d4ff' },
              { offset: 0.7, color: '#0066ff' },
              { offset: 0.84, color: '#7a00ff' },
              { offset: 1, color: '#ff00c8' }
            ]
          }
        },
        backgroundOptions: {
          color: '#000000'
        }
      });
      container.innerHTML = '';
      djQrCodeRef.current.append(container);
      return;
    }

    djQrCodeRef.current.update({
      data: generatedDjEntryUrl,
      image: djCenterLabel,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 3,
        imageSize: 0.26,
        hideBackgroundDots: true
      },
      dotsOptions: {
        type: 'rounded',
        gradient: {
          type: 'linear',
          rotation: Math.PI / 6,
          colorStops: [
            { offset: 0, color: '#ff0033' },
            { offset: 0.14, color: '#ff6a00' },
            { offset: 0.28, color: '#ffd500' },
            { offset: 0.42, color: '#7fff00' },
            { offset: 0.56, color: '#00d4ff' },
            { offset: 0.7, color: '#0066ff' },
            { offset: 0.84, color: '#7a00ff' },
            { offset: 1, color: '#ff00c8' }
          ]
        }
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        gradient: {
          type: 'linear',
          rotation: Math.PI / 3,
          colorStops: [
            { offset: 0, color: '#ff00c8' },
            { offset: 0.14, color: '#7a00ff' },
            { offset: 0.28, color: '#0066ff' },
            { offset: 0.42, color: '#00d4ff' },
            { offset: 0.56, color: '#7fff00' },
            { offset: 0.7, color: '#ffd500' },
            { offset: 0.84, color: '#ff6a00' },
            { offset: 1, color: '#ff0033' }
          ]
        }
      },
      cornersDotOptions: {
        type: 'dot',
        gradient: {
          type: 'linear',
          rotation: Math.PI / 2,
          colorStops: [
            { offset: 0, color: '#ff0033' },
            { offset: 0.14, color: '#ff6a00' },
            { offset: 0.28, color: '#ffd500' },
            { offset: 0.42, color: '#7fff00' },
            { offset: 0.56, color: '#00d4ff' },
            { offset: 0.7, color: '#0066ff' },
            { offset: 0.84, color: '#7a00ff' },
            { offset: 1, color: '#ff00c8' }
          ]
        }
      },
      backgroundOptions: {
        color: '#000000'
      }
    });
  }, [generatedDjEntryUrl, djCenterLabel]);

  useEffect(() => {
    setVenueForm({
      id: venue.id ?? '',
      name: venue.name,
      logo: venue.logo,
      accentColor: venue.accentColor,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      zipCode: venue.zipCode,
      phone: venue.phone,
      email: venue.email
    });
    if (activeVenueId) {
      setSelectedVenueId(activeVenueId);
    } else if (venue.id) {
      setSelectedVenueId(venue.id);
    }
  }, [venue, activeVenueId]);

  useEffect(() => {
    setConfig(systemConfig);
  }, [systemConfig]);

  const applyConfigUpdate = (updates: Partial<SystemConfigType>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    updateSystemConfig(updates);
  };

  // Venue Functions
  const handleChangeVenue = async () => {
    await updateVenue(venueForm);
    setVenueChanged(true);
    setTimeout(() => setVenueChanged(false), 2000);
  };

  const handleSetActiveVenue = async () => {
    if (!selectedVenueId) return;
    await setActiveVenue(selectedVenueId);
    setVenueActivated(true);
    setTimeout(() => setVenueActivated(false), 2000);
  };

  const handleAddVenue = async () => {
    const exists = uniqueVenues.some(v => v.name === venueForm.name && v.address === venueForm.address);

    if (!exists && venueForm.name && venueForm.address && venueForm.city && venueForm.state) {
      await addVenue(venueForm);
      // Clear form after successful addition
      setVenueForm({
        id: '',
        name: '',
        logo: '',
        accentColor: '#a855f7',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: ''
      });
      setSelectedVenueId('');
      setVenueAdded(true);
      setTimeout(() => setVenueAdded(false), 2000);
    } else if (exists) {
      alert('This venue already exists in the list!');
    } else {
      alert('Please fill in all required fields (Name, Address, City, State)');
    }
  };

  const handleVenueSelect = (venueId: string) => {
    setSelectedVenueId(venueId);
    if (venueId) {
      const selected = venues.find(v => v.id === venueId);
      if (selected) {
        setVenueForm(selected);
      }
    }
  };

  const handleDeleteVenue = async (venueId: string, venueName: string) => {

    if (confirm(`Are you sure you want to delete "${venueName}"?`)) {
      await deleteVenue(venueId);
      if (selectedVenueId === venueId) {
        setSelectedVenueId('');
      }
    }
  };

  const handleCopyQrUrl = async () => {
    if (!generatedUserUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUserUrl);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR URL', error);
    }
  };

  const handleCopyDjQrUrl = async () => {
    if (!generatedDjEntryUrl) return;
    try {
      await navigator.clipboard.writeText(generatedDjEntryUrl);
      setDjQrCopied(true);
      setTimeout(() => setDjQrCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy DJ QR URL', error);
    }
  };

  // DJ Functions
  const handleAddDJ = async () => {
    if (djForm.name && djForm.username) {
      await addDj(djForm);
      setDjForm({
        name: '',
        username: '',
        phone: '',
        email: '',
        bio: '',
      });

      setDjAdded(true);
      setTimeout(() => setDjAdded(false), 2000);
    }
  };

  // Authentication Functions
  const generateAuthKey = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 8; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setGeneratedKey(key);

    // Update DJ with new key
    if (selectedDjId) {
      updateDjAuthKey(selectedDjId, key);
    }
  };

  const handleAuthenticate = async () => {
    if (selectedDjId && generatedKey) {
      await authenticateDj(selectedDjId, generatedKey);
      alert('DJ authenticated successfully! They can now use this key to log in.');
    }
  };

  const handleDeleteDJ = async (djId: string) => {

    const dj = djList.find(d => d.id === djId);
    if (confirm(`Are you sure you want to delete DJ "${dj?.name}"?`)) {
      await deleteDj(djId);
      if (selectedDjId === djId) {
        setSelectedDjId('');
        setGeneratedKey('');
      }
    }
  };

  const selectedDJ = djList.find(dj => dj.id === selectedDjId);

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white tracking-tight">System Configuration</h1>
        <p className="text-purple-400 text-sm font-semibold">Global settings and preferences</p>
      </motion.div>

      {/* Venue Information Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-5 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-black text-white">Venue Information</h3>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={handleAddVenue}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${venueAdded ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {venueAdded ? <><Check className="w-4 h-4" /> Added</> : <><Plus className="w-4 h-4" /> Add Venue</>}
            </motion.button>
            <motion.button
              onClick={handleSetActiveVenue}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${venueActivated ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {venueActivated ? <><CheckCircle className="w-4 h-4" /> Active</> : <><CheckCircle className="w-4 h-4" /> Set Active</>}
            </motion.button>
            <motion.button
              onClick={handleChangeVenue}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${venueChanged ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {venueChanged ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </motion.button>
          </div>
        </div>

        {/* Database Selection Dropdown */}
        <div className="mb-4">
          <label className="text-sm font-bold text-white mb-2 block flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Select from Database
          </label>
          <select
            value={selectedVenueId}
            onChange={(e) => handleVenueSelect(e.target.value)}
            className="w-full px-4 py-3 bg-gradient-to-br from-slate-800/80 to-purple-900/20 border border-purple-500/30 rounded-lg text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
            style={{
              backgroundImage: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.9), rgba(88, 28, 135, 0.3))'
            }}
          >
            <option value="" className="bg-slate-900 text-gray-400 font-semibold py-2">
              -- Select a venue --
            </option>
            {uniqueVenues.map((v) => (
              <option key={v.id} value={v.id} className="bg-slate-800 text-white font-semibold py-3 hover:bg-purple-900">
                {v.name} - {v.city}, {v.state}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm font-bold text-white mb-2 block">Venue QR Link</label>
          {generatedUserUrl ? (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="relative p-1 rounded-xl bg-black border border-fuchsia-400/40 shadow-lg shadow-fuchsia-500/20">
                  <div className="w-32 h-32 rounded-lg border border-black bg-black overflow-hidden flex items-center justify-center p-0.5">
                    <div ref={qrContainerRef} className="w-full h-full [&>svg]:w-full [&>svg]:h-full" aria-label="Venue QR Code" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={generatedUserUrl}
                    readOnly
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-xs font-mono"
                  />
                  <motion.button
                    onClick={handleCopyQrUrl}
                    className={`px-3 py-2 rounded-lg font-bold text-xs ${qrCopied ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {qrCopied ? 'Copied' : 'Copy URL'}
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm">
              Select a venue to generate QR URL
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="text-sm font-bold text-white mb-2 block">DJ Entry URL / QR</label>
          {generatedDjEntryUrl ? (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="relative p-1 rounded-xl bg-black border border-fuchsia-400/40 shadow-lg shadow-fuchsia-500/20">
                  <div className="w-32 h-32 rounded-lg border border-black bg-black overflow-hidden flex items-center justify-center p-0.5">
                    <div ref={djQrContainerRef} className="w-full h-full [&>svg]:w-full [&>svg]:h-full" aria-label="DJ Entry QR Code" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={generatedDjEntryUrl}
                    readOnly
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-xs font-mono"
                  />
                  <motion.button
                    onClick={handleCopyDjQrUrl}
                    className={`px-3 py-2 rounded-lg font-bold text-xs ${djQrCopied ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {djQrCopied ? 'Copied' : 'Copy URL'}
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm">
              DJ entry URL unavailable
            </div>
          )}
        </div>

        <div className="h-px bg-purple-500/20 my-4" />

        {/* Manual Entry */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1.5 block">Venue Name *</label>
            <input
              type="text"
              value={venueForm.name}
              onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Enter venue name"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1.5 block">Address *</label>
            <input
              type="text"
              value={venueForm.address}
              onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">City *</label>
              <input
                type="text"
                value={venueForm.city}
                onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="City"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">State *</label>
              <input
                type="text"
                value={venueForm.state}
                onChange={(e) => setVenueForm({ ...venueForm, state: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="State"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">ZIP Code *</label>
              <input
                type="text"
                value={venueForm.zipCode}
                onChange={(e) => setVenueForm({ ...venueForm, zipCode: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="ZIP"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Phone</label>
              <input
                type="tel"
                value={venueForm.phone}
                onChange={(e) => setVenueForm({ ...venueForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Email</label>
              <input
                type="email"
                value={venueForm.email}
                onChange={(e) => setVenueForm({ ...venueForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="email@venue.com"
              />
            </div>
          </div>
        </div>

        {/* Saved Venues List */}
        {uniqueVenues.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-bold text-white mb-2">Saved Venues ({uniqueVenues.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uniqueVenues.map((venueItem) => (
                <div key={venueItem.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-sm">{venueItem.name}</div>
                    <div className="text-gray-400 text-xs">{venueItem.address}, {venueItem.city}, {venueItem.state} {venueItem.zipCode}</div>
                  </div>
                  <motion.button
                    onClick={() => handleDeleteVenue(venueItem.id, venueItem.name)}
                    className="px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* DJ Information Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-5 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white">DJ Information</h3>
          </div>
          <motion.button
            onClick={handleAddDJ}
            disabled={!djForm.name || !djForm.username}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${djAdded ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white disabled:opacity-50'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {djAdded ? <><Check className="w-4 h-4" /> Added</> : <><Plus className="w-4 h-4" /> Add DJ</>}
          </motion.button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1.5 block flex items-center gap-1">
              <User className="w-3 h-3" /> DJ Name *
            </label>
            <input
              type="text"
              value={djForm.name}
              onChange={(e) => setDjForm({ ...djForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="Enter DJ full name"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1.5 block">Username *</label>
            <input
              type="text"
              value={djForm.username}
              onChange={(e) => setDjForm({ ...djForm, username: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="dj_username"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone Number
              </label>
              <input
                type="tel"
                value={djForm.phone}
                onChange={(e) => setDjForm({ ...djForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input
                type="email"
                value={djForm.email}
                onChange={(e) => setDjForm({ ...djForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="dj@email.com"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1.5 block">Bio / Notes</label>
            <textarea
              value={djForm.bio}
              onChange={(e) => setDjForm({ ...djForm, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="Professional background, specialties, etc."
            />
          </div>
        </div>
      </motion.div>

      {/* Authentication Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-5 border border-yellow-500/20">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-black text-white">DJ Authentication</h3>
        </div>

        <div className="space-y-4">
          {/* DJ Selection */}
          <div>
            <label className="text-sm font-bold text-white mb-2 block">Select DJ</label>
            <select
              value={selectedDjId}
              onChange={(e) => {
                setSelectedDjId(e.target.value);
                const dj = djList.find(d => d.id === e.target.value);
                if (dj?.authKey) {
                  setGeneratedKey(dj.authKey);
                } else {
                  setGeneratedKey('');
                }
              }}
              className="w-full px-4 py-3 bg-gradient-to-br from-slate-800/80 to-yellow-900/20 border border-yellow-500/30 rounded-lg text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
              style={{
                backgroundImage: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.9), rgba(120, 53, 15, 0.3))'
              }}
            >
              <option value="" className="bg-slate-900 text-gray-400 font-semibold py-2">
                -- Select a DJ --
              </option>
              {djList.map((dj) => (
                <option key={dj.id} value={dj.id} className="bg-slate-800 text-white font-semibold py-3">
                  {dj.name} (@{dj.username}) {dj.authenticated ? '✓ Authenticated' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* DJ Details */}
          {selectedDJ && (
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-400 text-xs font-bold mb-1">Name</div>
                  <div className="text-white font-semibold">{selectedDJ.name}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs font-bold mb-1">Username</div>
                  <div className="text-white font-semibold">@{selectedDJ.username}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs font-bold mb-1">Phone</div>
                  <div className="text-white font-semibold">{selectedDJ.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs font-bold mb-1">Email</div>
                  <div className="text-white font-semibold truncate">{selectedDJ.email || 'N/A'}</div>
                </div>
              </div>
              {selectedDJ.authenticated && (
                <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <CheckCircle className="w-4 h-4" />
                  Currently Authenticated
                </div>
              )}
            </div>
          )}

          {/* Key Generator */}
          <div>
            <label className="text-sm font-bold text-white mb-2 block flex items-center gap-2">
              <Key className="w-4 h-4 text-yellow-400" />
              Authentication Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-black/30 border border-yellow-500/30 rounded-lg text-yellow-400 font-mono text-lg font-black text-center tracking-widest">
                {generatedKey || '--------'}
              </div>
              <motion.button
                onClick={generateAuthKey}
                disabled={!selectedDjId}
                className="px-4 py-3 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 font-bold disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Click the refresh button to generate a new 8-digit alphanumeric key
            </p>
          </div>

          {/* Authenticate Button */}
          <motion.button
            onClick={handleAuthenticate}
            disabled={!selectedDjId || !generatedKey}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShieldCheck className="w-5 h-5" />
            Authenticate DJ
          </motion.button>
          <p className="text-xs text-gray-400 text-center">
            DJ will use their username and this key to log in to the DJ Command Center
          </p>
        </div>

        {/* Saved DJs List */}
        {djList.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-bold text-white mb-2">Saved DJs ({djList.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {djList.map((dj) => (
                <div key={dj.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-sm">{dj.name}</div>
                    <div className="text-gray-400 text-xs">@{dj.username}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dj.authKey && (
                      <span className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-mono font-bold">
                        {dj.authKey}
                      </span>
                    )}
                    {dj.authenticated && (
                      <span className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        ✓ Auth
                      </span>
                    )}
                    <motion.button
                      onClick={() => handleDeleteDJ(dj.id)}
                      className="px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* DJ Access Requests Section */}
      <DJAccessRequests />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Notifications */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-5 border border-pink-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-black text-white">Notifications</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Enable Notifications', key: 'notificationsEnabled' },
              { label: 'Email Notifications', key: 'emailNotifications' },
              { label: 'Push Notifications', key: 'pushNotifications' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-white text-sm font-semibold">{item.label}</span>
                <button
                  onClick={() => applyConfigUpdate({ [item.key]: !config[item.key as keyof SystemConfigType] } as Partial<SystemConfigType>)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config[item.key as keyof typeof config] ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${config[item.key as keyof typeof config] ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Request Limits */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-5 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-black text-white">Request Limits</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-400">Auto Accept Requests</label>
                <button
                  onClick={() => applyConfigUpdate({ autoAcceptRequests: !config.autoAcceptRequests })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.autoAcceptRequests ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${config.autoAcceptRequests ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Max Requests Per User</label>
              <input
                type="number"
                value={config.maxRequestsPerUser}
                onChange={(e) => applyConfigUpdate({ maxRequestsPerUser: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Max Votes Per User</label>
              <input
                type="number"
                value={config.maxVotesPerUser}
                onChange={(e) => applyConfigUpdate({ maxVotesPerUser: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Request Cooldown (seconds)</label>
              <input
                type="number"
                value={config.requestCooldown}
                onChange={(e) => applyConfigUpdate({ requestCooldown: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Backup & Data */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-5 border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-black text-white">Backup & Data</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <span className="text-white text-sm font-semibold">Enable Auto Backup</span>
            <button
              onClick={() => applyConfigUpdate({ backupEnabled: !config.backupEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${config.backupEnabled ? 'bg-emerald-500' : 'bg-gray-600'
                }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${config.backupEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
            </button>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1.5 block">Backup Frequency</label>
            <select
              value={config.backupFrequency}
              onChange={(e) => applyConfigUpdate({ backupFrequency: e.target.value })}
              className="w-full px-3 py-2 bg-gradient-to-br from-slate-800/80 to-emerald-900/20 border border-emerald-500/30 rounded-lg text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              style={{
                backgroundImage: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.9), rgba(6, 78, 59, 0.3))'
              }}
            >
              <option value="hourly" className="bg-slate-800 text-white font-semibold">Hourly</option>
              <option value="daily" className="bg-slate-800 text-white font-semibold">Daily</option>
              <option value="weekly" className="bg-slate-800 text-white font-semibold">Weekly</option>
              <option value="monthly" className="bg-slate-800 text-white font-semibold">Monthly</option>
            </select>
          </div>
        </div>
        <button
          onClick={downloadBackup}
          className="mt-3 w-full px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold text-sm"
        >
          Download Backup Now
        </button>
      </motion.div>
    </div>
  );
}