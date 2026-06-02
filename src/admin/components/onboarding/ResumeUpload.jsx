/* eslint-disable react-hooks/static-components */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiUploadCloud, FiFileText, FiCheckCircle, FiLoader, FiAlertCircle, FiKey, FiRefreshCw, FiSkipForward } from "react-icons/fi";
import { parseResume, resetOnboarding } from "../../store/slices/onboardingSlice";
import { isOpenRouterConfigured } from "../../utils/openRouterService";

const ResumeUpload = ({ onSkip }) => {  
  const dispatch = useDispatch();
  const { isLoading, error, resumeData } = useSelector((state) => state.onboarding);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConfigured] = useState(() => isOpenRouterConfigured());

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    // Basic validation
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file.");
      return;
    }

    // Simulate upload progress - faster for better UX
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20; // 5 steps
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        dispatch(parseResume(file));
      }
    }, 80); // Total 400ms
  };

  const KeyConfigWarning = () => (
    <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-2xl flex gap-4 text-left animate-fadeIn">
      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
        <FiKey size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">OpenRouter API Key Required</h4>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
          Please add <strong>VITE_OPENROUTER_API_KEY</strong> to your <code>.env</code> file in the project root to enable automated resume parsing.
        </p>
        <div className="mt-3 bg-amber-100/50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200/50 font-mono text-[10px] text-amber-800 dark:text-amber-300 max-w-max">
          VITE_OPENROUTER_API_KEY=your_key_here
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-8 md:p-12">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload Candidate Resume</h2>
          <p className="text-gray-500 dark:text-gray-400">Our AI will automatically extract details for you.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Or skip this step and enter details manually</p>
        </div>

        {/* API Key warning if not set */}
        {!isConfigured && !resumeData && !isLoading && <KeyConfigWarning />}

        {/* Upload Zone */}
        {!resumeData && !isLoading && (
          <>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group ${
                isDragging
                  ? "border-green-500 bg-green-50 dark:bg-green-950/15"
                  : "border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept=".pdf,.docx"
              />
              
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 pointer-events-none ${
                isDragging ? "bg-green-500 text-white" : "bg-green-50 dark:bg-green-950/30 text-green-600"
              }`}>
                <FiUploadCloud size={40} />
              </div>
              
              <div className="text-center pointer-events-none">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Drag and drop resume here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Supported formats: <span className="font-medium text-gray-700 dark:text-gray-300 underline underline-offset-4 decoration-green-500/30">PDF, DOCX</span>
                </p>
              </div>
            </div>

            {/* Skip Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={onSkip}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 group"
              >
                <FiSkipForward size={16} className="group-hover:translate-x-0.5 transition-transform" />
                Skip Resume Upload
              </button>
            </div>
          </>
        )}

        {/* Loading / Parsing State */}
        {(isLoading || (uploadProgress > 0 && uploadProgress < 100)) && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-green-600">
                <FiFileText size={32} />
              </div>
            </div>
            
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {uploadProgress < 100 ? "Uploading..." : "Parsing Resume..."}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              AI is extracting data. Please wait...
            </p>
            
            <div className="w-full max-w-xs bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-8 overflow-hidden">
              <div 
                className="bg-green-600 h-full transition-all duration-300" 
                style={{ width: `${uploadProgress < 100 ? uploadProgress : 95}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success State */}
        {resumeData && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mb-6">
              <FiCheckCircle size={40} />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Successfully Parsed!</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 mb-6">
              <FiFileText className="text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{resumeData.fileName}</span>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950/15 rounded-2xl border border-green-100/50 dark:border-green-900/30 text-center max-w-sm mb-6">
              <p className="text-sm text-green-800 dark:text-green-300">
                We've extracted all information. You can now review and edit the details in the next step.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => dispatch(resetOnboarding())}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-200/50 dark:border-green-800/50 shadow-sm"
              >
                <FiRefreshCw size={16} />
                Upload Different Resume
              </button>
              
              <button
                onClick={onSkip}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <FiSkipForward size={16} />
                Continue Without Upload
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
            <FiAlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center text-gray-500 dark:text-gray-400 text-sm italic">
        <p>Smart HR Automation • Powered by AI Parsing</p>
      </div>
    </div>
  );
};

export default ResumeUpload;