'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, FolderUp, Image as ImageIcon, Video, Calendar, User, Phone, Mail, MapPin, Settings, Sliders, Camera, Trash2, Loader2, Check, Copy, Eye, EyeOff, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../../../../components/CustomDatePicker';

export default function EventUploadPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGalleryLink, setShowGalleryLink] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && event?.code) {
      setGalleryUrl(`${window.location.origin}/e/${event.code}`);
    }
  }, [event?.code]);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFilesList, setUploadFilesList] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState<string>('PHOTO');
  const [uploadCompress, setUploadCompress] = useState(true);
  const [uploadQuality, setUploadQuality] = useState(80);

  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showPassword, setShowPassword] = useState(false);

  const fetchEventDetails = async () => {
    try {
      const res = await apiClient.get(`/event/code/${eventId}`);
      if (res.data && res.data.event) {
        setEvent(res.data.event);
        try {
           const mediaRes = await apiClient.get(`/media/event/${res.data.event._id}`);
           if (mediaRes.data && mediaRes.data.media) setMediaItems(mediaRes.data.media);
        } catch (me) {
           console.error("Failed to fetch media", me);
        }
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadFilesList(Array.from(files));
    setUploadType(type);
    setIsUploadModalOpen(true);
    if (e.target) e.target.value = '';
  };

  const handleFileUpload = async (filesToUpload: File[], type: string, compress: boolean, quality: number) => {
    if (!filesToUpload || filesToUpload.length === 0 || !event) return;
    
    setUploadingMedia(true);
    setUploadProgress({ current: 0, total: filesToUpload.length });
    
    try {
      const CONCURRENCY_LIMIT = 2;
      let uploadedCount = 0;
      let successful = 0;
      let failed = 0;
      
      const imageCompression = (await import('browser-image-compression')).default;

      // Function to process and upload a single file
      const uploadSingleFile = async (file: File) => {
        let fileToUpload: File | Blob = file;
        
        if (file.type.startsWith('image/') && compress) {
          try {
            const options = {
              maxSizeMB: (quality / 100) * 3,
              maxWidthOrHeight: 2500,
              useWebWorker: true,
              alwaysKeepResolution: true
            };
            const compressedBlob = await imageCompression(file, options);
            fileToUpload = new File([compressedBlob], file.name, { type: compressedBlob.type });
          } catch (err) {
            console.error('Compression skipped:', err);
          }
        }

        const formData = new FormData();
        formData.append('files', fileToUpload);
        formData.append('folderPaths', file.webkitRelativePath || '');

        try {
          await apiClient.post(`/media/event/${event._id}/upload?compress=${compress}&quality=${quality}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          successful++;
        } catch (err) {
          failed++;
        }
        
        uploadedCount++;
        setUploadProgress({ current: uploadedCount, total: filesToUpload.length });
      };

      // Run parallel workers to process the queue
      const queue = [...filesToUpload];
      const workers = [];
      
      const worker = async () => {
        while (queue.length > 0) {
          const file = queue.shift();
          if (file) {
            await uploadSingleFile(file);
          }
        }
      };

      // Start concurrent worker threads
      for (let w = 0; w < Math.min(CONCURRENCY_LIMIT, filesToUpload.length); w++) {
        workers.push(worker());
      }
      
      await Promise.all(workers);
      
      if (failed > 0) {
        toast.error(`Uploaded ${successful}, failed ${failed}`);
      } else {
        toast.success(`Successfully uploaded ${filesToUpload.length} files!`);
      }
      fetchEventDetails();
    } catch (err: any) {
       console.error('Upload error:', err);
       if (err.response?.status === 413) {
         toast.error('Files too large. Please select fewer files.');
       } else {
         toast.error(err?.response?.data?.error || 'Upload failed. Please check console for details.');
       }
    } finally {
       setUploadingMedia(false);
    }
  };

  // Prevent leaving the page during upload or delete
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadingMedia || deletingMedia) {
        e.preventDefault();
        e.returnValue = 'Upload or deletion is in progress. Leaving this page will cancel the process. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadingMedia, deletingMedia]);

  // Auto-refresh if any media is PENDING
  useEffect(() => {
    const hasPending = (mediaItems || []).filter(Boolean).some(item => item.processedStatus === 'PENDING' || item.processedStatus === 'PROCESSING');
    if (!hasPending || !event?._id) return;

    const interval = setInterval(() => {
      apiClient.get(`/media/event/${event._id}`).then(res => {
        if (res.data && res.data.media) {
          setMediaItems(res.data.media || []);
        }
      }).catch(err => console.error('Polling error', err));
    }, 3000);

    return () => clearInterval(interval);
  }, [mediaItems, event?._id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedIndex = (mediaItems || []).filter(Boolean).findIndex(m => m?._id === selectedItem?._id);
      if (selectedIndex === -1) return;
      
      const activeMedia = (mediaItems || []).filter(Boolean);
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        setSelectedItem(activeMedia[selectedIndex - 1]);
      } else if (e.key === 'ArrowRight' && selectedIndex < activeMedia.length - 1) {
        setSelectedItem(activeMedia[selectedIndex + 1]);
      } else if (e.key === 'Escape') {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, mediaItems]);

  const getPreviewPosition = (pos: string) => {
    switch (pos) {
      case 'TOP_LEFT': return { top: '4%', left: '4%' };
      case 'TOP_RIGHT': return { top: '4%', right: '4%' };
      case 'BOTTOM_LEFT': return { bottom: '4%', left: '4%' };
      case 'BOTTOM_CENTER': return { bottom: '4%', left: '50%', transform: 'translateX(-50%)' };
      case 'BOTTOM_RIGHT': default: return { bottom: '4%', right: '4%' };
    }
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const handleWatermarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await apiClient.post('/dashboard/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data && res.data.url) {
        setFormData(prev => ({...prev, watermarkLogoUrl: res.data.url}));
        toast.success('Logo uploaded successfully');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientMobile: '',
    clientEmail: '',
    date: '',
    type: 'WEDDING',
    location: '',
    accessType: 'PUBLIC',
    password: '',
    customWatermark: false,
    addToPortfolio: false,
    coverImageUrl: '',
    watermarkType: 'LOGO',
    watermarkText: '',
    watermarkLogoUrl: '',
    watermarkTextColor: '#ffffff',
    watermarkPosition: 'BOTTOM_RIGHT',
    watermarkWidth: 20,
    watermarkOpacity: 50
  });

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  const handleBulkDelete = async () => {
    if (selectedMediaIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedMediaIds.length} selected files?`)) return;
    try {
      setDeletingMedia(true);
      await apiClient.delete(`/media/event/${event._id}/media`, {
        data: { mediaIds: selectedMediaIds }
      });
      setMediaItems((mediaItems || []).filter(item => item && !selectedMediaIds.includes(item._id)));
      setSelectedMediaIds([]);
      setSelectMode(false);
      toast.success('Selected files deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete selected files');
    } finally {
      setDeletingMedia(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await apiClient.delete(`/media/${mediaId}`);
      setMediaItems((mediaItems || []).filter(item => item && item._id !== mediaId));
      setSelectedItem(null);
      toast.success('Media file deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete media file');
    }
  };

  const EVENT_TYPES = [
    'WEDDING', 'PRE WEDDING', 'RECEPTION', 'BIRTHDAY', 'CORPORATE', 
    'SCHOOL', 'GARBA', 'CONCERT', 'RELIGIOUS', 'ENGAGEMENT', 
    'BABY SHOWER', 'PANCHMASI'
  ];

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        clientName: event.clientName || '',
        clientMobile: event.clientMobile || '',
        clientEmail: event.clientEmail || '',
        date: event.date && !isNaN(new Date(event.date).getTime()) ? new Date(event.date).toISOString().split('T')[0] : '',
        type: event.type || 'WEDDING',
        location: event.location || '',
        accessType: event.accessType || 'PUBLIC',
        password: event.passwordPin || (event as any).password || '',
        customWatermark: !!event.watermark?.isActive,
        addToPortfolio: !!event.addToPortfolio,
        coverImageUrl: event.coverImageUrl || '',
        watermarkType: event.watermark?.type || 'LOGO',
        watermarkText: event.watermark?.text || '',
        watermarkLogoUrl: event.watermark?.logoUrl || '',
        watermarkTextColor: event.watermark?.textColor || '#ffffff',
        watermarkPosition: event.watermark?.position || 'BOTTOM_RIGHT',
        watermarkWidth: event.watermark?.width || 20,
        watermarkOpacity: (event.watermark?.opacity !== undefined ? event.watermark.opacity * 100 : 50)
      });
    }
  }, [event]);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex-1 bg-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 bg-white p-8">
        <h1 className="text-2xl font-bold text-slate-900">Event not found</h1>
        <Link href="/dashboard/events" className="inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer mt-4">
          <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
          <span>Back to Events</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 font-poppins">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/events" className="inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer">
              <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
              <span>Back to Events</span>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 ml-4 border-l-2 border-slate-200 pl-4">{event.name}</h1>
          </div>

          <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <Upload className="h-10 w-10 text-[#c5a880] mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Media</h2>
              <p className="text-sm text-slate-500">Select a category below or drag and drop files.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              <input type="file" {...{ webkitdirectory: "true", directory: "true" }} multiple ref={folderInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'FOLDER')} />
              <input type="file" accept="image/*" multiple ref={photoInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'PHOTO')} />
              <input type="file" accept="video/*" multiple ref={videoInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'VIDEO')} />

              <div 
                onClick={() => folderInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <FolderUp className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-600 text-sm">Entire Folder</span>
              </div>
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <ImageIcon className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-600 text-sm">Photos</span>
              </div>
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a880] hover:shadow-md transition-all group"
              >
                <Video className="h-8 w-8 text-slate-400 group-hover:text-[#c5a880] mb-3 transition-colors" />
                <span className="font-bold text-slate-600 text-sm">Videos</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-slate-900">Media Files ({mediaItems.length})</h3>
               <div className="flex items-center gap-3">
                 {selectMode ? (
                   <>
                     <span className="text-xs text-slate-500 font-bold">Selected: {selectedMediaIds.length}</span>
                     <button
                       onClick={() => {
                         if (selectedMediaIds.length === mediaItems.length) {
                           setSelectedMediaIds([]);
                         } else {
                           setSelectedMediaIds(mediaItems.map(item => item._id));
                         }
                       }}
                       className="text-xs font-bold text-[#c5a880] bg-[#c5a880]/10 hover:bg-[#c5a880]/20 border border-[#c5a880]/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                     >
                       {selectedMediaIds.length === mediaItems.length ? 'Deselect All' : 'Select All'}
                     </button>
                     <button
                       onClick={handleBulkDelete}
                       disabled={selectedMediaIds.length === 0}
                       className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                     >
                       <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                     </button>
                     <button
                       onClick={() => {
                         setSelectMode(false);
                         setSelectedMediaIds([]);
                       }}
                       className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                     >
                       Cancel
                     </button>
                   </>
                 ) : (
                   <>
                     <button
                       onClick={() => setSelectMode(true)}
                       className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                     >
                       Select Multiple
                     </button>
                     <button 
                       onClick={fetchEventDetails}
                       className="text-xs font-bold text-slate-500 hover:text-[#c5a880] transition-colors cursor-pointer"
                     >
                       Refresh
                     </button>
                   </>
                 )}
              </div>
            </div>
            
            {uploadingMedia && (
                <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
                   <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#c5a880] to-[#e5cda8] animate-pulse" />
                      
                      <div className="w-16 h-16 bg-[#c5a880]/10 border border-[#c5a880]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#c5a880]">
                         <Loader2 className="w-8 h-8 animate-spin" />
                      </div>

                      <h3 className="text-xl font-extrabold text-[#09090b] tracking-tight">Uploading Media Files</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-2 mb-6">
                         Please do not close this tab or navigate away.<br />
                         Leaving this page will cancel the upload process.
                      </p>

                      <div className="bg-[#f8f7f4] border border-slate-200 rounded-2xl p-4 mb-2">
                         <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-2">
                            <span>Uploading to secure cloud storage...</span>
                            <span className="text-[#c5a880]">{uploadProgress.current} / {uploadProgress.total}</span>
                         </div>
                         <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                               className="bg-[#c5a880] h-2 rounded-full transition-all duration-300" 
                               style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            />
                         </div>
                      </div>
                      
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                         Processing files...
                      </div>
                   </div>
                </div>
             )}

             {deletingMedia && (
                <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
                   <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-rose-400 animate-pulse" />
                      
                      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                         <Loader2 className="w-8 h-8 animate-spin" />
                      </div>

                      <h3 className="text-xl font-extrabold text-[#09090b] tracking-tight">Deleting Media Files</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-2 mb-6">
                         Please do not close this tab or navigate away.<br />
                         Leaving this page will cancel the deletion process.
                      </p>

                      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 mb-2">
                         <div className="flex justify-between text-xs font-extrabold text-red-700 mb-2">
                            <span>Deleting from secure cloud storage...</span>
                         </div>
                         <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-red-500 h-2 rounded-full w-full animate-pulse" />
                         </div>
                      </div>
                      
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                         Updating catalog...
                      </div>
                   </div>
                </div>
             )}

            {mediaItems.length === 0 ? (
               <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-12 flex items-center justify-center text-slate-500 text-sm">
                 No media files uploaded yet. Select files to start.
               </div>
            ) : (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4">
                 {mediaItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        if (selectMode) {
                          if (selectedMediaIds.includes(item._id)) {
                            setSelectedMediaIds(selectedMediaIds.filter(id => id !== item._id));
                          } else {
                            setSelectedMediaIds([...selectedMediaIds, item._id]);
                          }
                        } else {
                          setSelectedItem(item);
                        }
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 transition-all duration-300 group cursor-pointer ${
                        selectMode && selectedMediaIds.includes(item._id) 
                          ? 'border-red-500 scale-[0.97] shadow-md shadow-red-500/10' 
                          : 'border-slate-200 hover:border-[#c5a880]'
                      }`}
                    >
                       {/* Selection Checkbox */}
                       {selectMode && (
                         <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all bg-white/90 backdrop-blur-sm border-slate-300">
                           {selectedMediaIds.includes(item._id) && (
                             <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                           )}
                         </div>
                       )}
                       {item.type === 'VIDEO' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                             <Video className="h-8 w-8 text-white/50 mb-2" />
                             <span className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Video</span>
                          </div>
                       ) : (
                          <img src={item.compressedUrl || item.r2Url} className="w-full h-full object-cover" />
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <span className="text-[10px] font-black text-[#c5a880] px-2.5 py-1 bg-white rounded uppercase tracking-wider">
                            {selectMode ? (selectedMediaIds.includes(item._id) ? 'Deselect' : 'Select') : 'Click to view'}
                          </span>
                       </div>
                    </div>
                 ))}
               </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-[#f8f7f4] text-slate-900 border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
              <Settings className="h-5 w-5 text-[#c5a880]" />
              <h3 className="text-lg font-bold text-slate-900">Edit Event Details</h3>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              .edit-input {
                width: 100%;
                background: #ffffff;
                border: 1px solid #cbd5e1;
                color: #0f172a;
                padding: 10px 12px;
                border-radius: 8px;
                font-size: 13px;
                outline: none;
                transition: border-color 0.2s;
              }
              .edit-input:focus {
                border-color: #c5a880;
              }
              .edit-label {
                display: block;
                font-size: 10px;
                color: #475569;
                font-weight: 800;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .toggle-switch {
                position: relative;
                width: 36px;
                height: 20px;
                background-color: #cbd5e1;
                border-radius: 20px;
                cursor: pointer;
                transition: background-color 0.2s;
              }
              .toggle-switch[data-active="true"] {
                background-color: #c5a880;
              }
              .toggle-switch::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 16px;
                height: 16px;
                background-color: white;
                border-radius: 50%;
                transition: transform 0.2s;
              }
              .toggle-switch[data-active="true"]::after {
                transform: translateX(16px);
              }
              
              .custom-slider {
                -webkit-appearance: none;
                height: 6px;
                border-radius: 3px;
                background: linear-gradient(to right, #c5a880 var(--val, 50%), #475569 var(--val, 50%));
                outline: none;
              }
              .custom-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #c5a880;
                cursor: pointer;
              }
            `}} />

            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSaving(true);
                
                const payload = {
                  ...formData,
                  watermark: {
                    ...(event?.watermark || {}),
                    isActive: formData.customWatermark,
                    type: formData.watermarkType,
                    text: formData.watermarkText,
                    logoUrl: formData.watermarkLogoUrl,
                    textColor: formData.watermarkTextColor,
                    position: formData.watermarkPosition,
                    width: formData.watermarkWidth,
                    opacity: formData.watermarkOpacity / 100
                  }
                };

                const res = await apiClient.put(`/event/${eventId}`, payload);
                if (res.data.event) {
                  setEvent(res.data.event);
                  toast.success('Event updated successfully!');
                  setHasSavedDetails(true);
                }
              } catch (err) {
                toast.error('Error updating event');
              } finally {
                setSaving(false);
              }
            }}>
              <div>
                <label className="edit-label">Family / Couple Name</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="edit-label">Client Name</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="edit-label">Phone Number (Optional)</label>
                  <input 
                    type="text" 
                    className="edit-input" 
                    value={formData.clientMobile}
                    onChange={e => setFormData({...formData, clientMobile: e.target.value})}
                  />
                </div>
                <div>
                  <label className="edit-label">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    className="edit-input" 
                    value={formData.clientEmail}
                    onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="edit-label">Event Date</label>
                  <CustomDatePicker
                    type="date"
                    className="edit-input"
                    value={formData.date}
                    onChange={val => setFormData({...formData, date: val})}
                  />
                </div>
                <div>
                  <label className="edit-label">Event Type</label>
                  <select 
                    className="edit-input" 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="edit-label">Event Location</label>
                <input 
                  type="text" 
                  className="edit-input" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <label className="edit-label">Cover Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-40 aspect-video rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {formData.coverImageUrl ? (
                      <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-slate-400" />
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-[#c5a880] animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.target.value = '';
                        setUploadingCover(true);
                        try {
                          const uploadData = new FormData();
                          uploadData.append('file', file);
                          const res = await apiClient.post('/media/upload-asset', uploadData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          if (res.data && res.data.url) {
                            setFormData(prev => ({ ...prev, coverImageUrl: res.data.url }));
                          }
                        } catch (err) {
                          console.error("Cover upload failed", err);
                          toast.error('Failed to upload cover');
                        } finally {
                          setUploadingCover(false);
                        }
                      }}
                    />
                    <div className="w-full bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg py-3 text-center hover:bg-slate-100 transition-colors cursor-pointer">
                      {uploadingCover ? 'Uploading...' : (formData.coverImageUrl ? 'Change Cover Image' : 'Choose File')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="edit-label">Access Type</label>
                <select 
                  className="edit-input"
                  value={formData.accessType}
                  onChange={e => setFormData({...formData, accessType: e.target.value})}
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="PASSWORD">PASSWORD PROTECTED</option>
                  <option value="OTP">OTP VERIFICATION</option>
                </select>
              </div>

              {formData.accessType === 'PASSWORD' && (
                <div>
                  <label className="edit-label text-[#c5a880] font-bold">Event Password / PIN</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="edit-input border-[#c5a880]/40 focus:border-[#c5a880] bg-[#f8f5f0] pr-10" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter event password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">
                    Type a new password above to change password
                  </p>
                </div>
              )}

              <div className="flex flex-col border-t border-b border-slate-200 py-4 my-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-bold">W</span>
                    <span className="text-xs font-bold text-slate-600 uppercase">Custom Event Watermark</span>
                  </div>
                  <div 
                    className="toggle-switch" 
                    data-active={formData.customWatermark}
                    onClick={() => setFormData({...formData, customWatermark: !formData.customWatermark})}
                  />
                </div>

                {formData.customWatermark && (
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="edit-label">Watermark Type</label>
                      <select 
                        className="edit-input font-bold tracking-wide"
                        value={formData.watermarkType}
                        onChange={e => setFormData({...formData, watermarkType: e.target.value as any})}
                      >
                        <option value="LOGO">LOGO WATERMARK</option>
                        <option value="TEXT">TEXT WATERMARK</option>
                      </select>
                    </div>

                    {formData.watermarkType === 'TEXT' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="edit-label">Watermark Text</label>
                          <input 
                            type="text" 
                            className="edit-input" 
                            value={formData.watermarkText}
                            onChange={e => setFormData({...formData, watermarkText: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="edit-label">Watermark Text Color</label>
                          <select 
                            className="edit-input"
                            value={formData.watermarkTextColor}
                            onChange={e => setFormData({...formData, watermarkTextColor: e.target.value})}
                          >
                            <option value="#ffffff">White</option>
                            <option value="#000000">Black</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="edit-label">Watermark Logo Image</label>
                        <div className="flex gap-4 items-center mt-1">
                          <div className="w-[60px] h-[60px] rounded border border-dashed border-slate-300 flex items-center justify-center shrink-0 bg-[#f8f7f4] text-slate-900">
                             {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-[#c5a880]" /> : (formData.watermarkLogoUrl ? <img src={formData.watermarkLogoUrl} className="max-w-[40px] max-h-[40px] object-contain" /> : <Camera className="h-5 w-5 text-slate-400" />)}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <label className="w-full text-center border border-slate-200 text-[#b69970] font-bold text-[13px] py-2 rounded-lg bg-white cursor-pointer hover:bg-[#f8f7f4] text-slate-900 transition-colors shadow-sm">
                               Choose File
                               <input type="file" accept="image/*" className="hidden" onChange={handleWatermarkLogoUpload} />
                            </label>
                            <p className="text-[10px] text-slate-600 font-bold mt-2">PNG with transparent background recommended.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-1">
                        <label className="edit-label">Watermark Position</label>
                        <select 
                          className="edit-input font-bold tracking-wide mt-1"
                          value={formData.watermarkPosition}
                          onChange={e => setFormData({...formData, watermarkPosition: e.target.value as any})}
                        >
                          <option value="BOTTOM_RIGHT">BOTTOM RIGHT</option>
                          <option value="BOTTOM_LEFT">BOTTOM LEFT</option>
                          <option value="TOP_RIGHT">TOP RIGHT</option>
                          <option value="TOP_LEFT">TOP LEFT</option>
                          <option value="BOTTOM_CENTER">BOTTOM CENTER</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex flex-col justify-center">
                        <label className="edit-label">Size ({formData.watermarkWidth}%)</label>
                        <input 
                          type="range" 
                          min="5" max="100" 
                          className="w-full custom-slider mt-2"
                          value={formData.watermarkWidth}
                          onChange={e => setFormData({...formData, watermarkWidth: Number(e.target.value)})}
                          style={{'--val': `${formData.watermarkWidth}%`} as any}
                        />
                      </div>
                      <div className="col-span-1 flex flex-col justify-center">
                        <label className="edit-label">Opacity ({formData.watermarkOpacity}%)</label>
                        <input 
                          type="range" 
                          min="10" max="100" 
                          className="w-full custom-slider mt-2"
                          value={formData.watermarkOpacity}
                          onChange={e => setFormData({...formData, watermarkOpacity: Number(e.target.value)})}
                          style={{'--val': `${formData.watermarkOpacity}%`} as any}
                        />
                      </div>
                    </div>

                    <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white">
                       <div className="bg-[#e8ebf0] text-[#64748b] text-[11px] font-bold px-4 py-2.5">
                          LIVE PREVIEW
                       </div>
                       <div className="relative w-full aspect-[3/2] bg-slate-200 flex items-center justify-center">
                          <img src="/wedding.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Preview Background" />
                          {formData.watermarkType === 'LOGO' && formData.watermarkLogoUrl && (
                             <img 
                               src={formData.watermarkLogoUrl} 
                               className="absolute pointer-events-none object-contain"
                               style={{
                                 opacity: formData.watermarkOpacity / 100,
                                 width: `${formData.watermarkWidth}%`,
                                 ...getPreviewPosition(formData.watermarkPosition)
                               }}
                             />
                          )}
                          {formData.watermarkType === 'TEXT' && formData.watermarkText && (
                             <div 
                               className="absolute pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-bold whitespace-nowrap"
                               style={{
                                 color: formData.watermarkTextColor,
                                 opacity: formData.watermarkOpacity / 100,
                                 fontSize: `${formData.watermarkWidth * 0.3}px`, 
                                 ...getPreviewPosition(formData.watermarkPosition)
                               }}
                             >
                               {formData.watermarkText}
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-bold">P</span>
                  <span className="text-xs font-bold text-slate-600 uppercase">Add to Portfolio</span>
                  {saving && <Loader2 className="h-3 w-3 animate-spin text-slate-400 ml-2" />}
                </div>
                <div 
                  className={`toggle-switch ${saving ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  data-active={formData.addToPortfolio}
                  onClick={async () => {
                    if (saving) return;
                    const newValue = !formData.addToPortfolio;
                    
                    setFormData({...formData, addToPortfolio: newValue});
                    setSaving(true);
                    
                    try {
                      await apiClient.patch(`/event/${eventId}/portfolio-status`, { 
                        addToPortfolio: newValue 
                      });
                      
                      if (event) {
                        setEvent({...event, addToPortfolio: newValue});
                      }
                    } catch (err) {
                      toast.error("Failed to save portfolio status.");
                      setFormData({...formData, addToPortfolio: !newValue});
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              </div>

              {event && mediaItems.length > 0 && hasSavedDetails && (
                <div className="pt-2 mb-4">
                  <div className="bg-[#f8f5f0] border border-[#e6d5c0] rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
                     <h4 className="text-sm font-extrabold text-slate-800 mb-1">Gallery is Ready</h4>
                     <p className="text-xs text-slate-500 mb-4">Share this link with your clients to view {mediaItems.length} media files.</p>
                     {!showGalleryLink ? (
                       <button
                         type="button"
                         onClick={() => setShowGalleryLink(true)}
                         className="w-full bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                       >
                         <span className="text-base leading-none">🔗</span> Generate Public Gallery Link
                       </button>
                     ) : (
                       <div className="w-full flex items-center bg-white border border-[#e6d5c0] rounded-xl overflow-hidden mt-2 shadow-sm">
                          <input 
                            type="text" 
                            readOnly 
                            value={galleryUrl} 
                            className="flex-1 bg-transparent text-[11px] sm:text-xs text-slate-700 font-semibold px-3 py-3 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(galleryUrl);
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            className="bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] px-4 py-3 text-xs font-bold transition-colors flex items-center gap-1.5 border-l border-[#e6d5c0]"
                          >
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {linkCopied ? 'Copied' : 'Copy'}
                          </button>
                       </div>
                     )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 flex justify-center items-center bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Event Details'}
                </button>
                <button 
                  type="button" 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this event permanently?')) {
                      try {
                        setSaving(true);
                        await apiClient.delete(`/event/${eventId}`);
                        router.push('/dashboard/events');
                      } catch (error) {
                        console.error('Error deleting event:', error);
                        toast.error('Error deleting event.');
                        setSaving(false);
                      }
                    }
                  }}
                  className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold px-4 py-3 rounded-xl text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Event
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Lightbox / Modal for preview & delete */}
      {selectedItem && (() => {
        const selectedIndex = mediaItems.findIndex(m => m._id === selectedItem._id);
        return (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-6">
            {/* Header */}
            <div className="flex justify-between items-center w-full z-10">
              <span className="text-white text-xs font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                {selectedItem.type || 'PHOTO'}
              </span>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Left navigation arrow */}
            {selectedIndex > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedItem(mediaItems[selectedIndex - 1]); }} 
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-20 cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Media Container */}
            <div className="flex-1 flex items-center justify-center max-h-[75vh] w-full my-4 relative">
              {selectedItem.type === 'VIDEO' ? (
                <video 
                  src={selectedItem.url || selectedItem.r2Url} 
                  controls 
                  autoPlay 
                  className="max-h-full max-w-full rounded-2xl shadow-2xl"
                />
              ) : (
                <img 
                  src={selectedItem.url || selectedItem.r2Url} 
                  alt="Zoom Preview" 
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/5 bg-slate-900"
                />
              )}
            </div>

            {/* Right navigation arrow */}
            {selectedIndex < mediaItems.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedItem(mediaItems[selectedIndex + 1]); }} 
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-20 cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Actions Footer */}
            <div className="flex justify-center items-center gap-4 w-full z-10 pb-4">
              <button 
                onClick={() => handleDeleteMedia(selectedItem._id)}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
              >
                <Trash2 className="h-4.5 w-4.5" />
                Delete File
              </button>
            </div>
          </div>
        );
      })()}
      {/* Upload settings modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090b]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 max-w-md w-full relative">
            <button 
              type="button"
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadFilesList([]);
              }}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all border border-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880] mb-4">
                <Sliders className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Upload Settings</h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                Configure quality options for {uploadFilesList.length} selected files.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Image Quality
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadCompress(false)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      !uploadCompress 
                        ? 'border-[#c5a880] bg-[#c5a880]/5 text-[#09090b] ring-2 ring-[#c5a880]/20' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">💎 Original Size</span>
                    <span className="text-[10px] text-slate-400 font-medium">No compression</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadCompress(true)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      uploadCompress 
                        ? 'border-[#c5a880] bg-[#c5a880]/5 text-[#09090b] ring-2 ring-[#c5a880]/20' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">⚡ Compress Image</span>
                    <span className="text-[10px] text-slate-400 font-medium">Reduce file size</span>
                  </button>
                </div>
              </div>

              {uploadCompress && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600">Compression Quality</span>
                    <span className="text-xs font-black text-[#c5a880] bg-white px-2 py-0.5 rounded-lg border border-slate-150">
                      {uploadQuality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={uploadQuality}
                    onChange={(e) => setUploadQuality(Number(e.target.value))}
                    className="w-full custom-slider mt-2"
                    style={{ '--val': `${uploadQuality}%` } as any}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                    <span>High Compression (Low Size)</span>
                    <span>High Quality (Large Size)</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadFilesList([]);
                  }}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    handleFileUpload(uploadFilesList, uploadType, uploadCompress, uploadQuality);
                  }}
                  className="flex-1 py-3 bg-[#c5a880] hover:bg-[#b59a72] text-[#09090b] font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Start Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
