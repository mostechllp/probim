import UnderDevelopment from '../../components/common/UnderDevelopment';

const Leaves = () => {
    return <UnderDevelopment pageName="Leaves" />;
}

export default Leaves

// import { useEffect, useMemo } from 'react';
// import { Link } from 'react-router-dom';
// import { useAppSelector, useAppDispatch } from '../store/hooks';
// import { setLeaveFilter, setLeavePagination, fetchEmployeeLeaves } from '../store/slices/leavesSlice';
// import { FiSearch, FiPlus, FiFileText, FiChevronLeft, FiChevronRight, FiCalendar, FiClock } from 'react-icons/fi';
// import StatusBadge from '../components/common/StatusBadge';

// const Leaves = () => {
//   const dispatch = useAppDispatch();
//   const leavesState = useAppSelector((state) => state.leaves);
  
//   // Add safety defaults
//   const leaves = leavesState?.leaves || [];
//   const filter = leavesState?.filter || { status: 'all', search: '' };
//   const pagination = leavesState?.pagination || { currentPage: 1, perPage: 10 };
//   const loading = leavesState?.loading || false;
  
//   // Use useMemo instead of useState + useEffect to prevent infinite loops
//   const filteredLeaves = useMemo(() => {
//     let filtered = [...leaves];
    
//     if (filter.status && filter.status !== 'all') {
//       filtered = filtered.filter(l => {
//         const leaveStatus = typeof l.status === 'object' ? l.status?.name?.toLowerCase() : l.status?.toLowerCase();
//         return leaveStatus === filter.status.toLowerCase();
//       });
//     }
    
//     if (filter.search) {
//       filtered = filtered.filter(l => {
//         const leaveType = typeof l.leave_type === 'object' ? l.leave_type?.name : l.leave_type;
//         const leaveStatus = typeof l.status === 'object' ? l.status?.name : l.status;
        
//         return (leaveType?.toLowerCase() || '').includes(filter.search.toLowerCase()) ||
//           (leaveStatus?.toLowerCase() || '').includes(filter.search.toLowerCase()) ||
//           (l.reason?.toLowerCase() || '').includes(filter.search.toLowerCase());
//       });
//     }
    
//     return filtered;
//   }, [leaves, filter.status, filter.search]); // Only recompute when these change
  
//   // Fetch leaves on component mount - only once
//   useEffect(() => {
//     dispatch(fetchEmployeeLeaves());
//   }, [dispatch]); // Empty dependency array - only runs once
  
//   // Safety check for pagination
//   const perPage = pagination?.perPage || 10;
//   const currentPage = pagination?.currentPage || 1;
  
//   const totalPages = Math.ceil(filteredLeaves.length / perPage);
//   const start = (currentPage - 1) * perPage;
//   const currentLeaves = filteredLeaves.slice(start, start + perPage);
  
//   // Helper functions
//   const getLeaveTypeName = (leaveType) => {
//     if (!leaveType) return '-';
//     if (typeof leaveType === 'object') {
//       return leaveType.name || leaveType.leave_type || '-';
//     }
//     return leaveType;
//   };
  
//   const getStatus = (status) => {
//     if (!status) return 'pending';
//     if (typeof status === 'object') {
//       return status.name?.toLowerCase() || 'pending';
//     }
//     return status.toLowerCase();
//   };
  
//   const getClaimSalary = (claimSalary) => {
//     if (claimSalary === undefined || claimSalary === null) return 'Yes';
//     if (typeof claimSalary === 'object') return 'Yes';
//     if (claimSalary === 1 || claimSalary === '1' || claimSalary === 'Yes') return 'Yes';
//     return 'No';
//   };
  
//   const hasDocument = (document) => {
//     return document !== null && document !== undefined && document !== '';
//   };
  
//   const stats = useMemo(() => ({
//     total: leaves.length,
//     pending: leaves.filter(l => getStatus(l.status) === 'pending').length,
//     approved: leaves.filter(l => getStatus(l.status) === 'approved').length,
//     rejected: leaves.filter(l => getStatus(l.status) === 'rejected').length,
//   }), [leaves]);
  
//   const formatDate = (dateString) => {
//     if (!dateString) return '-';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-GB', {
//         day: '2-digit', month: 'short', year: 'numeric'
//       });
//     } catch (error) {
//       return '-', error;
//     }
//   };
  
//   const calculateDays = (startDate, endDate) => {
//     if (!startDate || !endDate) return 0;
//     try {
//       const from = new Date(startDate);
//       const to = new Date(endDate);
//       const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
//       return days;
//     } catch (error) {
//       return 0, error;
//     }
//   };
  
//   const handleStatusFilter = (status) => {
//     dispatch(setLeaveFilter({ 
//       status: status === 'all' ? 'all' : status.toLowerCase(), 
//       search: filter.search || '' 
//     }));
//   };
  
//   const handleSearch = (e) => {
//     dispatch(setLeaveFilter({ 
//       status: filter.status || 'all', 
//       search: e.target.value 
//     }));
//   };
  
//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       dispatch(setLeavePagination({ currentPage: page, perPage: perPage }));
//     }
//   };
  
//   const handleEntriesChange = (e) => {
//     dispatch(setLeavePagination({ currentPage: 1, perPage: parseInt(e.target.value) }));
//   };
  
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-[var(--muted)]">Loading leaves...</p>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div>
//       {/* Stats Grid */}
//       <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-7">
//         <div className="stat-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 md:p-5">
//           <div className="stat-header flex justify-between items-center mb-3">
//             <div className="stat-icon w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center text-xl md:text-2xl">
//               <FiFileText />
//             </div>
//           </div>
//           <div className="stat-number text-2xl md:text-3xl font-extrabold text-green-600">{stats.total}</div>
//           <div className="stat-label text-xs text-[var(--muted)]">Total Leaves Taken</div>
//         </div>
//         <div className="stat-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 md:p-5">
//           <div className="stat-header flex justify-between items-center mb-3">
//             <div className="stat-icon w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl md:text-2xl">
//               <FiClock />
//             </div>
//           </div>
//           <div className="stat-number text-2xl md:text-3xl font-extrabold text-amber-500">{stats.pending}</div>
//           <div className="stat-label text-xs text-[var(--muted)]">Pending</div>
//         </div>
//         <div className="stat-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 md:p-5">
//           <div className="stat-header flex justify-between items-center mb-3">
//             <div className="stat-icon w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl md:text-2xl">
//               <FiCalendar />
//             </div>
//           </div>
//           <div className="stat-number text-2xl md:text-3xl font-extrabold text-purple-500">{stats.approved}</div>
//           <div className="stat-label text-xs text-[var(--muted)]">Approved</div>
//         </div>
//         <div className="stat-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 md:p-5">
//           <div className="stat-header flex justify-between items-center mb-3">
//             <div className="stat-icon w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl md:text-2xl">
//               <FiFileText />
//             </div>
//           </div>
//           <div className="stat-number text-2xl md:text-3xl font-extrabold text-red-500">{stats.rejected}</div>
//           <div className="stat-label text-xs text-[var(--muted)]">Rejected</div>
//         </div>
//       </div>
      
//       <div className="leaves-header flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-7">
//         <h2 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-gray-800 to-green-600 bg-clip-text text-transparent">
//           My Leave Requests
//         </h2>
//         <Link to="/employee/request-leave" className="request-btn bg-green-500 text-white py-2.5 px-6 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-green-600 hover:-translate-y-0.5 transition-all">
//           <FiPlus /> Request Leave
//         </Link>
//       </div>
      
//       {/* Status Tabs */}
//       <div className="status-tabs flex flex-wrap gap-2.5 mb-6 pb-3 border-b border-[var(--border)]">
//   {['all', 'Pending', 'Approved', 'Rejected'].map(status => (
//     <button
//       key={status}
//       onClick={() => handleStatusFilter(status)}
//       className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
//         (filter.status === status.toLowerCase()) || (status === 'all' && filter.status === 'all')
//           ? 'bg-green-500 text-white'
//           : 'bg-[var(--surface2)] text-[var(--text-secondary)] hover:bg-green-100 hover:text-green-600'
//       }`}
//     >
//       {status === 'all' ? 'All Requests' : status}
//     </button>
//   ))}
// </div>
      
//       {/* Action Bar */}
//       <div className="files-actions flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
//         <div className="entries-select flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-full px-3.5 py-1.5 text-xs text-[var(--muted)]">
//           <span>Show entries</span>
//           <select
//             value={perPage}
//             onChange={handleEntriesChange}
//             className="border-none outline-none bg-transparent font-semibold text-[var(--text)] cursor-pointer"
//           >
//             <option value="5">5</option>
//             <option value="10">10</option>
//             <option value="25">25</option>
//             <option value="50">50</option>
//           </select>
//         </div>
//         <div className="search-wrapper flex items-center gap-3 flex-wrap">
//           <div className="search-box flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-full px-3.5 py-2">
//             <FiSearch className="text-gray-400 text-xs" />
//             <input
//               type="text"
//               value={filter.search || ''}
//               onChange={handleSearch}
//               placeholder="Search by type, status..."
//               className="border-none outline-none bg-transparent text-xs text-[var(--text)] w-36 sm:w-44"
//             />
//           </div>
//         </div>
//       </div>
      
//       {/* Table */}
//       <div className="leave-table-wrapper bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-x-auto shadow-sm">
//         <table className="leave-table w-full border-collapse text-xs min-w-[900px]">
//           <thead>
//             <tr>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)] w-16">#</th>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">Type</th>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">From</th>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">To</th>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">Days</th>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">Claim Salary</th>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">Document</th>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">Status</th>
//               <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)]">Reason</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentLeaves.length === 0 ? (
//               <tr>
//                 <td colSpan="9" className="text-center py-8 text-[var(--muted)]">
//                   No leave requests found
//                 </td>
//               </tr>
//             ) : (
//               currentLeaves.map((leave, idx) => {
//                 const leaveTypeName = getLeaveTypeName(leave.leave_type);
//                 const statusName = getStatus(leave.status);
//                 const claimSalary = getClaimSalary(leave.claim_salary);
//                 const hasDoc = hasDocument(leave.document);
//                 const days = leave.duration_days || calculateDays(leave.start_date, leave.end_date);
                
//                 return (
//                   <tr key={leave.id || idx} className="hover:bg-[var(--surface2)] transition-colors">
//                     <td className="py-3.5 px-4 border-b border-[var(--border)] text-center">{start + idx + 1}</td>
//                     <td className="py-3.5 px-4 border-b border-[var(--border)] font-semibold text-[var(--text)]">{leaveTypeName}</td>
//                     <td className="py-3.5 px-4 border-b border-[var(--border)] text-[var(--text-secondary)]">{formatDate(leave.start_date)}</td>
//                     <td className="py-3.5 px-4 border-b border-[var(--border)] text-[var(--text-secondary)]">{formatDate(leave.end_date)}</td>
//                     <td className="py-3.5 px-4 border-b border-[var(--border)] text-[var(--text-secondary)]">{days}</td>
//                     <td className="py-3.5 px-4 border-b border-[var(--border)]">
//                       <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
//                         claimSalary === 'Yes' 
//                           ? 'bg-green-500/15 text-green-600' 
//                           : 'bg-gray-100 text-[var(--muted)]'
//                       }`}>
//                         {claimSalary}
//                       </span>
//                     </td>
//                     <td className="py-3.5 px-4 border-b border-[var(--border)]">
//                       {hasDoc ? (
//                         <a href="#" className="text-blue-500 cursor-pointer hover:underline">View</a>
//                       ) : '-'}
//                     </td>
//                     <td className="py-3.5 px-4 border-b border-[var(--border)]">
//                       <StatusBadge status={statusName} />
//                     </td>
//                     <td className="py-3.5 px-4 border-b border-[var(--border)] text-[var(--text-secondary)] max-w-[200px] truncate" title={leave.reason}>
//                       {leave.reason || '-'}
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>
      
//       {/* Pagination */}
//       {filteredLeaves.length > 0 && totalPages > 0 && (
//         <div className="pagination-container flex flex-col sm:flex-row justify-between items-center gap-3 mt-5">
//           <div className="text-xs text-[var(--muted)]">
//             Showing {start + 1} to {Math.min(start + perPage, filteredLeaves.length)} of {filteredLeaves.length} entries
//           </div>
//           <div className="page-buttons flex gap-1.5 flex-wrap">
//             <button
//               onClick={() => handlePageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//               className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface2)] transition-colors"
//             >
//               <FiChevronLeft className="mx-auto" />
//             </button>
//             {[...Array(Math.min(totalPages, 10))].map((_, i) => {
//               const pageNum = i + 1;
//               return (
//                 <button
//                   key={i}
//                   onClick={() => handlePageChange(pageNum)}
//                   className={`w-9 h-9 rounded-lg border text-xs transition-all ${
//                     currentPage === pageNum
//                       ? 'bg-green-500 border-green-500 text-white'
//                       : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface2)]'
//                   }`}
//                 >
//                   {pageNum}
//                 </button>
//               );
//             })}
//             <button
//               onClick={() => handlePageChange(currentPage + 1)}
//               disabled={currentPage === totalPages}
//               className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface2)] transition-colors"
//             >
//               <FiChevronRight className="mx-auto" />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Leaves;