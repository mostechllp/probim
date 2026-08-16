// UnifiedWidgets.jsx
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addTask, toggleTask, deleteTask, clearCompletedTasks } from '../../store/slices/tasksSlice';
import { addNote, deleteNote } from '../../store/slices/notesSlice';

const UnifiedWidgets = () => {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);
   const { notes } = useAppSelector((state) => state.notes);
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [newTask, setNewTask] = useState('');
  const [newNote, setNewNote] = useState('');

  const pendingCount = tasks.filter(t => !t.completed).length;

  const handleAddTask = () => {
    if (newTask.trim()) {
      dispatch(addTask(newTask.trim()));
      setNewTask('');
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      dispatch(addNote(newNote.trim()));
      setNewNote('');
    }
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (type === 'task') handleAddTask();
      else handleAddNote();
    }
  };

  const totalPending = tasks.filter(t => !t.completed).length + notes.length;

  return (
    <>
      {/* Floating Action Button - Only visible element when closed */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed z-[1000] 
          bottom-6 right-6
          w-14 h-14 rounded-full 
          shadow-lg hover:shadow-xl 
          flex items-center justify-center
          transition-all duration-300
          ${isOpen ? 'rotate-45' : 'rotate-0'}
          border-0 cursor-pointer
          hover:scale-105 active:scale-95
        `}
        style={{
          background: 'linear-gradient(135deg, #9753B3 0%, #EEAD16 100%)',
          boxShadow: '0 4px 15px rgba(151, 83, 179, 0.4)'
        }}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-plus'} text-white text-2xl`} style={{ color: 'white' }}></i>
        {totalPending > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center border-2 border-white">
            {totalPending}
          </span>
        )}
      </button>

      {/* Drawer - Completely hidden when closed, only shows when isOpen is true */}
      {isOpen && (
        <div
          className={`
            fixed inset-x-0 bottom-0 z-[999]
            bg-white dark:bg-gray-800
            rounded-t-3xl shadow-2xl
            transition-all duration-300 ease-in-out
            max-h-[85vh]
            md:max-w-md md:left-auto md:right-6 md:rounded-2xl md:shadow-2xl
            animate-slide-up
          `}
          style={{
            ...(window.innerWidth >= 768 && {
              bottom: '90px',
            })
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2 md:pt-4">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>

          {/* Header with Title */}
          <div className="px-5 pb-3">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              <i className="fas fa-tasks text-purple-500 mr-2"></i>
              My Tasks & Notes
            </h2>
          </div>

          {/* Tab Navigation */}
          <div className="px-5 pb-3">
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                  ${activeTab === 'tasks' 
                    ? 'bg-purple-500 text-black dark:text-white shadow-md' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <i className="fas fa-list-check mr-2"></i>
                Tasks
                {pendingCount > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'tasks' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                  ${activeTab === 'notes' 
                    ? 'bg-yellow-500 text-black dark:text-white shadow-md' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <i className="fas fa-sticky-note mr-2"></i>
                Notes
                {notes.length > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'notes' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300'
                  }`}>
                    {notes.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-5 pb-4" style={{ maxHeight: 'calc(85vh - 220px)' }}>
            {activeTab === 'tasks' ? (
              // Tasks Tab
              <div>
                {/* Add Task Input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'task')}
                    placeholder="Add a new task..."
                    className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <button
                    onClick={handleAddTask}
                    className="bg-purple-500 hover:bg-purple-600 active:scale-95 text-black dark:text-white px-5 py-3 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Add
                  </button>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="fas fa-check-circle text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No tasks yet. Add one above!
                      </p>
                    </div>
                  ) : (
                    tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          task.completed 
                            ? 'bg-gray-50 dark:bg-gray-700/50' 
                            : 'bg-white dark:bg-gray-700 shadow-sm hover:shadow-md'
                        } border border-gray-200 dark:border-gray-600`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => dispatch(toggleTask(idx))}
                          className="w-5 h-5 rounded accent-purple-500 cursor-pointer"
                        />
                        <span className={`flex-1 text-sm ${
                          task.completed 
                            ? 'line-through text-gray-400 dark:text-gray-500' 
                            : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {task.text}
                        </span>
                        <button
                          onClick={() => dispatch(deleteTask(idx))}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Clear Completed */}
                {tasks.some(t => t.completed) && (
                  <button
                    onClick={() => dispatch(clearCompletedTasks())}
                    className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                  >
                    <i className="fas fa-check-double"></i>
                    Clear completed tasks
                  </button>
                )}
              </div>
            ) : (
              // Notes Tab
              <div>
                {/* Add Note Input */}
                <div className="mb-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, 'note')}
                    rows="2"
                    placeholder="Write a note... (Press Enter to save)"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 dark:focus:ring-yellow-800 transition-all resize-none placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <button
                    onClick={handleAddNote}
                    className="mt-2 w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 dark:text-white text-black  py-2.5 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <i className="fas fa-save mr-2"></i>
                    Add Note
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-2">
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="fas fa-sticky-note text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No notes yet. Add one above!
                      </p>
                    </div>
                  ) : (
                    notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="bg-yellow-50 dark:bg-gray-700 border-l-4 border-yellow-400 p-3 rounded-xl shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {note.text}
                            </p>
                            <small className="text-xs text-gray-500 dark:text-gray-400 block mt-1.5">
                              <i className="far fa-clock mr-1"></i>
                              {note.date}
                            </small>
                          </div>
                          <button
                            onClick={() => dispatch(deleteNote(idx))}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-3xl flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <i className="fas fa-list-check text-purple-500"></i>
              {pendingCount} task{pendingCount !== 1 ? 's' : ''} pending
            </span>
            <span className="flex items-center gap-1">
              <i className="fas fa-sticky-note text-yellow-500"></i>
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedWidgets;