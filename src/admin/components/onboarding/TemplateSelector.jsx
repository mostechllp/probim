import { useState } from 'react';
import { FiCheck, FiGrid, FiChevronDown } from 'react-icons/fi';
import { TEMPLATES, getTemplateCategories } from '../../utils/offerLetterTemplates';

const TemplateSelector = ({ selectedTemplate, onSelectTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  const categories = getTemplateCategories();
  
  // Fix: Provide a default template if selectedTemplate is undefined or invalid
  const isValidTemplate = selectedTemplate && TEMPLATES[selectedTemplate];
  const currentTemplate = isValidTemplate ? TEMPLATES[selectedTemplate] : TEMPLATES.corporate;

  const handleSelect = (templateId) => {
    onSelectTemplate(templateId);
    setIsOpen(false);
  };

  // If no categories or templates, show loading/empty state
  if (Object.keys(categories).length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
        <p className="text-sm text-gray-500">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected Template Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm flex items-center justify-between hover:border-green-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-white">{currentTemplate.name || 'Corporate Classic'}</p>
            <p className="text-xs text-gray-500">{currentTemplate.description || 'Traditional corporate style with formal layout'}</p>
          </div>
        </div>
        <FiChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Template Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
            
            {/* View Toggle */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500">Select Template</span>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                >
                  <FiGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                >
                  <span className="text-xs">≡</span>
                </button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="p-4 grid grid-cols-1 gap-3">
                {Object.entries(categories).map(([category, templates]) => (
                  <div key={category}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelect(template.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            selectedTemplate === template.id
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{template.name}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                              </div>
                            </div>
                            {selectedTemplate === template.id && (
                              <FiCheck className="text-green-500 shrink-0" size={16} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {Object.entries(categories).map(([category, templates]) => (
                  <div key={category}>
                    <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 px-4 py-2">
                      <h4 className="text-xs font-bold text-gray-500 uppercase">{category}</h4>
                    </div>
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelect(template.id)}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedTemplate === template.id ? 'bg-green-50 dark:bg-green-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{template.name}</p>
                            <p className="text-xs text-gray-500">{template.description}</p>
                          </div>
                        </div>
                        {selectedTemplate === template.id && (
                          <FiCheck className="text-green-500" size={18} />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Template Preview Note */}
      <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
        <span>💡</span>
        <span>Different templates offer unique formatting and content structures</span>
      </div>
    </div>
  );
};

export default TemplateSelector;