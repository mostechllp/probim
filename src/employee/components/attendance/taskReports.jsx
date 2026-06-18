import { useState } from 'react';
import { FiX, FiCheckCircle } from 'react-icons/fi';

const TaskReports = ({ isOpen, onClose, onSubmit, loading }) => {
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [planTomorrow, setPlanTomorrow] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tasksCompleted.trim() || !planTomorrow.trim()) {
      return;
    }
    onSubmit({ tasks_completed: tasksCompleted, plan_tomorrow: planTomorrow });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface)] rounded-xl w-full max-w-md mx-4 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border)]">
          <h3 className="text-xl font-bold text-[var(--text)]">Punch Out</h3>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[var(--text)] mb-2">
              Tasks Completed Today 
            </label>
            <textarea
              value={tasksCompleted}
              onChange={(e) => setTasksCompleted(e.target.value)}
              placeholder="What tasks did you complete today?"
              rows="4"
              className="w-full p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[var(--text)] mb-2">
              Plan for Tomorrow 
            </label>
            <textarea
              value={planTomorrow}
              onChange={(e) => setPlanTomorrow(e.target.value)}
              placeholder="What are your plans for tomorrow?"
              rows="4"
              className="w-full p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold hover:bg-[var(--surface3)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !tasksCompleted.trim() || !planTomorrow.trim()}
              className="flex-1 py-2.5 px-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  Confirm Punch Out
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskReports;