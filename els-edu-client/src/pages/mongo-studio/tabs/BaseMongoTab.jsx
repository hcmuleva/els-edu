import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
} from "lucide-react";
import api from "../../../services/api";
import { useNotify, useDataProvider } from "react-admin";
import { CustomAsyncMultiSelect } from "../../../components/common/CustomAsyncMultiSelect";
import MongoCollectionSelect from "../../../components/common/MongoCollectionSelect";
import MongoCollectionMultiSelect from "../../../components/common/MongoCollectionMultiSelect";
import CountListModal from "../../../components/studio/CountListModal";
import DeleteConfirmationModal from "../../../components/common/DeleteConfirmationModal";
import { subscribeToCustomCourseUpdates } from "../../../services/ably";

/**
 * Base component for MongoDB collection tabs
 * Handles common CRUD operations
 */
const BaseMongoTab = ({
  collection,
  fields, // Array of { key, label, type, required?, options? }
  title,
  onCreate,
  onUpdate,
  onDelete,
  onView,
  renderItem,
  searchFields = [],
}) => {
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const [copiedId, setCopiedId] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [subjectMap, setSubjectMap] = useState({}); // Cache for subject names (for table display)
  const [topicMap, setTopicMap] = useState({}); // Cache for topic names (for table display)
  const [relationMaps, setRelationMaps] = useState({}); // Cache for relation names: { fieldKey: { relationId: relationName } }
  const [activeCountItems, setActiveCountItems] = useState(null);
  const [activeCountTitle, setActiveCountTitle] = useState("");
  const [loadingCountItems, setLoadingCountItems] = useState(false);
  const perPage = 20;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
    // Clear selection on page change or sort
    setSelectedIds([]);
  }, [page, searchQuery, sortField, sortOrder]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((item) => item._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setSaving(true);
      await Promise.all(
        selectedIds.map((id) =>
          api.delete(`/mongo-studio/${collection}/${id}`),
        ),
      );
      notify(`Successfully deleted ${selectedIds.length} items`, {
        type: "success",
      });
      fetchData();
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
    } catch (error) {
      console.error(`Error bulk deleting ${title}:`, error);
      notify(`Error deleting items`, { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Subscribe to real-time updates for custom courses
  useEffect(() => {
    if (collection !== "userCustomCourses") {
      return; // Only subscribe for custom courses
    }

    const unsubscribe = subscribeToCustomCourseUpdates((eventName, data) => {
      console.log("[ABLY] Custom course update received:", eventName, data);

      if (eventName === "custom-course:created") {
        notify("New custom course created", { type: "info" });
        // Refresh data to show new course
        setTimeout(() => {
          fetchData();
        }, 500); // Small delay to ensure server has processed the change
      } else if (eventName === "custom-course:updated") {
        notify("Custom course updated", { type: "info" });
        // Refresh data to show updated course
        setTimeout(() => {
          fetchData();
        }, 500);
      } else if (eventName === "custom-course:deleted") {
        notify("Custom course deleted", { type: "info" });
        // Refresh data to remove deleted course
        setTimeout(() => {
          fetchData();
        }, 500);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, notify]);

  // Fetch subject names and full objects for subjectDocumentIds fields
  useEffect(() => {
    const fetchSubjectNames = async () => {
      // Collect all subjectDocumentIds from data
      const allSubjectIds = new Set();
      data.forEach((item) => {
        if (item.subjectDocumentIds && Array.isArray(item.subjectDocumentIds)) {
          item.subjectDocumentIds.forEach((id) => allSubjectIds.add(id));
        }
      });

      if (allSubjectIds.size === 0) return;

      try {
        const subjectIds = Array.from(allSubjectIds);
        const { data: subjects } = await dataProvider.getList("subjects", {
          pagination: { page: 1, perPage: 1000 },
          filter: {
            "filters[documentId][$in]": subjectIds,
          },
          meta: {
            populate: [],
          },
        });

        const map = {};
        subjects.forEach((subject) => {
          map[subject.documentId] = subject; // Store full subject data
        });
        setSubjectMap(map);
      } catch (error) {
        console.error("Error fetching subject names:", error);
      }
    };

    // Fetch topic names and full objects for topicDocumentIds fields
    const fetchTopicNames = async () => {
      // Collect all topicDocumentIds from data
      const allTopicIds = new Set();
      data.forEach((item) => {
        if (item.topicDocumentIds && Array.isArray(item.topicDocumentIds)) {
          item.topicDocumentIds.forEach((id) => allTopicIds.add(id));
        }
      });

      if (allTopicIds.size === 0) return;

      try {
        const topicIds = Array.from(allTopicIds);
        const { data: topics } = await dataProvider.getList("topics", {
          pagination: { page: 1, perPage: 1000 },
          filter: {
            "filters[documentId][$in]": topicIds,
          },
          meta: {
            populate: [],
          },
        });

        const map = {};
        topics.forEach((topic) => {
          map[topic.documentId] = topic; // Store full topic data
        });
        setTopicMap(map);
      } catch (error) {
        console.error("Error fetching topic names:", error);
      }
    };

    // Check if any field uses subjectDocumentIds
    const hasSubjectField = fields.some(
      (f) => f.key === "subjectDocumentIds" || f.selectorType === "subjects",
    );
    if (hasSubjectField && data.length > 0) {
      fetchSubjectNames();
    }

    // Check if any field uses topicDocumentIds
    const hasTopicField = fields.some(
      (f) => f.key === "topicDocumentIds" || f.selectorType === "topics",
    );
    if (hasTopicField && data.length > 0) {
      fetchTopicNames();
    }

    // Fetch relation names for mongoRelation fields
    const relationFields = fields.filter(
      (f) => f.type === "mongoRelation" || f.type === "relation",
    );

    if (relationFields.length > 0 && data.length > 0) {
      // Fetch all relations in parallel
      const fetchPromises = relationFields.map(async (field) => {
        const collection = field.relationCollection || field.targetCollection;
        const labelField = field.labelField || "name";
        const valueField = field.valueField || "_id";

        // Collect all relation IDs from data
        const relationIds = new Set();
        data.forEach((item) => {
          const relationId = item[field.key];
          if (relationId) {
            relationIds.add(String(relationId)); // Ensure string comparison
          }
        });

        if (relationIds.size === 0) {
          return { fieldKey: field.key, map: {} };
        }

        try {
          // Fetch from MongoDB collection
          const response = await api.get(`/mongo-studio/${collection}`, {
            params: {
              page: 1,
              perPage: 1000,
              sortField: labelField,
              sortOrder: "ASC",
            },
          });

          const items = response.data?.data || response.data || [];
          const map = {};
          items.forEach((item) => {
            const id = String(item[valueField] || item._id);
            const label = item[labelField] || item.name || id;
            map[id] = label;
          });

          return { fieldKey: field.key, map };
        } catch (error) {
          console.error(
            `Error fetching ${collection} for ${field.key}:`,
            error,
          );
          return { fieldKey: field.key, map: {} };
        }
      });

      // Wait for all fetches to complete
      Promise.all(fetchPromises).then((results) => {
        const newRelationMaps = {};
        results.forEach(({ fieldKey, map }) => {
          newRelationMaps[fieldKey] = map;
        });
        setRelationMaps((prev) => ({
          ...prev,
          ...newRelationMaps,
        }));
      });
    }
  }, [data, fields, dataProvider]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortOrder("ASC");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortOrder === "ASC" ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        perPage,
        sortField,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
      };
      const response = await api.get(`/mongo-studio/${collection}`, { params });
      setData(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (error) {
      console.error(`Error fetching ${collection}:`, error);
      notify(`Error loading ${title}`, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    const initialData = {};
    fields.forEach((field) => {
      if (field.type === "array") {
        initialData[field.key] = [];
      } else if (field.type === "object") {
        initialData[field.key] = {};
      } else if (field.type === "mongoRelation" || field.type === "relation") {
        initialData[field.key] = field.default || "";
      } else {
        initialData[field.key] = field.default || "";
      }
    });
    setFormData(initialData);
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = async (item) => {
    // If editing item with subjectDocumentIds, fetch subject details for the selector
    if (
      item.subjectDocumentIds &&
      Array.isArray(item.subjectDocumentIds) &&
      item.subjectDocumentIds.length > 0
    ) {
      try {
        const { data: subjects } = await dataProvider.getList("subjects", {
          pagination: { page: 1, perPage: 1000 },
          filter: {
            "filters[documentId][$in]": item.subjectDocumentIds,
          },
          meta: {
            populate: [],
          },
        });
        // Store subjects for CustomAsyncMultiSelect initialData
        item._initialSubjects = subjects;
      } catch (error) {
        console.error("Error fetching subjects for edit:", error);
      }
    }

    // If editing item with topicDocumentIds, fetch topic details for the selector
    if (
      item.topicDocumentIds &&
      Array.isArray(item.topicDocumentIds) &&
      item.topicDocumentIds.length > 0
    ) {
      try {
        const { data: topics } = await dataProvider.getList("topics", {
          pagination: { page: 1, perPage: 1000 },
          filter: {
            "filters[documentId][$in]": item.topicDocumentIds,
          },
          meta: {
            populate: [],
          },
        });
        // Store topics for CustomAsyncMultiSelect initialData
        item._initialTopics = topics;
      } catch (error) {
        console.error("Error fetching topics for edit:", error);
      }
    }

    // If editing item with requiredSkills, ensure proper format
    if (item.requiredSkills && Array.isArray(item.requiredSkills)) {
      // Ensure each skill has both skillName and requiredLevel
      item.requiredSkills = item.requiredSkills.map((skill) => {
        if (typeof skill === "object" && skill !== null) {
          return {
            skillName: skill.skillName || "",
            requiredLevel: skill.requiredLevel || 3,
          };
        }
        // If it's just a string, convert to object format
        return {
          skillName: String(skill),
          requiredLevel: 3,
        };
      });
    }

    setFormData({ ...item });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${title}?`)) {
      return;
    }
    try {
      setSaving(true);
      await api.delete(`/mongo-studio/${collection}/${id}`);
      notify(`${title} deleted successfully`, { type: "success" });
      fetchData();
      if (onDelete) onDelete(id);
    } catch (error) {
      console.error(`Error deleting ${title}:`, error);
      notify(`Error deleting ${title}`, { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Clean up formData - remove temporary fields like _initialSubjects and _initialTopics
      const cleanedData = { ...formData };
      delete cleanedData._initialSubjects;
      delete cleanedData._initialTopics;

      if (editingItem) {
        await api.put(
          `/mongo-studio/${collection}/${editingItem._id}`,
          cleanedData,
        );
        notify(`${title} updated successfully`, { type: "success" });
        if (onUpdate) onUpdate(editingItem._id, cleanedData);
      } else {
        await api.post(`/mongo-studio/${collection}`, cleanedData);
        notify(`${title} created successfully`, { type: "success" });
        if (onCreate) onCreate(cleanedData);
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error(`Error saving ${title}:`, error);
      notify(error.response?.data?.error || `Error saving ${title}`, {
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({});
  };

  const updateFormField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Copy ID to clipboard
  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      notify("ID copied to clipboard", { type: "success" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      notify("Failed to copy ID", { type: "error" });
    }
  };

  const renderFormField = (field) => {
    const value = formData[field.key] || "";

    switch (field.type) {
      case "text":
      case "string":
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => updateFormField(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              required={field.required}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => updateFormField(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              rows={3}
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              required={field.required}
            />
          </div>
        );

      case "number":
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) =>
                updateFormField(field.key, parseFloat(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              min={field.min}
              max={field.max}
              required={field.required}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => updateFormField(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((opt) => (
                <option key={opt.value || opt} value={opt.value || opt}>
                  {opt.label || opt}
                </option>
              ))}
            </select>
          </div>
        );

      case "mongoRelation":
      case "relation":
        // MongoDB collection relation - use MongoCollectionSelect
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <MongoCollectionSelect
              collection={field.relationCollection || field.targetCollection}
              value={value}
              onChange={(selectedValue) =>
                updateFormField(field.key, selectedValue)
              }
              placeholder={`Select ${field.label.toLowerCase()}...`}
              labelField={field.labelField || "name"}
              valueField={field.valueField || "_id"}
              required={field.required}
            />
          </div>
        );

      case "array":
        // Special handling for subjectDocumentIds - use subject selector
        if (
          field.key === "subjectDocumentIds" ||
          field.selectorType === "subjects"
        ) {
          const arrayValue = Array.isArray(value) ? value : [];
          // Get initial data from formData if editing
          const initialSubjects = formData._initialSubjects || [];
          return (
            <div key={field.key}>
              <label className="block text-sm font-medium text-foreground mb-1">
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <CustomAsyncMultiSelect
                resource="subjects"
                optionText="name"
                value={arrayValue}
                onChange={(selectedIds) =>
                  updateFormField(field.key, selectedIds)
                }
                placeholder="Search and select subjects..."
                searchable={true}
                initialData={initialSubjects}
              />
              {arrayValue.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {arrayValue.length} subject
                  {arrayValue.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          );
        }

        // Special handling for topicDocumentIds - use topic selector
        if (
          field.key === "topicDocumentIds" ||
          field.selectorType === "topics"
        ) {
          const arrayValue = Array.isArray(value) ? value : [];
          // Get initial data from formData if editing
          const initialTopics = formData._initialTopics || [];
          return (
            <div key={field.key}>
              <label className="block text-sm font-medium text-foreground mb-1">
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <CustomAsyncMultiSelect
                resource="topics"
                optionText="name"
                value={arrayValue}
                onChange={(selectedIds) =>
                  updateFormField(field.key, selectedIds)
                }
                placeholder="Search and select topics..."
                searchable={true}
                initialData={initialTopics}
              />
              {arrayValue.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {arrayValue.length} topic{arrayValue.length !== 1 ? "s" : ""}{" "}
                  selected
                </p>
              )}
            </div>
          );
        }

        // Special handling for requiredSkills - MongoDB skills with levels
        if (
          field.key === "requiredSkills" &&
          field.selectorType === "mongoSkills"
        ) {
          const arrayValue = Array.isArray(value) ? value : [];
          const selectedSkillNames = arrayValue
            .map((item) =>
              typeof item === "object" && item !== null
                ? item.skillName
                : String(item),
            )
            .filter(Boolean);

          return (
            <div key={field.key}>
              <label className="block text-sm font-medium text-foreground mb-1">
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>

              {/* Skill Multi-Select */}
              <div className="mb-4">
                <MongoCollectionMultiSelect
                  collection={field.relationCollection || "skills"}
                  value={selectedSkillNames}
                  onChange={(selectedNames) => {
                    // Update the array to match selected skills
                    const currentMap = new Map(
                      arrayValue.map((item) => {
                        const skillName =
                          typeof item === "object" && item !== null
                            ? item.skillName
                            : String(item);
                        return [skillName, item];
                      }),
                    );

                    // Create new array with selected skills
                    const newArray = selectedNames.map((skillName) => {
                      const existing = currentMap.get(skillName);
                      if (
                        existing &&
                        typeof existing === "object" &&
                        existing !== null
                      ) {
                        return existing; // Keep existing level
                      }
                      return { skillName, requiredLevel: 3 }; // Default level
                    });

                    updateFormField(field.key, newArray);
                  }}
                  placeholder="Search and select skills..."
                  labelField={field.labelField || "name"}
                  valueField={field.valueField || "name"}
                  required={field.required}
                />
              </div>

              {/* Level inputs for each selected skill */}
              {arrayValue.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Set required levels:
                  </p>
                  {arrayValue.map((item, idx) => {
                    const skillName =
                      typeof item === "object" && item !== null
                        ? item.skillName
                        : String(item);
                    const level =
                      typeof item === "object" && item !== null
                        ? item.requiredLevel || 3
                        : 3;

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="flex-1 text-sm font-medium text-gray-700">
                          {skillName}
                        </span>
                        <label className="text-xs text-gray-500">Level:</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={level}
                          onChange={(e) => {
                            const newArray = [...arrayValue];
                            const newLevel = parseInt(e.target.value) || 1;
                            newArray[idx] = {
                              skillName,
                              requiredLevel: Math.max(1, Math.min(5, newLevel)),
                            };
                            updateFormField(field.key, newArray);
                          }}
                          className="w-16 px-2 py-1 text-sm border border-border rounded-lg bg-background text-foreground"
                        />
                        <button
                          onClick={() => {
                            const newArray = arrayValue.filter(
                              (_, i) => i !== idx,
                            );
                            updateFormField(field.key, newArray);
                          }}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Remove skill"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Check if it's an array of strings or objects
        const isStringArray =
          !field.itemFields || field.itemFields.length === 0;
        const arrayValue = Array.isArray(value) ? value : [];

        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {field.label}
            </label>
            <div className="space-y-2">
              {arrayValue.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  {isStringArray ? (
                    <input
                      type="text"
                      value={typeof item === "string" ? item : ""}
                      onChange={(e) => {
                        const newArray = [...arrayValue];
                        newArray[idx] = e.target.value;
                        updateFormField(field.key, newArray);
                      }}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      placeholder={field.placeholder || "Enter value"}
                    />
                  ) : (
                    field.itemFields?.map((itemField) => (
                      <input
                        key={itemField.key}
                        type={itemField.type || "text"}
                        value={
                          typeof item === "object" && item !== null
                            ? item[itemField.key] || ""
                            : ""
                        }
                        onChange={(e) => {
                          const newArray = [...arrayValue];
                          if (
                            typeof newArray[idx] !== "object" ||
                            newArray[idx] === null
                          ) {
                            newArray[idx] = {};
                          }
                          newArray[idx] = {
                            ...newArray[idx],
                            [itemField.key]:
                              itemField.type === "number"
                                ? parseFloat(e.target.value) || 0
                                : e.target.value,
                          };
                          updateFormField(field.key, newArray);
                        }}
                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder={itemField.placeholder || itemField.label}
                      />
                    ))
                  )}
                  <button
                    onClick={() => {
                      const newArray = [...arrayValue];
                      newArray.splice(idx, 1);
                      updateFormField(field.key, newArray);
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  if (isStringArray) {
                    updateFormField(field.key, [...arrayValue, ""]);
                  } else {
                    const newItem = {};
                    field.itemFields?.forEach((f) => {
                      newItem[f.key] =
                        f.type === "number" ? 0 : f.default || "";
                    });
                    updateFormField(field.key, [...arrayValue, newItem]);
                  }
                }}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted"
              >
                + Add {field.itemLabel || "Item"}
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {field.label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => updateFormField(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        );
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6 flex flex-col h-full min-h-0">
      {/* Count List Modal for Subjects/Topics */}
      {activeCountItems && (
        <CountListModal
          isOpen={!!activeCountItems}
          title={activeCountTitle}
          items={activeCountItems}
          nameField="name"
          showDocumentId={true}
          onClose={() => {
            setActiveCountItems(null);
            setActiveCountTitle("");
          }}
        />
      )}
      {/* Filters */}
      <div className="p-4 md:p-6 md:pt-4 border-b border-border/30 bg-gray-50 rounded-t-3xl">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Create {title}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {/* Bulk Actions Header - Sticky when items selected */}
      {(selectedIds.length > 0 || data.length > 0) && (
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b pb-4 mb-4 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.length > 0 && selectedIds.length === data.length}
                onChange={selectAll}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary transition-all"
              />
              <span className="font-medium text-gray-700">
                {selectedIds.length > 0
                  ? `${selectedIds.length} Selected`
                  : "Select All"}
              </span>
            </label>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors animate-in fade-in slide-in-from-right-4"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-b-3xl">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6 bg-white rounded-b-3xl">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Search className="w-12 h-12 text-gray-300" />
          </div>
          <p className="font-medium">No {title.toLowerCase()} found</p>
          <p className="text-sm opacity-70 mt-1">
            Try adjusting filters or create a new {title.toLowerCase()}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 px-4 pb-20 bg-white rounded-b-3xl">
            {data.map((item) => {
              const isSelected = selectedIds.includes(item._id);
              return (
                <div
                  key={item._id}
                  className={`group bg-gray-50 rounded-lg border shadow-sm p-3 space-y-2.5 transition-all relative ${
                    isSelected
                      ? "ring-2 ring-primary border-transparent bg-primary/5"
                      : "border-border"
                  }`}
                >
                  {/* Selection Checkbox (Absolute) */}
                  <div className="absolute top-3 right-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(item._id);
                      }}
                      className={`w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary shadow-sm transition-all bg-white`}
                    />
                  </div>
                  {/* Card Header: ID and Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                          ID
                        </span>
                        <div
                          className="text-[10px] font-mono bg-white px-1 py-0.5 rounded cursor-pointer truncate max-w-[120px] border border-gray-200"
                          onClick={() =>
                            copyToClipboard(item._id, `_id-${item._id}`)
                          }
                        >
                          {item._id?.substring(0, 10)}...
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content: First 4 Fields */}
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    {fields
                      .filter((f) => f.showInTable !== false)
                      .slice(0, 4)
                      .map((field) => {
                        const value = item[field.key];
                        let displayValue = value;

                        // Reuse display logic from table (simplified)
                        if (field.type === "array") {
                          if (
                            field.key === "subjectDocumentIds" ||
                            field.selectorType === "subjects"
                          ) {
                            displayValue = Array.isArray(value)
                              ? `${value.length} Subjects`
                              : "-";
                          } else if (
                            field.key === "topicDocumentIds" ||
                            field.selectorType === "topics"
                          ) {
                            displayValue = Array.isArray(value)
                              ? `${value.length} Topics`
                              : "-";
                          } else if (field.key === "requiredSkills") {
                            displayValue = Array.isArray(value)
                              ? `${value.length} Skills`
                              : "-";
                          } else {
                            displayValue = Array.isArray(value)
                              ? `${value.length} items`
                              : "-";
                          }
                        } else if (
                          typeof value === "object" &&
                          value !== null
                        ) {
                          displayValue = "{...}";
                        } else if (
                          field.type === "mongoRelation" ||
                          field.type === "relation"
                        ) {
                          const relationMap = relationMaps[field.key] || {};
                          const stringValue = value ? String(value) : "";
                          displayValue = stringValue
                            ? relationMap[stringValue] || value
                            : "-";
                        }

                        return (
                          <div
                            key={field.key}
                            className="grid grid-cols-3 gap-1.5"
                          >
                            <span className="text-[10px] font-medium text-gray-500 truncate">
                              {field.label}
                            </span>
                            <span className="col-span-2 text-xs text-gray-900 truncate">
                              {String(displayValue || "-")}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block flex-1 bg-white rounded-b-3xl flex flex-col min-h-0">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead className="bg-gray-50 border-b border-border/50 sticky top-0 z-20">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center sticky left-0 z-30 bg-gray-50">
                      <input
                        type="checkbox"
                        checked={
                          data.length > 0 && selectedIds.length === data.length
                        }
                        onChange={selectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("_id")}
                    >
                      <div className="flex items-center gap-2">
                        ID
                        <SortIcon field="_id" />
                      </div>
                    </th>
                    {fields
                      .filter((f) => f.showInTable !== false)
                      .slice(0, 5)
                      .map((field) => (
                        <th
                          key={field.key}
                          className={`px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${
                            field.sortable !== false
                              ? "cursor-pointer hover:bg-gray-100 transition-colors"
                              : ""
                          }`}
                          onClick={
                            field.sortable !== false
                              ? () => handleSort(field.key)
                              : undefined
                          }
                        >
                          {field.sortable !== false ? (
                            <div className="flex items-center gap-2">
                              {field.label}
                              <SortIcon field={field.key} />
                            </div>
                          ) : (
                            field.label
                          )}
                        </th>
                      ))}
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider sticky right-0 z-20 bg-gray-50 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] w-[150px] min-w-[150px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 bg-white">
                  {data.map((item, index) => {
                    const displayId =
                      sortOrder === "ASC"
                        ? (page - 1) * perPage + index + 1
                        : total - ((page - 1) * perPage + index);

                    const isSelected = selectedIds.includes(item._id);

                    return (
                      <tr
                        key={item._id}
                        onClick={() => toggleSelection(item._id)}
                        className={`transition-colors group cursor-pointer ${
                          isSelected ? "bg-primary/5" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td
                          className="px-6 py-4 align-middle sticky left-0 z-10 bg-inherit w-12 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(item._id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-bold text-gray-700">
                              {displayId}
                            </div>
                            <div className="flex items-center gap-2 group/id">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item._id, `_id-${item._id}`);
                                }}
                                className="p-1.5 hover:bg-primary/10 rounded-lg text-gray-500 hover:text-primary transition-colors relative"
                                title={`Copy MongoDB _id: ${item._id}`}
                              >
                                {copiedId === `_id-${item._id}` ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 group-hover/id:scale-110 transition-transform" />
                                )}
                              </button>
                              <div
                                className="text-xs text-gray-400 font-mono cursor-help px-2 py-1 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                                title={`MongoDB _id: ${item._id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item._id, `_id-${item._id}`);
                                }}
                              >
                                {item._id?.substring(0, 12)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        {fields
                          .filter((f) => f.showInTable !== false)
                          .slice(0, 5)
                          .map((field) => {
                            const value = item[field.key];
                            let displayValue = value;

                            if (field.type === "array") {
                              // Special handling for requiredSkills - show skills with levels
                              if (
                                field.key === "requiredSkills" &&
                                field.selectorType === "mongoSkills"
                              ) {
                                if (Array.isArray(value) && value.length > 0) {
                                  const skillsText = value
                                    .map((skill) => {
                                      const skillName =
                                        typeof skill === "object" &&
                                        skill !== null
                                          ? skill.skillName
                                          : String(skill);
                                      const level =
                                        typeof skill === "object" &&
                                        skill !== null
                                          ? skill.requiredLevel
                                          : null;
                                      return level
                                        ? `${skillName} (L${level})`
                                        : skillName;
                                    })
                                    .join(", ");
                                  displayValue = skillsText;
                                } else {
                                  displayValue = "-";
                                }
                              }
                              // Special handling for subjectDocumentIds - show subject names as clickable button
                              else if (
                                field.key === "subjectDocumentIds" ||
                                field.selectorType === "subjects"
                              ) {
                                if (Array.isArray(value) && value.length > 0) {
                                  // Return clickable button that opens CountListModal
                                  return (
                                    <td
                                      key={field.key}
                                      className="px-6 py-4 align-middle"
                                    >
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setLoadingCountItems(true);
                                          try {
                                            // Fetch subjects from Strapi by documentIds
                                            // Use Strapi v5 filter format: filters[documentId][$in]
                                            const { data: subjects } =
                                              await dataProvider.getList(
                                                "subjects",
                                                {
                                                  pagination: {
                                                    page: 1,
                                                    perPage: 1000,
                                                  },
                                                  filter: {
                                                    "filters[documentId][$in]":
                                                      value,
                                                  },
                                                  meta: {
                                                    populate: [],
                                                  },
                                                },
                                              );
                                            setActiveCountTitle(
                                              `Subjects for ${
                                                item.name || item._id
                                              }`,
                                            );
                                            setActiveCountItems(subjects || []);
                                          } catch (error) {
                                            console.error(
                                              "Error fetching subjects:",
                                              error,
                                            );
                                            notify("Failed to load subjects", {
                                              type: "error",
                                            });
                                            // Fallback to documentIds if fetch fails
                                            setActiveCountItems(
                                              value.map((id) => ({
                                                documentId: id,
                                                name: id,
                                              })),
                                            );
                                          } finally {
                                            setLoadingCountItems(false);
                                          }
                                        }}
                                        disabled={loadingCountItems}
                                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 text-xs font-bold text-amber-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {loadingCountItems ? (
                                          <Loader2 className="w-3 h-3 animate-spin inline" />
                                        ) : (
                                          `${value.length} Subject${
                                            value.length !== 1 ? "s" : ""
                                          }`
                                        )}
                                      </button>
                                    </td>
                                  );
                                } else {
                                  displayValue = "-";
                                }
                              }
                              // Special handling for topicDocumentIds - show topic names as clickable button
                              else if (
                                field.key === "topicDocumentIds" ||
                                field.selectorType === "topics"
                              ) {
                                if (Array.isArray(value) && value.length > 0) {
                                  // Return clickable button that opens CountListModal
                                  return (
                                    <td
                                      key={field.key}
                                      className="px-6 py-4 align-middle"
                                    >
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setLoadingCountItems(true);
                                          try {
                                            // Fetch topics from Strapi by documentIds
                                            // Use Strapi v5 filter format: filters[documentId][$in]
                                            const { data: topics } =
                                              await dataProvider.getList(
                                                "topics",
                                                {
                                                  pagination: {
                                                    page: 1,
                                                    perPage: 1000,
                                                  },
                                                  filter: {
                                                    "filters[documentId][$in]":
                                                      value,
                                                  },
                                                  meta: {
                                                    populate: [],
                                                  },
                                                },
                                              );
                                            setActiveCountTitle(
                                              `Topics for ${
                                                item.name || item._id
                                              }`,
                                            );
                                            setActiveCountItems(topics || []);
                                          } catch (error) {
                                            console.error(
                                              "Error fetching topics:",
                                              error,
                                            );
                                            notify("Failed to load topics", {
                                              type: "error",
                                            });
                                            // Fallback to documentIds if fetch fails
                                            setActiveCountItems(
                                              value.map((id) => ({
                                                documentId: id,
                                                name: id,
                                              })),
                                            );
                                          } finally {
                                            setLoadingCountItems(false);
                                          }
                                        }}
                                        disabled={loadingCountItems}
                                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 text-xs font-bold text-indigo-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {loadingCountItems ? (
                                          <Loader2 className="w-3 h-3 animate-spin inline" />
                                        ) : (
                                          `${value.length} Topic${
                                            value.length !== 1 ? "s" : ""
                                          }`
                                        )}
                                      </button>
                                    </td>
                                  );
                                } else {
                                  displayValue = "-";
                                }
                              } else {
                                displayValue = Array.isArray(value)
                                  ? value.length > 0
                                    ? `${value.length} item${
                                        value.length > 1 ? "s" : ""
                                      }`
                                    : "-"
                                  : "-";
                              }
                            } else if (field.type === "date") {
                              displayValue = value
                                ? new Date(value).toLocaleDateString()
                                : "-";
                            } else if (
                              field.type === "mongoRelation" ||
                              field.type === "relation"
                            ) {
                              // Display relation name from cache
                              const relationMap = relationMaps[field.key] || {};
                              const stringValue = value ? String(value) : "";
                              displayValue = stringValue
                                ? relationMap[stringValue] || value
                                : "-";
                            } else if (
                              typeof value === "object" &&
                              value !== null
                            ) {
                              displayValue = JSON.stringify(value).substring(
                                0,
                                50,
                              );
                            } else if (value === null || value === undefined) {
                              displayValue = "-";
                            }

                            // Default rendering
                            return (
                              <td
                                key={field.key}
                                className="px-6 py-4 align-middle"
                              >
                                <div className="max-w-md">
                                  <p
                                    className="text-sm text-gray-900 truncate"
                                    title={String(displayValue)}
                                  >
                                    {String(displayValue)}
                                  </p>
                                </div>
                              </td>
                            );
                          })}
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium whitespace-nowrap">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle sticky right-0 z-10 bg-white group-hover:bg-gray-50 transition-colors shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">
                          <div className="flex items-center justify-center gap-2">
                            {onView && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onView(item);
                                }}
                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors group/btn"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item);
                              }}
                              className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors group/btn"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item._id);
                              }}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors group/btn"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to{" "}
            {Math.min(page * perPage, total)} of {total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:bg-muted"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Create/Edit Form Modal */}
      {showForm &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col border border-border">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-white sticky top-0 z-10">
                <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                  {editingItem ? `Edit ${title}` : `Create ${title}`}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-20 sm:pb-6">
                {fields.map((field) => renderFormField(field))}
              </div>
              <div className="flex items-center justify-end gap-2 p-4 sm:p-6 border-t border-border bg-white sticky bottom-0">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Bulk Delete Modal */}
      <DeleteConfirmationModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Delete Items`}
        message={`Are you sure you want to delete these ${selectedIds.length} items? This action cannot be undone.`}
        isDeleting={saving}
      />
    </div>
  );
};

export default BaseMongoTab;
