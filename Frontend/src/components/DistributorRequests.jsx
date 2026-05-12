import { useEffect, useState } from "react";
import { getDistributorRequestsApi, deleteDistributorRequestApi, approveDistributorRequestApi } from "../api/api";
import { FaTrash, FaSpinner, FaExclamationTriangle, FaInbox, FaCheck } from "react-icons/fa";

const DistributorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [processingType, setProcessingType] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    const res = await getDistributorRequestsApi();
    if (res.success) {
      setRequests(res.data || []);
    } else {
      setError(res.message || "Unable to load distributor requests.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this distributor request permanently?")) {
      return;
    }
    setProcessingId(id);
    setProcessingType("delete");
    const res = await deleteDistributorRequestApi(id);
    if (res.success) {
      setRequests((prev) => prev.filter((request) => request._id !== id));
      alert("Request deleted successfully.");
    } else {
      alert(res.message || "Failed to delete request.");
    }
    setProcessingId("");
    setProcessingType("");
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this distributor application and send login details?")) {
      return;
    }
    setProcessingId(id);
    setProcessingType("approve");
    const res = await approveDistributorRequestApi(id);
    if (res.success) {
      setRequests((prev) => prev.filter((request) => request._id !== id));
      alert("Distributor approved and email sent successfully.");
    } else {
      alert(res.message || "Failed to approve distributor request.");
    }
    setProcessingId("");
    setProcessingType("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-[#4b2e2e]">
        <FaSpinner className="animate-spin text-4xl mb-4 text-[#7f2c2c]" />
        <p className="text-lg font-semibold">Loading distributor requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[#f8fafc] text-[#30231f]">
      <div className="flex flex-col gap-2 mb-6">
        <div className="inline-flex items-center gap-3 text-[#7f2c2c] font-bold text-xl">
          <FaInbox />
          <span>Distributor Application Requests</span>
        </div>
        <p className="text-sm text-[#5f4b45] max-w-2xl">
          These are the distributor applications submitted through the public form. The sole administrator can review and delete any application request here.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#7f2c2c] bg-white p-8 text-center text-[#4b2e2e]/90">
          <p className="text-lg font-semibold">No pending distributor requests found.</p>
          <p className="text-sm mt-2 text-[#6b5650]">New distributor applications will appear here after they submit the form.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#e7e2dd] bg-white shadow-sm">
          <table className="min-w-full text-left">
            <thead className="bg-[#faf5f1] text-sm uppercase text-[#6b5650]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Investment</th>
                <th className="px-4 py-3">Applied On</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className="border-t border-[#f1ece8] hover:bg-[#f7f2ef]">
                  <td className="px-4 py-4 align-top text-sm font-medium text-[#3d281f]">{request.name}</td>
                  <td className="px-4 py-4 align-top text-sm text-[#5f4b45]">{request.email}</td>
                  <td className="px-4 py-4 align-top text-sm text-[#5f4b45]">{request.phone || "N/A"}</td>
                  <td className="px-4 py-4 align-top text-sm text-[#5f4b45]">{request.city || "N/A"}</td>
                  <td className="px-4 py-4 align-top text-sm text-[#5f4b45]">{request.investmentDetails || "N/A"}</td>
                  <td className="px-4 py-4 align-top text-sm text-[#5f4b45]">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4 align-top text-sm space-x-2">
                    <button
                      onClick={() => handleApprove(request._id)}
                      disabled={processingId === request._id}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      <FaCheck />
                      {processingId === request._id && processingType === "approve" ? "Processing" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleDelete(request._id)}
                      disabled={processingId === request._id}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#7f2c2c] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#5f1d1d] disabled:cursor-not-allowed disabled:bg-[#b78b85]"
                    >
                      <FaTrash />
                      {processingId === request._id && processingType === "delete" ? "Deleting" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-[#faf5f1] text-sm text-[#6b5650]">
            <div className="font-semibold">Application details</div>
            <div className="mt-2">Click delete to remove an application request from the system.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorRequests;
