import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Title, useGetIdentity, useNotify } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Loader2,
  Globe,
  Check,
  X,
  GraduationCap,
  School,
  BookOpen,
  Palette,
  Code,
  Cloud,
  Bug,
  Shield,
  Search,
  XCircle,
  ChevronRight,
} from "lucide-react";
import analyticsService from "../../services/analyticsService";
import mongoService from "../../services/mongoService";
import {
  SURVEY_TYPES,
  ACADEMIC_CATEGORIES,
  LEARNING_PATHS,
  getSurveyTypeByGrade,
} from "../../utils/constants";

// Icon mapping for dynamic rendering
const ICON_MAP = {
  BookOpen: BookOpen,
  Palette: Palette,
  Code: Code,
  Cloud: Cloud,
  BarChart3: BarChart3,
  Bug: Bug,
  Shield: Shield,
  GraduationCap: GraduationCap,
  School: School,
  Building2: Building2,
};

// Animated loading skeleton
const LoadingSkeleton = ({ count = 3 }) => (
  <div className="space-y-3 animate-pulse">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-200 rounded-xl" />
    ))}
  </div>
);

// Selection Summary Sidebar
const SelectionSummary = ({ title, items, onRemove, emptyText }) => (
  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
    <h4 className="text-sm font-bold text-gray-700 mb-3">{title}</h4>
    {items.length === 0 ? (
      <p className="text-xs text-gray-400">{emptyText}</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.id || item}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm"
          >
            {item.name || item}
            <button
              onClick={() => onRemove(item.id || item)}
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    )}
  </div>
);

// Search Input Component
const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <XCircle className="w-4 h-4" />
      </button>
    )}
  </div>
);

// Multi-select Card Component
const SelectableCard = ({
  item,
  selected,
  onClick,
  showDescription = true,
}) => {
  const IconComponent = ICON_MAP[item.icon] || BookOpen;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
        selected
          ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-100"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            selected ? "bg-primary-500" : "bg-gray-100"
          }`}
        >
          <IconComponent
            className={`w-6 h-6 ${selected ? "text-white" : "text-gray-500"}`}
          />
        </div>
        <div className="flex-1">
          <span className="font-semibold text-gray-900">{item.name}</span>
          {showDescription && item.description && (
            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
          )}
        </div>
        {selected && <CheckCircle2 className="w-6 h-6 text-primary-500" />}
      </div>
    </button>
  );
};

// Clean Notion-style Level Selector
const RatingInput = ({ value, onChange, showLabels = true }) => {
  const levels = [
    { value: 1, label: "Beginner" },
    { value: 2, label: "Basic" },
    { value: 3, label: "Intermediate" },
    { value: 4, label: "Advanced" },
    { value: 5, label: "Expert" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
        {levels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
              value === level.value
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            }`}
          >
            <span className="hidden sm:inline">{level.label}</span>
            <span className="sm:hidden">L{level.value}</span>
          </button>
        ))}
      </div>
      {showLabels && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-400">Beginner</span>
          <span className="text-xs text-gray-500 font-medium">
            Level {value}: {levels.find((l) => l.value === value)?.label}
          </span>
          <span className="text-xs text-gray-400">Expert</span>
        </div>
      )}
    </div>
  );
};

// Compact inline rating for lists
const CompactRating = ({ value, onChange }) => (
  <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
    {[1, 2, 3, 4, 5].map((level) => (
      <button
        key={level}
        type="button"
        onClick={() => onChange(level)}
        className={`w-7 h-7 rounded text-xs font-medium transition-all ${
          value === level
            ? "bg-white text-gray-900 shadow-sm border border-gray-200"
            : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
        }`}
      >
        {level}
      </button>
    ))}
  </div>
);

// Progress Steps Component
const ProgressSteps = ({ steps, currentStep }) => (
  <div className="relative">
    <div className="flex items-center gap-2 mb-2">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
              idx < currentStep
                ? "bg-green-500 text-white"
                : idx === currentStep
                ? "bg-primary-500 text-white ring-4 ring-primary-200"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-1 rounded transition-all duration-500 ${
                idx < currentStep ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
    <p className="text-sm text-gray-500">
      Step {currentStep + 1} of {steps.length}:{" "}
      <span className="font-medium text-gray-700">{steps[currentStep]}</span>
    </p>
  </div>
);

const SelfAssessmentPage = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();
  const notify = useNotify();

  // Determine default survey type based on user's grade
  const defaultSurveyType = useMemo(() => {
    return getSurveyTypeByGrade(identity?.grade);
  }, [identity?.grade]);

  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyType, setSurveyType] = useState(defaultSurveyType);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // School survey state
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectRatings, setSubjectRatings] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // College survey state
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillRatings, setSkillRatings] = useState({});
  const [availableSkills, setAvailableSkills] = useState([]);

  // Professional survey state (existing)
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Result
  const [result, setResult] = useState(null);

  // Get steps based on survey type
  const getSteps = useCallback(() => {
    switch (surveyType) {
      case "school":
        return [
          "Survey Type",
          "Categories",
          "Subjects",
          "Rate Subjects",
          "Complete",
        ];
      case "college":
        return [
          "Survey Type",
          "Learning Paths",
          "Skills",
          "Rate Skills",
          "Complete",
        ];
      case "professional":
        return [
          "Survey Type",
          "Company",
          "Role",
          "Skills",
          "Rate Skills",
          "Complete",
        ];
      default:
        return ["Survey Type"];
    }
  }, [surveyType]);

  const steps = getSteps();

  // Check if user already took the assessment
  useEffect(() => {
    const checkExisting = async () => {
      if (!identity?.documentId) return;
      try {
        let quizzes = await mongoService.getUserQuizzes({
          userDocumentId: identity.documentId,
        });

        if (!Array.isArray(quizzes)) {
          quizzes = quizzes.results || quizzes.data || [];
        }

        const skillQuiz = quizzes.find((q) => q.type === "SKILL" || !q.type);

        if (skillQuiz) {
          notify(
            "You have already completed the assessment. Redirecting to results...",
            { type: "info" },
          );
          navigate("/analytics", { replace: true });
        }
      } catch (error) {
        console.error("Error checking existing quiz:", error);
      } finally {
        setCheckingExisting(false);
      }
    };
    checkExisting();
  }, [identity, navigate, notify]);

  // Fetch subjects when categories change (School)
  useEffect(() => {
    if (surveyType !== "school" || selectedCategories.length === 0) {
      setAvailableSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const result = await analyticsService.getAcademicSubjects({
          categories: selectedCategories,
          search: searchQuery,
          limit: 50,
        });

        // Map to consistent format
        const subjects = (result.data || []).map((s) => ({
          id: s._id || s.name.toLowerCase().replace(/\s+/g, "-"),
          name: s.name,
          category: s.category,
          icon: s.icon,
        }));

        setAvailableSubjects(subjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        // Fallback to empty array
        setAvailableSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [surveyType, selectedCategories, searchQuery]);

  // Fetch skills when paths change (College)
  useEffect(() => {
    if (surveyType !== "college" || selectedPaths.length === 0) {
      setAvailableSkills([]);
      return;
    }

    const fetchSkills = async () => {
      setLoading(true);
      try {
        const result = await analyticsService.getLearningPathSkills({
          learningPaths: selectedPaths,
          search: searchQuery,
          limit: 50,
        });

        // Map to consistent format
        const skills = (result.data || []).map((s) => ({
          id: s._id || s.name.toLowerCase().replace(/\s+/g, "-"),
          name: s.name,
          path: s.learningPath,
          icon: s.icon,
        }));

        setAvailableSkills(skills);
      } catch (error) {
        console.error("Error fetching skills:", error);
        // Fallback to empty array
        setAvailableSkills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [surveyType, selectedPaths, searchQuery]);

  // Fetch companies (Professional)
  useEffect(() => {
    if (surveyType !== "professional") return;

    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getCompanies();
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        notify("Failed to load companies", { type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [surveyType]);

  // Fetch roles when company changes (Professional)
  useEffect(() => {
    if (!selectedCompany || surveyType !== "professional") return;

    const fetchRoles = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getRoles({
          company: selectedCompany,
        });
        setRoles(data);
        const company = companies.find((c) => c.name === selectedCompany);
        if (company?.domain) setSelectedDomain(company.domain);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [selectedCompany, companies, surveyType]);

  // Fetch skills when role changes (Professional)
  useEffect(() => {
    if (!selectedRole || !selectedCompany || surveyType !== "professional")
      return;

    const fetchSkills = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getSkills(
          selectedRole,
          selectedCompany,
        );
        setAllSkills(data);
        setSelectedSkills([]);
        setSkillRatings({});
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, [selectedRole, selectedCompany, surveyType]);

  // Toggle handlers
  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId],
    );
  };

  const togglePath = (pathId) => {
    setSelectedPaths((prev) =>
      prev.includes(pathId)
        ? prev.filter((p) => p !== pathId)
        : [...prev, pathId],
    );
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectId)) {
        const newRatings = { ...subjectRatings };
        delete newRatings[subjectId];
        setSubjectRatings(newRatings);
        return prev.filter((s) => s !== subjectId);
      } else {
        setSubjectRatings((r) => ({ ...r, [subjectId]: 3 }));
        return [...prev, subjectId];
      }
    });
  };

  const toggleSkill = (skillId) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skillId)) {
        const newRatings = { ...skillRatings };
        delete newRatings[skillId];
        setSkillRatings(newRatings);
        return prev.filter((s) => s !== skillId);
      } else {
        setSkillRatings((r) => ({ ...r, [skillId]: 3 }));
        return [...prev, skillId];
      }
    });
  };

  // Filter items by search
  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return availableSubjects;
    return availableSubjects.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [availableSubjects, searchQuery]);

  const filteredSkills = useMemo(() => {
    if (!searchQuery) return availableSkills;
    return availableSkills.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [availableSkills, searchQuery]);

  // Can proceed check
  const canProceed = () => {
    switch (surveyType) {
      case "school":
        if (currentStep === 1) return selectedCategories.length > 0;
        if (currentStep === 2) return selectedSubjects.length > 0;
        if (currentStep === 3) return Object.keys(subjectRatings).length > 0;
        return true;
      case "college":
        if (currentStep === 1) return selectedPaths.length > 0;
        if (currentStep === 2) return selectedSkills.length > 0;
        if (currentStep === 3) return Object.keys(skillRatings).length > 0;
        return true;
      case "professional":
        if (currentStep === 1) return !!selectedCompany;
        if (currentStep === 2) return !!selectedRole;
        if (currentStep === 3) return selectedSkills.length > 0;
        if (currentStep === 4) return Object.keys(skillRatings).length > 0;
        return true;
      default:
        return true;
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let surveyData;

      switch (surveyType) {
        case "school":
          surveyData = {
            surveyType: "school",
            academicCategories: selectedCategories,
            subjects: selectedSubjects.map((subjectId) => {
              const subject = availableSubjects.find((s) => s.id === subjectId);
              return {
                subjectId,
                subjectName: subject?.name || subjectId,
                category: subject?.category,
                selfRating: subjectRatings[subjectId] || 3,
              };
            }),
            // Map subjects to skills format for quiz
            skills: selectedSubjects.map((subjectId) => {
              const subject = availableSubjects.find((s) => s.id === subjectId);
              return {
                skillName: subject?.name || subjectId,
                selfRating: subjectRatings[subjectId] || 3,
              };
            }),
          };
          break;
        case "college":
          surveyData = {
            surveyType: "college",
            learningPaths: selectedPaths,
            skills: selectedSkills.map((skillId) => {
              const skill = availableSkills.find((s) => s.id === skillId);
              return {
                skillId,
                skillName: skill?.name || skillId,
                learningPath: skill?.path,
                selfRating: skillRatings[skillId] || 3,
              };
            }),
          };
          break;
        case "professional":
          surveyData = {
            surveyType: "professional",
            company: selectedCompany,
            domain: selectedDomain,
            role: selectedRole,
            skills: selectedSkills.map((skillName) => ({
              skillName,
              selfRating: skillRatings[skillName] || 3,
            })),
          };
          break;
      }

      const response = await analyticsService.submitSurvey(surveyData);
      const surveyId = response?.survey?._id || response?._id;

      notify("Survey submitted successfully! Starting quiz...", {
        type: "success",
      });

      // Navigate to quiz page with survey data
      navigate("/analytics/skill-quiz", {
        state: {
          surveyData,
          surveyId,
        },
        replace: true,
      });
    } catch (error) {
      notify(error.message || "Failed to submit survey", { type: "error" });
      setSubmitting(false);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    const lastRatingStep = steps.length - 2;
    if (currentStep === lastRatingStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      setSearchQuery("");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setSearchQuery("");
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    // Step 0: Survey Type Selection
    if (currentStep === 0) {
      return (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Choose Your Assessment Type
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Select the category that best describes your current situation
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {SURVEY_TYPES.map((type) => {
              const icons = {
                school: School,
                college: GraduationCap,
                professional: Building2,
              };
              const IconComponent = icons[type.id];
              const isSelected = surveyType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => setSurveyType(type.id)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-100"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      isSelected ? "bg-primary-500" : "bg-gray-100"
                    }`}
                  >
                    <IconComponent
                      className={`w-8 h-8 ${
                        isSelected ? "text-white" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{type.name}</h3>
                  <p className="text-xs text-gray-500">{type.description}</p>
                  {isSelected && (
                    <div className="mt-3">
                      <CheckCircle2 className="w-6 h-6 text-primary-500 mx-auto" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // School Flow
    if (surveyType === "school") {
      // Categories selection
      if (currentStep === 1) {
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Subject Categories
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              You can select both Academic and Non-Academic subjects
            </p>
            <div className="space-y-3">
              {ACADEMIC_CATEGORIES.map((category) => (
                <SelectableCard
                  key={category.id}
                  item={category}
                  selected={selectedCategories.includes(category.id)}
                  onClick={() => toggleCategory(category.id)}
                />
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <div className="mt-4 p-3 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-sm text-primary-700">
                  <strong>{selectedCategories.length}</strong> categories
                  selected. Click Next to choose subjects from these categories.
                </p>
              </div>
            )}
          </div>
        );
      }

      // Subjects selection
      if (currentStep === 2) {
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Select Your Subjects
                </h2>
                <p className="text-gray-600 text-sm">
                  Choose subjects you want to assess ({filteredSubjects.length}{" "}
                  available)
                </p>
              </div>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {selectedSubjects.length} selected
              </span>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search subjects..."
            />

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
              {filteredSubjects.map((subject) => {
                const isSelected = selectedSubjects.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {subject.name}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isSelected
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {subject.category === "academic"
                          ? "Academic"
                          : "Non-Academic"}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredSubjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No subjects found</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Rate subjects
      if (currentStep === 3) {
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Rate Your Proficiency
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Rate your proficiency (1 = Beginner, 5 = Expert)
            </p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {selectedSubjects.map((subjectId) => {
                const subject = availableSubjects.find(
                  (s) => s.id === subjectId,
                );
                const rating = subjectRatings[subjectId] || 3;
                return (
                  <div
                    key={subjectId}
                    className="bg-white p-4 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {subject?.name || subjectId}
                      </h4>
                      <span
                        className={`text-lg font-bold ${
                          rating >= 3 ? "text-green-600" : "text-orange-500"
                        }`}
                      >
                        L{rating}
                      </span>
                    </div>
                    <RatingInput
                      value={rating}
                      onChange={(r) =>
                        setSubjectRatings((prev) => ({
                          ...prev,
                          [subjectId]: r,
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    // College Flow
    if (surveyType === "college") {
      // Learning paths selection
      if (currentStep === 1) {
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Learning Paths
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              You can select multiple learning paths you're interested in
            </p>
            <div className="space-y-3">
              {LEARNING_PATHS.map((path) => (
                <SelectableCard
                  key={path.id}
                  item={path}
                  selected={selectedPaths.includes(path.id)}
                  onClick={() => togglePath(path.id)}
                />
              ))}
            </div>
            {selectedPaths.length > 0 && (
              <div className="mt-4 p-3 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-sm text-primary-700">
                  <strong>{selectedPaths.length}</strong> paths selected. Click
                  Next to choose skills from these paths.
                </p>
              </div>
            )}
          </div>
        );
      }

      // Skills selection
      if (currentStep === 2) {
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Select Your Skills
                </h2>
                <p className="text-gray-600 text-sm">
                  Choose skills you have experience with (
                  {filteredSkills.length} available)
                </p>
              </div>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {selectedSkills.length} selected
              </span>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search skills..."
            />

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
              {filteredSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);
                const pathInfo = LEARNING_PATHS.find(
                  (p) => p.id === skill.path,
                );
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {skill.name}
                        </span>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        {pathInfo?.name || skill.path}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredSkills.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No skills found</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Rate skills
      if (currentStep === 3) {
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Rate Your Skills
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Rate your proficiency (1 = Beginner, 5 = Expert)
            </p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {selectedSkills.map((skillId) => {
                const skill = availableSkills.find((s) => s.id === skillId);
                const rating = skillRatings[skillId] || 3;
                return (
                  <div
                    key={skillId}
                    className="bg-white p-4 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {skill?.name || skillId}
                      </h4>
                      <span
                        className={`text-lg font-bold ${
                          rating >= 3 ? "text-green-600" : "text-orange-500"
                        }`}
                      >
                        L{rating}
                      </span>
                    </div>
                    <RatingInput
                      value={rating}
                      onChange={(r) =>
                        setSkillRatings((prev) => ({ ...prev, [skillId]: r }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    // Professional Flow (existing logic enhanced)
    if (surveyType === "professional") {
      // Company selection
      if (currentStep === 1) {
        const filteredCompanies = companies.filter(
          (company) =>
            company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.domain?.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Your Dream Company
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose a company you'd like to work for
            </p>

            {/* Search */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search companies..."
            />

            {loading ? (
              <LoadingSkeleton count={4} />
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {filteredCompanies.map((company) => (
                  <button
                    key={company.name}
                    onClick={() => setSelectedCompany(company.name)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                      selectedCompany === company.name
                        ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-100"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedCompany === company.name
                          ? "bg-primary-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <Building2
                        className={`w-6 h-6 ${
                          selectedCompany === company.name
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">
                        {company.name}
                      </span>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3" />
                        {company.domain}
                      </p>
                    </div>
                    {selectedCompany === company.name && (
                      <CheckCircle2 className="w-6 h-6 text-primary-500" />
                    )}
                  </button>
                ))}
                {filteredCompanies.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No companies found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // Role selection
      if (currentStep === 2) {
        const filteredRoles = roles.filter((role) =>
          role.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Target Role
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose your target role at{" "}
              <span className="font-semibold text-primary-600">
                {selectedCompany}
              </span>
            </p>

            {/* Search */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search roles..."
            />

            {loading ? (
              <LoadingSkeleton count={4} />
            ) : roles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No roles found for this company</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {filteredRoles.map((role) => (
                  <button
                    key={role.name}
                    onClick={() => setSelectedRole(role.name)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      selectedRole === role.name
                        ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-100"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedRole === role.name
                              ? "bg-primary-500"
                              : "bg-gray-100"
                          }`}
                        >
                          <Briefcase
                            className={`w-5 h-5 ${
                              selectedRole === role.name
                                ? "text-white"
                                : "text-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">
                            {role.name}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {role.requiredSkills?.length || 0} required skills
                          </p>
                        </div>
                      </div>
                      {selectedRole === role.name && (
                        <CheckCircle2 className="w-6 h-6 text-primary-500" />
                      )}
                    </div>
                  </button>
                ))}
                {filteredRoles.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No roles found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // Skills selection (Professional)
      if (currentStep === 3) {
        const filteredProfSkills = allSkills.filter((skill) =>
          skill.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Select Skills You Know
                </h2>
                <p className="text-gray-600 text-sm">
                  Select the skills you have experience with
                </p>
              </div>
              <div className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {selectedSkills.length} selected
              </div>
            </div>

            {/* Search */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search skills..."
            />

            {/* Selected skills tags */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                {selectedSkills.map((skillName) => (
                  <span
                    key={skillName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-medium"
                  >
                    {skillName}
                    <button
                      onClick={() => toggleSkill(skillName)}
                      className="hover:bg-green-600 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {loading ? (
              <LoadingSkeleton count={5} />
            ) : (
              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {filteredProfSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.name);
                  return (
                    <button
                      key={skill.name}
                      onClick={() => toggleSkill(skill.name)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        isSelected
                          ? "border-green-500 bg-green-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {skill.name}
                          </span>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            isSelected
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          Required: L{skill.requiredLevel}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filteredProfSkills.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No skills found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // Rate skills (Professional)
      if (currentStep === 4) {
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Rate Your Skills
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Rate your proficiency (1 = Beginner, 5 = Expert)
            </p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {selectedSkills.map((skillName) => {
                const skill = allSkills.find((s) => s.name === skillName);
                const rating = skillRatings[skillName] || 3;
                return (
                  <div
                    key={skillName}
                    className="bg-white p-4 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {skillName}
                        </h4>
                        {skill?.requiredLevel && (
                          <p className="text-xs text-gray-500">
                            Required: L{skill.requiredLevel}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          rating >= (skill?.requiredLevel || 3)
                            ? "text-green-600"
                            : "text-orange-500"
                        }`}
                      >
                        L{rating}
                      </span>
                    </div>
                    <RatingInput
                      value={rating}
                      onChange={(r) =>
                        setSkillRatings((prev) => ({ ...prev, [skillName]: r }))
                      }
                      requiredLevel={skill?.requiredLevel}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    // Complete step
    if (currentStep === steps.length - 1) {
      return (
        <div className="text-center py-8 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Self-Assessment Complete!
          </h2>
          <p className="text-gray-600 mb-8">
            {surveyType === "professional"
              ? "Now let's test your skills with a quick quiz to get accurate results."
              : "Great job! Your assessment has been recorded. View your results on the analytics page."}
          </p>
          <div className="flex flex-col gap-3 max-w-md mx-auto">
            {surveyType === "professional" && (
              <button
                onClick={() =>
                  navigate("/analytics/quiz", {
                    state: {
                      surveyData: {
                        company: selectedCompany,
                        domain: selectedDomain,
                        role: selectedRole,
                        skills: selectedSkills.map((skillName) => ({
                          skillName,
                          selfRating: skillRatings[skillName] || 3,
                        })),
                      },
                      surveyId: result?.survey?._id,
                    },
                  })
                }
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200"
              >
                Start Skill Quiz
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => navigate("/analytics")}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-200"
            >
              View Analytics Dashboard
              <ChevronRight className="inline-block ml-1 w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 md:pb-0">
      <Title title="Skill Assessment" />

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 mb-6">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Skill Assessment
              </h1>
              <p className="text-sm text-gray-500">
                Discover your skill gaps and recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 mb-6">
        <ProgressSteps steps={steps} currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 min-h-[450px]">
          {renderStepContent()}

          {/* Navigation */}
          {currentStep < steps.length - 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed() || submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : currentStep === steps.length - 2 ? (
                  <>
                    Submit & Analyze
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfAssessmentPage;
