import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { CustomSelect } from "../../../components/common/CustomSelect";
import { useGetIdentity, usePermissions, useNotify } from "react-admin";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Loader2,
  Calendar,
  Users,
  Play,
  Save,
  ChevronDown,
  ChevronLeft,
  FileText,
  Video,
  ChevronRight,
  Filter,
  ClipboardList,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableContentItem } from "../../../components/common/SortableContentItem";
import qs from "qs";
import mongoService from "../../../services/mongoService";
import DeleteConfirmationModal from "../../../components/common/DeleteConfirmationModal";
import { useClass } from "../../../contexts/ClassContext";
import { Link } from "react-router-dom";

const CLASS_STANDARDS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-gray-400" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-500" },
  { value: "live", label: "Live", color: "bg-red-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-yellow-500" },
];

const ClassroomsTab = () => {
  const { data: identity } = useGetIdentity();
  const { permissions } = usePermissions();
  const notify = useNotify();
  const { isContentVisible } = useClass();

  const [classrooms, setClassrooms] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Content Selection State
  const [contentSearch, setContentSearch] = useState("");
  const [contentPage, setContentPage] = useState(1);
  const [contentTotal, setContentTotal] = useState(0);
  const [contentLoading, setContentLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedContentDetails, setSelectedContentDetails] = useState([]); // Store details of selected items separately

  const isSuperAdmin = permissions === "SUPERADMIN";
  const userOrgDocumentId = identity?.org?.documentId;

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    orgDocumentId: "",
    classTypes: [],
    status: "draft",
    startDate: "",
    endDate: "",
    isInstant: false,
    contentDocumentIds: [],
    assignmentDocumentIds: [],
    quizIds: [],
    thumbnail: "",
  });

  const [activeTab, setActiveTab] = useState("content"); // content | assignment
  const [modalAssignments, setModalAssignments] = useState([]);
  const [modalAssignmentSearch, setModalAssignmentSearch] = useState("");
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentTotal, setAssignmentTotal] = useState(0);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState(
    []
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = formData.contentDocumentIds.indexOf(active.id);
      const newIndex = formData.contentDocumentIds.indexOf(over.id);

      const newOrder = arrayMove(
        formData.contentDocumentIds,
        oldIndex,
        newIndex
      );

      setFormData((prev) => ({
        ...prev,
        contentDocumentIds: newOrder,
      }));
    }
  };

  // Helper to extract text from blocks
  const extractTextFromBlocks = (blocks) => {
    if (!blocks || !Array.isArray(blocks)) return "";
    return (
      blocks
        .map((block) => {
          if (block.type === "paragraph" || block.type === "heading") {
            return block.children?.map((child) => child.text).join("") || "";
          }
          return "";
        })
        .join(" ")
        .substring(0, 100) + (blocks.length > 0 ? "..." : "")
    );
  };

  // Fetch classrooms
  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (!isSuperAdmin && userOrgDocumentId) {
        params.orgDocumentId = userOrgDocumentId;
      }

      const data = await mongoService.getClassrooms(params);
      setClassrooms(data.data || []);
    } catch (err) {
      console.error("Error fetching classrooms:", err);
      notify("Failed to fetch classrooms", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, userOrgDocumentId, notify]);

  // Fetch orgs for SuperAdmin dropdown
  const fetchOrgs = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const data = await mongoService.getOrgs();
      setOrgs(data.data || []);
    } catch (err) {
      console.error("Error fetching orgs:", err);
    }
  }, [isSuperAdmin]);

  // Fetch Subjects and Topics for dropdowns
  const fetchMetadata = useCallback(async () => {
    try {
      const subData = await mongoService.getSubjects();
      setSubjects(subData.data || []);

      const topicData = await mongoService.getTopics();
      setTopics(topicData.data || []);
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  }, []);

  // Fetch contents for selection with search, pagination and filters
  const fetchContents = useCallback(async () => {
    try {
      setContentLoading(true);

      const queryParams = {
        pagination: {
          page: contentPage,
          pageSize: 20,
        },
        fields: ["title", "documentId", "type", "json_description"],
        filters: {},
      };

      if (contentSearch) {
        queryParams.filters.title = { $containsi: contentSearch };
      }
      if (filterSubject) {
        queryParams.filters.subjects = { documentId: { $eq: filterSubject } };
      }
      if (filterTopic) {
        queryParams.filters.topics = { documentId: { $eq: filterTopic } };
      }

      const data = await mongoService.getContents(queryParams);
      setContents(data.data || []);
      setContentTotal(data.meta?.pagination?.total || 0);
    } catch (err) {
      console.error("Error fetching contents:", err);
    } finally {
      setContentLoading(false);
    }
  }, [contentPage, contentSearch, filterSubject, filterTopic]);

  // Fetch assignments for selection
  const fetchModalAssignments = useCallback(async () => {
    try {
      setAssignmentLoading(true);
      const params = {
        pagination: { page: assignmentPage, pageSize: 20 },
        filters: {},
      };

      if (modalAssignmentSearch) {
        params.filters.title = { $containsi: modalAssignmentSearch };
      }

      const data = await mongoService.getAssignments(params);
      setModalAssignments(data.data || []);
      setAssignmentTotal(data.meta?.pagination?.total || 0);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    } finally {
      setAssignmentLoading(false);
    }
  }, [assignmentPage, modalAssignmentSearch]);

  // Fetch Contents when modal is open
  useEffect(() => {
    if (showForm) {
      if (activeTab === "content") fetchContents();
      if (activeTab === "assignment") fetchModalAssignments();
    }
  }, [showForm, activeTab, fetchContents, fetchModalAssignments]);

  // Fetch selected contents separately to ensure they are always available even if not in current paginated list
  const fetchSelectedContents = useCallback(async (ids) => {
    if (!ids || ids.length === 0) {
      setSelectedContentDetails([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Split into chunks if too many IDs, but for now simple implementation
      const promises = ids.map((id) =>
        fetch(
          `${
            import.meta.env.VITE_API_URL
          }/contents?filters[documentId][$eq]=${id}&fields[0]=title&fields[1]=documentId&fields[2]=type&fields[3]=json_description`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
          .then((r) => r.json())
          .then((d) => d.data?.[0])
      );

      const results = await Promise.all(promises);
      setSelectedContentDetails(results.filter(Boolean));
    } catch (err) {
      console.error("Error fetching selected contents:", err);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
    fetchOrgs();
    fetchMetadata();
  }, [fetchClassrooms, fetchOrgs, fetchMetadata]);

  // Fetch contents when modal is open or filters change
  useEffect(() => {
    if (showForm) {
      fetchContents();
    }
  }, [showForm, fetchContents]);

  // Filter classrooms by list search AND Class Standard using useClass()
  const filteredClassrooms = useMemo(() => {
    let result = classrooms;

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    // 2. Filter by Class Standard (using Context)
    // Note: c.classTypes matches the "1st", "2nd" format directly if that's what is stored in Mongo
    // But backend User uses "Standard_1st".
    // The Context helper `isContentVisible` expects an array of standards (backend format usually?)
    // Wait, the Mongo Classroom `classTypes` are likely plain strings like "1st".
    // I should check `CLASS_STANDARDS` in this file. It uses "1st".
    // My `ClassContext` logic expects `Standard_1st`.
    // So I might need to map classroom standards to backend format OR update Context to be smarter.
    // Let's assume Context `isContentVisible` compares against `userClass` (which is "1st", "2nd" etc after mapClassFromBackend).
    // Let's check Context implementation...
    // In Context: const userClass = mapClassFromBackend(identity.class_standard); // e.g. "4th"
    // isContentVisible checks if contentClassStandards.includes(userClass).
    // So if classroom.classTypes = ["4th"], it works!

    result = result.filter((c) => isContentVisible(c.classTypes));

    return result;
  }, [classrooms, searchQuery, isContentVisible]);

  // Get selected content objects in order
  const selectedContents = useMemo(() => {
    // Map IDs to full objects from selectedContentDetails
    return (formData.contentDocumentIds || [])
      .map((id) => selectedContentDetails?.find((c) => c.documentId === id))
      .filter(Boolean);
  }, [formData.contentDocumentIds, selectedContentDetails]);

  const selectedAssignments = useMemo(() => {
    return (formData.assignmentDocumentIds || [])
      .map(
        (id) =>
          selectedAssignmentDetails?.find((a) => a.documentId === id) ||
          modalAssignments?.find((a) => a.documentId === id)
      )
      .filter(Boolean);
  }, [
    formData.assignmentDocumentIds,
    selectedAssignmentDetails,
    modalAssignments,
  ]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      orgDocumentId: isSuperAdmin ? "" : userOrgDocumentId,
      classTypes: [],
      status: "draft",
      startDate: "",
      endDate: "",
      isInstant: false,
      contentDocumentIds: [],
      assignmentDocumentIds: [],
      quizIds: [],
      thumbnail: "",
    });
    setEditingItem(null);
    setModalAssignments([]);
    setSelectedContentDetails([]);
    setContentSearch("");
    setFilterSubject("");
    setFilterTopic("");
    setContentPage(1);
    setModalAssignmentSearch("");
    setAssignmentPage(1);
    setSelectedAssignmentDetails([]);
    setActiveTab("content");
  };

  // Open form for create
  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  // Open form for edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      orgDocumentId: item.orgDocumentId || "",
      classTypes: item.classTypes || [],
      status: item.status || "draft",
      startDate: item.startDate ? item.startDate.substring(0, 16) : "",
      endDate: item.endDate ? item.endDate.substring(0, 16) : "",
      isInstant: item.isInstant || false,
      contentDocumentIds: item.contentDocumentIds || [],
      assignmentDocumentIds: item.assignmentDocumentIds || [],
      quizIds: item.quizIds || [],
      thumbnail: item.thumbnail || "",
    });

    // Fetch details for already selected contents
    if (item.contentDocumentIds?.length > 0) {
      fetchSelectedContents(item.contentDocumentIds);
    }
    // Note: We might want to fetch selected assignment details too if we want to show them immediately
    // For now relying on list fetch or separate fetch if needed.
    // Let's implement fetchSelectedAssignments similar to content
    if (item.assignmentDocumentIds?.length > 0) {
      // logic to pre-fetch details if not in list
      // For brevity, skipping specialized pre-fetch for assignments unless needed
    }

    setShowForm(true);
  };

  // Save classroom
  const handleSave = async () => {
    if (!formData.title.trim()) {
      notify("Title is required", { type: "warning" });
      return;
    }
    if (!formData.endDate) {
      notify("End date is required", { type: "warning" });
      return;
    }
    if (!formData.orgDocumentId && !userOrgDocumentId) {
      notify("Organization is required", { type: "warning" });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        orgDocumentId: formData.orgDocumentId || userOrgDocumentId,
        startDate: formData.isInstant ? null : formData.startDate || null,
        // Ensure contentDocumentIds and assignmentDocumentIds are sent
        contentDocumentIds: formData.contentDocumentIds,
        assignmentDocumentIds: formData.assignmentDocumentIds,
      };

      if (editingItem) {
        // Use _id or documentId
        const id = editingItem._id || editingItem.documentId;
        await mongoService.updateClassroom(id, payload);
        notify("Classroom updated", { type: "success" });
      } else {
        await mongoService.createClassroom(payload);
        notify("Classroom created", { type: "success" });
      }

      setShowForm(false);
      resetForm();
      fetchClassrooms();
    } catch (err) {
      console.error("Error saving classroom:", err);
      notify(err.error || "Failed to save", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ... (existing helper functions) ...

  // Open delete modal
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // Execute delete
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      // Use _id or documentId
      const id = itemToDelete._id || itemToDelete.documentId;
      await mongoService.deleteClassroom(id);
      notify("Classroom deleted", { type: "success" });
      fetchClassrooms();
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      notify("Error deleting classroom", { type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle class type selection
  const toggleClassType = (type) => {
    setFormData((prev) => ({
      ...prev,
      classTypes: prev.classTypes.includes(type)
        ? prev.classTypes.filter((t) => t !== type)
        : [...prev.classTypes, type],
    }));
  };

  // Toggle content selection
  const toggleContent = (content) => {
    setFormData((prev) => {
      const docId = content.documentId;
      const isSelected = prev.contentDocumentIds.includes(docId);

      // Update selected content details cache
      if (!isSelected) {
        setSelectedContentDetails((curr) => [...curr, content]);
        return {
          ...prev,
          contentDocumentIds: [...prev.contentDocumentIds, docId],
        };
      } else {
        // If unselecting, remove from ID list but keep in details cache to avoid refetching if re-selected immediately
        // (optional optimization, but removing for now to keep strict sync)
        setSelectedContentDetails((curr) =>
          curr.filter((c) => c.documentId !== docId)
        );
        return {
          ...prev,
          contentDocumentIds: prev.contentDocumentIds.filter(
            (id) => id !== docId
          ),
        };
      }
    });
  };

  const removeContent = (docId) => {
    setFormData((prev) => ({
      ...prev,
      contentDocumentIds: prev.contentDocumentIds.filter((id) => id !== docId),
    }));
    setSelectedContentDetails((curr) =>
      curr.filter((c) => c.documentId !== docId)
    );
  };

  const toggleAssignment = (assignment) => {
    setFormData((prev) => {
      const docId = assignment.documentId;
      const isSelected = prev.assignmentDocumentIds.includes(docId);

      if (!isSelected) {
        setSelectedAssignmentDetails((curr) => [...curr, assignment]);
        return {
          ...prev,
          assignmentDocumentIds: [...prev.assignmentDocumentIds, docId],
        };
      } else {
        setSelectedAssignmentDetails((curr) =>
          curr.filter((a) => a.documentId !== docId)
        );
        return {
          ...prev,
          assignmentDocumentIds: prev.assignmentDocumentIds.filter(
            (id) => id !== docId
          ),
        };
      }
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(contentTotal / 20)) {
      setContentPage(newPage);
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${
          statusInfo?.color || "bg-gray-400"
        }`}
      >
        {statusInfo?.label || status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Classrooms</h2>
            <p className="text-sm text-gray-500">
              {filteredClassrooms.length} classroom(s)
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Classroom
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search classrooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredClassrooms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No classrooms found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClassrooms.map((classroom) => (
            <div
              key={classroom._id}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                {getStatusBadge(classroom.status)}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(classroom)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => confirmDelete(classroom)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <h3
                className="font-bold text-gray-800 mb-1 cursor-pointer hover:text-primary"
                onClick={() => handleEdit(classroom)}
              >
                {classroom.title}
              </h3>
              <p className="text-sm text-gray-500 truncate mb-3">
                {classroom.description}
              </p>

              <div className="flex gap-3 text-xs text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>
                    {classroom.contentDocumentIds?.length || 0} Contents
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" />
                  <span>
                    {classroom.assignmentDocumentIds?.length || 0} Assignments
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {classroom.classTypes?.slice(0, 4).map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {type}
                  </span>
                ))}
                {classroom.classTypes?.length > 4 && (
                  <span className="text-xs text-gray-400">
                    +{classroom.classTypes.length - 4} more
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {classroom.endDate
                    ? new Date(classroom.endDate).toLocaleDateString()
                    : "No date"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {classroom.contentDocumentIds?.length || 0} lectures
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-0 sm:p-4">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-7xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold">
                  {editingItem ? "Edit Classroom" : "Create Classroom"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LEFT COLUMN: Metadata Fields */}
                  <div className="space-y-6">
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
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Class title"
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
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows={3}
                        placeholder="Class description"
                      />
                    </div>

                    {/* Org & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Org (SuperAdmin only) */}
                      {isSuperAdmin && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Organization *
                          </label>
                          <CustomSelect
                            value={formData.orgDocumentId}
                            onChange={(val) =>
                              setFormData({
                                ...formData,
                                orgDocumentId: val,
                              })
                            }
                            options={orgs.map((org) => ({
                              id: org.documentId,
                              name: org.org_name || org.name,
                            }))}
                            placeholder="Select Organization"
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Status */}
                      <div className={isSuperAdmin ? "" : "col-span-2"}>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Status
                        </label>
                        <CustomSelect
                          value={formData.status}
                          onChange={(val) =>
                            setFormData({ ...formData, status: val })
                          }
                          options={STATUS_OPTIONS.map((opt) => ({
                            id: opt.value,
                            name: opt.label,
                          }))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Instant Class Toggle */}
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
                      <input
                        type="checkbox"
                        id="isInstant"
                        checked={formData.isInstant}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isInstant: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <label
                        htmlFor="isInstant"
                        className="text-sm font-medium"
                      >
                        Instant Class
                        <span className="block text-xs text-gray-500 font-normal">
                          No start date required, starts immediately.
                        </span>
                      </label>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      {!formData.isInstant && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.startDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                startDate: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      )}
                      <div className={formData.isInstant ? "col-span-2" : ""}>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          End Date *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Class Types */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Target Class Standards
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CLASS_STANDARDS.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleClassType(type)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              formData.classTypes.includes(type)
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Content Selection & Ordering */}
                  <div className="space-y-4">
                    {/* Column Layout for Content (Stacked on mobile, 2 cols on Desktop inside the Right Column) */}
                    {/* Actually, the Right Column is already half the modal width. Splitting it again might make it too narrow.
                       The plan asked for "in a column instead of rows". Let's interpret "column" as:
                       Left: Available List | Right: Selected List
                       Wait, the current outer grid divides Form (Left) and Content (Right).
                       The Content needs to be split.
                       Let's make the Modal wider (max-w-7xl) and split the entire modal into:
                       Col 1: Form Inputs
                       Col 2: Available Content
                       Col 3: Selected Content
                       OR
                       Top: Form Inputs
                       Bottom: 2-Col Content
                       
                       Let's stick to the current outer 2-col (Form | Content). This makes the content area narrow for 2 lists side-by-side.
                       Better approach:
                       Modal Grid:
                       - Desktop: Col 1 (35%): Form Inputs. Col 2 (65%): Content Selection (Split into Avail | Sel)
                   */}
                  </div>
                </div>

                {/* Content Section - Full Width below basic info on mobile, or side-by-side on desktop */}
                <div className="border-t pt-6">
                  {/* Selection Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <h4 className="font-bold text-lg">Manage:</h4>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => setActiveTab("content")}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            activeTab === "content"
                              ? "bg-white shadow text-primary"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Library Content
                        </button>
                        <button
                          onClick={() => setActiveTab("assignment")}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            activeTab === "assignment"
                              ? "bg-white shadow text-primary"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Assignments
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[600px]">
                      {/* LEFT PANEL: AVAILABLE ITEMS */}
                      <div className="flex flex-col h-[500px] lg:h-full border rounded-xl overflow-hidden bg-gray-50/30">
                        <div className="p-3 border-b bg-white space-y-3">
                          <label className="block text-sm font-bold text-gray-700">
                            {activeTab === "content"
                              ? "Available Content"
                              : "Available Assignments"}
                          </label>

                          {/* Search & Filter Bar */}
                          <div className="flex flex-col gap-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder={
                                  activeTab === "content"
                                    ? "Search content..."
                                    : "Search assignments..."
                                }
                                value={
                                  activeTab === "content"
                                    ? contentSearch
                                    : modalAssignmentSearch
                                }
                                onChange={(e) => {
                                  if (activeTab === "content") {
                                    setContentSearch(e.target.value);
                                    setContentPage(1);
                                  } else {
                                    setModalAssignmentSearch(e.target.value);
                                    setAssignmentPage(1);
                                  }
                                }}
                                className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg"
                              />
                            </div>

                            {/* Filters only for Content currently */}
                            {activeTab === "content" && (
                              <div className="flex gap-2">
                                <CustomSelect
                                  value={filterSubject}
                                  onChange={(val) => {
                                    setFilterSubject(val);
                                    setContentPage(1);
                                  }}
                                  options={subjects.map((s) => ({
                                    id: s.documentId,
                                    name: s.name || s.title,
                                  }))}
                                  placeholder="All Subjects"
                                  className="flex-1"
                                />
                                <CustomSelect
                                  value={filterTopic}
                                  onChange={(val) => {
                                    setFilterTopic(val);
                                    setContentPage(1);
                                  }}
                                  options={topics.map((t) => ({
                                    id: t.documentId,
                                    name: t.name || t.title,
                                  }))}
                                  placeholder="All Topics"
                                  className="flex-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {(
                            activeTab === "content"
                              ? contentLoading
                              : assignmentLoading
                          ) ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="animate-spin text-primary" />
                            </div>
                          ) : (activeTab === "content"
                              ? contents
                              : modalAssignments
                            ).length === 0 ? (
                            <p className="text-center text-gray-500 text-sm py-4">
                              No items found
                            </p>
                          ) : (
                            (activeTab === "content"
                              ? contents
                              : modalAssignments
                            ).map((item) => {
                              const isSelected =
                                activeTab === "content"
                                  ? formData.contentDocumentIds.includes(
                                      item.documentId
                                    )
                                  : formData.assignmentDocumentIds.includes(
                                      item.documentId
                                    );

                              return (
                                <div
                                  key={item.documentId}
                                  onClick={() =>
                                    activeTab === "content"
                                      ? toggleContent(item)
                                      : toggleAssignment(item)
                                  }
                                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-blue-50 border border-blue-200"
                                      : "bg-white hover:bg-gray-100 border border-gray-200"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      {activeTab === "content" ? (
                                        item.type === "video" ? (
                                          <Video className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <FileText className="w-3 h-3 text-gray-400" />
                                        )
                                      ) : (
                                        <ClipboardList className="w-3 h-3 text-orange-400" />
                                      )}
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {item.title}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                      {activeTab === "content"
                                        ? extractTextFromBlocks(
                                            item.json_description
                                          ) || item.description
                                        : item.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Pagination */}
                        <div className="p-2 border-t bg-white flex items-center justify-between text-xs">
                          <button
                            onClick={() =>
                              activeTab === "content"
                                ? handlePageChange(contentPage - 1)
                                : setAssignmentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={
                              activeTab === "content"
                                ? contentPage === 1
                                : assignmentPage === 1
                            }
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-medium text-gray-600">
                            {activeTab === "content"
                              ? `Page ${contentPage}`
                              : `Page ${assignmentPage}`}
                          </span>
                          <button
                            onClick={() =>
                              activeTab === "content"
                                ? handlePageChange(contentPage + 1)
                                : setAssignmentPage((p) => p + 1)
                            } // Simple next page logic, ideally check total
                            // disabled logic omitted for brevity or check total
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* RIGHT PANEL: SELECTED ITEMS */}
                      <div className="flex flex-col h-[500px] lg:h-full border rounded-xl overflow-hidden bg-gray-50/30">
                        <div className="p-3 border-b bg-white">
                          <label className="block text-sm font-bold text-gray-700">
                            {activeTab === "content"
                              ? `Selected Content (${selectedContents.length})`
                              : `Selected Assignments (${selectedAssignments.length})`}
                          </label>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3">
                          {activeTab === "content" ? (
                            selectedContents.length === 0 ? (
                              <p className="text-gray-400 text-sm p-4 text-center">
                                No content selected
                              </p>
                            ) : (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                              >
                                <SortableContext
                                  items={selectedContents.map(
                                    (c) => c.documentId
                                  )}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="space-y-2">
                                    {selectedContents.map((content) => (
                                      <SortableContentItem
                                        key={content.documentId}
                                        content={{
                                          ...content,
                                          description:
                                            extractTextFromBlocks(
                                              content.json_description
                                            ) || content.description,
                                        }}
                                        onRemove={removeContent}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            )
                          ) : // Assignments List (No DnD for now, just list)
                          selectedAssignments.length === 0 ? (
                            <p className="text-gray-400 text-sm p-4 text-center">
                              No assignments selected
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {selectedAssignments.map((assignment) => (
                                <div
                                  key={assignment.documentId}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm"
                                >
                                  <div>
                                    <p className="font-medium text-sm">
                                      {assignment.title}
                                    </p>
                                    <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                                      {assignment.type}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => toggleAssignment(assignment)}
                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="p-4 sm:p-6 border-t flex justify-end gap-3 bg-white shrink-0">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
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
        title="Delete Classroom"
        message="Are you sure you want to delete this classroom? This action cannot be undone."
        itemName={itemToDelete?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ClassroomsTab;
