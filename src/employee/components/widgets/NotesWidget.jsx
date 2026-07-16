import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addNote, deleteNote } from '../../store/slices/notesSlice';

const NotesWidget = () => {
  const dispatch = useAppDispatch();
  const { notes } = useAppSelector((state) => state.notes);
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 });
  const [widgetPosition, setWidgetPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isIconDragging, setIsIconDragging] = useState(false);
  const iconRef = useRef(null);
  const widgetRef = useRef(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Load saved positions
  useEffect(() => {
    const savedIconPos = localStorage.getItem('notesIconPosition');
    const savedWidgetPos = localStorage.getItem('notesWidgetPosition');
    
    if (savedIconPos) {
      const pos = JSON.parse(savedIconPos);
      setIconPosition(pos);
    } else {
      // Default: bottom right
      setIconPosition({ 
        x: window.innerWidth - 80, 
        y: window.innerHeight - 120 
      });
    }
    
    if (savedWidgetPos) {
      const pos = JSON.parse(savedWidgetPos);
      setWidgetPosition(pos);
    } else {
      setWidgetPosition({ 
        x: window.innerWidth - 360, 
        y: window.innerHeight - 400 
      });
    }
    setIsFirstRender(false);
  }, []);

  // Save positions when they change
  useEffect(() => {
    if (!isFirstRender) {
      localStorage.setItem('notesIconPosition', JSON.stringify(iconPosition));
    }
  }, [iconPosition, isFirstRender]);

  useEffect(() => {
    if (!isFirstRender) {
      localStorage.setItem('notesWidgetPosition', JSON.stringify(widgetPosition));
    }
  }, [widgetPosition, isFirstRender]);

  // Keep icons in bounds on resize
  useEffect(() => {
    const handleResize = () => {
      const iconSize = 56;
      const maxX = window.innerWidth - iconSize;
      const maxY = window.innerHeight - iconSize;
      
      setIconPosition(prev => ({
        x: Math.min(prev.x, maxX),
        y: Math.min(prev.y, maxY)
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Icon Drag Handlers ---
  const handleIconMouseDown = (e) => {
    e.stopPropagation();
    setIsIconDragging(true);
    const rect = iconRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleIconMouseMove = (e) => {
    if (!isIconDragging || !iconRef.current) return;
    
    const iconSize = 56;
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    const maxX = window.innerWidth - iconSize;
    const maxY = window.innerHeight - iconSize;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setIconPosition({
      x: newX,
      y: newY
    });
  };

  const handleIconMouseUp = () => {
    if (isIconDragging) {
      setIsIconDragging(false);
    }
  };

  // --- Widget Drag Handlers ---
  const handleWidgetMouseDown = (e) => {
    if (e.target.closest('.widget-actions')) return;
    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleWidgetMouseMove = (e) => {
    if (!isDragging || !widgetRef.current) return;
    
    const widgetWidth = widgetRef.current.offsetWidth;
    const widgetHeight = widgetRef.current.offsetHeight;
    
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    const maxX = window.innerWidth - widgetWidth;
    const maxY = window.innerHeight - widgetHeight;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setWidgetPosition({
      x: newX,
      y: newY
    });
  };

  const handleWidgetMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Global event listeners for dragging
  useEffect(() => {
    if (isIconDragging) {
      window.addEventListener('mousemove', handleIconMouseMove);
      window.addEventListener('mouseup', handleIconMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleIconMouseMove);
        window.removeEventListener('mouseup', handleIconMouseUp);
      };
    }
  }, [isIconDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleWidgetMouseMove);
      window.addEventListener('mouseup', handleWidgetMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleWidgetMouseMove);
        window.removeEventListener('mouseup', handleWidgetMouseUp);
      };
    }
  }, [isDragging]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      dispatch(addNote(newNote.trim()));
      setNewNote('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const handleIconClick = () => {
    if (!isIconDragging) {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Draggable Floating Icon */}
      <div
        ref={iconRef}
        className={`floating-icon fixed w-14 h-14 rounded-full bg-[#EEAD16] shadow-lg flex items-center justify-center z-[1000] transition-transform active:scale-95 hover:scale-105 ${isIconDragging ? 'scale-110 shadow-2xl cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${iconPosition.x}px`,
          top: `${iconPosition.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
        onMouseDown={handleIconMouseDown}
        onClick={handleIconClick}
      >
        <i className="fas fa-sticky-note text-white text-2xl pointer-events-none"></i>
        {notes.length > 0 && (
          <span className="floating-badge absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center border-2 border-white pointer-events-none">
            {notes.length}
          </span>
        )}
        {/* Drag handle indicator */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-300 dark:bg-yellow-600 rounded-full border-2 border-white dark:border-gray-800 opacity-60 pointer-events-none"></div>
      </div>

      {/* Widget Panel */}
      {isOpen && (
        <div
          ref={widgetRef}
          className={`widget-panel fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[1001] flex flex-col overflow-hidden transition-shadow ${isDragging ? 'shadow-2xl scale-[1.01]' : 'shadow-lg'}`}
          style={{
            left: `${widgetPosition.x}px`,
            top: `${widgetPosition.y}px`,
            width: '320px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          <div
            className="widget-header bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-orange-500 text-gray-800 dark:text-white p-3.5 flex justify-between items-center cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleWidgetMouseDown}
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <i className="fas fa-sticky-note"></i> Sticky Notes
            </h3>
            <div className="widget-actions flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-black/10 dark:bg-white/20 border-none text-gray-700 dark:text-white w-7 h-7 rounded-md text-xs cursor-pointer hover:bg-black/20 dark:hover:bg-white/30 transition-colors"
                title="Minimize"
              >
                <i className="fas fa-compress"></i>
              </button>
            </div>
          </div>
          
          <div className="widget-content flex flex-col h-[300px] p-3 overflow-hidden">
            <ul className="notes-list list-none flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {notes.length === 0 ? (
                <li className="text-center text-gray-400 dark:text-gray-500 text-xs py-4">
                  No notes yet. Add one below!
                </li>
              ) : (
                notes.map((note, idx) => (
                  <li key={idx} className="note-item bg-yellow-50 dark:bg-gray-700 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-lg p-3 mb-2.5 relative group">
                    <div className="note-text text-sm text-gray-700 dark:text-gray-200 mb-2 pr-6">
                      {note.text}
                    </div>
                    <small className="note-date text-[10px] text-gray-400 dark:text-gray-500 block">
                      {note.date}
                    </small>
                    <button
                      onClick={() => dispatch(deleteNote(idx))}
                      className="note-delete absolute top-2 right-2 bg-none border-none text-red-400 dark:text-red-500 cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </li>
                ))
              )}
            </ul>
            
            <div className="add-note-form flex flex-col gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={handleKeyPress}
                rows="2"
                placeholder="Write a note... (Enter to save)"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 font-poppins text-sm text-gray-700 dark:text-gray-200 resize-y outline-none focus:border-yellow-400 dark:focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 dark:focus:ring-yellow-500 transition-all"
              />
              <button
                onClick={handleAddNote}
                className="bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 border-none rounded-lg py-2 font-semibold cursor-pointer text-white transition-colors"
              >
                <i className="fas fa-save"></i> Add Note
              </button>
            </div>
          </div>
          
          <div className="widget-footer p-2.5 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-700">
            <span>{notes.length}</span> notes
          </div>
        </div>
      )}
    </>
  );
};

export default NotesWidget;