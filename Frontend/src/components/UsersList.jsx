import { useEffect, useState } from "react";
import {
  getUsersApi,
  deleteUserApi,
  toggleFOStatusApi,
  toggleBookerStatusApi,
  toggleUserStatusApi,
  getUserByIdApi,
} from "../api/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrash,
  FaEye,
  FaUsers,
  FaSearch,
  FaSpinner,
  FaUserCircle,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBullseye,
  FaRoute,
  FaCheckCircle,
  FaTimesCircle,
  FaPowerOff,
} from "react-icons/fa";
import PageLoader from "./common/PageLoader";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewUser, setViewUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsersApi();
    if (res.success) {
      setUsers(res.data);
      setFilteredUsers(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    // Tab filter
    if (activeTab === "active") {
      result = result.filter((u) => u.isActive !== false);
    } else if (activeTab === "inactive") {
      result = result.filter((u) => u.isActive === false);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
      );
    }

    setFilteredUsers(result);
  }, [search, activeTab, users]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this user permanently?")) {
      const res = await deleteUserApi(id);
      if (res.success) {
        setUsers(users.filter((u) => u._id !== id));
        toast.success("User deleted successfully", { autoClose: 1500 });
      } else {
        toast.error(res.message || "Failed to delete user");
      }
    }
  };

  const handleToggleStatus = async (user) => {
    setConfirmingId(user._id);
    let res;
    if (user.role === "FO") {
      res = await toggleFOStatusApi(user._id);
    } else if (user.role === "booker") {
      res = await toggleBookerStatusApi(user._id);
    } else if (user.role === "distributer") {
      res = await toggleUserStatusApi(user._id);
    } else {
      setConfirmingId(null);
      return;
    }

    if (res.success) {
      toast.success(res.message, { autoClose: 1500 });
      fetchUsers();
    } else {
      toast.error(res.message || "Failed to toggle status");
    }
    setConfirmingId(null);
  };

  const handleViewUser = async (id) => {
    setViewLoading(true);
    const res = await getUserByIdApi(id);
    if (res.success) {
      setViewUser(res.data);
    } else {
      toast.error(res.message || "Failed to load user details");
    }
    setViewLoading(false);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return "N/A";
    const [year, month] = monthStr.split("-");
    const d = new Date(year, parseInt(month) - 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const roleConfig = {
    FO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "FO" },
    booker: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Booker" },
    distributer: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Distributor" },
    sole: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: "Sole" },
  };

  const statusConfig = (isActive) =>
    isActive !== false
      ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Active", icon: FaCheckCircle }
      : { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Inactive", icon: FaTimesCircle };

  if (loading) {
    return <PageLoader message="Loading users..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-500">
        <FaTimesCircle className="text-3xl mb-2" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const activeCount = users.filter((u) => u.isActive !== false).length;
  const inactiveCount = users.filter((u) => u.isActive === false).length;

  return (
    <div className="bg-[#E8F0F8] min-h-screen text-[#4b2e2e] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white shadow">
            <FaUsers className="text-sm" />
          </div>
          <h2 className="text-xl font-bold">Registered Users</h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All", count: users.length },
            { key: "active", label: "Active", count: activeCount },
            { key: "inactive", label: "Inactive", count: inactiveCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === tab.key
                  ? "bg-[#7f2c2c] text-white shadow"
                  : "bg-white text-[#7f2c2c] border border-[#7f2c2c]/20 hover:bg-[#7f2c2c]/10"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#7f2c2c]/15 rounded-xl text-sm text-[#4b2e2e] outline-none focus:border-[#7f2c2c] focus:ring-1 focus:ring-[#7f2c2c] transition-all"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaUsers className="text-3xl mx-auto mb-2 text-[#7f2c2c]/30" />
          <p>No users found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border border-[#7f2c2c]/15 rounded-xl overflow-hidden">
              <thead className="bg-[#7f2c2c] text-white">
                <tr>
                  {["User", "Email", "Role", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => {
                  const rCfg = roleConfig[u.role] || roleConfig.sole;
                  const sCfg = statusConfig(u.isActive);
                  const StatusIcon = sCfg.icon;

                  return (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#7f2c2c]/10 hover:bg-[#7f2c2c]/5 transition-all bg-white"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(u.name)}
                          </div>
                          <span className="text-sm font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <FaEnvelope className="text-gray-400 text-[10px]" />
                          {u.email}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${rCfg.bg} ${rCfg.text} border ${rCfg.border}`}
                        >
                          {rCfg.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${sCfg.bg} ${sCfg.text} border ${sCfg.border}`}
                        >
                          <StatusIcon className="text-[8px]" />
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <FaCalendarAlt className="text-[10px]" />
                          {formatDate(u.createdAt)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewUser(u._id)}
                            className="inline-flex items-center gap-1 bg-[#7f2c2c]/10 hover:bg-[#7f2c2c]/20 text-[#7f2c2c] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                            title="View Details"
                          >
                            <FaEye className="text-[10px]" />
                            View
                          </button>

                          {["FO", "booker", "distributer"].includes(u.role) && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={confirmingId === u._id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                                u.isActive !== false
                                  ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                              title={u.isActive !== false ? "Deactivate" : "Activate"}
                            >
                              {confirmingId === u._id ? (
                                <FaSpinner className="animate-spin text-[10px]" />
                              ) : (
                                <FaPowerOff className="text-[10px]" />
                              )}
                              {u.isActive !== false ? "Deactivate" : "Activate"}
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(u._id)}
                            className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            title="Delete"
                          >
                            <FaTrash className="text-[10px]" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((u, i) => {
              const rCfg = roleConfig[u.role] || roleConfig.sole;
              const sCfg = statusConfig(u.isActive);
              const StatusIcon = sCfg.icon;

              return (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-[#7f2c2c]/10 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{u.name}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <FaEnvelope className="text-[8px]" /> {u.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${sCfg.bg} ${sCfg.text} border ${sCfg.border}`}
                    >
                      <StatusIcon className="text-[8px]" />
                      {sCfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Role</p>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${rCfg.bg} ${rCfg.text} border ${rCfg.border}`}
                      >
                        {rCfg.label}
                      </span>
                    </div>
                    <div className="bg-[#faf8f5] rounded-lg p-2">
                      <p className="text-gray-500 text-[10px]">Created</p>
                      <p className="font-medium text-gray-600">{formatDate(u.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewUser(u._id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-[#7f2c2c]/10 hover:bg-[#7f2c2c]/20 text-[#7f2c2c] px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      <FaEye className="text-[10px]" /> View
                    </button>

                    {["FO", "booker", "distributer"].includes(u.role) && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={confirmingId === u._id}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                          u.isActive !== false
                            ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {confirmingId === u._id ? (
                          <FaSpinner className="animate-spin text-[10px]" />
                        ) : (
                          <FaPowerOff className="text-[10px]" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(u._id)}
                      className="inline-flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      <FaTrash className="text-[10px]" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* View User Modal */}
      <AnimatePresence>
        {viewUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-[#4b2e2e] p-5 rounded-2xl w-full max-w-md space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white">
                    <FaUserCircle className="text-sm" />
                  </div>
                  <h3 className="text-lg font-bold">User Details</h3>
                </div>
                <button
                  onClick={() => setViewUser(null)}
                  className="text-gray-400 hover:text-[#7f2c2c] transition-all"
                >
                  <FaTimesCircle className="text-lg" />
                </button>
              </div>

              {viewLoading ? (
                <div className="flex flex-col items-center py-8">
                  <FaSpinner className="animate-spin text-2xl text-[#7f2c2c] mb-2" />
                  <p className="text-sm text-gray-500">Loading details...</p>
                </div>
              ) : (
                <>
                  {/* Avatar & Name */}
                  <div className="flex flex-col items-center py-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7f2c2c] to-[#4b2e2e] flex items-center justify-center text-white text-xl font-bold mb-2">
                      {getInitials(viewUser.name)}
                    </div>
                    <h4 className="text-lg font-bold">{viewUser.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          roleConfig[viewUser.role]?.bg || roleConfig.sole.bg
                        } ${roleConfig[viewUser.role]?.text || roleConfig.sole.text} border ${
                          roleConfig[viewUser.role]?.border || roleConfig.sole.border
                        }`}
                      >
                        {roleConfig[viewUser.role]?.label || viewUser.role}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          statusConfig(viewUser.isActive).bg
                        } ${statusConfig(viewUser.isActive).text} border ${statusConfig(viewUser.isActive).border}`}
                      >
                        {statusConfig(viewUser.isActive).label}
                      </span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-3">
                    <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#7f2c2c]/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                        <FaEnvelope className="text-xs" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Email</p>
                        <p className="text-sm font-medium">{viewUser.email}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#7f2c2c]/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#7f2c2c]/10 flex items-center justify-center text-[#7f2c2c]">
                        <FaCalendarAlt className="text-xs" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Created On</p>
                        <p className="text-sm font-medium">{formatDate(viewUser.createdAt)}</p>
                      </div>
                    </div>

                    {/* Area */}
                    {viewUser.assignedArea && (
                      <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#7f2c2c]/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <FaMapMarkerAlt className="text-xs" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Assigned Area</p>
                          <p className="text-sm font-medium">
                            {typeof viewUser.assignedArea === "object"
                              ? viewUser.assignedArea.name || "N/A"
                              : viewUser.assignedArea}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Routes - Booker only */}
                    {viewUser.role === "booker" && viewUser.routes && viewUser.routes.length > 0 && (
                      <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#7f2c2c]/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                            <FaRoute className="text-xs" />
                          </div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Assigned Routes</p>
                        </div>
                        <div className="flex flex-wrap gap-2 pl-10">
                          {viewUser.routes.map((route, idx) => (
                            <span
                              key={idx}
                              className="bg-[#7f2c2c] text-white px-2.5 py-1 rounded-full text-[10px] font-bold"
                            >
                              {route}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Target - FO */}
                    {viewUser.role === "FO" && viewUser.stockTarget > 0 && (
                      <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#7f2c2c]/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <FaBullseye className="text-xs" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Monthly Stock Target</p>
                          <p className="text-sm font-medium">
                            {viewUser.stockTarget} units ({formatMonth(viewUser.targetMonth)})
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Target - Booker */}
                    {viewUser.role === "booker" && viewUser.bookerTarget > 0 && (
                      <div className="p-3 bg-[#faf8f5] rounded-xl border border-[#7f2c2c]/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                          <FaBullseye className="text-xs" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Monthly Order Target</p>
                          <p className="text-sm font-medium">
                            {viewUser.bookerTarget} units ({formatMonth(viewUser.targetMonth)})
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setViewUser(null)}
                    className="w-full inline-flex items-center justify-center gap-1 bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    <FaCheckCircle className="text-[10px]" />
                    Close
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersList;

