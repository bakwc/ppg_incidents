import { useState, useRef, useEffect } from 'react';

export default function HintPopup({ hint, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState('left');
  const timeoutRef = useRef(null);
  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  if (!hint) return null;

  const getDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const isMouseNearButton = () => {
    if (!buttonRef.current) return false;
    const rect = buttonRef.current.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    const buttonCenterY = rect.top + rect.height / 2;
    const distance = getDistance(mousePositionRef.current.x, mousePositionRef.current.y, buttonCenterX, buttonCenterY);
    return distance < 30;
  };

  const isMouseOverPopup = () => {
    if (!popupRef.current) return false;
    const rect = popupRef.current.getBoundingClientRect();
    const { x, y } = mousePositionRef.current;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  };

  const handleMouseMove = (e) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 320;
      const spaceOnRight = window.innerWidth - rect.left;
      
      if (spaceOnRight < popupWidth) {
        setPosition('right');
      } else {
        setPosition('left');
      }
    }
    
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    const checkAndClose = () => {
      if (!isMouseNearButton() && !isMouseOverPopup()) {
        setIsOpen(false);
      } else {
        timeoutRef.current = setTimeout(checkAndClose, 200);
      }
    };
    
    timeoutRef.current = setTimeout(checkAndClose, 200);
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-300 hover:border-slate-500/50 transition-all cursor-help"
      >
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div 
          ref={popupRef}
          className={`absolute z-50 w-80 p-3 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 leading-relaxed ${
            position === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className={`absolute -top-1.5 w-3 h-3 bg-slate-800 border-l border-t border-slate-700 rotate-45 pointer-events-none ${
            position === 'right' ? 'right-3' : 'left-3'
          }`} />
          {hint}
        </div>
      )}
    </div>
  );
}


