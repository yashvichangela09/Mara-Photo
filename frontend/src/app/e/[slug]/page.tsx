'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, 
  Settings, Camera, Trash2, Loader2, Check, Copy, ZoomIn, Play, ShieldCheck, RefreshCw, ScanFace, 
  ChevronRight, ChevronLeft, LayoutGrid, Sliders, X, Download, Loader, Sparkles, CalendarDays, 
  Lock, Key, AlertCircle, Search, Eye, EyeOff 
} from 'lucide-react';
import PhotoAlbum from 'react-photo-album';
import confetti from 'canvas-confetti';
import { apiClient } from '../../../lib/api';

const dbName = 'MeraPhotoDB';
const storeName = 'media_files';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('Server side');
    const request = window.indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getLocalFile = async (id: string): Promise<File | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ? request.result.file : null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('getLocalFile error', e);
    return null;
  }
};

export default function ClientGallery() {
  const params = useParams();
  const slug = params.slug as string;

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showEventPassword, setShowEventPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Guest Sign-In States
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestError, setGuestError] = useState('');
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  // Gallery view configurations
  const [viewType, setViewType] = useState<'grid' | 'masonry' | 'timeline'>('masonry');
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');

  // Selfie Search Modal
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<'upload' | 'camera'>('camera');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState('');
  
  // Search Matches State
  const [searchActive, setSearchActive] = useState(false);
  const [matchedMedia, setMatchedMedia] = useState<any[]>([]);
  const [searchStats, setSearchStats] = useState<{ totalSearched: number; message: string } | null>(null);

  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});

  const resolveMediaUrl = (m: any) => {
    if (!m) return '';
    const url = m.compressedUrl || m.url || m.r2Url || '';
    if (url.startsWith('localdb://')) {
      const id = url.replace('localdb://', '');
      if (localUrls[id]) return localUrls[id];
      
      getLocalFile(id).then((file) => {
        if (file) {
          const blobUrl = URL.createObjectURL(file);
          setLocalUrls(prev => ({ ...prev, [id]: blobUrl }));
        }
      });
      return '';
    }
    return url;
  };

  // Lightbox / Detail view
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Selection for bulk downloads
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  // Drag & Drop state
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchGalleryMedia = async (eventId: string) => {
    try {
      const res = await apiClient.get(`/media/event/${eventId}`);
      setMedia(res.data.media);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/event/code/${slug}`);
      setEvent(res.data.event);
      
      if (res.data.event.accessType === 'PASSWORD') {
        setIsLocked(true);
      } else {
        fetchGalleryMedia(res.data.event._id);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError('Event gallery not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guestStatus = localStorage.getItem(`mara_guest_${slug}`);
      if (guestStatus === 'true') {
        setIsGuest(true);
      }
    }
    fetchEventData();
  }, [slug]);

  // Clean up selfie preview URL on unmount
  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!selectedItem) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedItem(null);
        return;
      }
      
      const galleryMediaList = (searchActive ? matchedMedia : media).filter(m => {
        if (mediaFilter === 'PHOTO') return m.type === 'PHOTO' || !m.type;
        if (mediaFilter === 'VIDEO') return m.type === 'VIDEO';
        return true;
      });
      const currentIndex = galleryMediaList.findIndex(m => m._id === selectedItem._id);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowRight' && currentIndex < galleryMediaList.length - 1) {
        setSelectedItem(galleryMediaList[currentIndex + 1]);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSelectedItem(galleryMediaList[currentIndex - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, searchActive, matchedMedia, media, mediaFilter]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await apiClient.post(`/event/code/${slug}/verify-password`, { password });
      setIsLocked(false);
      fetchGalleryMedia(event._id);
    } catch (err: any) {
      setAuthError('Incorrect gallery password.');
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError('');
    setGuestSubmitting(true);
    
    if (!guestName.trim() || !guestPhone.trim()) {
      setGuestError('Name and Phone are required.');
      setGuestSubmitting(false);
      return;
    }

    try {
      await apiClient.post(`/visitors/event/code/${slug}`, {
        name: guestName,
        phone: guestPhone,
        email: guestEmail
      });
      
      localStorage.setItem(`mara_guest_${slug}`, 'true');
      setIsGuest(true);
    } catch (err: any) {
      console.error(err);
      setGuestError(err.response?.data?.error || 'Failed to submit details. Please try again.');
    } finally {
      setGuestSubmitting(false);
    }
  };

  // ── Camera handling ──────────────────────
  const startWebcam = async () => {
    setSearchTab('camera');
    setSearchError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      setWebcamStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setSearchError('Could not access camera. Please allow camera permissions or upload a photo instead.');
      setSearchTab('upload');
    }
  };

  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
  }, [webcamStream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          setSelfieFile(file);
          setSelfiePreview(URL.createObjectURL(file));
          stopWebcam();
          setSearchTab('upload');
        }
      }, 'image/jpeg', 0.92);
    }
  };

  // ── File upload handling ──────────────────
  const handleSelfieUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
      setSearchError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
      setSearchError('');
    }
  };

  const clearSelfie = () => {
    setSelfieFile(null);
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(null);
    setSearchError('');
  };

  // ── AI Search ──────────────────────────
  const handleAISearch = async () => {
    if (!selfieFile || !event) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchProgress(0);
    setSearchStage('Detecting face in your photo...');
    
    const formData = new FormData();
    formData.append('selfie', selfieFile);

    const progressTimer = setInterval(() => {
      setSearchProgress(prev => {
        if (prev < 30) {
          setSearchStage('Detecting face in your photo...');
          return prev + 3;
        } else if (prev < 60) {
          setSearchStage('Generating facial embedding...');
          return prev + 2;
        } else if (prev < 85) {
          setSearchStage('Matching against album photos...');
          return prev + 1;
        }
        return prev;
      });
    }, 150);

    try {
      const res = await apiClient.post(`/ai/search/${event._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(progressTimer);
      setSearchProgress(100);
      setSearchStage('Complete!');

      const matches = res.data.matches || [];
      setMatchedMedia(matches);
      setSearchStats({
        totalSearched: res.data.totalSearched || 0,
        message: res.data.message || '',
      });
      setSearchActive(true);

      setTimeout(() => {
        setSearchModalOpen(false);
        clearSelfie();
        setSearchProgress(0);
        setSearchStage('');
      }, 600);

      if (matches.length > 0) {
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 800);
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error(err);
      setSearchError(err.response?.data?.error || 'Failed to search photos. Please try again.');
      setSearchProgress(0);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchActive(false);
    setMatchedMedia([]);
    setSearchStats(null);
  };

  const toggleSelectMedia = (id: string) => {
    if (selectedMediaIds.includes(id)) {
      setSelectedMediaIds(selectedMediaIds.filter((mid) => mid !== id));
    } else {
      setSelectedMediaIds([...selectedMediaIds, id]);
    }
  };

  const downloadSingleFile = async (url: string, fileName?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || url.split('/').pop()?.split('?')[0] || `media_${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      a.target = '_self';
      a.click();
    }
  };

  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const handleBulkDownload = async () => {
    if (selectedMediaIds.length === 0) return;
    setDownloadingBulk(true);
    try {
      const res = await apiClient.post('/media/download-bulk', { mediaIds: selectedMediaIds });
      const downloads = res.data.downloads || [];
      for (const d of downloads) {
        await downloadSingleFile(d.url, d.name || `photo_${Date.now()}`);
        await new Promise((r) => setTimeout(r, 350));
      }
      setSelectedMediaIds([]);
      setIsMultiSelect(false);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingBulk(false);
    }
  };

  const closeSearchModal = () => {
    stopWebcam();
    setSearchModalOpen(false);
    setSearchError('');
    setSearchProgress(0);
    setSearchStage('');
    clearSelfie();
    setSearchTab('camera');
  };

  // 1. Locked Screen
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-[#09090b] flex flex-col items-center justify-between p-6 relative overflow-hidden font-poppins">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#c5a880]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#c5a880]/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl flex items-center justify-between py-4 z-10">
          <div className="flex items-center gap-3">
            {event?.studioId?.logoUrl ? (
              <img src={event.studioId.logoUrl} alt="Studio Logo" className="h-9 max-w-[140px] object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c5a880] flex items-center justify-center text-[#09090b] font-black text-xs">M</div>
                <span className="font-extrabold text-sm tracking-wider text-[#09090b] uppercase">
                  {event?.studioId?.name || 'Mara Photo'}
                </span>
              </div>
            )}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c5a880] bg-[#c5a880]/10 px-3 py-1.5 rounded-full border border-[#c5a880]/20">
            Protected Gallery
          </span>
        </div>

        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-[#e3d8c8] p-8 sm:p-10 rounded-3xl text-center shadow-xl relative z-10 my-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center mx-auto mb-6 text-[#c5a880]">
            <Lock className="h-6 w-6 text-[#c5a880]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#09090b] tracking-tight">{event?.name || 'Private Event'}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-2 leading-relaxed">
            This gallery is password protected.<br />Enter the password to view the photos.
          </p>

          {authError && (
            <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center justify-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-4 mt-6">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c5a880]" />
              <input
                type={showEventPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter event password"
                className="w-full bg-[#faf9f6] border border-[#e3d8c8] rounded-xl pl-11 pr-12 py-3.5 text-sm font-semibold text-[#09090b] placeholder:text-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white text-center tracking-wider transition-all"
              />
              <button
                type="button"
                onClick={() => setShowEventPassword(!showEventPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showEventPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="submit"
              className="bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
            >
              Unlock Gallery
            </button>
            <div className="text-center mt-1">
              <span className="text-[11px] text-slate-400 hover:text-[#c5a880] cursor-help font-semibold transition-colors">
                Forgot password?
              </span>
            </div>
          </form>
        </div>

        <div className="py-4 text-center z-10">
          <p className="text-[11px] text-slate-400 font-semibold">Powered by <span className="text-[#c5a880] font-bold">Mara Photo</span></p>
        </div>
      </div>
    );
  }

  // 2. Guest Sign-In Page
  if (!isGuest && !isLocked) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-[#09090b] flex flex-col items-center justify-between p-6 relative overflow-hidden font-poppins">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#c5a880]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#c5a880]/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl flex items-center justify-between py-4 z-10">
          <div className="flex items-center gap-3">
            {event?.studioId?.logoUrl ? (
              <img src={event.studioId.logoUrl} alt="Studio Logo" className="h-9 max-w-[140px] object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c5a880] flex items-center justify-center text-[#09090b] font-black text-xs">M</div>
                <span className="font-extrabold text-sm tracking-wider text-[#09090b] uppercase">
                  {event?.studioId?.name || 'Mara Photo'}
                </span>
              </div>
            )}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c5a880] bg-[#c5a880]/10 px-3 py-1.5 rounded-full border border-[#c5a880]/20">
            Guest Access
          </span>
        </div>

        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-[#e3d8c8] p-8 sm:p-10 rounded-3xl text-center shadow-xl relative z-10 my-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center mx-auto mb-6 text-[#c5a880]">
            <User className="h-6 w-6 text-[#c5a880]" />
          </div>
          
          <span className="text-[10px] font-extrabold tracking-widest text-[#c5a880] uppercase bg-[#f5f2eb] px-3 py-1 rounded-full border border-[#e3d8c8] inline-block mb-3">
            {event?.type || 'EVENT'}
          </span>
          <h2 className="text-2xl font-extrabold text-[#09090b] tracking-tight">{event?.name || 'Event Gallery'}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-2 mb-6 leading-relaxed">Please enter your details to view the album.</p>
          
          <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4 text-left">
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 mb-1.5 block uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-[#e3d8c8] rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-[#09090b] placeholder-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white transition-all"
                  placeholder="John Doe"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a880]" />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 mb-1.5 block uppercase tracking-wider">Phone Number *</label>
              <div className="relative">
                <input 
                  type="tel" 
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-[#e3d8c8] rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-[#09090b] placeholder-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white transition-all"
                  placeholder="+91 9876543210"
                />
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a880]" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 mb-1.5 block uppercase tracking-wider">Email Address (Optional)</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-[#e3d8c8] rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-[#09090b] placeholder-slate-400 focus:outline-none focus:border-[#c5a880] focus:bg-white transition-all"
                  placeholder="john@example.com"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a880]" />
              </div>
            </div>

            {guestError && (
              <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center justify-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{guestError}</span>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={guestSubmitting}
              className="mt-4 bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg w-full flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {guestSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-[#09090b]" /> : 'Enter Gallery'}
            </button>
          </form>
        </div>

        <div className="py-4 text-center z-10">
          <p className="text-[11px] text-slate-400 font-semibold">Powered by <span className="text-[#c5a880] font-bold">Mara Photo</span></p>
        </div>
      </div>
    );
  }

  const galleryMedia = (searchActive ? matchedMedia : media).filter(m => {
    if (mediaFilter === 'PHOTO') return m.type === 'PHOTO' || !m.type;
    if (mediaFilter === 'VIDEO') return m.type === 'VIDEO';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#09090b] flex flex-col relative font-poppins selection:bg-[#c5a880] selection:text-[#09090b]">
      {/* Whitelabel Header with Bigger Logo & Studio Name */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#e3d8c8]/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-22 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {event?.studioId?.logoUrl ? (
              <img src={event.studioId.logoUrl} alt="Logo" className="h-12 md:h-14 max-w-[200px] object-contain shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#c5a880] flex items-center justify-center text-[#09090b] font-black text-sm shadow-sm">M</div>
            )}
            <div className="flex flex-col">
              <span className="font-extrabold text-base md:text-xl text-[#09090b] tracking-tight">
                {event?.studioId?.name || 'Mara Photo Studio'}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Official Gallery</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-[#c5a880] bg-[#c5a880]/10 px-3.5 py-1.5 rounded-full border border-[#c5a880]/20">
              {event?.name}
            </span>
            {event?.date && (
              <span className="text-xs font-bold text-slate-600 bg-white border border-[#e3d8c8] px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                <CalendarDays className="h-4 w-4 text-[#c5a880]" />
                {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Clear Cover Hero Presentation */}
      <div className="relative w-full bg-[#09090b] text-white py-14 sm:py-20 px-6 overflow-hidden">
        {event?.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-65 scale-100 transition-all duration-700" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#1a1714] to-[#09090b] opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col items-start gap-3.5 max-w-2xl">
            <span className="text-[10px] uppercase font-black tracking-widest bg-[#c5a880] text-[#09090b] px-3.5 py-1.5 rounded-full shadow-md">
              {event?.type || 'EVENT GALLERY'}
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
              {event?.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-200 mt-1">
              {event?.date && (
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
                  <CalendarDays className="h-4 w-4 text-[#c5a880]" />
                  <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              {event?.location && (
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
                  <MapPin className="h-4 w-4 text-[#c5a880]" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
                <ImageIcon className="h-4 w-4 text-[#c5a880]" />
                <span>{media.length} Media Files</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Controls bar & Filter Tabs */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#e3d8c8]/50">
        {/* Media Filter Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button 
            onClick={() => setMediaFilter('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              mediaFilter === 'ALL' 
                ? 'bg-[#09090b] text-white shadow-md' 
                : 'bg-white text-slate-700 border border-[#e3d8c8] hover:bg-[#faf9f6]'
            }`}
          >
            All Media ({media.length})
          </button>
          <button 
            onClick={() => setMediaFilter('PHOTO')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              mediaFilter === 'PHOTO' 
                ? 'bg-[#09090b] text-white shadow-md' 
                : 'bg-white text-slate-700 border border-[#e3d8c8] hover:bg-[#faf9f6]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#c5a880]" />
            Photos ({media.filter(m => m.type !== 'VIDEO').length})
          </button>
          <button 
            onClick={() => setMediaFilter('VIDEO')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              mediaFilter === 'VIDEO' 
                ? 'bg-[#09090b] text-white shadow-md' 
                : 'bg-white text-slate-700 border border-[#e3d8c8] hover:bg-[#faf9f6]'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-[#c5a880]" />
            Videos ({media.filter(m => m.type === 'VIDEO').length})
          </button>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {searchActive && (
            <button onClick={clearSearch} className="text-xs text-rose-600 hover:text-rose-700 font-bold underline flex items-center gap-1">
              <X className="h-3.5 w-3.5" />
              Clear AI Results
            </button>
          )}

          {isMultiSelect ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600 font-bold">Selected: <strong>{selectedMediaIds.length}</strong></span>
              <button 
                onClick={handleBulkDownload} 
                disabled={selectedMediaIds.length === 0 || downloadingBulk} 
                className="bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] text-xs font-extrabold px-4 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                {downloadingBulk ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {downloadingBulk ? 'Downloading...' : 'Download Selected'}
              </button>
              <button onClick={() => { setIsMultiSelect(false); setSelectedMediaIds([]); }} className="text-xs text-slate-500 hover:text-slate-700 font-bold">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setIsMultiSelect(true)} className="text-xs text-[#09090b] hover:text-[#c5a880] border border-[#e3d8c8] bg-white rounded-xl px-4 py-2.5 hover:bg-[#faf9f6] transition-colors shadow-sm font-bold flex items-center gap-2 cursor-pointer">
              <Check className="h-3.5 w-3.5 text-[#c5a880]" />
              Select Multiple
            </button>
          )}
        </div>
      </div>

      {/* Gallery Items Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {galleryMedia.length > 0 ? (
          <div>
            {searchActive && (
              <div className="mb-8 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-100 text-[#FF6B00] p-5 rounded-2xl text-sm font-semibold flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center shrink-0">
                  <ScanFace className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold">Found {galleryMedia.length} matching photo{galleryMedia.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-[#FF6B00] mt-0.5 font-medium">AI matched your face across the entire album. Photos are sorted by similarity.</p>
                </div>
              </div>
            )}
            {viewType === 'masonry' ? (
               <PhotoAlbum 
                 layout="masonry"
                 photos={galleryMedia.map(m => ({
                    src: resolveMediaUrl(m),
                    width: m.width || (m.type === 'VIDEO' ? 1920 : 1600),
                    height: m.height || (m.type === 'VIDEO' ? 1080 : 1200),
                    key: m._id,
                    media: m
                 }))}
                 columns={(containerWidth) => {
                    if (containerWidth < 400) return 3;
                    if (containerWidth < 700) return 4;
                    if (containerWidth < 1000) return 6;
                    return 8;
                  }}
                 spacing={16}
                 render={{
                   wrapper: ({ style, children, ...rest }, { photo }) => {
                     const m = (photo as any).media;
                     const isSelected = selectedMediaIds.includes(m._id);
                     return (
                       <div 
                         {...rest} 
                         style={{ ...style, position: 'relative', overflow: 'hidden', borderRadius: '0.75rem' }} 
                         className={`group transition-all duration-300 bg-slate-100 flex items-center justify-center ${isSelected ? 'border-2 border-[#c5a880] ring-4 ring-[#c5a880]/20 shadow-lg scale-95' : 'border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 z-0 hover:z-10 cursor-pointer'}`}
                       >
                         {children}
                       </div>
                     );
                   },
                   image: (imageProps, { photo }) => {
                     const m = (photo as any).media;
                     if (m?.type === 'VIDEO') {
                       return (
                         <div style={{ ...imageProps.style, position: 'relative', width: '100%', height: '100%', minHeight: '140px', backgroundColor: '#09090b' }}>
                           <video 
                             src={resolveMediaUrl(m)} 
                             className="w-full h-full object-cover pointer-events-none opacity-90" 
                             muted 
                             playsInline 
                             preload="metadata"
                           />
                         </div>
                       );
                     }
                     return (
                       <img 
                         {...imageProps} 
                         style={{ ...imageProps.style, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                         className={`${imageProps.className || ''} group-hover:scale-110 object-cover`} 
                       />
                     );
                   },
                   extras: (_, { photo }) => {
                     const m = (photo as any).media;
                     const isSelected = selectedMediaIds.includes(m._id);
                     return (
                       <>
                         {/* Video overlay */}
                         {m.type === 'VIDEO' && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors pointer-events-none z-10">
                             <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                               <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                             </div>
                           </div>
                         )}

                         {/* Similarity badge */}
                         {searchActive && m.similarityPercent && (
                           <div className="absolute top-3 left-3 z-20">
                             <div className={`px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md border flex items-center gap-1 ${
                               m.confidence === 'HIGH' 
                                 ? 'bg-emerald-500/90 border-emerald-400/50 text-white' 
                                 : 'bg-amber-500/90 border-amber-400/50 text-white'
                             }`}>
                               <ShieldCheck className="h-3 w-3" />
                               {m.similarityPercent}% match
                             </div>
                           </div>
                         )}

                         {isMultiSelect ? (
                           <div className="absolute inset-0 bg-black/10 flex items-start justify-start p-3 cursor-pointer z-30" onClick={() => toggleSelectMedia(m._id)}>
                             <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#FF6B00] border-[#FF6B00] text-white' : 'border-white/40 bg-black/10'}`}>
                               {isSelected && <Check className="h-4.5 w-4.5" />}
                             </div>
                           </div>
                         ) : (
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 cursor-pointer z-30" onClick={() => setSelectedItem(m)}>
                             <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:scale-105 transition-transform">
                               <ZoomIn className="h-4.5 w-4.5" />
                             </div>
                           </div>
                         )}
                       </>
                     );
                   }
                 }}
               />
            ) : (
               <PhotoAlbum 
                 layout="rows"
                 photos={galleryMedia.map(m => ({
                    src: resolveMediaUrl(m),
                    width: m.width || (m.type === 'VIDEO' ? 1920 : 1600),
                    height: m.height || (m.type === 'VIDEO' ? 1080 : 1200),
                    key: m._id,
                    media: m
                 }))}
                 targetRowHeight={100}
                 spacing={16}
                 render={{
                   wrapper: ({ style, children, ...rest }, { photo }) => {
                     const m = (photo as any).media;
                     const isSelected = selectedMediaIds.includes(m._id);
                     return (
                       <div 
                         {...rest} 
                         style={{ ...style, overflow: 'hidden', borderRadius: '0.75rem' }} 
                         className={`group relative transition-all duration-300 bg-slate-100 flex items-center justify-center ${isSelected ? 'border-2 border-[#FF6B00] ring-4 ring-[#FF6B00]/20 shadow-lg scale-95' : 'border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 z-0 hover:z-10 cursor-pointer'}`}
                       >
                         {children}
                       </div>
                     );
                   },
                   image: (imageProps, { photo }) => {
                     const m = (photo as any).media;
                     if (m?.type === 'VIDEO') {
                       return (
                         <div style={{ ...imageProps.style, position: 'relative', width: '100%', height: '100%', minHeight: '140px', backgroundColor: '#09090b' }}>
                           <video 
                             src={resolveMediaUrl(m)} 
                             className="w-full h-full object-cover pointer-events-none opacity-90" 
                             muted 
                             playsInline 
                             preload="metadata"
                           />
                         </div>
                       );
                     }
                     return (
                       <img 
                         {...imageProps} 
                         style={{ ...imageProps.style, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                         className={`${imageProps.className || ''} group-hover:scale-110 object-cover`} 
                       />
                     );
                   },
                   extras: (_, { photo }) => {
                     const m = (photo as any).media;
                     const isSelected = selectedMediaIds.includes(m._id);
                     return (
                       <>
                         {/* Video overlay */}
                         {m.type === 'VIDEO' && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors pointer-events-none z-10">
                             <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                               <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                             </div>
                           </div>
                         )}

                         {/* Similarity badge */}
                         {searchActive && m.similarityPercent && (
                           <div className="absolute top-3 left-3 z-20">
                             <div className={`px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md border flex items-center gap-1 ${
                               m.confidence === 'HIGH' 
                                 ? 'bg-emerald-500/90 border-emerald-400/50 text-white' 
                                 : 'bg-amber-500/90 border-amber-400/50 text-white'
                             }`}>
                               <ShieldCheck className="h-3 w-3" />
                               {m.similarityPercent}% match
                             </div>
                           </div>
                         )}

                         {isMultiSelect ? (
                           <div className="absolute inset-0 bg-black/10 flex items-start justify-start p-3 cursor-pointer z-30" onClick={() => toggleSelectMedia(m._id)}>
                             <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#FF6B00] border-[#FF6B00] text-white' : 'border-white/40 bg-black/10'}`}>
                               {isSelected && <Check className="h-4.5 w-4.5" />}
                             </div>
                           </div>
                         ) : (
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 cursor-pointer z-30" onClick={() => setSelectedItem(m)}>
                             <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:scale-105 transition-transform">
                               <ZoomIn className="h-4.5 w-4.5" />
                             </div>
                           </div>
                         )}
                       </>
                     );
                   }
                 }}
               />
            )}
          </div>
        ) : (
          <div className="py-24 text-center glass-panel bg-white border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 max-w-xl mx-auto text-slate-500 shadow-sm">
            <ImageIcon className="h-10 w-10 text-slate-350 mb-3" />
            <h3 className="text-sm font-bold text-slate-600">
              {searchActive ? 'No matching photos found' : 'No media files yet'}
            </h3>
            <p className="text-xs mt-1 font-semibold">
              {searchActive 
                ? 'Try uploading a clearer, well-lit photo of your face. Make sure you are looking directly at the camera.'
                : 'Check back later once uploads are completed.'}
            </p>
            {searchActive && (
              <button onClick={clearSearch} className="mt-4 text-xs text-[#FF6B00] hover:text-[#FF6B00] font-bold flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Action Button ── */}
      <button 
        onClick={() => { setSearchModalOpen(true); startWebcam(); }} 
        className="fixed bottom-8 right-8 z-35 group"
      >
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 bg-[#c5a880] rounded-2xl animate-ping opacity-25" />
          <div className="relative bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-black px-6 py-4 rounded-2xl shadow-2xl transform hover:-translate-y-0.5 transition-all flex items-center gap-2.5 border border-[#e3d8c8]">
            <ScanFace className="h-5 w-5 text-[#09090b]" />
            <span className="text-sm uppercase tracking-wider">Find My Photos</span>
            <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </button>

      {/* Rich Contact Footer */}
      <footer className="mt-20 bg-[#09090b] text-white border-t border-white/10 py-14 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {event?.studioId?.logoUrl ? (
                <img src={event.studioId.logoUrl} alt="Logo" className="h-10 max-w-[160px] object-contain brightness-125" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#c5a880] flex items-center justify-center text-[#09090b] font-black text-xs">M</div>
                  <span className="font-extrabold text-base tracking-wider text-white uppercase">
                    {event?.studioId?.name || 'Mara Photo Studio'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
              Capturing timeless memories with AI-powered gallery distribution & high-resolution delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
            {typeof event?.studioId === 'object' && event?.studioId?.ownerId && typeof event.studioId.ownerId === 'object' && (event.studioId.ownerId as any).email && (
              <a href={`mailto:${(event.studioId.ownerId as any).email}`} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-colors">
                <Mail className="h-4 w-4 text-[#c5a880]" />
                <span>{(event.studioId.ownerId as any).email}</span>
              </a>
            )}
            {typeof event?.studioId === 'object' && event?.studioId?.ownerId && typeof event.studioId.ownerId === 'object' && (event.studioId.ownerId as any).phone && (
              <a href={`tel:${(event.studioId.ownerId as any).phone}`} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-colors">
                <Phone className="h-4 w-4 text-[#c5a880]" />
                <span>{(event.studioId.ownerId as any).phone}</span>
              </a>
            )}
            {event?.location && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                <MapPin className="h-4 w-4 text-[#c5a880]" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-semibold">
          <p>© {new Date().getFullYear()} {event?.studioId?.name || 'Mara Photo'}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Delivered with passion via</span>
            <span className="text-[#c5a880] font-extrabold">Mara Photo AI Gallery</span>
          </p>
        </div>
      </footer>

      {/* ── Professional Selfie Search Modal ── */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/90 backdrop-blur-lg flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white p-0 rounded-3xl relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="relative bg-[#09090b] text-white p-6 pb-8 border-b border-white/10">
              <button 
                onClick={closeSearchModal} 
                className="absolute top-4 right-4 text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#c5a880] flex items-center justify-center text-[#09090b]">
                  <ScanFace className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Find My Photos</h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">Upload a photo or scan your face to find all photos you appear in</p>
                </div>
              </div>
            </div>

            <div className="p-6 -mt-3">
              <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
                <button 
                  onClick={startWebcam}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    searchTab === 'camera' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  Face Scan
                </button>
                <button 
                  onClick={() => { setSearchTab('upload'); stopWebcam(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    searchTab === 'upload' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </button>
              </div>

              {searchError && (
                <div className="mb-5 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              {searchTab === 'camera' && webcamStream && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-[4/3] rounded-2xl border-2 border-slate-200 overflow-hidden bg-black relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white/40 rounded-full" />
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <span className="text-[10px] text-white/70 font-semibold bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                        Position your face in the circle
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={capturePhoto} 
                    className="w-full bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-black py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Camera className="h-4.5 w-4.5" />
                    Capture Photo
                  </button>
                </div>
              )}

              {searchTab === 'upload' && (
                <div className="flex flex-col gap-4">
                  {selfieFile && selfiePreview ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-full">
                        <div className="w-full aspect-[4/3] rounded-2xl border-2 border-orange-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                          <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                        </div>
                        <button 
                          onClick={clearSelfie} 
                          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 p-2 rounded-xl text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="w-full space-y-3">
                        <button 
                          onClick={() => fileInputRef.current?.click()} 
                          className="w-full text-xs text-[#c5a880] hover:text-[#b59a72] font-bold py-2 flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Remove & choose another
                        </button>

                        <button 
                          onClick={handleAISearch} 
                          disabled={searchLoading} 
                          className="relative w-full bg-[#c5a880] hover:bg-[#b59a72] disabled:opacity-50 text-[#09090b] font-black py-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2.5 overflow-hidden"
                        >
                          {searchLoading && (
                            <div 
                              className="absolute inset-y-0 left-0 bg-[#09090b]/15 transition-all duration-300 ease-out"
                              style={{ width: `${searchProgress}%` }}
                            />
                          )}
                          <span className="relative flex items-center gap-2.5">
                            {searchLoading ? (
                              <>
                                <Loader className="h-4.5 w-4.5 animate-spin" />
                                <span>{searchStage}</span>
                              </>
                            ) : (
                              <>
                                <Search className="h-4.5 w-4.5" />
                                <span>Search Photos</span>
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                        isDragOver 
                          ? 'border-[#c5a880] bg-[#f5f2eb]' 
                          : 'border-slate-200 bg-slate-50 hover:border-[#c5a880] hover:bg-[#faf9f6]'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#c5a880]/15 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-[#c5a880]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          PNG, JPG, WEBP up to 10MB
                        </p>
                      </div>
                    </div>
                  )}

                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleSelfieUploadChange} 
                    className="hidden" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6">
          <div className="flex items-center justify-between w-full absolute top-6 left-0 px-6 z-10 pointer-events-none">
            <div>
              {selectedItem.similarityPercent && (
                <span className="text-[#FF6B00] font-mono text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg border border-white/10 pointer-events-auto">
                  {selectedItem.similarityPercent}% AI match
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 pointer-events-auto">
              <button 
                onClick={() => downloadSingleFile(resolveMediaUrl(selectedItem), `${selectedItem.name || 'media'}_${selectedItem._id}`)} 
                className="bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button onClick={() => setSelectedItem(null)} className="bg-white/10 hover:bg-rose-500/90 px-4 py-2 text-white rounded-xl flex items-center gap-2 font-bold text-xs transition-colors border border-white/10">
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 relative h-full w-full">
            {galleryMedia.findIndex(m => m._id === selectedItem._id) > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedItem(galleryMedia[galleryMedia.findIndex(m => m._id === selectedItem._id) - 1]); }} 
                className="absolute left-4 p-4 rounded-full bg-white/5 hover:bg-white/15 text-white transition-colors border border-white/10 z-20"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {selectedItem.type === 'PHOTO' ? (
              <img src={resolveMediaUrl(selectedItem)} alt="detailed preview" className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl select-none" />
            ) : (
              <video ref={playerRef} controls src={resolveMediaUrl(selectedItem)} className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl" />
            )}

            {galleryMedia.findIndex(m => m._id === selectedItem._id) < galleryMedia.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedItem(galleryMedia[galleryMedia.findIndex(m => m._id === selectedItem._id) + 1]); }} 
                className="absolute right-4 p-4 rounded-full bg-white/5 hover:bg-white/15 text-white transition-colors border border-white/10 z-20"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
