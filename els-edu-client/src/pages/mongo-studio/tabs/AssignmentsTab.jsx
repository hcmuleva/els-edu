import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { CustomSelect } from "../../../components/common/CustomSelect";
import mongoService from "../../../services/mongoService";
import DeleteConfirmationModal from "../../../components/common/DeleteConfirmationModal";
import { useGetIdentity, usePermissions, useNotify } from "react-admin";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Loader2,
  Calendar,
  Save,
  Users,
} from "lucide-react";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useClass } from "../../../contexts/ClassContext";
import {
  CLASS_STANDARDS,
  mapClassToBackend,
  mapClassFromBackend,
} from "../../../config/constants";

const AssignmentsTab = () => {
  const { data: identity } = useGetIdentity();
  const { permissions } = usePermissions();
  const notify = useNotify();
  const navigate = useNavigate();
  const { isContentVisible } = useClass();
  const location = useLocation();

  const [assignments, setAssignments] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = permissions === "SUPERADMIN";
  const userOrgDocumentId = identity?.org?.documentId;

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions_text: "",
    classStandards: [],
    dueDate: "",
    maxScore: 100,
    type: "HOMEWORK",
    org: "", // documentId
  });

  // Fetch Strapi assignments
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        populate: "org",
        pagination: { pageSize: 100 },
        filters: {},
      };

      if (!isSuperAdmin && userOrgDocumentId) {
        params.filters.org = { documentId: { $eq: userOrgDocumentId } };
      }

      const data = await mongoService.getAssignments(params);
      setAssignments(data.data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      notify("Failed to fetch assignments", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, userOrgDocumentId, notify]);

  // Fetch orgs for SuperAdmin
  const fetchOrgs = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const data = await mongoService.getOrgs();
      setOrgs(data.data || []);
    } catch (err) {
      console.error("Error fetching orgs:", err);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchAssignments();
    fetchOrgs();
  }, [fetchAssignments, fetchOrgs]);

  // Filter by search AND Class Standard
  const filteredAssignments = useMemo(() => {
    let result = assignments;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }

    // Filter by Class Standard
    // Assignment has `classStandards` array. We assume it might be ["1st", "2nd"] OR ["Standard_1st", ...]
    // isContentVisible handles "1st" format if user has "1st".
    // If Assignment from Strapi has "Standard_1st", we might need to map it?
    // Let's assume we map IT to "1st" locally if needed, OR isContentVisible handles mapping?
    // isContentVisible implementation: check if userClass (e.g. "1st") is included in contentStandards.
    // If contentStandards has "Standard_1st", it won't match "1st".
    // So we should map contentStandards to frontend format before checking, OR just check.
    // Let's assume for now we standardize on "1st" (Frontend format) for comparison.
    // BUT, from API we might get "Standard_1st".
    // Let's map locally for check.

    result = result.filter((a) => {
      // Map backend standards to frontend if needed
      const standards =
        a.classStandards?.map((s) => s.replace("Standard_", "")) || [];
      return isContentVisible(standards);
    });

    return result;
  }, [assignments, searchQuery, isContentVisible]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instructions_text: "",
      classStandards: [],
      dueDate: "",
      maxScore: 100,
      type: "HOMEWORK",
      org: isSuperAdmin ? "" : userOrgDocumentId,
    });
    setEditingItem(null);
  };

  const handleCreate = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [isSuperAdmin, userOrgDocumentId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "create") {
      handleCreate();
      // Clear the action param so it doesn't trigger again on tab switch
      params.delete("action");
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [location.search, handleCreate, navigate]);

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      instructions_text: item.instructions_text || "",
      classStandards:
        item.classStandards?.map((s) => s.replace("Standard_", "")) || [], // Map backend to frontend
      dueDate: item.dueDate ? item.dueDate.substring(0, 16) : "",
      maxScore: item.maxScore || 100,
      type: item.type || "HOMEWORK",
      org: item.org?.documentId || "",
    });
    setShowForm(true);
  };

  // Save assignment via Strapi API
  const handleSave = async () => {
    if (!formData.title.trim()) {
      notify("Title is required", { type: "warning" });
      return;
    }
    if (formData.classStandards.length === 0) {
      notify("Select at least one class standard", { type: "warning" });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: formData.title,
        description: formData.description,
        instructions_text: formData.instructions_text,
        classStandards: formData.classStandards.map(mapClassToBackend), // Map frontend to backend
        dueDate: formData.dueDate || null,
        maxScore: parseInt(formData.maxScore) || 100,
        type: formData.type,
        org: formData.org || userOrgDocumentId,
      };

      if (editingItem) {
        await mongoService.updateAssignment(editingItem.documentId, payload);
        notify("Assignment updated", { type: "success" });
      } else {
        await mongoService.createAssignment(payload);
        notify("Assignment created", { type: "success" });
      }

      setShowForm(false);
      resetForm();
      fetchAssignments();
    } catch (err) {
      console.error("Error saving assignment:", err);
      notify(err.error?.message || "Failed to save", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open delete modal
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // Delete assignment
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await mongoService.deleteAssignment(itemToDelete.documentId);
      notify("Assignment deleted", { type: "success" });
      fetchAssignments();
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Error deleting assignment:", err);
      notify("Error deleting assignment", { type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle class standard
  const toggleClassStandard = (std) => {
    setFormData((prev) => ({
      ...prev,
      classStandards: prev.classStandards.includes(std)
        ? prev.classStandards.filter((s) => s !== std)
        : [...prev.classStandards, std],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <ClipboardList className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Assignments</h2>
            <p className="text-sm text-gray-500">
              {filteredAssignments.length} assignment(s)
            </p>
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No assignments found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.documentId}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                    assignment.type === "PROJECT"
                      ? "bg-purple-500"
                      : "bg-blue-500"
                  }`}
                >
                  {assignment.type}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(assignment)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => confirmDelete(assignment)}
                    className="p-1.5 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <h3
                className="font-bold text-gray-800 mb-1 cursor-pointer hover:text-orange-600"
                onClick={() =>
                  navigate(`/mongo-studio/assignments/${assignment.documentId}`)
                }
              >
                {assignment.title}
              </h3>
              <p className="text-sm text-gray-500 truncate mb-2">
                {assignment.description}
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {assignment.classStandards?.slice(0, 4).map((std) => (
                  <span
                    key={std}
                    className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                  >
                    {std.replace("Standard_", "")}
                  </span>
                ))}
                {assignment.classStandards?.length > 4 && (
                  <span className="text-xs text-gray-400">
                    +{assignment.classStandards.length - 4}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {assignment.dueDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Max: {assignment.maxScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
              <div className="p-6 border-b flex-none flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {editingItem ? "Edit Assignment" : "Create Assignment"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    rows={2}
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={formData.instructions_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instructions_text: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    rows={4}
                    placeholder="Detailed instructions for students..."
                  />
                </div>

                {/* Org (SuperAdmin) */}
                {isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Organization *
                    </label>
                    <CustomSelect
                      value={formData.org}
                      onChange={(val) => setFormData({ ...formData, org: val })}
                      options={orgs.map((org) => ({
                        id: org.documentId,
                        name: org.org_name || org.name,
                      }))}
                      placeholder="Select Organization"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Type
                  </label>
                  <CustomSelect
                    value={formData.type}
                    onChange={(val) => setFormData({ ...formData, type: val })}
                    options={[
                      { id: "HOMEWORK", name: "Homework" },
                      { id: "PROJECT", name: "Project" },
                    ]}
                    className="w-full"
                  />
                </div>

                {/* Due Date + Max Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      value={formData.maxScore}
                      onChange={(e) =>
                        setFormData({ ...formData, maxScore: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                {/* Class Standards */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Target Class Standards *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CLASS_STANDARDS.map((std) => (
                      <button
                        key={std}
                        type="button"
                        onClick={() => toggleClassStandard(std)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          formData.classStandards.includes(std)
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {std}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Assignment will be auto-assigned to all students of selected
                    standards
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t flex-none flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        itemName={itemToDelete?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AssignmentsTab;
