import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addTask, toggleTask, deleteTask, clearCompletedTasks } from '../../store/slices/tasksSlice';

const TaskWidget = () => {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);
  const [isOpen, setIsOpen] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 });
  const [widgetPosition, setWidgetPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isIconDragging, setIsIconDragging] = useState(false);
  const iconRef = useRef(null);
  const widgetRef = useRef(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const pendingCount = tasks.filter(t => !t.completed).length;

  // Load saved positions
  useEffect(() => {
    const savedIconPos = localStorage.getItem('taskIconPosition');
    const savedWidgetPos = localStorage.getItem('taskWidgetPosition');
    
    if (savedIconPos) {
      const pos = JSON.parse(savedIconPos);
      setIconPosition(pos);
    } else {
      // Default: above notes icon
      setIconPosition({ 
        x: window.innerWidth - 80, 
        y: window.innerHeight - 200 
      });
    }
    
    if (savedWidgetPos) {
      const pos = JSON.parse(savedWidgetPos);
      setWidgetPosition(pos);
    } else {
      setWidgetPosition({ 
        x: window.innerWidth - 360, 
        y: window.innerHeight - 350 
      });
    }
    setIsFirstRender(false);
  }, []);

  // Save positions when they change
  useEffect(() => {
    if (!isFirstRender) {
      localStorage.setItem('taskIconPosition', JSON.stringify(iconPosition));
    }
  }, [iconPosition, isFirstRender]);

  useEffect(() => {
    if (!isFirstRender) {
      localStorage.setItem('taskWidgetPosition', JSON.stringify(widgetPosition));
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

  const handleAddTask = () => {
    if (newTask.trim()) {
      dispatch(addTask(newTask.trim()));
      setNewTask('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
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
        className={`floating-icon fixed w-14 h-14 rounded-full bg-[#9753B3] shadow-lg flex items-center justify-center z-[1000] transition-transform active:scale-95 hover:scale-105 ${isIconDragging ? 'scale-110 shadow-2xl cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${iconPosition.x}px`,
          top: `${iconPosition.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
        onMouseDown={handleIconMouseDown}
        onClick={handleIconClick}
      >
        <i className="fas fa-list-check text-white text-2xl pointer-events-none"></i>
        {pendingCount > 0 && (
          <span className="floating-badge absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center border-2 border-white pointer-events-none">
            {pendingCount}
          </span>
        )}
        {/* Drag handle indicator */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-300 dark:bg-purple-600 rounded-full border-2 border-white dark:border-gray-800 opacity-60 pointer-events-none"></div>
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
            className="widget-header bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-700 text-gray-800 dark:text-white p-3.5 flex justify-between items-center cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleWidgetMouseDown}
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <i className="fas fa-list-check"></i> Task Manager
            </h3>
            <div className="widget-actions flex gap-2">
              <button
                onClick={() => dispatch(clearCompletedTasks())}
                className="bg-black/10 hover:bg-black/20 dark:bg-white/20 dark:hover:bg-white/30 border-none text-gray-700 dark:text-white w-7 h-7 rounded-md text-xs cursor-pointer transition-colors"
                title="Clear completed tasks"
              >
                <i className="fas fa-check-double"></i>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-black/10 hover:bg-black/20 dark:bg-white/20 dark:hover:bg-white/30 border-none text-gray-700 dark:text-white w-7 h-7 rounded-md text-xs cursor-pointer transition-colors"
                title="Minimize"
              >
                <i className="fas fa-compress"></i>
              </button>
            </div>
          </div>
          
          <div className="widget-content flex flex-col h-[300px] p-3 overflow-hidden">
            <ul className="task-list list-none flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {tasks.length === 0 ? (
                <li className="text-center text-gray-400 dark:text-gray-500 text-xs py-4">
                  No tasks yet. Add one below!
                </li>
              ) : (
                tasks.map((task, idx) => (
                  <li key={idx} className="task-item bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 mb-2 flex items-center gap-2.5 hover:shadow-sm transition-shadow group">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => dispatch(toggleTask(idx))}
                      className="w-4 h-4 cursor-pointer accent-purple-500 dark:accent-purple-400"
                    />
                    <span className={`task-text flex-1 text-sm text-gray-700 dark:text-gray-200 ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                      {task.text}
                    </span>
                    <button
                      onClick={() => dispatch(deleteTask(idx))}
                      className="task-delete bg-none border-none text-red-400 dark:text-red-500 cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </li>
                ))
              )}
            </ul>
            
            <div className="add-task-form flex gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a new task..."
                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-1 focus:ring-purple-400 dark:focus:ring-purple-500 transition-all"
              />
              <button
                onClick={handleAddTask}
                className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 border-none rounded-lg px-4 text-white cursor-pointer transition-colors flex items-center gap-1"
              >
                <i className="fas fa-plus text-xs"></i>
                <span className="hidden sm:inline text-sm">Add</span>
              </button>
            </div>
          </div>
          
          <div className="widget-footer p-2.5 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-700">
            <span>{pendingCount}</span> tasks pending
          </div>
        </div>
      )}
    </>
  );
};

export default TaskWidget;