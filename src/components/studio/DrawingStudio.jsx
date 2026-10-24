import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowRight,
    Bold,
    Check,
    ChevronDown,
    Circle,
    Diamond,
    Download,
    Edit3,
    Eraser,
    Hand,
    Heart,
    Hexagon,
    Infinity as InfinityIcon,
    Italic,
    Layout,
    Maximize2,
    Minus,
    Move,
    PaintBucket,
    Pipette,
    Redo2,
    RotateCcw,
    Shapes,
    Sliders,
    Square,
    Star,
    Trash2,
    Triangle,
    Type,
    Underline,
    Undo2,
    X,
    ZoomIn, ZoomOut
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const BRUSHES = [
  { id: 'pen', name: 'Pen', lineCap: 'round', lineJoin: 'round', shadowBlur: 0, defaultSize: 4 },
  { id: 'brush', name: 'Watercolor', lineCap: 'round', lineJoin: 'round', shadowBlur: 14, defaultSize: 16, isWatercolor: true },
  { id: 'marker', name: 'Marker', lineCap: 'round', lineJoin: 'round', shadowBlur: 0, defaultSize: 10, isMarker: true },
  { id: 'highlighter', name: 'Highlighter', lineCap: 'square', lineJoin: 'miter', shadowBlur: 0, defaultSize: 26, isHighlighter: true },
  { id: 'pencil', name: 'Pencil', lineCap: 'round', lineJoin: 'round', shadowBlur: 0, defaultSize: 2, isPencil: true },
  { id: 'airbrush', name: 'Airbrush', lineCap: 'round', lineJoin: 'round', shadowBlur: 24, defaultSize: 32, isAirbrush: true },
  { id: 'calligraphy', name: 'Calligraphy', lineCap: 'butt', lineJoin: 'miter', shadowBlur: 0, defaultSize: 14, isCalligraphy: true },
];

const SHAPE_CATEGORIES = [
  {
    category: 'Basic',
    items: [
      { id: 'line', name: 'Line', icon: Minus },
      { id: 'rectangle', name: 'Rectangle', icon: Square },
      { id: 'ellipse', name: 'Circle/Oval', icon: Circle },
      { id: 'triangle', name: 'Triangle', icon: Triangle },
    ],
  },
  {
    category: 'Polygons & Symbols',
    items: [
      { id: 'star', name: 'Star', icon: Star },
      { id: 'heart', name: 'Heart', icon: Heart },
      { id: 'arrow', name: 'Arrow', icon: ArrowRight },
      { id: 'diamond', name: 'Diamond', icon: Diamond },
      { id: 'hexagon', name: 'Hexagon', icon: Hexagon },
      { id: 'trapezoid', name: 'Trapezoid', icon: Square },
    ],
  },
];

const ALL_SHAPES = SHAPE_CATEGORIES.flatMap(c => c.items);

const FONT_FAMILIES = [
  { id: 'sans', name: 'Modern Sans', style: 'font-sans', css: 'sans-serif' },
  { id: 'serif', name: 'Classic Serif', style: 'font-serif', css: 'serif' },
  { id: 'mono', name: 'Code Mono', style: 'font-mono', css: 'monospace' },
  { id: 'cursive', name: 'Playful Hand', style: 'italic font-serif', css: 'cursive' },
];

const QUICK_PALETTES = [
  { name: 'Neon', colors: ['#FF0055', '#FF5500', '#FFE600', '#00FF66', '#00F0FF', '#7000FF', '#FF00A0', '#000000'] },
  { name: 'Pastel', colors: ['#FFE2D8', '#FFF9F2', '#A8D8B9', '#FFD978', '#BAE6FD', '#E2D9F3', '#FFD1DC', '#FFFFFF'] },
  { name: 'Earth', colors: ['#2B4C3F', '#4A7C59', '#8FCB9B', '#C8D6AF', '#3A7D62', '#5DBB8F', '#D9E8D4', '#1F3A2B'] },
];

export const CANVAS_PRESETS = [
  { id: 'landscape', name: 'Landscape', width: 900, height: 520, ratio: '16:9 approx', category: 'Screen' },
  { id: 'square', name: 'Square', width: 600, height: 600, ratio: '1:1', category: 'Social' },
  { id: 'portrait', name: 'Portrait', width: 520, height: 720, ratio: '3:4', category: 'Social' },
  { id: 'story', name: 'Story / Reel', width: 450, height: 800, ratio: '9:16', category: 'Mobile' },
  { id: 'a4_portrait', name: 'A4 Portrait', width: 595, height: 842, ratio: '1:1.41', category: 'Print' },
  { id: 'a4_landscape', name: 'A4 Landscape', width: 842, height: 595, ratio: '1.41:1', category: 'Print' },
];

function hexToRgba(hex, alpha = 255) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: alpha,
  };
}

export default function DrawingStudio({
  title,
  setTitle,
  initialImage = '',
  onImageChange,
  onFirstStroke,
  onSound,
}) {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const viewportRef = useRef(null);

  // Active Tool: 'brush' | 'eraser' | 'shape' | 'bucket' | 'text' | 'eyedropper'
  const [tool, setTool] = useState('brush');
  const [brushType, setBrushType] = useState('pen');
  const [shapeType, setShapeType] = useState('line');
  const [shapeFill, setShapeFill] = useState(false);
  const [color, setColor] = useState('#FF0055');
  const [brushSize, setBrushSize] = useState(6);
  const [eraserSize, setEraserSize] = useState(24);
  const [shapeSize, setShapeSize] = useState(4);
  const [fillTolerance, setFillTolerance] = useState(32); // 0 - 100
  const [opacity, setOpacity] = useState(100); // 1 - 100%
  const [bgType, setBgType] = useState('white'); // 'white' | 'transparent' | 'cream' | 'custom'
  const [customBgColor, setCustomBgColor] = useState('#FFE2D8');
  const [showClearModal, setShowClearModal] = useState(false);
  const [eyedropperPreview, setEyedropperPreview] = useState(null); // { x, y, color }

  // Drawer / Submenu toggles
  const [openDrawer, setOpenDrawer] = useState(null); // 'brush' | 'shape' | null

  // Zoom & Pan state (Directly on canvas floating bar)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Interactive Text Objects
  // Item: { id, x, y, text, fontSize, color, fontFamily, isBold, isItalic, isUnderline, align }
  const [textItems, setTextItems] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const textDragOffsetRef = useRef({ x: 0, y: 0 });
  const [textModalData, setTextModalData] = useState(null); // { id, x, y, text, fontSize, color, fontFamily, isNew }

  // Undo & Redo History
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const initialImageLoadedRef = useRef(false);

  // Drawing state
  const isDrawing = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const points = useRef([]);

  const currentBrush = BRUSHES.find(b => b.id === brushType) || BRUSHES[0];
  const currentShape = ALL_SHAPES.find(s => s.id === shapeType) || ALL_SHAPES[0];

  // Canvas Mode & Size configuration
  const [canvasMode, setCanvasMode] = useState('fixed'); // 'fixed' | 'infinite'
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 520, presetId: 'landscape' });
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState({ width: '900', height: '520', presetId: 'landscape' });
  const [customInputError, setCustomInputError] = useState('');

  // Fixed canvas dimensions (pure numerical)
  // Infinite canvas spans an expansive surface (3600 x 2800) with dynamic pan & zoom
  const activeCanvasWidth = canvasMode === 'infinite' ? 3600 : Number(canvasSize.width) || 900;
  const activeCanvasHeight = canvasMode === 'infinite' ? 2800 : Number(canvasSize.height) || 520;

  // Composite background + artwork canvas + text objects
  const compositeCanvasDataUrl = useCallback((format = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    // If infinite canvas, compute bounding box of drawn content & text for clean, professional export
    let cropX = 0;
    let cropY = 0;
    let cropW = canvas.width;
    let cropH = canvas.height;

    if (canvasMode === 'infinite') {
      try {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          let minX = canvas.width;
          let minY = canvas.height;
          let maxX = 0;
          let maxY = 0;
          let hasPixels = false;

          for (let y = 0; y < canvas.height; y += 4) {
            for (let x = 0; x < canvas.width; x += 4) {
              const alpha = data[(y * canvas.width + x) * 4 + 3];
              if (alpha > 5) {
                hasPixels = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          // Factor in text objects bounding boxes
          textItems.forEach(item => {
            if (item.text.trim()) {
              hasPixels = true;
              const fontDef = FONT_FAMILIES.find(f => f.id === item.fontFamily) || FONT_FAMILIES[0];
              const approxW = Math.max(80, item.fontSize * item.text.length * 0.7);
              const approxH = Math.max(30, item.fontSize * 1.5);
              const startX = item.align === 'center' ? item.x - approxW / 2 : item.align === 'right' ? item.x - approxW : item.x;
              minX = Math.min(minX, startX);
              maxX = Math.max(maxX, startX + approxW);
              minY = Math.min(minY, item.y);
              maxY = Math.max(maxY, item.y + approxH);
            }
          });

          if (hasPixels && maxX > minX && maxY > minY) {
            const padding = 40;
            cropX = Math.max(0, Math.floor(minX - padding));
            cropY = Math.max(0, Math.floor(minY - padding));
            cropW = Math.min(canvas.width - cropX, Math.ceil(maxX - minX + padding * 2));
            cropH = Math.min(canvas.height - cropY, Math.ceil(maxY - minY + padding * 2));
          } else {
            // Default center crop for blank infinite canvas
            cropW = Math.min(1400, canvas.width);
            cropH = Math.min(900, canvas.height);
            cropX = Math.floor((canvas.width - cropW) / 2);
            cropY = Math.floor((canvas.height - cropH) / 2);
          }
        }
      } catch (_) {
        // Fallback to full canvas
        cropX = 0;
        cropY = 0;
        cropW = canvas.width;
        cropH = canvas.height;
      }
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return '';

    // Background fill
    if (bgType === 'white') {
      tCtx.fillStyle = '#FFFFFF';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    } else if (bgType === 'cream') {
      tCtx.fillStyle = '#FFFAF1';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    } else if (bgType === 'custom') {
      tCtx.fillStyle = customBgColor || '#FFE2D8';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    } else if (format === 'jpg') {
      tCtx.fillStyle = '#FFFFFF';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    // Drawing layer with crop offset
    tCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Text Objects (with offset)
    textItems.forEach(item => {
      if (!item.text.trim()) return;
      tCtx.save();
      const fontDef = FONT_FAMILIES.find(f => f.id === item.fontFamily) || FONT_FAMILIES[0];
      const fontStyle = item.isItalic ? 'italic ' : 'normal ';
      const fontWeight = item.isBold ? 'bold ' : 'normal ';
      tCtx.font = `${fontStyle}${fontWeight}${item.fontSize}px ${fontDef.css}`;
      tCtx.fillStyle = item.color;
      tCtx.textBaseline = 'top';
      tCtx.textAlign = item.align || 'left';

      const lines = item.text.split('\n');
      const lineHeight = item.fontSize * 1.25;

      lines.forEach((line, idx) => {
        const lineY = (item.y - cropY) + idx * lineHeight;
        const lineX = item.x - cropX;
        tCtx.fillText(line, lineX, lineY);

        if (item.isUnderline && line.trim()) {
          const metrics = tCtx.measureText(line);
          const width = metrics.width;
          let startX = lineX;
          if (item.align === 'center') {
            startX = lineX - width / 2;
          } else if (item.align === 'right') {
            startX = lineX - width;
          }
          const underlineY = lineY + item.fontSize * 1.05;
          tCtx.beginPath();
          tCtx.strokeStyle = item.color;
          tCtx.lineWidth = Math.max(1, item.fontSize / 14);
          tCtx.moveTo(startX, underlineY);
          tCtx.lineTo(startX + width, underlineY);
          tCtx.stroke();
        }
      });
      tCtx.restore();
    });

    return format === 'jpg' 
      ? tempCanvas.toDataURL('image/jpeg', 0.95)
      : tempCanvas.toDataURL('image/png');
  }, [bgType, customBgColor, textItems, canvasMode]);

  // Sync to parent onImageChange
  useEffect(() => {
    if (onImageChange && historyStep >= 0) {
      const dataUrl = compositeCanvasDataUrl('png');
      if (dataUrl) onImageChange(dataUrl);
    }
  }, [bgType, customBgColor, historyStep, textItems, compositeCanvasDataUrl, onImageChange]);

  // Mount initialization & dynamic canvas dimension resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas) return;

    const prevWidth = canvas.width;
    const prevHeight = canvas.height;
    const isFirstRun = !canvas.dataset.initialized;

    if (isFirstRun) {
      canvas.dataset.initialized = 'true';
      canvas.width = activeCanvasWidth;
      canvas.height = activeCanvasHeight;
      if (overlay) {
        overlay.width = activeCanvasWidth;
        overlay.height = activeCanvasHeight;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, activeCanvasWidth, activeCanvasHeight);

      if (!initialImage && historyStep === -1) {
        const initialSnapshot = {
          drawing: canvas.toDataURL('image/png'),
          texts: [],
        };
        setHistory([initialSnapshot]);
        setHistoryStep(0);
      }
    } else if (prevWidth !== activeCanvasWidth || prevHeight !== activeCanvasHeight) {
      // Preserve artwork when resizing canvas dimensions
      const temp = document.createElement('canvas');
      temp.width = prevWidth;
      temp.height = prevHeight;
      const tCtx = temp.getContext('2d');
      if (tCtx) tCtx.drawImage(canvas, 0, 0);

      canvas.width = activeCanvasWidth;
      canvas.height = activeCanvasHeight;
      if (overlay) {
        overlay.width = activeCanvasWidth;
        overlay.height = activeCanvasHeight;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const offsetX = Math.round((activeCanvasWidth - prevWidth) / 2);
      const offsetY = Math.round((activeCanvasHeight - prevHeight) / 2);
      if (ctx && tCtx) {
        ctx.clearRect(0, 0, activeCanvasWidth, activeCanvasHeight);
        ctx.drawImage(temp, offsetX, offsetY);
      }
      if (offsetX || offsetY) {
        setTextItems(prev => prev.map(item => ({
          ...item,
          x: item.x + offsetX,
          y: item.y + offsetY,
        })));
      }
      if (overlay) {
        const oCtx = overlay.getContext('2d');
        if (oCtx) oCtx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCanvasWidth, activeCanvasHeight]);

  // Draft data can arrive after this studio mounts. Load the first non-empty
  // source once; onImageChange updates initialImage with a fresh canvas export.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.dataset.initialized || !initialImage || initialImageLoadedRef.current) return;
    initialImageLoadedRef.current = true;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHistory([{ drawing: canvas.toDataURL('image/png'), texts: [] }]);
      setHistoryStep(0);
    };
    img.onerror = () => {
      // Keep the existing canvas and avoid turning a bad draft image into a render loop.
      initialImageLoadedRef.current = false;
    };
    img.src = initialImage;
  }, [initialImage]);

  // History stack push
  const pushHistory = (customTexts = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const snapshot = {
      drawing: canvas.toDataURL('image/png'),
      texts: customTexts !== null ? customTexts : [...textItems],
    };
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(snapshot);

    if (newHistory.length > 30) newHistory.shift();

    // Fire onFirstStroke the first time the user actually draws (going from initial snapshot to step 1)
    if (newHistory.length === 2 && historyStep === 0 && onFirstStroke) {
      onFirstStroke();
    }

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep <= 0) return;
    if (onSound) onSound('pop');
    const nextStep = historyStep - 1;
    restoreHistory(nextStep);
  };

  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;
    if (onSound) onSound('pop');
    const nextStep = historyStep + 1;
    restoreHistory(nextStep);
  };

  const restoreHistory = (step) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = history[step];
    if (!state) return;

    const img = new Image();
    img.src = state.drawing;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setTextItems(state.texts || []);
      setSelectedTextId(null);
      setHistoryStep(step);
    };
  };

  const handleDeselectText = () => {
    setSelectedTextId(null);
    if (onSound) onSound('pop');
  };

  // Keyboard shortcut listener:
  // - Escape: deselect/discard text selection
  // - Delete / Backspace: delete selected text
  // - Ctrl + Z: Undo
  // - Ctrl + Y / Ctrl + Shift + Z: Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea (e.g., text edit modal or title input)
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Check Undo (Ctrl+Z without Shift)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (e.cancelable) e.preventDefault();
        handleUndo();
        return;
      }

      // Check Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        if (e.cancelable) e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === 'Escape' && selectedTextId) {
        handleDeselectText();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTextId) {
        handleDeleteSelectedText(selectedTextId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTextId, textItems, historyStep, history]);

  const handleClear = () => {
    if (onSound) onSound('pop');
    setShowClearModal(true);
  };

  const confirmClear = () => {
    if (onSound) onSound('bounce');
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    setShowClearModal(false);
    setSelectedTextId(null);
    setTextItems([]);

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (overlay) {
      const oCtx = overlay.getContext('2d');
      if (oCtx) oCtx.clearRect(0, 0, overlay.width, overlay.height);
    }
    pushHistory([]);
  };

  // High precision coords calculation
  const getCoords = (e) => {
    const target = overlayCanvasRef.current || canvasRef.current;
    if (!target) return { x: 0, y: 0 };
    const rect = target.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    
    const scaleX = target.width / rect.width;
    const scaleY = target.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Zoom controls (free zoom without max / min restrictions)
  const handleZoomIn = () => {
    setZoom(prev => prev * 1.1);
    if (onSound) onSound('click');
  };

  const handleZoomOut = () => {
    setZoom(prev => prev * 0.9);
    if (onSound) onSound('click');
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    if (onSound) onSound('pop');
  };

  // Isolated non-passive wheel listener: Smooth zoom and pan locking strictly inside canvas viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      // Prevent browser from scrolling whole window when mouse is inside canvas viewport
      if (e.cancelable) e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom (trackpad) or Ctrl + Wheel (mouse) - unconstrained zoom
        const factor = Math.exp(-e.deltaY * 0.0035);
        setZoom(prev => prev * factor);
      } else if (e.shiftKey) {
        // Shift + scroll -> Horizontal Pan
        setPan(prev => ({ ...prev, x: prev.x - e.deltaY * 0.8 }));
      } else if (e.altKey) {
        // Alt + wheel -> Fine zoom
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        setZoom(prev => prev * factor);
      } else {
        // Standard mouse wheel inside canvas: smooth scroll / pan canvas content
        setPan(prev => ({
          x: prev.x - (e.deltaX || 0) * 0.8,
          y: prev.y - (e.deltaY || 0) * 0.8,
        }));
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Flood Fill
  const performFloodFill = (startX, startY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    startX = Math.floor(startX);
    startY = Math.floor(startY);

    if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const fillAlpha = Math.round(255 * (opacity / 100));
    const fillColor = hexToRgba(color, fillAlpha);

    const startIdx = (startY * w + startX) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    const tolSq = (fillTolerance * 2.55) * (fillTolerance * 2.55) * 4;
    const matchTarget = (idx) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      const diffSq = (r - targetR) * (r - targetR) +
                     (g - targetG) * (g - targetG) +
                     (b - targetB) * (b - targetB) +
                     (a - targetA) * (a - targetA);
      return diffSq <= tolSq;
    };

    if (
      Math.abs(targetR - fillColor.r) < 3 &&
      Math.abs(targetG - fillColor.g) < 3 &&
      Math.abs(targetB - fillColor.b) < 3 &&
      Math.abs(targetA - fillColor.a) < 3
    ) {
      return;
    }

    const visited = new Uint8Array(w * h);
    const stack = [[startX, startY]];

    while (stack.length > 0) {
      const [curX, curY] = stack.pop();
      let y = curY;
      let x = curX;

      let pixelIdx = (y * w + x) * 4;
      if (visited[y * w + x] || !matchTarget(pixelIdx)) continue;

      let topY = y;
      while (topY > 0) {
        const nextIdx = ((topY - 1) * w + x) * 4;
        if (!visited[(topY - 1) * w + x] && matchTarget(nextIdx)) {
          topY--;
        } else {
          break;
        }
      }

      let bottomY = y;
      while (bottomY < h - 1) {
        const nextIdx = ((bottomY + 1) * w + x) * 4;
        if (!visited[(bottomY + 1) * w + x] && matchTarget(nextIdx)) {
          bottomY++;
        } else {
          break;
        }
      }

      let checkLeft = false;
      let checkRight = false;

      for (let scanY = topY; scanY <= bottomY; scanY++) {
        const idx = (scanY * w + x) * 4;
        const cell = scanY * w + x;

        visited[cell] = 1;
        data[idx] = fillColor.r;
        data[idx + 1] = fillColor.g;
        data[idx + 2] = fillColor.b;
        data[idx + 3] = fillColor.a;

        if (x > 0) {
          const leftCell = scanY * w + (x - 1);
          const leftIdx = leftCell * 4;
          if (!visited[leftCell] && matchTarget(leftIdx)) {
            if (!checkLeft) {
              stack.push([x - 1, scanY]);
              checkLeft = true;
            }
          } else {
            checkLeft = false;
          }
        }

        if (x < w - 1) {
          const rightCell = scanY * w + (x + 1);
          const rightIdx = rightCell * 4;
          if (!visited[rightCell] && matchTarget(rightIdx)) {
            if (!checkRight) {
              stack.push([x + 1, scanY]);
              checkRight = true;
            }
          } else {
            checkRight = false;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    pushHistory();
    if (onSound) onSound('pop');
  };

  // Eyedropper
  const pickColorAt = (ptX, ptY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tCtx) return;

    if (bgType === 'white') {
      tCtx.fillStyle = '#FFFFFF';
      tCtx.fillRect(0, 0, 1, 1);
    } else if (bgType === 'cream') {
      tCtx.fillStyle = '#FFFAF1';
      tCtx.fillRect(0, 0, 1, 1);
    } else if (bgType === 'custom') {
      tCtx.fillStyle = customBgColor || '#FFE2D8';
      tCtx.fillRect(0, 0, 1, 1);
    } else {
      tCtx.fillStyle = '#FFFFFF';
      tCtx.fillRect(0, 0, 1, 1);
    }

    tCtx.drawImage(canvas, ptX, ptY, 1, 1, 0, 0, 1, 1);
    const pixel = tCtx.getImageData(0, 0, 1, 1).data;
    return '#' + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase();
  };

  // Shapes Drawing
  const drawShape = (ctx, type, start, end, strokeCol, strokeW, isFilled) => {
    ctx.save();
    ctx.strokeStyle = strokeCol;
    ctx.fillStyle = strokeCol;
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    const w = maxX - minX;
    const h = maxY - minY;
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;

    if (type === 'line') {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (type === 'rectangle') {
      if (isFilled) ctx.fillRect(minX, minY, w, h);
      ctx.strokeRect(minX, minY, w, h);
    } else if (type === 'ellipse') {
      ctx.ellipse(centerX, centerY, Math.max(0.1, w / 2), Math.max(0.1, h / 2), 0, 0, Math.PI * 2);
      if (isFilled) ctx.fill();
      ctx.stroke();
    } else if (type === 'triangle') {
      ctx.moveTo(centerX, minY);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(minX, maxY);
      ctx.closePath();
      if (isFilled) ctx.fill();
      ctx.stroke();
    } else if (type === 'diamond') {
      ctx.moveTo(centerX, minY);
      ctx.lineTo(maxX, centerY);
      ctx.lineTo(centerX, maxY);
      ctx.lineTo(minX, centerY);
      ctx.closePath();
      if (isFilled) ctx.fill();
      ctx.stroke();
    } else if (type === 'trapezoid') {
      const topOffset = w * 0.22;
      ctx.moveTo(minX + topOffset, minY);
      ctx.lineTo(maxX - topOffset, minY);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(minX, maxY);
      ctx.closePath();
      if (isFilled) ctx.fill();
      ctx.stroke();
    } else if (type === 'hexagon') {
      const sides = 6;
      const rx = w / 2;
      const ry = h / 2;
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const px = centerX + rx * Math.cos(angle);
        const py = centerY + ry * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (isFilled) ctx.fill();
      ctx.stroke();
    } else if (type === 'star') {
      const pointsCount = 5;
      const outerRx = w / 2;
      const outerRy = h / 2;
      const innerRx = outerRx * 0.42;
      const innerRy = outerRy * 0.42;
      for (let i = 0; i < pointsCount * 2; i++) {
        const angle = (i * Math.PI) / pointsCount - Math.PI / 2;
        const rx = i % 2 === 0 ? outerRx : innerRx;
        const ry = i % 2 === 0 ? outerRy : innerRy;
        const px = centerX + rx * Math.cos(angle);
        const py = centerY + ry * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (isFilled) ctx.fill();
      ctx.stroke();
    } else if (type === 'heart') {
      const topCurveHeight = h * 0.3;
      ctx.moveTo(centerX, minY + topCurveHeight);
      ctx.bezierCurveTo(centerX, minY, minX, minY, minX, minY + topCurveHeight);
      ctx.bezierCurveTo(minX, minY + (h + topCurveHeight) / 2, centerX, minY + (h + topCurveHeight) / 2, centerX, maxY);
      ctx.bezierCurveTo(centerX, minY + (h + topCurveHeight) / 2, maxX, minY + (h + topCurveHeight) / 2, maxX, minY + topCurveHeight);
      ctx.bezierCurveTo(maxX, minY, centerX, minY, centerX, minY + topCurveHeight);
      ctx.closePath();
      if (isFilled) ctx.fill();
      ctx.stroke();
    } else if (type === 'arrow') {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headlen = Math.max(16, strokeW * 3.5);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      if (isFilled) ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  const applyEraserSettings = (ctx) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = eraserSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  };

  const applyBrushSettings = (ctx) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = currentBrush.lineCap;
    ctx.lineJoin = currentBrush.lineJoin;

    if (currentBrush.isWatercolor) {
      ctx.shadowBlur = Math.max(6, brushSize * 0.85);
      ctx.shadowColor = color;
    } else if (currentBrush.isHighlighter) {
      ctx.shadowBlur = 4;
      ctx.shadowColor = color;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  };

  const drawAirbrushDabs = (ctx, x, y, size, col) => {
    const density = Math.max(14, Math.round(size * 1.8));
    ctx.fillStyle = col;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.6) * (size / 2);
      const dotX = x + Math.cos(angle) * dist;
      const dotY = y + Math.sin(angle) * dist;
      ctx.globalAlpha = Math.random() * 0.28 + 0.08;
      ctx.beginPath();
      ctx.arc(dotX, dotY, Math.random() * 1.4 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  };

  const drawCalligraphyDab = (ctx, x, y, size, col) => {
    const angle = Math.PI / 4;
    const dx = Math.cos(angle) * (size / 2);
    const dy = Math.sin(angle) * (size / 2);
    ctx.beginPath();
    ctx.moveTo(x - dx, y - dy);
    ctx.lineTo(x + dx, y + dy);
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(2, size * 0.25);
    ctx.stroke();
  };

  // Pointer Down handler
  const handlePointerDown = (e) => {
    if (e.button === 1 || e.spaceKey || tool === 'pan') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      return;
    }

    if (e.button !== undefined && e.button !== 0) return;
    if (e.cancelable) {
      e.preventDefault();
    }

    if (e.currentTarget && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    const pt = getCoords(e);
    startPointRef.current = pt;

    // Eyedropper
    if (tool === 'eyedropper') {
      const picked = pickColorAt(pt.x, pt.y);
      if (picked) {
        setColor(picked);
        setEyedropperPreview(null);
        if (onSound) onSound('pop');
        setTool('brush');
      }
      return;
    }

    // Paint Bucket
    if (tool === 'bucket') {
      performFloodFill(pt.x, pt.y);
      return;
    }

    // Text Tool (Tap to place new text, or double-click existing text to select/edit)
    if (tool === 'text') {
      setSelectedTextId(null);
      setTextModalData({
        id: 'txt_' + Date.now(),
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        text: '',
        fontSize: Math.max(18, Math.min(60, brushSize * 3 + 14)),
        color: color,
        fontFamily: 'sans',
        isBold: true,
        isItalic: false,
        isUnderline: false,
        align: 'left',
        isNew: true,
      });
      return;
    }

    // Shape Tool
    if (tool === 'shape') {
      isDrawing.current = true;
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const oCtx = overlay.getContext('2d');
        if (oCtx) oCtx.clearRect(0, 0, overlay.width, overlay.height);
      }
      return;
    }

    // Freehand Drawing (Brush & Eraser)
    isDrawing.current = true;
    points.current = [pt];

    const overlay = overlayCanvasRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (overlay) {
      const oCtx = overlay.getContext('2d');
      if (oCtx) oCtx.clearRect(0, 0, overlay.width, overlay.height);
    }

    if (tool === 'eraser') {
      const targetCtx = overlay ? overlay.getContext('2d') : canvas.getContext('2d');
      if (!targetCtx) return;
      applyEraserSettings(targetCtx);
      targetCtx.beginPath();
      targetCtx.arc(pt.x, pt.y, Math.max(0.5, eraserSize / 2), 0, Math.PI * 2);
      targetCtx.fill();
    } else {
      const targetCtx = overlay ? overlay.getContext('2d') : canvas.getContext('2d');
      if (!targetCtx) return;
      applyBrushSettings(targetCtx);

      if (currentBrush.isAirbrush) {
        drawAirbrushDabs(targetCtx, pt.x, pt.y, brushSize, color);
      } else if (currentBrush.isCalligraphy) {
        drawCalligraphyDab(targetCtx, pt.x, pt.y, brushSize, color);
      } else {
        targetCtx.beginPath();
        targetCtx.arc(pt.x, pt.y, Math.max(0.5, brushSize / 2), 0, Math.PI * 2);
        targetCtx.fillStyle = color;
        targetCtx.fill();
      }
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
      return;
    }

    const currentPt = getCoords(e);

    // Eyedropper Live Preview
    if (tool === 'eyedropper') {
      const picked = pickColorAt(currentPt.x, currentPt.y);
      if (picked) {
        setEyedropperPreview({
          x: currentPt.x,
          y: currentPt.y,
          color: picked,
        });
      }
      return;
    }

    // Text Dragging
    if (tool === 'text' && isDraggingText && selectedTextId) {
      setTextItems(prev => prev.map(item => {
        if (item.id === selectedTextId) {
          return {
            ...item,
            x: Math.round(currentPt.x - textDragOffsetRef.current.x),
            y: Math.round(currentPt.y - textDragOffsetRef.current.y),
          };
        }
        return item;
      }));
      return;
    }

    if (!isDrawing.current) return;
    if (e.cancelable) e.preventDefault();

    // Shape Tool Live Preview
    if (tool === 'shape') {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;
      const oCtx = overlay.getContext('2d');
      if (!oCtx) return;

      oCtx.clearRect(0, 0, overlay.width, overlay.height);
      drawShape(oCtx, shapeType, startPointRef.current, currentPt, color, shapeSize, shapeFill);
      return;
    }

    // Freehand Drawing (Brush & Eraser)
    const prevPt = points.current[points.current.length - 1];
    points.current.push(currentPt);

    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const oCtx = overlay.getContext('2d');
    if (!oCtx) return;

    if (tool === 'eraser') {
      applyEraserSettings(oCtx);
      if (prevPt) {
        oCtx.beginPath();
        oCtx.moveTo(prevPt.x, prevPt.y);
        oCtx.lineTo(currentPt.x, currentPt.y);
        oCtx.stroke();
      }
      return;
    }

    applyBrushSettings(oCtx);

    if (currentBrush.isAirbrush) {
      drawAirbrushDabs(oCtx, currentPt.x, currentPt.y, brushSize, color);
      return;
    }

    if (currentBrush.isCalligraphy) {
      if (prevPt) {
        const angle = Math.PI / 4;
        const w = brushSize;
        const cdx = Math.cos(angle) * (w / 2);
        const cdy = Math.sin(angle) * (w / 2);
        oCtx.beginPath();
        oCtx.moveTo(prevPt.x - cdx, prevPt.y - cdy);
        oCtx.lineTo(prevPt.x + cdx, prevPt.y + cdy);
        oCtx.lineTo(currentPt.x + cdx, currentPt.y + cdy);
        oCtx.lineTo(currentPt.x - cdx, currentPt.y - cdy);
        oCtx.closePath();
        oCtx.fillStyle = color;
        oCtx.fill();
      }
      return;
    }

    if (currentBrush.isPencil) {
      if (prevPt) {
        oCtx.beginPath();
        oCtx.moveTo(prevPt.x, prevPt.y);
        oCtx.lineTo(currentPt.x, currentPt.y);
        oCtx.stroke();
        for (let j = 0; j < 3; j++) {
          const jx = currentPt.x + (Math.random() - 0.5) * brushSize * 1.2;
          const jy = currentPt.y + (Math.random() - 0.5) * brushSize * 1.2;
          oCtx.fillStyle = color;
          oCtx.fillRect(jx, jy, 1.2, 1.2);
        }
      }
      return;
    }

    const pts = points.current;
    const len = pts.length;
    if (len >= 3) {
      const p1 = pts[len - 2];
      const p2 = pts[len - 1];
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const prevMid = len === 3 ? pts[0] : { x: (pts[len - 3].x + p1.x) / 2, y: (pts[len - 3].y + p1.y) / 2 };

      oCtx.beginPath();
      oCtx.moveTo(prevMid.x, prevMid.y);
      oCtx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
      oCtx.stroke();
    } else if (prevPt) {
      oCtx.beginPath();
      oCtx.moveTo(prevPt.x, prevPt.y);
      oCtx.lineTo(currentPt.x, currentPt.y);
      oCtx.stroke();
    }
  };

  // Pointer Up handler
  const handlePointerUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingText) {
      setIsDraggingText(false);
      pushHistory();
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (e && e.currentTarget && e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    const overlay = overlayCanvasRef.current;
    const canvas = canvasRef.current;

    // Shape Tool
    if (tool === 'shape') {
      const currentPt = getCoords(e);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.globalAlpha = Math.max(0.04, opacity / 100);
          drawShape(ctx, shapeType, startPointRef.current, currentPt, color, shapeSize, shapeFill);
          ctx.restore();
        }
      }
      if (overlay) {
        const oCtx = overlay.getContext('2d');
        if (oCtx) oCtx.clearRect(0, 0, overlay.width, overlay.height);
      }
      pushHistory();
      return;
    }

    // Freehand Drawing (Brush & Eraser)
    points.current = [];

    if (overlay && canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (tool === 'eraser') {
          const eraserAlpha = Math.max(0.04, opacity / 100);
          ctx.globalAlpha = eraserAlpha;
          ctx.globalCompositeOperation = 'destination-out';
          ctx.drawImage(overlay, 0, 0);
          ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = 'source-over';
        } else {
          const baseAlpha = Math.max(0.04, opacity / 100);
          const strokeAlpha = currentBrush.isHighlighter
            ? baseAlpha * 0.55
            : currentBrush.isWatercolor
              ? baseAlpha * 0.85
              : baseAlpha;

          ctx.globalAlpha = strokeAlpha;
          ctx.globalCompositeOperation = currentBrush.isHighlighter ? 'multiply' : 'source-over';
          ctx.drawImage(overlay, 0, 0);
          ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = 'source-over';
        }

        const oCtx = overlay.getContext('2d');
        if (oCtx) oCtx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }

    pushHistory();
  };

  // Text Modal Save / Update (Full WYSIWYG)
  const handleSaveTextModal = () => {
    if (!textModalData || !textModalData.text.trim()) {
      setTextModalData(null);
      return;
    }

    let nextTexts;
    if (textModalData.isNew) {
      const newItem = {
        id: textModalData.id,
        x: textModalData.x,
        y: textModalData.y,
        text: textModalData.text,
        fontSize: textModalData.fontSize || 24,
        color: textModalData.color || color,
        fontFamily: textModalData.fontFamily || 'sans',
        isBold: Boolean(textModalData.isBold),
        isItalic: Boolean(textModalData.isItalic),
        isUnderline: Boolean(textModalData.isUnderline),
        align: textModalData.align || 'left',
      };
      nextTexts = [...textItems, newItem];
      setSelectedTextId(newItem.id);
    } else {
      nextTexts = textItems.map(item => item.id === textModalData.id ? {
        ...item,
        text: textModalData.text,
        fontSize: textModalData.fontSize || item.fontSize || 24,
        color: textModalData.color || item.color,
        fontFamily: textModalData.fontFamily || item.fontFamily || 'sans',
        isBold: Boolean(textModalData.isBold),
        isItalic: Boolean(textModalData.isItalic),
        isUnderline: Boolean(textModalData.isUnderline),
        align: textModalData.align || item.align || 'left',
      } : item);
      setSelectedTextId(null);
    }

    setTextItems(nextTexts);
    pushHistory(nextTexts);
    setTextModalData(null);
    if (onSound) onSound('pop');
  };

  const handleDeleteSelectedText = (id) => {
    const nextTexts = textItems.filter(item => item.id !== id);
    setTextItems(nextTexts);
    setSelectedTextId(null);
    pushHistory(nextTexts);
    if (onSound) onSound('pop');
  };

  const handleEditSelectedText = (item) => {
    setTextModalData({
      id: item.id,
      x: item.x,
      y: item.y,
      text: item.text,
      fontSize: item.fontSize || 24,
      color: item.color || color,
      fontFamily: item.fontFamily || 'sans',
      isBold: Boolean(item.isBold),
      isItalic: Boolean(item.isItalic),
      isUnderline: Boolean(item.isUnderline),
      align: item.align || 'left',
      isNew: false,
    });
  };

  // Export File (PNG / JPG)
  const handleDownload = (format = 'png') => {
    if (onSound) onSound('coin');
    const downloadUrl = compositeCanvasDataUrl(format);
    if (!downloadUrl) return;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${title.trim() || 'looma-artwork'}.${format}`;
    a.click();
  };

  return (
    <div className="space-y-2.5 select-none font-sans max-w-full">
      {/* 1. TOP HEADER BAR: Artwork Title & Actions */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title your artwork..."
          className="flex-1 bg-white px-4 py-2 rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-sm text-[#302541] placeholder:text-[#746B7C]/60 focus:outline-none focus:ring-2 focus:ring-[#FFD978]"
        />

        {/* Global Action Icons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyStep <= 0}
            title="Undo"
            className={`w-8 h-8 rounded-xl border border-[#302541] flex items-center justify-center transition-all ${
              historyStep > 0 ? 'bg-[#FFFAF1] hover:bg-[#FFD978] cursor-pointer active:translate-y-0.5' : 'opacity-35 cursor-not-allowed bg-gray-100'
            }`}
          >
            <Undo2 className="w-4 h-4 text-[#302541]" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            title="Redo"
            className={`w-8 h-8 rounded-xl border border-[#302541] flex items-center justify-center transition-all ${
              historyStep < history.length - 1 ? 'bg-[#FFFAF1] hover:bg-[#FFD978] cursor-pointer active:translate-y-0.5' : 'opacity-35 cursor-not-allowed bg-gray-100'
            }`}
          >
            <Redo2 className="w-4 h-4 text-[#302541]" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1 rounded-xl border border-[#302541] bg-[#FFE2D8] hover:bg-[#FFD978] text-[#302541] font-black text-xs flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
            title="Clear all artwork"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <div className="w-[1px] h-5 bg-[#302541]/20 mx-0.5" />

          <button
            type="button"
            onClick={() => handleDownload('png')}
            className="px-2.5 py-1 rounded-xl border border-[#302541] bg-[#FF385C] text-white hover:bg-[#ff5273] font-black text-xs flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5 shadow-sm"
            title="Export PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload('jpg')}
            className="px-2.5 py-1 rounded-xl border border-[#302541] bg-[#FFFAF1] hover:bg-[#FFD978] text-[#302541] font-black text-xs cursor-pointer transition-all active:translate-y-0.5"
            title="Export JPG"
          >
            <span>JPG</span>
          </button>
        </div>
      </div>

      {/* 2. UNIFIED STUDIO TOOLBAR: Single Clean Dock without messy nested cards */}
      <div className="bg-[#FFFAF1] rounded-3xl border-2 border-[#302541] shadow-[3px_3px_0px_#302541] p-2.5 space-y-2">
        {/* ROW 1: PRIMARY TOOL SELECTOR & CANVAS BACKGROUND */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Main Tools Dock */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Brush Tool */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setTool('brush');
                  setOpenDrawer(openDrawer === 'brush' ? null : 'brush');
                  if (onSound) onSound('click');
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer border-2 transition-all ${
                  tool === 'brush'
                    ? 'bg-[#FF385C] text-white border-[#302541] shadow-[2px_2px_0px_#302541]'
                    : 'bg-white text-[#302541] border-[#302541]/30 hover:border-[#302541]'
                }`}
                title="Brush — draw freehand strokes. Click ▾ to switch brush style"
              >
                <span>🖌️</span>
                <span>{currentBrush.name}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </div>

            {/* Eraser Tool */}
            <button
              type="button"
              onClick={() => {
                setTool('eraser');
                setOpenDrawer(null);
                if (onSound) onSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer border-2 transition-all ${
                tool === 'eraser'
                  ? 'bg-[#FF385C] text-white border-[#302541] shadow-[2px_2px_0px_#302541]'
                  : 'bg-white text-[#302541] border-[#302541]/30 hover:border-[#302541]'
              }`}
              title="Eraser — rub out any part of your drawing"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eraser</span>
            </button>

            {/* Shape Tool */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setTool('shape');
                  setOpenDrawer(openDrawer === 'shape' ? null : 'shape');
                  if (onSound) onSound('click');
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer border-2 transition-all ${
                  tool === 'shape'
                    ? 'bg-[#FF385C] text-white border-[#302541] shadow-[2px_2px_0px_#302541]'
                    : 'bg-white text-[#302541] border-[#302541]/30 hover:border-[#302541]'
                }`}
                title="Shape — draw perfect shapes. Click ▾ to pick a different shape"
              >
                <Shapes className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentShape.name}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </div>

            {/* Paint Bucket */}
            <button
              type="button"
              onClick={() => {
                setTool('bucket');
                setOpenDrawer(null);
                if (onSound) onSound('click');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer border-2 transition-all ${
                tool === 'bucket'
                  ? 'bg-[#FF385C] text-white border-[#302541] shadow-[2px_2px_0px_#302541]'
                  : 'bg-white text-[#302541] border-[#302541]/30 hover:border-[#302541]'
              }`}
              title="Paint Bucket — flood-fill a region with the current color. Use Tolerance to adjust sensitivity"
            >
              <PaintBucket className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Fill</span>
            </button>

            {/* Text Tool */}
            <button
              type="button"
              onClick={() => {
                setTool('text');
                setOpenDrawer(null);
                if (onSound) onSound('click');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer border-2 transition-all ${
                tool === 'text'
                  ? 'bg-[#FF385C] text-white border-[#302541] shadow-[2px_2px_0px_#302541]'
                  : 'bg-white text-[#302541] border-[#302541]/30 hover:border-[#302541]'
              }`}
              title="Text Tool — click on the canvas to place a text label"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Text</span>
            </button>

            {/* Eyedropper */}
            <button
              type="button"
              onClick={() => {
                setTool('eyedropper');
                setOpenDrawer(null);
                if (onSound) onSound('click');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer border-2 transition-all ${
                tool === 'eyedropper'
                  ? 'bg-[#FF385C] text-white border-[#302541] shadow-[2px_2px_0px_#302541]'
                  : 'bg-white text-[#302541] border-[#302541]/30 hover:border-[#302541]'
              }`}
              title="Eyedropper — click any pixel to pick its color"
            >
              <Pipette className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Picker</span>
            </button>

            {/* Hand / Pan Canvas Tool */}
            <button
              type="button"
              onClick={() => {
                setTool(tool === 'pan' ? 'brush' : 'pan');
                setOpenDrawer(null);
                if (onSound) onSound('click');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer border-2 transition-all ${
                tool === 'pan'
                  ? 'bg-[#FF385C] text-white border-[#302541] shadow-[2px_2px_0px_#302541]'
                  : 'bg-white text-[#302541] border-[#302541]/30 hover:border-[#302541]'
              }`}
              title="Hand Tool (Pan / Drag Canvas)"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pan</span>
            </button>
          </div>

          {/* Canvas Background Settings */}
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-2xl border-2 border-[#302541]">
            <span className="text-[10px] font-black uppercase text-[#746B7C] mr-0.5">Canvas:</span>
            {[
              { id: 'white', label: 'White' },
              { id: 'cream', label: 'Cream' },
              { id: 'transparent', label: 'Grid' },
            ].map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setBgType(b.id);
                  if (onSound) onSound('pop');
                }}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  bgType === b.id
                    ? 'border border-[#302541] bg-[#FFD978] text-[#302541] shadow-[1px_1px_0px_#302541]'
                    : 'text-[#746B7C] hover:bg-gray-100'
                }`}
              >
                {b.label}
              </button>
            ))}

            <label
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                bgType === 'custom'
                  ? 'border border-[#302541] bg-[#FFD978] text-[#302541] shadow-[1px_1px_0px_#302541]'
                  : 'text-[#746B7C] hover:bg-gray-100'
              }`}
              title="Pick custom background color"
            >
              <span
                style={{ backgroundColor: customBgColor }}
                className="w-3.5 h-3.5 rounded-full border border-[#302541]"
              />
              <span>Color</span>
              <input
                type="color"
                value={customBgColor}
                onChange={(e) => {
                  setCustomBgColor(e.target.value);
                  setBgType('custom');
                  if (onSound) onSound('pop');
                }}
                className="sr-only"
              />
            </label>
          </div>

          {/* Canvas Mode & Dimensions Setup Pill */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-2xl border-2 border-[#302541]">
            {/* Mode switch */}
            <div className="flex items-center bg-[#FFFAF1] p-0.5 rounded-xl border border-[#302541]">
              <button
                type="button"
                onClick={() => {
                  setCanvasMode('fixed');
                  if (onSound) onSound('pop');
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                  canvasMode === 'fixed'
                    ? 'bg-[#FF385C] text-white shadow-[1px_1px_0px_#302541]'
                    : 'text-[#746B7C] hover:text-[#302541]'
                }`}
                title="Fixed Canvas: Boundary with custom/preset size"
              >
                <Layout className="w-3 h-3" />
                <span>Fixed</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCanvasMode('infinite');
                  if (onSound) onSound('pop');
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                  canvasMode === 'infinite'
                    ? 'bg-[#FF385C] text-white shadow-[1px_1px_0px_#302541]'
                    : 'text-[#746B7C] hover:text-[#302541]'
                }`}
                title="Infinite Canvas: Expands seamlessly inside the viewport"
              >
                <InfinityIcon className="w-3 h-3" />
                <span>Infinite</span>
              </button>
            </div>

            {/* Canvas Size Trigger Button */}
            {canvasMode === 'fixed' && (
              <button
                type="button"
                onClick={() => {
                  setCustomSizeInput({
                    width: String(canvasSize.width),
                    height: String(canvasSize.height),
                    presetId: canvasSize.presetId || 'landscape',
                  });
                  setCustomInputError('');
                  setShowSizeModal(true);
                  if (onSound) onSound('click');
                }}
                className="px-2.5 py-1 rounded-xl bg-[#FFFAF1] hover:bg-[#FFD978] text-[#302541] border border-[#302541] font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Change canvas size or choose preset"
              >
                <Sliders className="w-3 h-3 text-[#302541]" />
                <span className="font-mono text-[11px] font-bold">
                  {canvasSize.width}×{canvasSize.height}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* BRUSH POPUP MENU */}
        {openDrawer === 'brush' && (
          <div className="bg-white p-2.5 rounded-2xl border-2 border-[#302541] shadow-sm animate-in fade-in duration-100">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#302541]/10 mb-2">
              <span className="text-[11px] font-black text-[#302541]">Brush Style</span>
              <button
                type="button"
                onClick={() => setOpenDrawer(null)}
                className="text-[11px] text-[#746B7C] hover:text-[#302541] font-bold"
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {BRUSHES.map(b => {
                const isActive = brushType === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBrushType(b.id);
                      setBrushSize(b.defaultSize);
                      setTool('brush');
                      if (onSound) onSound('click');
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#302541] text-white shadow-[1px_1px_0px_#FFD978]'
                        : 'bg-[#FFFAF1] text-[#302541] border border-[#302541]/30 hover:border-[#302541]'
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SHAPE POPUP MENU */}
        {openDrawer === 'shape' && (
          <div className="bg-white p-2.5 rounded-2xl border-2 border-[#302541] shadow-sm space-y-2 animate-in fade-in duration-100">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#302541]/10">
              <span className="text-[11px] font-black text-[#302541]">Select Shape</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-black text-[#302541] cursor-pointer bg-[#FFFAF1] px-2 py-0.5 rounded-lg border border-[#302541]/40">
                  <input
                    type="checkbox"
                    checked={shapeFill}
                    onChange={(e) => setShapeFill(e.target.checked)}
                    className="rounded accent-[#FF385C]"
                  />
                  <span>Fill Color</span>
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDrawer(null)}
                  className="text-[11px] text-[#746B7C] hover:text-[#302541] font-bold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {ALL_SHAPES.map(s => {
                const Icon = s.icon;
                const isActive = shapeType === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setShapeType(s.id);
                      setTool('shape');
                      if (onSound) onSound('click');
                    }}
                    className={`px-2 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#FF385C] text-white shadow-[1px_1px_0px_#302541]'
                        : 'bg-[#FFFAF1] text-[#302541] border border-[#302541]/30 hover:border-[#302541]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ROW 2: UNIFIED SETTINGS BAR (Sliders + Colors in one clean line) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#302541]/10">
          {/* Sliders Area */}
          <div className="flex flex-wrap items-center gap-4 flex-1 min-w-[280px]">
            {/* Size Slider */}
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <span className="text-xs font-black text-[#302541] whitespace-nowrap">
                {tool === 'eraser' ? 'Eraser' : tool === 'shape' ? 'Outline' : 'Size'}:
              </span>
              <input
                type="range"
                min="1"
                max={tool === 'eraser' ? '120' : tool === 'shape' ? '40' : '80'}
                value={tool === 'eraser' ? eraserSize : tool === 'shape' ? shapeSize : brushSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (tool === 'eraser') setEraserSize(val);
                  else if (tool === 'shape') setShapeSize(val);
                  else setBrushSize(val);
                }}
                className="flex-1 accent-[#FF385C] cursor-pointer h-1.5"
              />
              <span className="tabular-nums font-mono text-[11px] font-bold text-[#302541] w-8">
                {tool === 'eraser' ? `${eraserSize}px` : tool === 'shape' ? `${shapeSize}px` : `${brushSize}px`}
              </span>
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <span className="text-xs font-black text-[#302541] whitespace-nowrap">Opacity:</span>
              <input
                type="range"
                min="3"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="flex-1 accent-[#FF385C] cursor-pointer h-1.5"
              />
              <span className="tabular-nums font-mono text-[11px] font-bold text-[#302541] w-8">
                {opacity}%
              </span>
            </div>

            {/* Fill Tolerance when bucket selected */}
            {tool === 'bucket' && (
              <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                <span className="text-xs font-black text-[#302541] whitespace-nowrap">Tolerance:</span>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={fillTolerance}
                  onChange={(e) => setFillTolerance(Number(e.target.value))}
                  className="flex-1 accent-[#FF385C] cursor-pointer h-1.5"
                />
                <span className="tabular-nums font-mono text-[11px] font-bold text-[#302541] w-8">
                  {fillTolerance}%
                </span>
              </div>
            )}
          </div>

          {/* Color Picker & Quick Dots (Hidden only for eraser) */}
          {tool !== 'eraser' && (
            <div className="flex items-center gap-2 shrink-0">
              <label 
                style={{ backgroundColor: color }}
                className="w-6 h-6 rounded-lg border-2 border-[#302541] cursor-pointer shadow-[1px_1px_0px_#302541] relative overflow-hidden"
                title="Custom color"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>

              {/* Fast Palette Dots */}
              <div className="flex items-center gap-1">
                {QUICK_PALETTES[0].colors.slice(0, 6).map((c, idx) => (
                  <button
                    key={`quick-${c}-${idx}`}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      if (onSound) onSound('pop');
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-3.5 h-3.5 rounded-full border border-[#302541] cursor-pointer transition-transform ${
                      color.toLowerCase() === c.toLowerCase() ? 'scale-125 ring-2 ring-[#FF385C]' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. CANVAS VIEWPORT & FLOATING OVERLAY CONTROLS (ZOOM IS DIRECTLY ON CANVAS!) */}
      <div 
        ref={containerRef}
        className={`w-full h-[520px] sm:h-[600px] rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] overflow-hidden relative select-none ${
          canvasMode === 'infinite'
            ? bgType === 'transparent'
              ? 'bg-[repeating-conic-gradient(#D1D5DB_0%_25%,_#FFFFFF_0%_50%)_50%_/_16px_16px]'
              : bgType === 'cream'
                ? 'bg-[#FFFAF1]'
                : bgType === 'custom'
                  ? ''
                  : 'bg-white'
            : 'bg-[#E5E7EB]'
        }`}
        style={canvasMode === 'infinite' && bgType === 'custom' ? { backgroundColor: customBgColor || '#FFE2D8' } : undefined}
      >
        {/* CANVAS FLOATING ZOOM SUITE (PLACED DIRECTLY ON TOP OF CANVAS IN HIGHLY VISIBLE DOCK) */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border-2 border-[#302541] shadow-[3px_3px_0px_#302541]">
          <span className="text-[10px] font-black uppercase text-[#746B7C] mr-0.5">Zoom:</span>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-xl border border-[#302541] bg-[#FFFAF1] hover:bg-[#FFD978] flex items-center justify-center cursor-pointer disabled:opacity-35 transition-transform active:scale-95"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5 text-[#302541]" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-0.5 text-xs font-black text-[#302541] hover:bg-gray-100 rounded-lg tabular-nums"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-xl border border-[#302541] bg-[#FFFAF1] hover:bg-[#FFD978] flex items-center justify-center cursor-pointer disabled:opacity-35 transition-transform active:scale-95"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5 text-[#302541]" />
          </button>

          {zoom !== 1.0 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="w-7 h-7 rounded-xl border border-[#302541] bg-[#FFE2D8] hover:bg-[#FFD978] flex items-center justify-center cursor-pointer ml-0.5 transition-transform active:scale-95"
              title="Reset 100% (Fit)"
            >
              <Maximize2 className="w-3 h-3 text-[#302541]" />
            </button>
          )}
        </div>

        {/* Selected Text Quick Action Floating Bar */}
        {selectedTextId && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-[#302541] shadow-[3px_3px_0px_#302541] animate-in fade-in zoom-in-95">
            <span className="text-xs font-black text-[#302541]">Text Selected:</span>
            <button
              type="button"
              onClick={() => {
                const item = textItems.find(t => t.id === selectedTextId);
                if (item) handleEditSelectedText(item);
              }}
              className="px-2.5 py-1 rounded-xl bg-[#FFD978] border border-[#302541] text-xs font-black flex items-center gap-1 cursor-pointer hover:bg-[#ffe399] transition-transform active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Text
            </button>
            <button
              type="button"
              onClick={() => handleDeleteSelectedText(selectedTextId)}
              className="px-2.5 py-1 rounded-xl bg-[#FFE2D8] border border-[#302541] text-xs font-black text-[#FF385C] flex items-center gap-1 cursor-pointer hover:bg-[#FF385C] hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              type="button"
              onClick={handleDeselectText}
              className="px-2.5 py-1 rounded-xl bg-gray-100 border border-[#302541] text-xs font-black text-[#746B7C] flex items-center gap-1 cursor-pointer hover:bg-gray-200 hover:text-[#302541] transition-colors"
              title="Discard / Deselect Text (Esc)"
            >
              <X className="w-3.5 h-3.5" /> Discard
            </button>
          </div>
        )}

        {/* Canvas Scaled Inner Wrapper */}
        <div
          ref={viewportRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.08s ease-out',
            width: `${activeCanvasWidth}px`,
            height: `${activeCanvasHeight}px`,
            marginLeft: `-${activeCanvasWidth / 2}px`,
            marginTop: `-${activeCanvasHeight / 2}px`,
            background: canvasMode === 'infinite'
              ? 'transparent'
              : bgType === 'transparent'
                ? 'repeating-conic-gradient(#D1D5DB 0% 25%, #FFFFFF 0% 50%) 50% / 16px 16px'
                : bgType === 'cream' 
                  ? '#FFFAF1' 
                  : bgType === 'custom' 
                    ? customBgColor 
                    : '#FFFFFF',
          }}
          className={`absolute left-1/2 top-1/2 touch-none select-none ${
            tool === 'pan' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          } ${
            canvasMode === 'fixed'
              ? 'shadow-[0_10px_30px_rgba(48,37,65,0.18)] border-2 border-[#302541]/40 rounded-sm'
              : 'border-0 shadow-none'
          }`}
        >
          {/* Layer 1: Main Artwork Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />

          {/* Layer 2: Interactive Text Objects (With full WYSIWYG styles) */}
          {textItems.map(item => {
            const isSelected = selectedTextId === item.id;
            const fontDef = FONT_FAMILIES.find(f => f.id === item.fontFamily) || FONT_FAMILIES[0];
            const alignClass = item.align === 'center' ? 'text-center' : item.align === 'right' ? 'text-right' : 'text-left';
            const transformOrigin = item.align === 'center' ? '-translate-x-1/2' : item.align === 'right' ? '-translate-x-full' : '';

            return (
              <div
                key={item.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedTextId(item.id);
                  const pt = getCoords(e);
                  textDragOffsetRef.current = {
                    x: pt.x - item.x,
                    y: pt.y - item.y,
                  };
                  setIsDraggingText(true);
                  if (onSound) onSound('click');
                  if (e.currentTarget && e.currentTarget.setPointerCapture) {
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch (_) {}
                  }
                }}
                onPointerMove={(e) => {
                  if (isDraggingText && selectedTextId === item.id) {
                    e.stopPropagation();
                    const currentPt = getCoords(e);
                    setTextItems(prev => prev.map(t => {
                      if (t.id === item.id) {
                        return {
                          ...t,
                          x: Math.round(currentPt.x - textDragOffsetRef.current.x),
                          y: Math.round(currentPt.y - textDragOffsetRef.current.y),
                        };
                      }
                      return t;
                    }));
                  }
                }}
                onPointerUp={(e) => {
                  if (isDraggingText && selectedTextId === item.id) {
                    e.stopPropagation();
                    setIsDraggingText(false);
                    if (e.currentTarget && e.currentTarget.releasePointerCapture) {
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      } catch (_) {}
                    }
                    pushHistory();
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setSelectedTextId(item.id);
                  handleEditSelectedText(item);
                }}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  color: item.color,
                  fontSize: `${item.fontSize}px`,
                  lineHeight: '1.25',
                  fontWeight: item.isBold !== false ? 700 : 400,
                  fontStyle: item.isItalic ? 'italic' : 'normal',
                  textDecoration: item.isUnderline ? 'underline' : 'none',
                  textAlign: item.align || 'left',
                  cursor: isDraggingText && isSelected ? 'grabbing' : 'grab',
                }}
                className={`absolute select-none whitespace-pre transition-shadow z-20 group ${fontDef.style} ${alignClass} ${transformOrigin} ${
                  isSelected 
                    ? 'ring-2 ring-dashed ring-[#FF385C] bg-[#FF385C]/15 rounded px-2 -mx-2 py-1 -my-1 shadow-md' 
                    : 'hover:ring-1 hover:ring-dashed hover:ring-[#302541]/40 rounded px-1 -mx-1 py-0.5 -my-0.5'
                }`}
                title="Klik untuk select dan geser, klik 2x untuk edit"
              >
                {item.text}
                {/* Visual badges when selected: drag handle & quick discard button */}
                {isSelected && (
                  <>
                    <div 
                      className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#FF385C] text-white flex items-center justify-center shadow border border-white cursor-grab pointer-events-none animate-in zoom-in-75"
                      title="Drag to move"
                    >
                      <Move className="w-3 h-3" />
                    </div>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handleDeselectText();
                      }}
                      className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-white text-[#302541] hover:bg-[#FF385C] hover:text-white flex items-center justify-center shadow-md border-2 border-[#302541] cursor-pointer transition-colors active:scale-90 animate-in zoom-in-75"
                      title="Discard / Deselect Text (Esc)"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {/* Layer 3: Realtime Active Stroke & Shape Overlay Canvas */}
          <canvas
            ref={overlayCanvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              touchAction: 'none',
              pointerEvents: 'auto',
              opacity: tool === 'brush'
                ? (currentBrush.isHighlighter ? Math.min(1, (opacity / 100) * 0.5) : opacity / 100)
                : Math.max(0.15, (opacity / 100) * 0.4),
            }}
            className="w-full h-full absolute inset-0 block touch-none"
          />

          {/* Layer 4: Eyedropper Live Preview Loupe */}
          {tool === 'eyedropper' && eyedropperPreview && (
            <div
              style={{
                left: `${eyedropperPreview.x}px`,
                top: `${eyedropperPreview.y}px`,
              }}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-full -mt-3 z-30 flex flex-col items-center animate-in zoom-in-75"
            >
              <div className="flex items-center gap-1.5 bg-white/95 px-2 py-1 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541]">
                <div
                  className="w-4 h-4 rounded-full border border-[#302541]"
                  style={{ backgroundColor: eyedropperPreview.color }}
                />
                <span className="text-[11px] font-black text-[#302541] font-mono">
                  {eyedropperPreview.color.toUpperCase()}
                </span>
              </div>
              <div className="w-2 h-2 bg-white border-r-2 border-b-2 border-[#302541] rotate-45 -mt-1.5" />
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL DIALOG: FULL WYSIWYG TEXT EDITOR (COMPACT - NO SCROLL) */}
      {textModalData && typeof document !== 'undefined' && createPortal(
        <div
          role="presentation"
          onClick={() => setTextModalData(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#302541]/70 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wysiwyg-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[460px] rounded-[24px] border-[3px] border-[#302541] bg-[#FFFAF1] shadow-[8px_8px_0px_#302541] animate-in zoom-in-95 duration-150 p-4 sm:p-5 space-y-3"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#302541]/10">
              <h3 id="wysiwyg-dialog-title" className="font-display text-base font-black text-[#302541] flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#FFE2D8] border border-[#302541] text-[#FF385C]">
                  <Type className="w-3.5 h-3.5" />
                </span>
                <span>{textModalData.isNew ? 'Insert Text' : 'Edit Text'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setTextModalData(null)}
                className="w-7 h-7 rounded-lg border-2 border-[#302541] bg-white hover:bg-[#FFE2D8] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-[#302541]" />
              </button>
            </div>

            {/* WYSIWYG Formatting Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-white rounded-xl border-2 border-[#302541]">
              {/* Font Family Dropdown */}
              <div className="relative">
                <select
                  value={textModalData.fontFamily || 'sans'}
                  onChange={(e) => setTextModalData(prev => ({ ...prev, fontFamily: e.target.value }))}
                  className="appearance-none bg-[#FFFAF1] border border-[#302541] rounded-lg px-2 py-1 pr-6 text-[11px] font-black text-[#302541] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FFD978]"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#302541] pointer-events-none" />
              </div>

              {/* Bold, Italic, Underline */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTextModalData(prev => ({ ...prev, isBold: !prev.isBold }))}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    textModalData.isBold
                      ? 'bg-[#FF385C] text-white border-[#302541] shadow-[1px_1px_0px_#302541]'
                      : 'bg-[#FFFAF1] text-[#302541] border-[#302541]/30 hover:border-[#302541]'
                  }`}
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTextModalData(prev => ({ ...prev, isItalic: !prev.isItalic }))}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    textModalData.isItalic
                      ? 'bg-[#FF385C] text-white border-[#302541] shadow-[1px_1px_0px_#302541]'
                      : 'bg-[#FFFAF1] text-[#302541] border-[#302541]/30 hover:border-[#302541]'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTextModalData(prev => ({ ...prev, isUnderline: !prev.isUnderline }))}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    textModalData.isUnderline
                      ? 'bg-[#FF385C] text-white border-[#302541] shadow-[1px_1px_0px_#302541]'
                      : 'bg-[#FFFAF1] text-[#302541] border-[#302541]/30 hover:border-[#302541]'
                  }`}
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Alignments */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTextModalData(prev => ({ ...prev, align: 'left' }))}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    (textModalData.align || 'left') === 'left'
                      ? 'bg-[#FFD978] text-[#302541] border-[#302541] shadow-[1px_1px_0px_#302541]'
                      : 'bg-[#FFFAF1] text-[#302541] border-[#302541]/30 hover:border-[#302541]'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTextModalData(prev => ({ ...prev, align: 'center' }))}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    textModalData.align === 'center'
                      ? 'bg-[#FFD978] text-[#302541] border-[#302541] shadow-[1px_1px_0px_#302541]'
                      : 'bg-[#FFFAF1] text-[#302541] border-[#302541]/30 hover:border-[#302541]'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTextModalData(prev => ({ ...prev, align: 'right' }))}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    textModalData.align === 'right'
                      ? 'bg-[#FFD978] text-[#302541] border-[#302541] shadow-[1px_1px_0px_#302541]'
                      : 'bg-[#FFFAF1] text-[#302541] border-[#302541]/30 hover:border-[#302541]'
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Color Swatch */}
              <label 
                style={{ backgroundColor: textModalData.color }}
                className="w-6 h-6 rounded-lg border-2 border-[#302541] cursor-pointer shadow-[1px_1px_0px_#302541] relative overflow-hidden"
                title="Pick text color"
              >
                <input
                  type="color"
                  value={textModalData.color}
                  onChange={(e) => setTextModalData(prev => ({ ...prev, color: e.target.value }))}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>

            {/* WYSIWYG Text Input Area (Fixed compact height, no scrolling needed) */}
            <textarea
              autoFocus
              value={textModalData.text}
              onChange={(e) => setTextModalData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Type your text here..."
              rows={3}
              style={{
                color: textModalData.color,
                fontSize: `${Math.min(26, Math.max(14, textModalData.fontSize))}px`,
                fontWeight: textModalData.isBold !== false ? 700 : 400,
                fontStyle: textModalData.isItalic ? 'italic' : 'normal',
                textDecoration: textModalData.isUnderline ? 'underline' : 'none',
                textAlign: textModalData.align || 'left',
              }}
              className={`w-full bg-white p-3 rounded-xl border-2 border-[#302541] focus:outline-none focus:ring-2 focus:ring-[#FFD978] leading-tight resize-none ${
                (FONT_FAMILIES.find(f => f.id === textModalData.fontFamily) || FONT_FAMILIES[0]).style
              }`}
            />

            {/* Font Size & Quick Colors in One Row */}
            <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border-2 border-[#302541]">
              <div className="flex flex-col justify-center">
                <div className="flex items-center justify-between text-[11px] font-black text-[#302541] mb-1">
                  <span>Size</span>
                  <span className="font-mono text-[10px]">{textModalData.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="64"
                  value={textModalData.fontSize}
                  onChange={(e) => setTextModalData(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                  className="w-full accent-[#FF385C] cursor-pointer h-1.5"
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-black text-[#302541] mb-1">Quick Colors</span>
                <div className="flex items-center gap-1">
                  {['#302541', '#FF385C', '#FF5500', '#FFD978', '#00FF66', '#00F0FF', '#7000FF', '#FFFFFF'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTextModalData(prev => ({ ...prev, color: c }))}
                      style={{ backgroundColor: c }}
                      className={`w-4 h-4 rounded-md border border-[#302541] cursor-pointer transition-transform ${
                        textModalData.color.toLowerCase() === c.toLowerCase() ? 'scale-125 ring-1 ring-[#FF385C]' : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTextModalData(null)}
                className="flex-1 rounded-xl border-2 border-[#302541] bg-white px-3 py-2 text-xs font-black text-[#302541] hover:bg-[#FFE2D8] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTextModal}
                disabled={!textModalData.text.trim()}
                className="flex-1 rounded-xl border-2 border-[#302541] bg-[#FF385C] px-3 py-2 text-xs font-black text-white hover:bg-[#ff5273] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 cursor-pointer disabled:opacity-40"
              >
                {textModalData.isNew ? 'Place Text' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. MODAL KONFIRMASI CLEAR KANVAS (PORTAL TO BODY) */}
      {showClearModal && typeof document !== 'undefined' && createPortal(
        <div
          role="presentation"
          onClick={() => setShowClearModal(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#302541]/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-canvas-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[28px] border-[3px] border-[#302541] bg-[#FFFAF1] p-6 text-center shadow-[8px_8px_0px_#302541] animate-in zoom-in-95 duration-150"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#302541] bg-[#FFE2D8] text-2xl shadow-[2px_2px_0px_#302541]">
              🎨
            </div>
            <h3 id="clear-canvas-title" className="font-display text-xl font-black text-[#302541]">
              Clear entire canvas?
            </h3>
            <p className="mt-2 text-xs sm:text-sm font-bold text-[#746B7C] leading-relaxed">
              All strokes and text items will be cleared. Your canvas background color will stay the same, and you can undo this action.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 rounded-xl border-2 border-[#302541] bg-white px-3 py-2.5 text-xs sm:text-sm font-black text-[#302541] hover:bg-[#FFE2D8] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClear}
                className="flex-1 rounded-xl border-2 border-[#302541] bg-[#FF385C] px-3 py-2.5 text-xs sm:text-sm font-black text-white hover:bg-[#ff5273] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 cursor-pointer"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 6. CANVAS SIZE MODAL */}
      {showSizeModal && typeof document !== 'undefined' && createPortal(
        <div
          role="presentation"
          onClick={() => setShowSizeModal(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#302541]/70 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="canvas-size-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border-[3px] border-[#302541] bg-[#FFFAF1] shadow-[8px_8px_0px_#302541] animate-in zoom-in-95 duration-150"
          >
            <div className="flex shrink-0 items-center justify-between border-b-2 border-[#302541]/10 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#302541] bg-[#FFD978] text-lg shadow-[2px_2px_0px_#302541]">📐</div>
                <div>
                  <h3 id="canvas-size-title" className="font-display text-base font-black leading-tight text-[#302541] sm:text-lg">Canvas Size</h3>
                  <p className="mt-0.5 text-xs font-semibold text-[#746B7C]">Pick a template or set your own size.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                aria-label="Close canvas size dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#302541] bg-white text-[#302541] transition hover:bg-[#FFE2D8] active:scale-90"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#746B7C]">Templates</h4>
                  <span className="rounded-full bg-[#302541]/8 px-2.5 py-1 text-[10px] font-bold text-[#746B7C]">{CANVAS_PRESETS.length} sizes</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {CANVAS_PRESETS.map((p) => {
                    const isSelected = customSizeInput.presetId === p.id;
                    const ratio = p.width / p.height;
                    const previewW = ratio >= 1 ? 34 : Math.max(13, Math.round(34 * ratio));
                    const previewH = ratio <= 1 ? 34 : Math.max(13, Math.round(34 / ratio));
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setCustomSizeInput({ width: String(p.width), height: String(p.height), presetId: p.id });
                          setCustomInputError('');
                          if (onSound) onSound('click');
                        }}
                        className={`flex min-w-0 items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all cursor-pointer ${isSelected ? 'border-[#302541] bg-[#FFD978] shadow-[2px_2px_0px_#302541]' : 'border-[#302541]/20 bg-white hover:border-[#302541]/60 hover:bg-[#FFF9F2]'}`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#302541]/10 bg-[#FFFAF1]">
                          <div style={{ width: `${previewW}px`, height: `${previewH}px` }} className={`rounded-sm border-2 ${isSelected ? 'border-[#302541] bg-[#FF385C]' : 'border-[#FF385C] bg-[#FF385C]/25'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-black text-[#302541]">{p.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#302541]" />}
                          </div>
                          <p className="mt-1 text-[11px] font-semibold text-[#746B7C]">{p.width} × {p.height}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border-2 border-[#302541] bg-white p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#302541]">Custom Size</h4>
                  <span className="text-[11px] font-bold text-[#746B7C]">Pixels (px)</span>
                </div>
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:gap-3">
                  <div className="min-w-0">
                    <label htmlFor="canvas-width" className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-[#746B7C]">Width</label>
                    <input
                      id="canvas-width"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customSizeInput.width}
                      placeholder="1920"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCustomSizeInput(prev => ({ ...prev, width: val, presetId: 'custom' }));
                        setCustomInputError('');
                      }}
                      className="w-full rounded-xl border-2 border-[#302541]/25 bg-[#FFFAF1] px-3 py-2.5 font-mono text-sm font-black text-[#302541] outline-none transition focus:border-[#FF385C] focus:ring-2 focus:ring-[#FFD978]"
                    />
                  </div>
                  <span className="hidden pb-2 text-lg font-black text-[#302541] sm:block">×</span>
                  <div className="min-w-0">
                    <label htmlFor="canvas-height" className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-[#746B7C]">Height</label>
                    <input
                      id="canvas-height"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customSizeInput.height}
                      placeholder="1080"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCustomSizeInput(prev => ({ ...prev, height: val, presetId: 'custom' }));
                        setCustomInputError('');
                      }}
                      className="w-full rounded-xl border-2 border-[#302541]/25 bg-[#FFFAF1] px-3 py-2.5 font-mono text-sm font-black text-[#302541] outline-none transition focus:border-[#FF385C] focus:ring-2 focus:ring-[#FFD978]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FFFAF1] px-3 py-2 sm:min-w-[125px] sm:flex-col sm:items-start sm:justify-center">
                    <span className="text-[10px] font-black uppercase tracking-wide text-[#746B7C]">Preview</span>
                    {(() => {
                      const numW = Math.max(1, Number(customSizeInput.width) || 1);
                      const numH = Math.max(1, Number(customSizeInput.height) || 1);
                      const scale = Math.min(38 / numW, 38 / numH);
                      return <div className="flex h-10 flex-1 items-center justify-center sm:w-full sm:flex-none"><div style={{ width: `${Math.max(5, numW * scale)}px`, height: `${Math.max(5, numH * scale)}px` }} className="rounded-sm border-2 border-[#FF385C] bg-[#FF385C]/20" /></div>;
                    })()}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#302541]">{Number(customSizeInput.width) || 0} × {Number(customSizeInput.height) || 0} px</p>
                  <p className="text-[10px] font-medium text-[#746B7C]">Max 8000 px per side</p>
                </div>
                {customInputError && <p role="alert" className="mt-3 rounded-xl border border-[#FF385C]/30 bg-[#FFE2D8] px-3 py-2 text-xs font-bold text-[#FF385C]">⚠️ {customInputError}</p>}
              </section>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t-2 border-[#302541]/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="rounded-xl border-2 border-[#302541] bg-white px-5 py-2.5 text-xs font-black text-[#302541] shadow-[2px_2px_0px_#302541] transition hover:bg-[#FFE2D8] active:translate-y-0.5 cursor-pointer sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const w = parseInt(customSizeInput.width, 10);
                  const h = parseInt(customSizeInput.height, 10);
                  if (!w || !h || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
                    setCustomInputError('Enter a width and height greater than 0.');
                    return;
                  }
                  if (w > 8000 || h > 8000) {
                    setCustomInputError('Each dimension must be 8000 px or less.');
                    return;
                  }
                  setCanvasSize({ width: w, height: h, presetId: customSizeInput.presetId || 'custom' });
                  setCanvasMode('fixed');
                  setPan({ x: 0, y: 0 });
                  setShowSizeModal(false);
                  if (onSound) onSound('coin');
                }}
                className="rounded-xl border-2 border-[#302541] bg-[#FF385C] px-5 py-2.5 text-xs font-black text-white shadow-[2px_2px_0px_#302541] transition hover:bg-[#ff5273] active:translate-y-0.5 cursor-pointer sm:text-sm"
              >
                Apply Size
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
