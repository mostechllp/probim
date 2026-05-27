const UnderDevelopment = ({ pageName = "This page" }) => {
  return (
    <div className="w-full min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <i className="fas fa-hard-hat text-amber-600 dark:text-amber-400 text-5xl"></i>
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
          🚧 Under Development
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {pageName} is currently being built.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          We're working hard to bring you this feature soon!
        </p>
      </div>
    </div>
  );
};

export default UnderDevelopment;