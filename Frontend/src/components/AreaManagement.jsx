import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAreasApi,
  createAreaApi,
  updateAreaApi,
  toggleAreaStatusApi,
  getFOListApi,
  assignAreasToFOApi,
  getFOWithAreasApi,
  deleteAreaApi,
  setMonthlyTargetApi,
  toggleFOStatusApi,
} from "../api/api";
import { toast } from "react-toastify";
import { FaTrash, FaEdit } from "react-icons/fa";
import PageLoader from "./common/PageLoader";

const AreaManagement = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [fos, setFos] = useState([]);
  const [fosWithAreas, setFosWithAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [editingArea, setEditingArea] = useState(null);
  const [editName, setEditName] = useState("");
  const [selectedFO, setSelectedFO] = useState("");
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [showTargetForm, setShowTargetForm] = useState(null); // FO ID to show target form
  const [targetAmount, setTargetAmount] = useState("");
  const [targetMonth, setTargetMonth] = useState("");

  // Only for Distributor and FO
  const isDistributor = user?.role === "distributer";
  const isFO = user?.role === "FO";

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAreas(), loadFOData()]);
    setLoading(false);
  };

  const loadAreas = async () => {
    const res = await getAreasApi();
    if (res.success) {
      setAreas(res.data);
    }
  };

  const loadFOData = async () => {
    if (isDistributor) {
      const fosRes = await getFOListApi();
      if (fosRes.success) setFos(fosRes.data);

      const fosWithAreasRes = await getFOWithAreasApi();
      if (fosWithAreasRes.success) setFosWithAreas(fosWithAreasRes.data);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return toast.error("Area name is required");

    const res = await createAreaApi(newAreaName.trim());
    if (res.success) {
      toast.success("Area created successfully!");
      setNewAreaName("");
      setShowAddForm(false);
      loadAreas();
    } else {
      toast.error(res.message);
    }
  };

  const handleUpdateArea = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return toast.error("Area name is required");

    const res = await updateAreaApi(editingArea._id, editName.trim());
    if (res.success) {
      toast.success("Area updated successfully!");
      setEditingArea(null);
      setEditName("");
      loadAreas();
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleStatus = async (areaId) => {
    const res = await toggleAreaStatusApi(areaId);
    if (res.success) {
      toast.success(res.message);
      loadAreas();
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteArea = async (areaId) => {
    if (!window.confirm("Are you sure you want to delete this area?")) return;
    
    const res = await deleteAreaApi(areaId);
    if (res.success) {
      toast.success(res.message);
      loadAreas();
      loadFOData();
    } else {
      toast.error(res.message);
    }
  };

  const handleSetTarget = async (foId) => {
    if (!targetAmount || targetAmount <= 0) {
      return toast.error("Please enter a valid target amount");
    }

    const res = await setMonthlyTargetApi(foId, targetAmount, targetMonth);
    if (res.success) {
      toast.success(res.message);
      setShowTargetForm(null);
      setTargetAmount("");
      setTargetMonth("");
      loadFOData();
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleFOStatus = async (foId) => {
    const res = await toggleFOStatusApi(foId);
    if (res.success) {
      toast.success(res.message);
      loadFOData();
    } else {
      toast.error(res.message);
    }
  };

  const handleAssignAreas = async (e) => {
    e.preventDefault();
    if (!selectedFO || selectedAreas.length === 0) {
      return toast.error("Please select FO and at least one area");
    }

    const res = await assignAreasToFOApi(selectedFO, selectedAreas);
    if (res.success) {
      toast.success(res.message);
      setShowAssignForm(false);
      setSelectedFO("");
      setSelectedAreas([]);
      loadFOData();
    } else {
      toast.error(res.message);
    }
  };

  if (loading) {
    return <PageLoader message="Loading areas..." />;
  }

  // FO view - only shows assigned areas
  if (isFO) {
    return (
      <div className="p-6 bg-[#E8F0F8] rounded-md">
        <h3 className="text-2xl font-bold mb-4 text-[#4b2e2e]">My Areas</h3>
        {areas.length === 0 ? (
          <p className="text-[#4b2e2e]">No areas assigned to you.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <div
                key={area._id}
                className="bg-white p-4 rounded-lg shadow border border-[#7f2c2c]"
              >
                <h4 className="font-semibold text-lg text-[#4b2e2e]">
                  {area.name}
                </h4>
                <p className="text-sm text-[#7f2c2c]">
                  Status: {area.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Distributor view - full management
  return (
    <div className="p-6 bg-[#E8F0F8] rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-[#4b2e2e]">Area Management</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#7f2c2c] text-white px-4 py-2 rounded hover:bg-[#6a241f]"
          >
            {showAddForm ? "Cancel" : "+ Add Area"}
          </button>
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="bg-[#4b2e2e] text-white px-4 py-2 rounded hover:bg-[#3d2525]"
          >
            {showAssignForm ? "Cancel" : "Assign to FO"}
          </button>
        </div>
      </div>

      {/* Add Area Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateArea}
          className="mb-6 p-4 bg-white rounded-lg shadow border border-[#7f2c2c]"
        >
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter area name"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              className="flex-1 p-3 border-2 border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
              required
            />
            <button
              type="submit"
              className="bg-[#7f2c2c] text-white px-6 py-3 rounded hover:bg-[#6a241f]"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Assign Areas to FO Form */}
      {showAssignForm && (
        <form
          onSubmit={handleAssignAreas}
          className="mb-6 p-4 bg-white rounded-lg shadow border border-[#7f2c2c]"
        >
          <h4 className="font-semibold mb-3 text-[#4b2e2e]">
            Assign Areas to FO
          </h4>
          <div className="flex flex-col gap-3">
            <select
              value={selectedFO}
              onChange={(e) => setSelectedFO(e.target.value)}
              className="p-3 border-2 border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none"
              required
            >
              <option value="">Select FO</option>
              {fos.map((fo) => (
                <option key={fo._id} value={fo._id}>
                  {fo.name} ({fo.email})
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <label
                  key={area._id}
                  className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer border ${
                    selectedAreas.includes(area._id)
                      ? "bg-[#7f2c2c] text-white"
                      : "bg-white text-[#4b2e2e] border-[#7f2c2c]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAreas([...selectedAreas, area._id]);
                      } else {
                        setSelectedAreas(
                          selectedAreas.filter((id) => id !== area._id)
                        );
                      }
                    }}
                    className="hidden"
                  />
                  {area.name}
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="bg-[#7f2c2c] text-white px-6 py-3 rounded hover:bg-[#6a241f] self-start"
            >
              Assign Areas
            </button>
          </div>
        </form>
      )}

      {/* Areas List */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold mb-3 text-[#4b2e2e]">All Areas</h4>
        {areas.length === 0 ? (
          <p className="text-[#4b2e2e]">No areas created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#7f2c2c] text-[#4b2e2e]">
              <thead className="bg-[#7f2c2c]/20">
                <tr>
                  <th className="p-2 border border-[#7f2c2c] text-left font-semibold">
                    Area Name
                  </th>
                  <th className="p-2 border border-[#7f2c2c] text-left font-semibold">
                    Status
                  </th>
                  <th className="p-2 border border-[#7f2c2c] text-left font-semibold">
                    Assigned FOs
                  </th>
                  <th className="p-2 border border-[#7f2c2c] text-left font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr
                    key={area._id}
                    className="border-t border-[#7f2c2c] hover:bg-[#7f2c2c]/10"
                  >
                    <td className="p-2">{area.name}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          area.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {area.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-2">
                      {area.assignedFOs?.length > 0
                        ? area.assignedFOs.map((fo) => fo.name).join(", ")
                        : "-"}
                    </td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingArea(area);
                          setEditName(area.name);
                        }}
                        className="text-[#7f2c2c] hover:text-[#5a1f1f] transition"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(area._id)}
                        className={`hover:underline ${
                          area.isActive ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {area.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteArea(area._id)}
                        className="text-red-600 hover:underline"
                      >
                        <FaTrash className="inline mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Area Modal */}
      {editingArea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-[#4b2e2e]">Edit Area</h3>
            <form onSubmit={handleUpdateArea}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 border-2 border-[#7f2c2c] bg-transparent text-[#4b2e2e] outline-none mb-4"
                required
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingArea(null);
                    setEditName("");
                  }}
                  className="px-4 py-2 border border-[#7f2c2c] text-[#7f2c2c] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7f2c2c] text-white rounded hover:bg-[#6a241f]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FO with Areas List */}
      <div>
        <h4 className="text-xl font-semibold mb-3 text-[#4b2e2e]">
          FO Management
        </h4>
        {fosWithAreas.length === 0 ? (
          <p className="text-[#4b2e2e]">No FOs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fosWithAreas.map((fo) => (
              <div
                key={fo._id}
                className={`bg-white p-4 rounded-lg shadow border-2 ${
                  fo.isActive === false 
                    ? "border-red-300 opacity-75" 
                    : "border-[#7f2c2c]"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-semibold text-lg text-[#4b2e2e]">
                      {fo.name}
                    </h5>
                    <p className="text-sm text-gray-600">{fo.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      fo.isActive !== false
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {fo.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                
                {/* Monthly Target */}
                <div className="mb-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-[#4b2e2e]">
                    Stock Target: <span className="text-[#7f2c2c] font-bold">{fo.stockTarget || 0}</span> units
                    {fo.targetMonth && <span className="text-gray-500 text-xs ml-1">({fo.targetMonth})</span>}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {fo.assignedAreas?.length > 0 ? (
                    fo.assignedAreas.map((area) => (
                      <span
                        key={area._id}
                        className="px-2 py-1 bg-[#7f2c2c]/10 text-[#7f2c2c] text-xs rounded"
                      >
                        {area.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No areas assigned</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setShowTargetForm(fo._id);
                      setTargetAmount(fo.monthlyTarget || "");
                      setTargetMonth(fo.targetMonth || new Date().toISOString().slice(0, 7));
                    }}
                    className="text-xs bg-[#7f2c2c] text-white px-2 py-1 rounded hover:bg-[#6a241f]"
                  >
                    Set Target
                  </button>
                  <button
                    onClick={() => handleToggleFOStatus(fo._id)}
                    className={`text-xs px-2 py-1 rounded ${
                      fo.isActive !== false
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {fo.isActive !== false ? "Deactivate" : "Activate"}
                  </button>
                </div>

                {/* Target Form */}
                {showTargetForm === fo._id && (
                  <div className="mt-3 p-2 bg-gray-100 rounded">
                    <p className="text-sm font-medium mb-2 text-[#4b2e2e]">Set Monthly Stock Target</p>
                    <input
                      type="number"
                      placeholder="Target quantity (units)"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full p-2 mb-2 text-sm border border-[#7f2c2c] rounded"
                    />
                    <input
                      type="month"
                      value={targetMonth}
                      onChange={(e) => setTargetMonth(e.target.value)}
                      className="w-full p-2 mb-2 text-sm border border-[#7f2c2c] rounded"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSetTarget(fo._id)}
                        className="flex-1 text-xs bg-[#7f2c2c] text-white px-2 py-1 rounded hover:bg-[#6a241f]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setShowTargetForm(null);
                          setTargetAmount("");
                          setTargetMonth("");
                        }}
                        className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaManagement;
