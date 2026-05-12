import { useEffect, useState } from "react";
import { 
  getBookersApi, 
  getAreasApi, 
  assignAreaToBookerApi, 
  setBookerTargetApi, 
  toggleBookerStatusApi,
  deleteUserApi 
} from "../api/api";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const BookerManagement = () => {
  const [bookers, setBookers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedBooker, setSelectedBooker] = useState(null);
  const [selectedArea, setSelectedArea] = useState("");
  const [routes, setRoutes] = useState("");
  const [target, setTarget] = useState("");
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState("list"); // 'list' or 'assign'

  const fetchBookers = async () => {
    const res = await getBookersApi();
    if (res.success) {
      setBookers(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  const fetchAreas = async () => {
    const res = await getAreasApi();
    if (res.success) {
      setAreas(res.data);
    }
  };

  useEffect(() => {
    fetchBookers();
    fetchAreas();
  }, []);

  const handleAssignArea = (booker) => {
    setSelectedBooker(booker);
    setSelectedArea(booker.assignedArea?._id || "");
    setRoutes(booker.routes?.join(", ") || "");
    setShowModal(true);
    setActiveTab("assign");
  };

  const handleSetTarget = (booker) => {
    setSelectedBooker(booker);
    setTarget(booker.bookerTarget || "");
    setTargetMonth(booker.targetMonth || new Date().toISOString().slice(0, 7));
    setShowModal(true);
    setActiveTab("target");
  };

  const submitAssignArea = async () => {
    if (!selectedBooker) return;
    
    const routeArray = routes.split(",").map(r => r.trim()).filter(r => r !== "");
    const res = await assignAreaToBookerApi(
      selectedBooker._id, 
      selectedArea || null, 
      routeArray
    );
    
    if (res.success) {
      toast.success("Area and routes assigned successfully! 🎯", { autoClose: 1500 });
      setShowModal(false);
      fetchBookers();
    } else {
      toast.error(res.message || "Failed to assign area ❌");
    }
  };

  const submitTarget = async () => {
    if (!selectedBooker || !target) return;
    
    const res = await setBookerTargetApi(selectedBooker._id, target, targetMonth);
    
    if (res.success) {
      toast.success("Target set successfully! 🎯", { autoClose: 1500 });
      setShowModal(false);
      fetchBookers();
    } else {
      toast.error(res.message || "Failed to set target ❌");
    }
  };

  const handleToggleStatus = async (bookerId) => {
    const res = await toggleBookerStatusApi(bookerId);
    if (res.success) {
      toast.success(res.message, { autoClose: 1500 });
      fetchBookers();
    } else {
      toast.error(res.message || "Failed to toggle status ❌");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this booker permanently?")) {
      const res = await deleteUserApi(id);
      if (res.success) {
        setBookers(bookers.filter((b) => b._id !== id));
        toast.success("Booker deleted successfully 🗑️", { autoClose: 1500 });
      } else {
        toast.error(res.message || "Failed to delete booker ❌");
      }
    }
  };

  if (loading)
    return (
      <p className="text-[#4b2e2e] font-medium text-center py-10">
        Loading bookers...
      </p>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[#E8F0F8] rounded-md"
    >
      <h2 className="text-2xl font-semibold mb-6 text-[#4b2e2e]">
        Booker Management
      </h2>

      {error && (
        <p className="text-red-500 font-semibold text-center py-4">{error}</p>
      )}

      {!bookers.length ? (
        <div className="text-center py-10">
          <p className="text-[#4b2e2e] font-medium">
            No bookers found. Create a booker first.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-[#7f2c2c] text-sm text-[#4b2e2e]">
            <thead className="bg-[#7f2c2c]/20">
              <tr>
                <th className="p-3 border border-[#7f2c2c] text-left">Name</th>
                <th className="p-3 border border-[#7f2c2c] text-left">Email</th>
                <th className="p-3 border border-[#7f2c2c] text-left">Assigned Area</th>
                <th className="p-3 border border-[#7f2c2c] text-left">Routes</th>
                <th className="p-3 border border-[#7f2c2c] text-left">Target</th>
                <th className="p-3 border border-[#7f2c2c] text-left">Status</th>
                <th className="p-3 border border-[#7f2c2c] text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookers.map((booker, i) => (
                <motion.tr
                  key={booker._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-[#7f2c2c]/10 transition-all"
                >
                  <td className="p-3 border border-[#7f2c2c] font-medium">
                    {booker.name}
                  </td>
                  <td className="p-3 border border-[#7f2c2c]">{booker.email}</td>
                  <td className="p-3 border border-[#7f2c2c]">
                    {booker.assignedArea?.name || (
                      <span className="text-gray-400 italic">Not assigned</span>
                    )}
                  </td>
                  <td className="p-3 border border-[#7f2c2c]">
                    {booker.routes?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {booker.routes.map((route, idx) => (
                          <span 
                            key={idx} 
                            className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs"
                          >
                            {route}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No routes</span>
                    )}
                  </td>
                  <td className="p-3 border border-[#7f2c2c]">
                    {booker.bookerTarget > 0 ? (
                      <div>
                        <span className="font-semibold">{booker.bookerTarget}</span>
                        <span className="text-gray-500 text-xs ml-1">
                          ({booker.targetMonth})
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No target</span>
                    )}
                  </td>
                  <td className="p-3 border border-[#7f2c2c]">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        booker.isActive !== false
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booker.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 border border-[#7f2c2c]">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleAssignArea(booker)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs"
                      >
                        Assign Area & Routes
                      </button>
                      <button
                        onClick={() => handleSetTarget(booker)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-xs"
                      >
                        Set Target
                      </button>
                      <button
                        onClick={() => handleDelete(booker._id)}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 rounded text-xs"
                      >
                        <FaTrash className="inline mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Assign Area/Routes or Set Target */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#4b2e2e]">
                  {activeTab === "assign" 
                    ? `Assign Area & Routes - ${selectedBooker?.name}` 
                    : `Set Target - ${selectedBooker?.name}`}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>

              {/* Tab Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("assign")}
                  className={`flex-1 py-2 rounded text-sm font-medium ${
                    activeTab === "assign"
                      ? "bg-[#7f2c2c] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Area & Routes
                </button>
                <button
                  onClick={() => setActiveTab("target")}
                  className={`flex-1 py-2 rounded text-sm font-medium ${
                    activeTab === "target"
                      ? "bg-[#7f2c2c] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Set Target
                </button>
              </div>

              {activeTab === "assign" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4b2e2e] mb-1">
                      Select Area
                    </label>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full border border-[#7f2c2c] rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7f2c2c]"
                    >
                      <option value="">Select an area...</option>
                      {areas.map((area) => (
                        <option key={area._id} value={area._id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4b2e2e] mb-1">
                      Routes (comma separated)
                    </label>
                    <input
                      type="text"
                      value={routes}
                      onChange={(e) => setRoutes(e.target.value)}
                      placeholder="e.g., Route A, Route B, Main Road"
                      className="w-full border border-[#7f2c2c] rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7f2c2c]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple routes with commas
                    </p>
                  </div>
                  <button
                    onClick={submitAssignArea}
                    className="w-full bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-2 rounded font-medium"
                  >
                    Assign Area & Routes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4b2e2e] mb-1">
                      Monthly Target (Units)
                    </label>
                    <input
                      type="number"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="Enter target quantity"
                      className="w-full border border-[#7f2c2c] rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7f2c2c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4b2e2e] mb-1">
                      Target Month
                    </label>
                    <input
                      type="month"
                      value={targetMonth}
                      onChange={(e) => setTargetMonth(e.target.value)}
                      className="w-full border border-[#7f2c2c] rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7f2c2c]"
                    />
                  </div>
                  <button
                    onClick={submitTarget}
                    className="w-full bg-[#7f2c2c] hover:bg-[#6d2525] text-white py-2 rounded font-medium"
                  >
                    Set Target
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookerManagement;
