'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Camera, Battery, Download, AlertCircle, Timer, RotateCcw, Images, Smartphone, Edit3, ChevronLeft, ChevronRight, Maximize2, Minimize2, Trash2, Video, StopCircle, CloudUpload, CheckCircle2, Circle, ExternalLink } from 'lucide-react';

// --- SOUND ENGINE (Unchanged) ---
const playSound = (type) => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const now = ctx.currentTime;

  if (type === 'shutter') {
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(800, now);
    snapOsc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    snapGain.gain.setValueAtTime(0, now);
    snapGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    snapOsc.start(now);
    snapOsc.stop(now + 0.15);
    
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(200, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    bodyGain.gain.setValueAtTime(0, now);
    bodyGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
    bodyGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.2);
    
    const motorOsc = ctx.createOscillator();
    const motorGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    motorOsc.type = 'sawtooth';
    motorOsc.frequency.setValueAtTime(60, now + 0.2);
    motorOsc.frequency.linearRampToValueAtTime(65, now + 1.2);
    filter.type = 'lowpass';
    filter.frequency.value = 400; 
    motorOsc.connect(filter);
    filter.connect(motorGain);
    motorGain.connect(ctx.destination);
    motorGain.gain.setValueAtTime(0, now + 0.2);
    motorGain.gain.linearRampToValueAtTime(0.08, now + 0.4);
    motorGain.gain.linearRampToValueAtTime(0, now + 1.2);
    motorOsc.start(now + 0.2);
    motorOsc.stop(now + 1.2);
  } else if (type === 'beep') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'focus') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'start_record') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
};

// --- CSS FILTER GENERATOR ---
const getFilterString = (config) => {
    if (!config) return 'none';
    const parts = [];
    if (config.contrast) parts.push(`contrast(${config.contrast})`);
    if (config.brightness) parts.push(`brightness(${config.brightness})`);
    if (config.saturate) parts.push(`saturate(${config.saturate})`);
    if (config.sepia) parts.push(`sepia(${config.sepia})`);
    if (config.grayscale) parts.push(`grayscale(${config.grayscale})`);
    if (config.hueRotate) parts.push(`hue-rotate(${config.hueRotate}deg)`);
    if (config.invert) parts.push(`invert(${config.invert})`);
    if (config.blur) parts.push(`blur(${config.blur}px)`);
    return parts.length > 0 ? parts.join(' ') : 'none';
};

// --- FILTER LIBRARY ---
const FILTER_TYPES = {
  // === CLASSIC (6) ===
  sepia: { name: '1980 Sepia', category: 'Classic', contrast: 1.1, brightness: 0.9, sepia: 0.9, overlayColor: 'rgba(140, 60, 10, 0.4)', overlayBlend: 'overlay' },
  neon: { name: '1990 Neon', category: 'Classic', saturate: 2.0, contrast: 1.1, brightness: 1.1, hueRotate: 10, overlayColor: 'rgba(220, 0, 255, 0.2)', overlayBlend: 'screen' },
  noir: { name: '1950 Noir', category: 'Classic', grayscale: 1, contrast: 1.5, brightness: 0.9, overlayColor: 'rgba(0, 0, 0, 0.3)', overlayBlend: 'multiply' },
  vintage: { name: 'Vintage', category: 'Classic', sepia: 0.5, contrast: 0.9, brightness: 1.1, saturate: 0.8, overlayColor: 'rgba(255, 230, 150, 0.2)', overlayBlend: 'multiply' },
  warm: { name: 'Warm', category: 'Classic', contrast: 1.1, saturate: 1.2, sepia: 0.2, overlayColor: 'rgba(255, 150, 0, 0.15)', overlayBlend: 'overlay' },
  cool: { name: 'Cool', category: 'Classic', contrast: 1.1, saturate: 0.9, hueRotate: 180, overlayColor: 'rgba(0, 50, 150, 0.1)', overlayBlend: 'overlay' },

  // === KODAK (5) ===
  portra400: { name: 'Portra 400', category: 'Kodak', contrast: 1.1, saturate: 1.2, hueRotate: -5, overlayColor: 'rgba(255, 220, 100, 0.15)', overlayBlend: 'overlay' },
  gold200: { name: 'Gold 200', category: 'Kodak', contrast: 1.1, saturate: 1.3, sepia: 0.2, overlayColor: 'rgba(255, 180, 0, 0.2)', overlayBlend: 'overlay' },
  ektar: { name: 'Ektar 100', category: 'Kodak', contrast: 1.3, saturate: 1.4, brightness: 0.9, overlayColor: 'rgba(0, 0, 50, 0.1)', overlayBlend: 'multiply' },
  trix: { name: 'Tri-X 400', category: 'Kodak', grayscale: 1, contrast: 1.4, brightness: 0.8, overlayColor: 'rgba(20, 20, 20, 0.2)', overlayBlend: 'multiply' },
  kodachrome: { name: 'Kodachrome', category: 'Kodak', contrast: 1.4, saturate: 1.2, brightness: 0.9, sepia: 0.2, overlayColor: 'rgba(200, 50, 0, 0.15)', overlayBlend: 'overlay' },

  // === FUJI (5) ===
  provia: { name: 'Fuji Provia', category: 'Fuji', contrast: 1.1, brightness: 1.05, saturate: 1.1, overlayColor: 'rgba(0, 50, 200, 0.1)', overlayBlend: 'overlay' },
  velvia: { name: 'Fuji Velvia', category: 'Fuji', contrast: 1.25, saturate: 1.5, hueRotate: -5, overlayColor: 'rgba(220, 0, 100, 0.15)', overlayBlend: 'overlay' },
  superia: { name: 'Superia', category: 'Fuji', contrast: 1.0, saturate: 1.1, hueRotate: 5, brightness: 0.95, overlayColor: 'rgba(0, 255, 100, 0.1)', overlayBlend: 'overlay' },
  acros: { name: 'Acros 100', category: 'Fuji', grayscale: 1, contrast: 1.3, brightness: 0.9, overlayColor: 'rgba(10, 10, 10, 0.1)', overlayBlend: 'multiply' },
  industrial: { name: 'Industrial', category: 'Fuji', contrast: 1.1, saturate: 0.9, brightness: 1.1, overlayColor: 'rgba(200, 220, 255, 0.2)', overlayBlend: 'screen' },

  // === CINEMATIC (5) ===
  cinestill: { name: 'CineStill', category: 'Cinema', contrast: 1.1, saturate: 1.1, hueRotate: -10, overlayColor: 'rgba(0, 100, 255, 0.2)', overlayBlend: 'screen' },
  tealorange: { name: 'Teal/Orange', category: 'Cinema', contrast: 1.2, saturate: 1.3, overlayColor: 'rgba(0, 255, 255, 0.15)', overlayBlend: 'overlay' },
  matrix: { name: 'Matrix', category: 'Cinema', contrast: 1.3, saturate: 0.8, brightness: 0.9, overlayColor: 'rgba(0, 255, 50, 0.15)', overlayBlend: 'multiply' },
  sincity: { name: 'Sin City', category: 'Cinema', grayscale: 1, contrast: 2.0, brightness: 0.8, overlayColor: 'rgba(255, 255, 255, 0.1)', overlayBlend: 'overlay' },
  wes: { name: 'Grand Hotel', category: 'Cinema', contrast: 1.0, saturate: 1.4, sepia: 0.4, brightness: 1.1, overlayColor: 'rgba(255, 150, 150, 0.2)', overlayBlend: 'overlay' },

  // === TECH & FX (9) ===
  polaroid: { name: 'Polaroid', category: 'FX', contrast: 0.9, saturate: 1.1, sepia: 0.1, overlayColor: 'rgba(100, 100, 200, 0.15)', overlayBlend: 'darken' },
  glitch: { name: 'Glitch', category: 'FX', contrast: 1.2, saturate: 1.5, glitch: true },
  thermal: { name: 'Predator', category: 'FX', invert: 1, contrast: 1.5, saturate: 2.0, overlayColor: 'rgba(255, 0, 0, 0.3)', overlayBlend: 'screen' },
  nightvision: { name: 'Night Vis', category: 'FX', grayscale: 1, contrast: 1.5, brightness: 1.2, overlayColor: 'rgba(0, 255, 50, 0.5)', overlayBlend: 'multiply' },
  vhs: { name: 'VHS Tape', category: 'FX', contrast: 1.1, saturate: 0.8, blur: 0.5, overlayColor: 'rgba(0, 0, 255, 0.1)', overlayBlend: 'screen' },
  lomo: { name: 'Lomo', category: 'FX', contrast: 1.4, saturate: 1.6, brightness: 0.8, overlayColor: 'rgba(0, 0, 0, 0.4)', overlayBlend: 'multiply' },
  redscale: { name: 'Redscale', category: 'FX', contrast: 1.2, saturate: 1.2, sepia: 0.8, hueRotate: -30, overlayColor: 'rgba(255, 50, 0, 0.3)', overlayBlend: 'overlay' },
  cyber: { name: 'Cyberpunk', category: 'FX', contrast: 1.2, saturate: 1.5, hueRotate: 20, overlayColor: 'rgba(255, 0, 255, 0.15)', overlayBlend: 'screen' },
  negative: { name: 'Negative', category: 'FX', invert: 1, contrast: 1.2 },
};

const RetroCamera = ({ eventId = null }) => {
  // --- STATE ---
  const [filterMode, setFilterMode] = useState('sepia');
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set()); // NEW: Track selections
  const [shutterCount, setShutterCount] = useState(0);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Features
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'gallery'
  const [driveLink, setDriveLink] = useState(null);
  const [eventName, setEventName] = useState("");
  const [mode, setMode] = useState('photo'); 
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [timerDuration, setTimerDuration] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isBoothMode, setIsBoothMode] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef(null);
  const recordingCanvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const requestRef = useRef(null);
  const recordingStartTimeRef = useRef(0);
  const scrollContainerRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // --- INITIALIZATION ---
  const categories = useMemo(() => ['All', ...new Set(Object.values(FILTER_TYPES).map(f => f.category))], []);
  const filterKeys = useMemo(() => Object.keys(FILTER_TYPES), []);
  
  const visibleFilters = useMemo(() => {
    return Object.entries(FILTER_TYPES).filter(([key, config]) => {
        if (selectedCategory === 'All') return true;
        return config.category === selectedCategory;
    });
  }, [selectedCategory]);

  // --- FETCH LINK ON LOAD ---
  useEffect(() => {
      if (eventId) {
          console.log("Fetching data for event:", eventId); // Debug Log
          fetch(`/api/event/${eventId}`)
            .then(res => res.json())
            .then(data => {
                console.log("🔥 API RESPONSE:", data); // <--- Add this log
                if (data.success) {
                    setDriveLink(data.driveLink);
                    setEventName(data.eventName);
                }
            })
            .catch(err => console.error("Fetch error:", err));
      }
  }, [eventId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startCamera = async () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: facingMode },
          audio: mode === 'video'
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.error("Camera error:", err);
        setError("Camera access denied.");
      }
    };
    startCamera();
  }, [facingMode, mode]);

  // --- INTERACTION ---
  const cycleFilter = useCallback((direction) => {
    setFilterMode(prev => {
      const curr = filterKeys.indexOf(prev);
      const next = direction === 'next' ? (curr + 1) % filterKeys.length : (curr - 1 + filterKeys.length) % filterKeys.length;
      if (navigator.vibrate) navigator.vibrate(10);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = next * 88 - 100;
      return filterKeys[next];
    });
  }, [filterKeys]);

  useEffect(() => {
    const handleKey = (e) => {
        if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') { 
            e.preventDefault(); 
            if (mode === 'photo') handleShootClick();
            else handleRecordToggle();
        }
        if (e.code === 'ArrowRight') cycleFilter('next');
        if (e.code === 'ArrowLeft') cycleFilter('prev');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cycleFilter, mode, isRecording]);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(console.log); setIsFullscreen(true); }
      else { if(document.exitFullscreen) document.exitFullscreen(); setIsFullscreen(false); }
  };

  const handleFocus = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setFocusPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
      playSound('focus');
      setTimeout(() => setFocusPoint(null), 1000);
  };

  useEffect(() => {
    let lastTime = Date.now();
    const handleMove = (e) => {
      if (Date.now() - lastTime > 50) {
        const d = Math.sqrt(Math.pow(e.clientX - lastMousePos.current.x, 2) + Math.pow(e.clientY - lastMousePos.current.y, 2));
        setShakeIntensity(p => p * 0.9 + Math.min(d / 150, 1) * 0.1);
        lastMousePos.current = { x: e.clientX, y: e.clientY }; lastTime = Date.now();
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // --- DRAWING ---
  const drawFrame = (video, canvas, ctx, filterKey) => {
    const config = FILTER_TYPES[filterKey] || FILTER_TYPES.sepia;
    const { width, height } = canvas;
    ctx.filter = getFilterString(config);
    if (facingMode === 'user') { ctx.translate(width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none'; 
    if (config.grayscale === 1) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, width, height); ctx.restore(); }
    if (config.invert === 1) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height); ctx.restore(); }
    if (config.glitch) { 
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        if (facingMode === 'user') { ctx.translate(width, 0); ctx.scale(-1, 1); } ctx.drawImage(video, 5, 0, width, height); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; if (facingMode === 'user') { ctx.translate(width, 0); ctx.scale(-1, 1); } ctx.drawImage(video, -5, 0, width, height); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.restore();
    }
    if (config.overlayColor) { ctx.save(); ctx.globalCompositeOperation = config.overlayBlend; ctx.fillStyle = config.overlayColor; ctx.fillRect(0, 0, width, height); ctx.restore(); }
    // Scanlines
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = 'rgba(0,0,0,0.2)'; for(let i=0; i<height; i+=4) ctx.fillRect(0, i, width, 2); ctx.restore();
    // Vignette
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; const grad = ctx.createRadialGradient(width/2, height/2, height/3, width/2, height/2, height); grad.addColorStop(0, 'transparent'); grad.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height); ctx.restore();
  };

  const getShotCanvas = (video, filterKey) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    drawFrame(video, canvas, ctx, filterKey);
    return canvas;
  };

  const triggerShutter = async () => {
    if (!videoRef.current) return;
    playSound('shutter');
    if (navigator.vibrate) navigator.vibrate(200);
    setIsFlashing(true); setTimeout(() => setIsFlashing(false), 150);
    
    const shots = [];
    const count = isBoothMode ? 3 : 1;
    
    for (let i = 0; i < count; i++) {
        const shotCanvas = getShotCanvas(videoRef.current, filterMode);
        shots.push(shotCanvas);
        if (i < count - 1) {
            await new Promise(r => setTimeout(r, 800));
            playSound('shutter'); setIsFlashing(true); setTimeout(() => setIsFlashing(false), 100);
        }
    }

    let finalUrl;
    let isStrip = false;

    if (isBoothMode) {
        const stripCanvas = document.createElement('canvas');
        const gap = 20; 
        const border = 40;
        const w = shots[0].width; 
        const h = shots[0].height;
        stripCanvas.width = w + (border * 2);
        stripCanvas.height = (h * 3) + (gap * 2) + (border * 2);
        const ctx = stripCanvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
        shots.forEach((shot, idx) => {
            ctx.drawImage(shot, border, border + (idx * (h + gap)));
        });
        finalUrl = stripCanvas.toDataURL('image/jpeg', 0.95);
        isStrip = true;
    } else {
        finalUrl = shots[0].toDataURL('image/jpeg', 0.95);
    }

    setPhotos(p => [{
        id: Date.now(), filter: filterMode, imageUrl: finalUrl, type: 'photo',
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        caption: FILTER_TYPES[filterMode]?.name || 'Memories', isStrip
    }, ...p]);
    setShutterCount(c => c + 1);
  };

  const handleShootClick = useCallback(() => {
      if (countdown !== null) return;
      if (timerDuration > 0) {
          let c = timerDuration; setCountdown(c); playSound('beep');
          const i = setInterval(() => { c--; if (c>0) { setCountdown(c); playSound('beep'); } else { clearInterval(i); setCountdown(null); triggerShutter(); } }, 1000);
      } else triggerShutter();
  }, [countdown, timerDuration, filterMode, isBoothMode, facingMode]);

  // --- VIDEO RECORDING LOGIC ---
  const handleRecordToggle = () => { if (isRecording) stopRecording(); else startRecording(); };

  const startRecording = () => {
      if (!videoRef.current || !stream) return;
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const baseW = 800; const border = 60; const bottom = 200;
      const vidAspect = video.videoWidth / video.videoHeight;
      const vidW = baseW - (border * 2); const vidH = vidW / vidAspect;
      canvas.width = baseW; canvas.height = vidH + border + bottom;
      recordingCanvasRef.current = canvas;
      const ctx = canvas.getContext('2d');
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth; tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true); playSound('start_record');
      
      const render = () => {
          drawFrame(video, tempCanvas, tempCtx, filterMode);
          ctx.fillStyle = '#f8f8f8'; ctx.fillRect(0, 0, canvas.width, canvas.height); 
          ctx.fillStyle = '#101010'; ctx.fillRect(border, border, vidW, vidH); 
          ctx.drawImage(tempCanvas, border, border, vidW, vidH); 
          const time = (Date.now() - recordingStartTimeRef.current) / 1000;
          const mins = Math.floor(time / 60).toString().padStart(2,'0'); const secs = Math.floor(time % 60).toString().padStart(2,'0');
          ctx.textBaseline = 'top'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillText("REC", border, vidH + border + 20);
          if (Math.floor(time * 2) % 2 === 0) { ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(border + 50, vidH + border + 28, 6, 0, Math.PI*2); ctx.fill(); }
          ctx.textAlign = 'right'; ctx.font = 'bold 24px monospace'; ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.fillText(`${mins}:${secs}`, baseW - border, vidH + border + 20);
          ctx.textAlign = 'left'; ctx.font = 'italic 40px serif'; ctx.fillStyle = 'rgba(10, 20, 80, 0.85)'; ctx.fillText(FILTER_TYPES[filterMode]?.name || 'Live Video', border, vidH + border + 80);
          requestRef.current = requestAnimationFrame(render); setRecordingTime(time);
      };
      requestRef.current = requestAnimationFrame(render);
      const canvasStream = canvas.captureStream(30);
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) canvasStream.addTrack(audioTracks[0]);
      let mimeType = 'video/webm;codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/mp4')) { mimeType = 'video/mp4'; } else if (MediaRecorder.isTypeSupported('video/webm')) { mimeType = 'video/webm'; }
      const recorder = new MediaRecorder(canvasStream, { mimeType });
      mediaRecorderRef.current = recorder; recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setPhotos(p => [{ id: Date.now(), filter: filterMode, imageUrl: url, type: 'video', timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), caption: 'Moving Picture', mimeType: mimeType }, ...p]);
      };
      recorder.start();
  };

  const stopRecording = () => {
      setIsRecording(false); cancelAnimationFrame(requestRef.current);
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop(); playSound('shutter');
  };

  // --- HELPER: BAKE POLAROID FRAME ---
  const bakePolaroid = async (photoItem) => {
      return new Promise((resolve) => {
          const cvs = document.createElement('canvas');
          const ctx = cvs.getContext('2d');
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
              const baseW = 1000, bor = 80, bot = 280;
              const rat = img.width / img.height;
              const pW = baseW - bor * 2;
              const pH = pW / rat;
              cvs.width = baseW; 
              cvs.height = pH + bor + bot;

              // Draw Paper
              ctx.fillStyle = '#f8f8f8'; 
              ctx.fillRect(0, 0, cvs.width, cvs.height);
              
              // Draw Inner Frame
              ctx.fillStyle = '#101010'; 
              ctx.fillRect(bor, bor, pW, pH);
              
              // Draw Photo
              ctx.drawImage(img, bor, bor, pW, pH);
              
              // Draw Text
              ctx.textBaseline = 'top';
              ctx.font = 'bold 24px sans-serif'; 
              ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
              ctx.fillText("FUJIFILM INSTAX", bor, pH + bor + 20);
              
              ctx.font = 'italic 50px serif'; 
              ctx.fillStyle = 'rgba(10,20,80,0.85)'; 
              ctx.fillText(photoItem.caption, bor, pH + bor + 80);
              
              ctx.textAlign = 'right'; 
              ctx.font = 'bold 30px monospace'; 
              ctx.fillStyle = 'rgba(0,0,0,0.3)'; 
              ctx.fillText(photoItem.timestamp, baseW - bor, pH + bor + 150);

              cvs.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
          };
          img.src = photoItem.imageUrl;
      });
  };

  // --- NEW: BATCH SELECTION & ACTION ---
  const toggleSelection = (id) => {
    const newSet = new Set(selectedPhotos);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPhotos(newSet);
  };

  const handleBatchDelete = () => {
    setPhotos(prev => prev.filter(p => !selectedPhotos.has(p.id)));
    setSelectedPhotos(new Set());
  };

  const handleBatchUpload = async () => {
    if (!eventId || selectedPhotos.size === 0) return;
    setIsUploading(true);

    const photosToUpload = photos.filter(p => selectedPhotos.has(p.id));
    let successCount = 0;

    await Promise.all(photosToUpload.map(async (item) => {
        try {
            // CRITICAL: Bake Polaroid before uploading
            const polaroidBlob = await bakePolaroid(item);
            
            const formData = new FormData();
            formData.append('file', polaroidBlob);
            formData.append('eventId', eventId);
            formData.append('caption', item.caption);

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (res.ok) successCount++;
        } catch (e) { console.error(e); }
    }));

    setIsUploading(false);
    alert(`Successfully uploaded ${successCount} Polaroids to Host!`);
    setSelectedPhotos(new Set());
  };

  const saveToDevice = async (e, item) => {
    e.stopPropagation();
    
    if (item.type === 'video') {
        const ext = item.mimeType === 'video/mp4' ? 'mp4' : 'webm';
        const a = document.createElement('a');
        a.href = item.imageUrl;
        a.download = `retro-motion-${item.id}.${ext}`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        return;
    }

    // Bake single photo
    const blob = await bakePolaroid(item);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retro-${item.id}.jpg`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
  };

  const updateCaption = (id, txt) => setPhotos(p => p.map(x => x.id === id ? { ...x, caption: txt } : x));
  const scrollFilters = (dir) => scrollContainerRef.current?.scrollBy({ left: dir==='left'?-200:200, behavior:'smooth' });

  // Mode Toggle UI
  const formatTime = (s) => {
      const m = Math.floor(s/60).toString().padStart(2,'0');
      const sc = Math.floor(s%60).toString().padStart(2,'0');
      return `${m}:${sc}`;
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-900 flex flex-col items-center py-4 px-2 font-mono select-none overflow-x-hidden">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes develop { 0% { filter: brightness(0) blur(5px) grayscale(1); opacity: 0.1; } 40% { filter: brightness(0.4) blur(2px) grayscale(0.5); opacity: 0.6; } 100% { filter: brightness(1) blur(0) grayscale(0); opacity: 1; } }
        .developing-image { animation: develop ${Math.max(0.5, 4 - (shakeIntensity * 3))}s ease-in-out forwards; }
        @keyframes bounce-in { 0% { transform: translate(-50%, 100%); } 100% { transform: translate(-50%, 0); } }
        .animate-bounce-in { animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        /* Safe area for iPhone home bar */
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>

      {/* --- HEADER --- */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-4 px-2 z-20">
         <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter italic">RETRO<span className="text-red-500">CAM</span></h1>
         <div className="flex gap-2 text-[10px] md:text-xs font-bold text-neutral-500">
             {eventId && <span className="bg-red-600 text-white px-2 py-1 rounded animate-pulse shadow-red-900/50 shadow-lg">LIVE EVENT</span>}
             <button onClick={toggleFullscreen} className="hover:text-white transition-colors flex items-center gap-1 hidden md:flex"><Maximize2 size={14} /> FULLSCREEN</button>
         </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 w-full max-w-7xl pb-24 md:pb-0">
        
        {/* --- CAMERA BODY (Hidden on mobile if tab is 'gallery') --- */}
        <div className={`${activeTab === 'camera' ? 'flex' : 'hidden md:flex'} relative w-full max-w-[500px] bg-[#1e1e1e] rounded-[2rem] md:rounded-[3rem] shadow-2xl border-t border-white/10 p-4 md:p-8 flex-col gap-4 md:gap-6 z-10 shrink-0`}>
          <div className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
          
          {/* Top Info Bar */}
          <div className="flex justify-between items-center text-neutral-400 px-2">
            <div className="flex items-center gap-2 text-neutral-300"><Camera size={18} /><span className="text-xs tracking-[0.2em] font-black">POLAROID-3000</span></div>
            <div className="flex items-center gap-3"><div className={`flex items-center gap-2 px-2 py-1 rounded-full bg-black/40 border border-white/5`}><div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`}></div><span className="text-[9px] font-bold text-neutral-400">{isRecording ? 'REC' : 'ON'}</span></div><Battery size={18} className="text-green-500" /></div>
          </div>

          {/* Viewfinder */}
          <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border-4 md:border-[8px] border-[#151515] shadow-inner group cursor-crosshair active:scale-[0.99] transition-transform" onClick={handleFocus}>
            {error ? <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-3 text-center p-4"><AlertCircle size={32} className="text-red-500" /><p className="text-xs">{error}</p></div> : 
              <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
                 <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                 style={{ filter: getFilterString(FILTER_TYPES[filterMode]) }} />
                 {FILTER_TYPES[filterMode]?.glitch && <div className="absolute inset-0 opacity-50 pointer-events-none mix-blend-screen bg-fuchsia-500/10 translate-x-[-2px]"></div>}
                 {FILTER_TYPES[filterMode]?.invert && <div className="absolute inset-0 bg-white mix-blend-difference pointer-events-none"></div>}
              </div>
            }
            
            <div className="absolute inset-0 pointer-events-none transition-colors duration-300" style={{ backgroundColor: FILTER_TYPES[filterMode]?.overlayColor || 'transparent', mixBlendMode: FILTER_TYPES[filterMode]?.overlayBlend || 'normal' }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none z-10"></div>
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-100"></div>

            {focusPoint && <div className="absolute w-12 h-12 border border-white rounded pointer-events-none z-50 animate-focus shadow-[0_0_10px_rgba(0,255,0,0.5)]" style={{ left: focusPoint.x - 24, top: focusPoint.y - 24 }} />}
            {countdown !== null && <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"><span className="text-8xl font-black text-white animate-bounce">{countdown}</span></div>}
            <div className={`absolute inset-0 bg-white z-[60] transition-opacity duration-75 ${isFlashing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
            
            <div className="absolute inset-0 p-4 z-20 flex flex-col justify-between opacity-70 pointer-events-none">
              <div className="flex justify-between text-[10px] font-bold text-white/80 font-mono">
                  <span>{isRecording ? formatTime(recordingTime) : `${timerDuration}s TIMER`}</span>
                  <span>{mode === 'video' ? 'VIDEO' : (isBoothMode ? 'BOOTH' : 'SINGLE')}</span>
              </div>
              <div className="flex justify-between items-end text-[10px] font-bold text-white/80 uppercase"><span className="bg-black/40 px-2 py-1 rounded backdrop-blur-md">{FILTER_TYPES[filterMode]?.name}</span><span className="text-lg text-yellow-500 font-digital tracking-widest">{shutterCount.toString().padStart(3, '0')}</span></div>
            </div>
          </div>

          {/* Controls Area */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 shadow-inner border-b border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
                    <button onClick={() => setMode('photo')} className={`p-2 rounded-md transition-all ${mode==='photo'?'bg-white/20 text-white shadow-sm':'text-neutral-500'}`}><Camera size={14} /></button>
                    <button onClick={() => setMode('video')} className={`p-2 rounded-md transition-all ${mode==='video'?'bg-white/20 text-white shadow-sm':'text-neutral-500'}`}><Video size={14} /></button>
                </div>
                <div className="flex gap-2">
                    {mode === 'photo' && (
                        <button onClick={() => setTimerDuration(p => p===0?3:p===3?10:0)} className={`p-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${timerDuration>0?'bg-yellow-500/20 text-yellow-500':'text-neutral-500 hover:text-white'}`}><Timer size={14} />{timerDuration>0 && `${timerDuration}s`}</button>
                    )}
                    <button onClick={() => setFacingMode(p => p==='user'?'environment':'user')} className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10"><RotateCcw size={14} /></button>
                </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide text-[10px] font-bold">
                {categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-full border transition-all whitespace-nowrap ${selectedCategory===cat?'bg-neutral-200 text-black border-neutral-200':'bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500'}`}>{cat}</button>))}
            </div>

            <div className="relative group">
                <button onClick={() => scrollFilters('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 p-2 rounded-r-xl text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16} /></button>
                <div ref={scrollContainerRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x px-1">
                {visibleFilters.map(([key, config]) => (
                    <button key={key} onClick={() => setFilterMode(key)} className={`flex-shrink-0 p-2 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95 snap-start min-w-[4.5rem] border relative overflow-hidden ${filterMode===key?'bg-[#252525] text-white border-white/20 shadow-lg ring-1 ring-white/10':'bg-[#222] text-neutral-600 border-transparent'}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center shadow-inner"><span className="text-[8px] font-black opacity-30">{key.slice(0, 2).toUpperCase()}</span></div>
                    <span className="text-[8px] font-bold whitespace-nowrap z-10 relative">{config.name}</span>
                    {filterMode === key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"></div>}
                    </button>
                ))}
                </div>
                <button onClick={() => scrollFilters('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 p-2 rounded-l-xl text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={16} /></button>
            </div>

            <div className="flex justify-between items-center px-2 pt-1">
               <div className="w-12"></div>
              <button onClick={mode === 'photo' ? handleShootClick : handleRecordToggle} disabled={!!error || !stream || countdown !== null} className={`relative group touch-manipulation ${error||!stream?'opacity-50 cursor-not-allowed':'cursor-pointer'}`}>
                <div className={`relative w-20 h-20 ${isRecording ? 'bg-white' : 'bg-gradient-to-b from-red-500 to-red-700'} rounded-full border-[6px] border-[#151515] shadow-2xl active:scale-95 transition-all duration-100 flex items-center justify-center ring-4 ring-[#222]`}>
                    {isRecording ? <div className="w-6 h-6 bg-red-600 rounded-sm"></div> : <div className="w-16 h-16 rounded-full border border-white/20 bg-gradient-to-br from-white/20 to-transparent"></div>}
                </div>
              </button>
              <div className="w-12 flex justify-end"><div className="grid grid-cols-3 gap-0.5 opacity-20">{[...Array(9)].map((_,i)=><div key={i} className="w-1 h-1 rounded-full bg-white"></div>)}</div></div>
            </div>
          </div>
        </div>

        {/* --- DARKROOM GALLERY (Hidden on mobile if tab is 'camera') --- */}
        <div className={`${activeTab === 'gallery' ? 'block' : 'hidden md:block'} w-full md:w-[500px] shrink-0 min-h-[500px] px-2`}>
           
           {/* Drive Link Box */}
           {driveLink && (
               <div className="mb-6 p-4 bg-[#1a1a1a] rounded-2xl border border-white/10 flex flex-col gap-2 shadow-lg">
                   <div className="flex justify-between items-start">
                       <div>
                           <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Shared Album</p>
                           <h3 className="text-white font-bold leading-tight">{eventName || "Party Photos"}</h3>
                       </div>
                       <a href={driveLink} target="_blank" rel="noreferrer" className="bg-blue-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-blue-500 flex items-center gap-1 shadow-lg shadow-blue-900/20">
                           VIEW <ExternalLink size={12} />
                       </a>
                   </div>
               </div>
           )}

           <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
              <div><div className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Darkroom</div><h2 className="text-xl font-bold text-white">Recent Prints</h2></div>
              <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-1 rounded">{photos.length} ITEMS</span>
           </div>
           
           <div className="grid grid-cols-2 gap-3 pb-32">
            {photos.length === 0 && <div className="col-span-2 flex flex-col items-center justify-center text-neutral-700 gap-4 py-20 opacity-50"><Images size={48} strokeWidth={1} /><p className="text-sm font-mono">No photos yet.</p></div>}
            
            {photos.map((photo) => {
                const isSelected = selectedPhotos.has(photo.id);
                return (
                <div key={photo.id} onClick={() => toggleSelection(photo.id)} className={`relative transition-all duration-200 ${isSelected ? 'scale-95 ring-2 ring-blue-500 rounded-sm z-10' : 'active:scale-95'}`}>
                    <div className="bg-[#f4f4f4] p-1.5 pb-4 shadow-md">
                        <div className={`bg-[#101010] ${photo.isStrip?'p-1':'aspect-[1/1.05]'} overflow-hidden relative shadow-inner`}>
                            {photo.type === 'video' ? (
                                <video src={photo.imageUrl} className="w-full h-full object-cover" muted />
                            ) : (
                                <img src={photo.imageUrl} alt="Print" className={`w-full h-full object-cover developing-image`} />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10"></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none z-10"></div>
                            
                            <div className="absolute top-2 right-2 z-20">
                                {isSelected ? <CheckCircle2 className="text-blue-500 bg-white rounded-full" size={18} /> : <Circle className="text-white/50 drop-shadow-md" size={18} />}
                            </div>

                            <button onClick={(e) => saveToDevice(e, photo)} className="absolute bottom-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm text-white rounded-full z-20" title="Save">
                                <Download size={12} />
                            </button>
                        </div>
                        <div className="mt-2 px-1 relative">
                             <div className="relative group/edit">
                                <input type="text" onClick={(e) => e.stopPropagation()} value={photo.caption} onChange={(e) => updateCaption(photo.id, e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-blue-900/20 focus:border-blue-900 focus:outline-none text-[9px] font-serif italic text-blue-900/80 text-center placeholder-blue-900/30 transition-all truncate" placeholder="Write caption..." />
                            </div>
                        </div>
                    </div>
                </div>
            )})}
           </div>
        </div>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION (Visible only on Mobile) --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-neutral-900 border-t border-white/10 p-4 pb-8 z-40 flex justify-around items-center safe-area-bottom">
          <button 
            onClick={() => setActiveTab('camera')} 
            className={`flex flex-col items-center gap-1 ${activeTab === 'camera' ? 'text-white' : 'text-neutral-500'}`}
          >
              <Camera size={24} strokeWidth={activeTab === 'camera' ? 2.5 : 1.5} />
              <span className="text-[10px] font-bold tracking-widest">CAMERA</span>
          </button>
          
          <div className="w-px h-8 bg-white/10"></div>

          <button 
            onClick={() => setActiveTab('gallery')} 
            className={`relative flex flex-col items-center gap-1 ${activeTab === 'gallery' ? 'text-white' : 'text-neutral-500'}`}
          >
              <div className="relative">
                <Images size={24} strokeWidth={activeTab === 'gallery' ? 2.5 : 1.5} />
                {photos.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-900"></span>}
              </div>
              <span className="text-[10px] font-bold tracking-widest">PRINTS</span>
          </button>
      </div>

      {/* --- FLOATING BATCH ACTION BAR --- */}
      {selectedPhotos.size > 0 && (
          <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-full shadow-2xl z-[60] flex items-center gap-4 animate-bounce-in border border-white/20 w-[90%] max-w-sm justify-between">
              <span className="font-bold text-sm whitespace-nowrap">{selectedPhotos.size} <span className="hidden sm:inline">Selected</span></span>
              
              <div className="flex items-center gap-3">
                {/* Save Button */}
                <button onClick={async () => {
                      const selectedItems = photos.filter(p => selectedPhotos.has(p.id));
                      for (let i = 0; i < selectedItems.length; i++) {
                          const item = selectedItems[i];
                          if (item.type === 'video') {
                             const a = document.createElement('a'); a.href = item.imageUrl; a.download = `retro-motion-${item.id}.webm`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                          } else {
                             const blob = await bakePolaroid(item);
                             const url = URL.createObjectURL(blob);
                             const a = document.createElement('a'); a.href = url; a.download = `retro-${item.id}.jpg`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                          }
                          await new Promise(r => setTimeout(r, 500));
                      }
                      setSelectedPhotos(new Set());
                }} className="bg-white/10 p-2 rounded-full hover:bg-green-500/20 text-green-400"><Download size={18} /></button>

                {/* Upload Button */}
                {eventId && (
                    <button onClick={handleBatchUpload} disabled={isUploading} className="bg-blue-600 p-2 px-4 rounded-full text-white font-bold text-xs flex items-center gap-2">
                        {isUploading ? '...' : <>UPLOAD <CloudUpload size={16} /></>}
                    </button>
                )}

                {/* Delete Button */}
                <button onClick={handleBatchDelete} className="bg-white/10 p-2 rounded-full hover:bg-red-500/20 text-red-500"><Trash2 size={18}/></button>
              </div>
          </div>
      )}
    </div>
  );
};

export default RetroCamera;