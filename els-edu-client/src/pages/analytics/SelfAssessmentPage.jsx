import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import analyticsService from "../../services/analyticsService";
import mongoService from "../../services/mongoService";

const STEPS = ["Company", "Role", "Select Skills", "Rate Skills", "Complete"];

// Animated loading skeleton
const LoadingSkeleton = ({ count = 3 }) => (
  <div className="space-y-3 animate-pulse">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="h-14 bg-gray-200 rounded-xl" />
    ))}
  </div>
);

// Animated progress bar
const ProgressBar = ({ current, total }) => {
  const progress = ((current + 1) / total) * 100;
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        {STEPS.slice(0, -1).map((step, idx) => (
          <React.Fragment key={step}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                idx < current
                  ? "bg-green-500 text-white"
                  : idx === current
                  ? "bg-primary-500 text-white ring-4 ring-primary-200"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {idx < current ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            {idx < STEPS.length - 2 && (
              <div
                className={`flex-1 h-1 rounded transition-all duration-500 ${
                  idx < current ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        Step {current + 1} of {STEPS.length - 1}:{" "}
        <span className="font-medium text-gray-700">{STEPS[current]}</span>
      </p>
    </div>
  );
};

const SelfAssessmentPage = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();
  const notify = useNotify();

  const [currentStep, setCurrentStep] = useState(0);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  // Survey state
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]); // Skills user knows
  const [skillRatings, setSkillRatings] = useState({});
  const [result, setResult] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check if user already took the assessment
  useEffect(() => {
    const checkExisting = async () => {
      if (!identity?.documentId) return;
      try {
        let quizzes = await mongoService.getUserQuizzes({
          userDocumentId: identity.documentId,
        });

        // Robustly handle response structure (Array vs wrapped Object)
        if (!Array.isArray(quizzes)) {
          if (Array.isArray(quizzes.results)) {
            quizzes = quizzes.results;
          } else if (Array.isArray(quizzes.data)) {
            quizzes = quizzes.data;
          } else {
            quizzes = [];
          }
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

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const data = await analyticsService.getCompanies();
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        notify("Failed to load companies", { type: "error" });
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch roles when company changes
  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedCompany) return;
      setRolesLoading(true);
      try {
        const data = await analyticsService.getRoles({
          company: selectedCompany,
        });
        setRoles(data);
        // Update domain from company
        const company = companies.find((c) => c.name === selectedCompany);
        if (company?.domain) setSelectedDomain(company.domain);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, [selectedCompany, companies]);

  // Fetch skills when role changes
  useEffect(() => {
    const fetchSkills = async () => {
      if (!selectedRole || !selectedCompany) return;
      setSkillsLoading(true);
      try {
        const data = await analyticsService.getSkills(
          selectedRole,
          selectedCompany,
        );
        setAllSkills(data);
        // Reset selections when role changes
        setSelectedSkills([]);
        setSkillRatings({});
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setSkillsLoading(false);
      }
    };
    fetchSkills();
  }, [selectedRole, selectedCompany]);

  // Handle skill selection toggle
  const toggleSkill = (skillName) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skillName)) {
        // Remove skill and its rating
        const newRatings = { ...skillRatings };
        delete newRatings[skillName];
        setSkillRatings(newRatings);
        return prev.filter((s) => s !== skillName);
      } else {
        // Add skill with default rating
        setSkillRatings((r) => ({ ...r, [skillName]: 3 }));
        return [...prev, skillName];
      }
    });
  };

  const handleRatingChange = (skillName, rating) => {
    setSkillRatings((prev) => ({ ...prev, [skillName]: rating }));
  };

  const handleSubmit = async () => {
    if (selectedSkills.length === 0) {
      notify("Please select at least one skill", { type: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      const surveyData = {
        surveyType: "company",
        company: selectedCompany,
        domain: selectedDomain,
        role: selectedRole,
        skills: selectedSkills.map((skillName) => ({
          skillName,
          selfRating: skillRatings[skillName] || 3,
        })),
      };

      const response = await analyticsService.submitSurvey(surveyData);
      setResult(response);
      setCurrentStep(4); // Move to complete step
      notify("Survey submitted successfully!", { type: "success" });
    } catch (error) {
      notify(error.message || "Failed to submit survey", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Get skills for the selected role with required levels
  const roleSkills = useMemo(() => {
    if (!selectedRole) return [];
    return allSkills;
  }, [allSkills, selectedRole]);

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selectedCompany;
      case 1:
        return !!selectedRole;
      case 2:
        return selectedSkills.length > 0;
      case 3:
        return Object.keys(skillRatings).length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 3) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Your Dream Company
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Choose a company you'd like to work for
            </p>
            {companiesLoading ? (
              <LoadingSkeleton count={4} />
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {companies.map((company) => (
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
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Target Role
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Choose your target role at {selectedCompany}
            </p>
            {rolesLoading ? (
              <LoadingSkeleton count={4} />
            ) : roles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No roles found for this company</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {roles.map((role) => (
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
                      <div>
                        <span className="font-semibold text-gray-900">
                          {role.name}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {role.requiredSkills?.length || 0} required skills
                        </p>
                      </div>
                      {selectedRole === role.name && (
                        <CheckCircle2 className="w-6 h-6 text-primary-500" />
                      )}
                    </div>
                    {selectedRole === role.name && role.requiredSkills && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {role.requiredSkills.map((s) => (
                          <span
                            key={s.skillName}
                            className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full"
                          >
                            {s.skillName} (L{s.requiredLevel})
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Skills You Know
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Select the skills you have experience with. Required level for the
              role is shown.
            </p>
            {skillsLoading ? (
              <LoadingSkeleton count={5} />
            ) : (
              <div className="space-y-2">
                {roleSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.name);
                  return (
                    <button
                      key={skill.name}
                      onClick={() => toggleSkill(skill.name)}
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
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
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
              </div>
            )}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Selected:{" "}
                <span className="font-medium text-gray-900">
                  {selectedSkills.length}
                </span>{" "}
                of {roleSkills.length} skills
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Rate Your Skills
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Rate your proficiency (1 = Beginner, 5 = Expert)
            </p>
            <div className="space-y-4">
              {selectedSkills.map((skillName) => {
                const skill = roleSkills.find((s) => s.name === skillName);
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
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRatingChange(skillName, r)}
                          className={`flex-1 h-10 rounded-lg font-semibold transition-all duration-200 ${
                            rating >= r
                              ? r >= (skill?.requiredLevel || 3)
                                ? "bg-green-500 text-white"
                                : "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center py-8 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Self-Assessment Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              Now let's test your skills with a quick quiz to get accurate
              results.
            </p>
            <div className="flex flex-col gap-3 max-w-md mx-auto">
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
              <button
                onClick={() => navigate("/analytics")}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
              >
                Skip quiz → View Self-Assessment Only
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
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
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 -mx-4 -mt-2 md:-mx-8 md:-mt-6 mb-6">
        <div className="max-w-3xl mx-auto px-4 py-4 md:px-8 md:py-6">
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
      <div className="max-w-3xl mx-auto mb-6">
        <ProgressBar current={currentStep} total={STEPS.length - 1} />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 min-h-[400px]">
          {renderStepContent()}

          {/* Navigation */}
          {currentStep < 4 && (
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
                ) : currentStep === 3 ? (
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
