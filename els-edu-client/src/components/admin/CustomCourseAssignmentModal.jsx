import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Save,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Search,
} from "lucide-react";
import { useDataProvider } from "react-admin";
import api from "../../services/api";
import { cn } from "../../lib/utils";
import { CustomSelect } from "../common/CustomSelect";
import { subscribeToUserCustomCourseUpdates, subscribeToCustomCourseUpdates } from "../../services/ably";

// Transfer List Component for Subjects
const SubjectTransferList = ({
  availableSubjects = [],
  assignedSubjects = [],
  onAssignedChange,
  skillsWithSubjects = [],
  unassignedSubjects = [], // Pass unassigned subjects from parent
  onUnassignedChange, // Callback to update unassigned subjects in parent
}) => {
  const [selected, setSelected] = useState(new Set());
  const [localAssigned, setLocalAssigned] = useState([]);
  const [localAvailable, setLocalAvailable] = useState([]);
  const [availableSearch, setAvailableSearch] = useState("");
  const [assignedSearch, setAssignedSearch] = useState("");

  useEffect(() => {
    console.log("[SubjectTransferList] useEffect triggered", {
      assignedSubjects: assignedSubjects,
      assignedSubjectsCount: assignedSubjects?.length || 0,
      availableSubjects: availableSubjects,
      availableSubjectsCount: availableSubjects?.length || 0,
      unassignedSubjectsCount: unassignedSubjects?.length || 0,
    });
    
    // Ensure we have arrays
    const safeAssigned = Array.isArray(assignedSubjects) ? assignedSubjects : [];
    const safeAvailable = Array.isArray(availableSubjects) ? availableSubjects : [];
    
    setLocalAssigned(safeAssigned);
    
    // Get all subjects from skills, excluding already assigned ones
    const assignedIds = new Set(safeAssigned.map((s) => s?.documentId).filter(Boolean));
    const surveyAvailable = safeAvailable.filter(
      (s) => s && s.documentId && !assignedIds.has(s.documentId)
    );
    
    // Include unassigned subjects that aren't in the survey
    const safeUnassigned = Array.isArray(unassignedSubjects) ? unassignedSubjects : [];
    const unassignedNotInSurvey = safeUnassigned.filter(
      (s) => s && s.documentId && !assignedIds.has(s.documentId) && 
             !surveyAvailable.some((sa) => sa.documentId === s.documentId)
    );
    
    // Combine survey subjects with previously unassigned subjects
    const allAvailable = [...surveyAvailable, ...unassignedNotInSurvey];
    
    console.log("[SubjectTransferList] Calculated lists", {
      safeAssignedCount: safeAssigned.length,
      safeAvailableCount: safeAvailable.length,
      surveyAvailableCount: surveyAvailable.length,
      unassignedNotInSurveyCount: unassignedNotInSurvey.length,
      allAvailableCount: allAvailable.length,
    });
    
    setLocalAvailable(allAvailable);
    setSelected(new Set());
  }, [availableSubjects, assignedSubjects, unassignedSubjects]);

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const moveToAssigned = () => {
    const toMove = localAvailable.filter((item) =>
      selected.has(item.documentId)
    );
    
    if (toMove.length === 0) return;
    
    const newAssigned = [...localAssigned, ...toMove];
    const newAvailable = localAvailable.filter(
      (item) => !selected.has(item.documentId)
    );
    
    // Remove from unassignedSubjects if they were reassigned
    const toMoveIds = new Set(toMove.map((s) => s.documentId));
    if (onUnassignedChange) {
      onUnassignedChange((prev) => 
        prev.filter((s) => !toMoveIds.has(s.documentId))
      );
    }
    
    setLocalAssigned(newAssigned);
    setLocalAvailable(newAvailable);
    setSelected(new Set());
    onAssignedChange(newAssigned);
  };

  const moveToAvailable = () => {
    const toMove = localAssigned.filter((item) =>
      selected.has(item.documentId)
    );
    
    if (toMove.length === 0) return;
    
    const newAssigned = localAssigned.filter(
      (item) => !selected.has(item.documentId)
    );
    const newAvailable = [...localAvailable, ...toMove];
    
    // Track unassigned subjects (those not originally in availableSubjects)
    const toMoveIds = new Set(toMove.map((s) => s.documentId));
    const availableSubjectIds = new Set(availableSubjects.map((s) => s.documentId));
    const newlyUnassigned = toMove.filter((s) => !availableSubjectIds.has(s.documentId));
    
    if (newlyUnassigned.length > 0 && onUnassignedChange) {
      onUnassignedChange((prev) => {
        const existingIds = new Set(prev.map((s) => s.documentId));
        const toAdd = newlyUnassigned.filter((s) => !existingIds.has(s.documentId));
        return [...prev, ...toAdd];
      });
    }
    
    setLocalAssigned(newAssigned);
    setLocalAvailable(newAvailable);
    setSelected(new Set());
    onAssignedChange(newAssigned);
  };

  // Filter subjects
  const filteredAvailable = (localAvailable || []).filter((item) =>
    item && (item.name || "")
      .toLowerCase()
      .includes(availableSearch.toLowerCase())
  );
  const filteredAssigned = (localAssigned || []).filter((item) =>
    item && (item.name || "")
      .toLowerCase()
      .includes(assignedSearch.toLowerCase())
  );
  
  console.log("[SubjectTransferList] Filtered lists", {
    filteredAvailableCount: filteredAvailable.length,
    filteredAssignedCount: filteredAssigned.length,
    localAvailableCount: localAvailable?.length || 0,
    localAssignedCount: localAssigned?.length || 0,
  });

  return (
    <div className="grid grid-cols-[1fr,auto,1fr] gap-4 h-full min-h-[400px]">
      {/* Suggested Subjects List */}
      <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-2">
            Suggested Subjects ({filteredAvailable.length})
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[250px] max-h-[300px]">
          {filteredAvailable.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No suggested subjects
            </p>
          ) : (
            filteredAvailable.map((subject) => (
              <div
                key={subject.documentId}
                onClick={() => toggleSelect(subject.documentId)}
                className={cn(
                  "px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                  selected.has(subject.documentId)
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className="font-medium text-gray-800">{subject.name}</div>
                {subject.grade && (
                  <div className="text-xs text-gray-500">
                    {subject.grade} • Level {subject.level || "N/A"}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center justify-center gap-2 py-2">
        <button
          onClick={moveToAssigned}
          disabled={
            ![...selected].some((id) =>
              localAvailable.find((i) => i.documentId === id)
            )
          }
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary disabled:opacity-40 transition-all"
          title="Assign selected"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={moveToAvailable}
          disabled={
            ![...selected].some((id) =>
              localAssigned.find((i) => i.documentId === id)
            )
          }
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary disabled:opacity-40 transition-all"
          title="Remove selected"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Assigned List */}
      <div className="flex flex-col border border-emerald-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
          <h3 className="text-sm font-bold text-emerald-700 mb-2">
            Assigned ({filteredAssigned.length})
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
              value={assignedSearch}
              onChange={(e) => setAssignedSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[250px] max-h-[300px]">
          {filteredAssigned.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No subjects assigned
            </p>
          ) : (
            filteredAssigned.map((subject) => (
              <div
                key={subject.documentId}
                onClick={() => toggleSelect(subject.documentId)}
                className={cn(
                  "px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                  selected.has(subject.documentId)
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className="font-medium text-gray-800">{subject.name}</div>
                {subject.grade && (
                  <div className="text-xs text-gray-500">
                    {subject.grade} • Level {subject.level || "N/A"}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const CustomCourseAssignmentModal = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const dataProvider = useDataProvider();
  const [loading, setLoading] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [skillsWithSubjects, setSkillsWithSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [customCourses, setCustomCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [unassignedSubjects, setUnassignedSubjects] = useState([]); // Track subjects that were unassigned
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "EDUCATION",
    subcategory: "ACADEMIC",
    subjectDocumentIds: [],
    cover: null,
    status: "ACTIVE",
  });
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Define fetchCustomCourses before useEffect hooks that use it
  const fetchCustomCourses = useCallback(async () => {
    if (!user?.documentId) return;
    try {
      setLoadingCourses(true);
      const response = await api.get(
        `/user-courses/user/${user.documentId}/custom-courses`
      );
      setCustomCourses(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching custom courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  }, [user?.documentId]);

  // Define fetchSurveys before useEffect hooks that use it
  const fetchSurveys = useCallback(async () => {
    if (!user?.documentId) return;
    try {
      setLoading(true);
      const response = await api.get(
        `/user-courses/user/${user.documentId}/surveys`
      );
      setSurveys(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      setError("Failed to load surveys");
    } finally {
      setLoading(false);
    }
  }, [user?.documentId]);

  // Fetch surveys when modal opens
  useEffect(() => {
    if (isOpen && user?.documentId) {
      fetchSurveys();
      fetchCustomCourses();
      // Reset form
      setSelectedSurveyId(null);
      setSkillsWithSubjects([]);
      setAllSubjects([]);
      setShowCreateForm(false);
      setEditingCourse(null);
      setFormData({
        name: "",
        description: "",
        category: "EDUCATION",
        subcategory: "ACADEMIC",
        subjectDocumentIds: [],
        cover: null,
        status: "ACTIVE",
      });
      setAssignedSubjects([]);
      setError("");
    }
  }, [isOpen, user?.documentId, fetchSurveys, fetchCustomCourses]);

  // Subscribe to real-time updates for custom courses
  useEffect(() => {
    if (!isOpen || !user?.documentId) {
      return;
    }

    // Subscribe to user-specific updates
    const unsubscribeUser = subscribeToUserCustomCourseUpdates(
      user.documentId,
      (eventName, data) => {
        console.log("[ABLY] User custom course update:", eventName, data);
        if (eventName === "custom-course:assigned") {
          // Refresh courses list when a course is assigned
          fetchCustomCourses();
        }
      }
    );

    // Subscribe to global updates (for create/update/delete)
    const unsubscribeGlobal = subscribeToCustomCourseUpdates((eventName, data) => {
      console.log("[ABLY] Global custom course update:", eventName, data);
      if (eventName === "custom-course:created" || eventName === "custom-course:updated" || eventName === "custom-course:deleted") {
        // Refresh courses list when a course is created, updated, or deleted
        fetchCustomCourses();
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeGlobal();
    };
  }, [isOpen, user?.documentId, fetchCustomCourses]);

  const handleSurveySelect = async (surveyId) => {
    try {
      setLoadingSubjects(true);
      setSelectedSurveyId(surveyId);
      const response = await api.get(
        `/user-courses/survey/${surveyId}/subjects`
      );
      const data = response.data?.data || {};
      console.log("Survey subjects data:", data);
      setSkillsWithSubjects(data.skills || []);
      const surveySubjects = data.allSubjects || [];
      setAllSubjects(surveySubjects);
      console.log("Set skillsWithSubjects:", data.skills);
      console.log("Set allSubjects:", surveySubjects);
      
      // If editing a course, calculate which assigned subjects are not in the survey
      // These should appear in the suggested (unassigned) list
      // This ensures that when you reopen edit, subjects not in the survey show in Suggested
      if (editingCourse && assignedSubjects.length > 0) {
        const surveySubjectIds = new Set(surveySubjects.map((s) => s.documentId));
        const unassignedFromCourse = assignedSubjects.filter(
          (s) => !surveySubjectIds.has(s.documentId)
        );
        if (unassignedFromCourse.length > 0) {
          console.log("[handleSurveySelect] Found unassigned subjects not in survey:", unassignedFromCourse);
          setUnassignedSubjects(unassignedFromCourse);
        } else {
          // Clear unassigned if all assigned subjects are in the survey
          setUnassignedSubjects([]);
        }
      }
    } catch (error) {
      console.error("Error fetching subjects from survey:", error);
      setError("Failed to load subjects from survey");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleAssignedSubjectsChange = (newAssigned) => {
    setAssignedSubjects(newAssigned);
    setFormData({
      ...formData,
      subjectDocumentIds: newAssigned.map((s) => s.documentId),
    });
  };

  const handleCreateCourse = async () => {
    if (!formData.name.trim()) {
      setError("Course name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await api.post(
        `/user-courses/user/${user.documentId}/custom-courses`,
        formData
      );
      await fetchCustomCourses();
      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        category: "EDUCATION",
        subcategory: "ACADEMIC",
        subjectDocumentIds: [],
        cover: null,
        status: "ACTIVE",
      });
      setAssignedSubjects([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating course:", error);
      setError(
        error.response?.data?.error || "Failed to create custom course"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse || !formData.name.trim()) {
      setError("Course name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await api.put(
        `/user-courses/custom-courses/${editingCourse.documentId}`,
        formData
      );
      await fetchCustomCourses();
      setEditingCourse(null);
      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        category: "EDUCATION",
        subcategory: "ACADEMIC",
        subjectDocumentIds: [],
        cover: null,
        status: "ACTIVE",
      });
      setAssignedSubjects([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating course:", error);
      setError(
        error.response?.data?.error || "Failed to update custom course"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      setSaving(true);
      await api.delete(`/user-courses/custom-courses/${courseId}`);
      await fetchCustomCourses();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error deleting course:", error);
      setError(error.response?.data?.error || "Failed to delete course");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCourse = async (course) => {
    setEditingCourse(course);
    setShowCreateForm(true);
    setUnassignedSubjects([]); // Reset unassigned subjects when starting to edit
    
    // Load subjects for this course
    const courseSubjectIds = course.subjectDocumentIds || [];
    
    // Fetch full subject data for assigned subjects
    try {
      if (courseSubjectIds.length > 0) {
        const { data: assignedSubjectsData } = await dataProvider.getList("subjects", {
          pagination: { page: 1, perPage: 1000 },
          filter: {
            "filters[documentId][$in]": courseSubjectIds,
          },
          meta: {
            populate: [],
          },
        });
        const loadedAssigned = assignedSubjectsData || [];
        setAssignedSubjects(loadedAssigned);
        
        // If a survey is already selected, calculate which assigned subjects are not in the survey
        // These should appear in the suggested (unassigned) list
        // This ensures subjects assigned to the course but not in the survey show in Suggested
        if (selectedSurveyId && allSubjects.length > 0) {
          const surveySubjectIds = new Set(allSubjects.map((s) => s.documentId));
          const unassignedFromCourse = loadedAssigned.filter(
            (s) => !surveySubjectIds.has(s.documentId)
          );
          if (unassignedFromCourse.length > 0) {
            console.log("[handleEditCourse] Found assigned subjects not in survey (will show in Suggested):", unassignedFromCourse);
            setUnassignedSubjects(unassignedFromCourse);
          }
        } else {
          console.log("[handleEditCourse] No survey selected or no survey subjects, unassignedSubjects will be empty");
        }
      } else {
        setAssignedSubjects([]);
      }
    } catch (err) {
      console.error("Error loading course subjects:", err);
      setAssignedSubjects([]);
    }

    setFormData({
      name: course.name,
      description: course.description || "",
      category: course.category || "EDUCATION",
      subcategory: course.subcategory || "ACADEMIC",
      subjectDocumentIds: courseSubjectIds,
      cover: course.cover,
      status: course.status || "ACTIVE",
    });
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingCourse(null);
    setFormData({
      name: "",
      description: "",
      category: "EDUCATION",
      subcategory: "ACADEMIC",
      subjectDocumentIds: [],
      cover: null,
      status: "ACTIVE",
    });
    setAssignedSubjects([]);
    setError("");
  };

  if (!isOpen) return null;

  const surveyOptions = surveys.map((survey) => ({
    id: survey._id?.toString() || survey.id?.toString(),
    name: `${survey.surveyType === "company" ? "Company" : "Self"} Survey - ${new Date(survey.completedAt).toLocaleDateString()}`,
  }));

  const categoryOptions = [
    { id: "EDUCATION", name: "Education" },
    { id: "SKILLS", name: "Skills" },
    { id: "CERTIFICATION", name: "Certification" },
  ];

  const subcategoryOptions = [
    { id: "ACADEMIC", name: "Academic" },
    { id: "PROFESSIONAL", name: "Professional" },
    { id: "PERSONAL", name: "Personal" },
  ];

  const statusOptions = [
    { id: "ACTIVE", name: "Active" },
    { id: "INACTIVE", name: "Inactive" },
    { id: "COMPLETED", name: "Completed" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Assign Custom Course
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.username} ({user?.documentId?.slice(0, 8)}...)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Survey Selection */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Select Survey
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : surveys.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                No surveys found for this user
              </div>
            ) : (
              <CustomSelect
                value={selectedSurveyId}
                onChange={handleSurveySelect}
                options={surveyOptions}
                placeholder="Select a survey..."
              />
            )}
          </div>

          {/* Loading Subjects */}
          {loadingSubjects && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Display Subjects from Selected Survey */}
          {!loadingSubjects && selectedSurveyId && skillsWithSubjects.length > 0 && (
            <div className="border border-border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-foreground">
                Subjects Available from Survey
              </h3>
              <div className="space-y-3">
                {skillsWithSubjects.map((skillData) => (
                  <div key={skillData.skillName} className="space-y-2">
                    <div className="px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="font-semibold text-sm text-foreground">
                        {skillData.skillName}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                        {skillData.requiredLevel && (
                          <span>Required: Level {skillData.requiredLevel}</span>
                        )}
                        {skillData.currentLevel && (
                          <span>Current: Level {skillData.currentLevel}</span>
                        )}
                        {!skillData.currentLevel && skillData.requiredLevel && (
                          <span className="text-amber-600">Not assessed yet</span>
                        )}
                      </div>
                    </div>
                    {skillData.subjects && skillData.subjects.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        {skillData.subjects.map((subject) => (
                          <div
                            key={subject.documentId}
                            className="px-3 py-2 rounded-lg bg-muted/50 text-sm border border-border"
                          >
                            <div className="font-medium text-foreground">
                              {subject.name}
                            </div>
                            {subject.grade && (
                              <div className="text-xs text-muted-foreground">
                                {subject.grade} • Level {subject.level || "N/A"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground pl-4">
                        No subjects available for this skill
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {allSubjects.length === 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  No subjects found for the selected survey. Please ensure skills have associated topics and subjects.
                </div>
              )}
            </div>
          )}

          {/* Create/Edit Course Form */}
          {showCreateForm && (
            <div className="border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg text-foreground">
                {editingCourse ? "Edit Course" : "Create New Course"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="Enter course name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Status
                  </label>
                  <CustomSelect
                    value={formData.status}
                    onChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                    options={statusOptions}
                    placeholder="Select status..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  rows={3}
                  placeholder="Enter course description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category
                  </label>
                  <CustomSelect
                    value={formData.category}
                    onChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    options={categoryOptions}
                    placeholder="Select category..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Subcategory
                  </label>
                  <CustomSelect
                    value={formData.subcategory}
                    onChange={(value) =>
                      setFormData({ ...formData, subcategory: value })
                    }
                    options={subcategoryOptions}
                    placeholder="Select subcategory..."
                  />
                </div>
              </div>

              {/* Subject Selection with Transfer List */}
              {/* Always show transfer list when creating or editing */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Subjects
                </label>
                {!selectedSurveyId && (
                  <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    {editingCourse 
                      ? "Select a survey to see suggested subjects. You can still unassign subjects from the Assigned list."
                      : "Please select a survey to see suggested subjects."}
                  </div>
                )}
                <SubjectTransferList
                  availableSubjects={allSubjects}
                  assignedSubjects={assignedSubjects}
                  onAssignedChange={handleAssignedSubjectsChange}
                  skillsWithSubjects={skillsWithSubjects}
                  unassignedSubjects={unassignedSubjects}
                  onUnassignedChange={setUnassignedSubjects}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingCourse ? "Update Course" : "Create Course"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing Custom Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-foreground">
                Custom Courses
              </label>
              {!showCreateForm && selectedSurveyId && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </button>
              )}
            </div>
            {loadingCourses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : customCourses.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No custom courses yet
              </div>
            ) : (
              <div className="space-y-2">
                {customCourses.map((course) => (
                  <div
                    key={course.documentId}
                    className="p-4 border border-border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {course.name}
                      </div>
                      {course.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {course.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {course.subjects?.length || 0} subjects • {course.status}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.documentId)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomCourseAssignmentModal;
