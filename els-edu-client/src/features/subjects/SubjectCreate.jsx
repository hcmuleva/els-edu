import React, { useState } from "react";
import {
  useNotify,
  useRedirect,
  Title,
  useCreate,
  useGetIdentity,
} from "react-admin";
import {
  ArrowLeft,
  Upload,
  X,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Layers,
  GraduationCap,
  Star,
} from "lucide-react";
import { CustomSelect } from "../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../components/common/CustomAsyncSelect";
import { CustomAsyncMultiSelect } from "../../components/common/CustomAsyncMultiSelect";
import { RichTextEditor } from "../../components/common/RichTextEditor";

// Step indicator component
const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center mb-8">
    {steps.map((step, index) => {
      const isCompleted = index < currentStep;
      const isCurrent = index === currentStep;

      return (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110"
                    : "bg-white border-gray-200 text-gray-400"
                }
              `}
            >
              {isCompleted ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isCurrent
                  ? "text-primary"
                  : isCompleted
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-24 h-0.5 mx-4 transition-all duration-500 ${
                isCompleted ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      );
    })}
  </div>
);

// Level options for dropdown
const levelOptions = [
  { id: 1, name: "Level 1 - Beginner" },
  { id: 2, name: "Level 2 - Elementary" },
  { id: 3, name: "Level 3 - Intermediate" },
  { id: 4, name: "Level 4 - Advanced" },
  { id: 5, name: "Level 5 - Expert" },
];

export const SubjectCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const [create, { isLoading }] = useCreate();
  const { data: identity } = useGetIdentity();

  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    grade: "",
    level: 3,
    coverpage: null,
    courses: [],
  });

  const [coverPreview, setCoverPreview] = useState(null);

  const steps = [
    { label: "Details", icon: BookOpen },
    { label: "Review", icon: CheckCircle },
  ];

  const gradeOptions = [
    { id: "", name: "Select Grade" },
    { id: "PLAYSCHOOL", name: "Play School" },
    { id: "LKG", name: "LKG" },
    { id: "UKG", name: "UKG" },
    { id: "FIRST", name: "1st Grade" },
    { id: "SECOND", name: "2nd Grade" },
    { id: "THIRD", name: "3rd Grade" },
    { id: "FOURTH", name: "4th Grade" },
    { id: "FIFTH", name: "5th Grade" },
    { id: "SIXTH", name: "6th Grade" },
    { id: "SEVENTH", name: "7th Grade" },
    { id: "EIGHTH", name: "8th Grade" },
    { id: "NINTH", name: "9th Grade" },
    { id: "TENTH", name: "10th Grade" },
    { id: "ELEVENTH", name: "11th Grade" },
    { id: "TWELFTH", name: "12th Grade" },
    { id: "DIPLOMA", name: "Diploma" },
    { id: "GRADUATION", name: "Graduation" },
    { id: "POSTGRADUATION", name: "Post Graduation" },
    { id: "PHD", name: "PhD" },
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, coverpage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, coverpage: null }));
    setCoverPreview(null);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.name.trim()) {
        notify("Please enter a subject name", { type: "warning" });
        return;
      }
      if (!formData.grade) {
        notify("Please select a grade", { type: "warning" });
        return;
      }
      if (!formData.level) {
        notify("Please select a difficulty level", { type: "warning" });
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        notify("Please enter a subject name", { type: "warning" });
        setCurrentStep(0);
        return;
      }

      if (!formData.grade) {
        notify("Please select a grade", { type: "warning" });
        setCurrentStep(0);
        return;
      }

      const subjectData = {
        name: formData.name,
        description: formData.description || null,
        grade: formData.grade,
        level: formData.level,
        creator: identity?.id,
      };

      if (formData.courses && formData.courses.length > 0) {
        subjectData.courses = formData.courses;
      }

      let result;
      if (formData.coverpage) {
        const submitData = new FormData();
        submitData.append("data", JSON.stringify(subjectData));
        submitData.append("files.coverpage", formData.coverpage);

        result = await create(
          "subjects",
          { data: submitData },
          {
            meta: {
              isFormData: true,
            },
          }
        );
      } else {
        result = await create("subjects", { data: subjectData });
      }

      notify("Subject created successfully!", { type: "success" });

      // Redirect based on the created subject's ID
      if (result?.data?.id) {
        setTimeout(() => {
          redirect(`/browse-subjects/${result.data.id}`);
        }, 500);
      } else {
        setTimeout(() => {
          redirect("/my-contents");
        }, 500);
      }
    } catch (error) {
      console.error("Error creating subject:", error);
      notify("Error creating subject. Please try again.", { type: "error" });
    }
  };

  const getGradeLabel = (gradeId) => {
    const option = gradeOptions.find((opt) => opt.id === gradeId);
    return option?.name || gradeId || "Not specified";
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Title title="Create Subject" />

      {/* Sticky Header */}
      <div className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-40 backdrop-blur-md bg-white/95 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={
                currentStep === 0 ? () => redirect("/my-contents") : handleBack
              }
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
              title={currentStep === 0 ? "Exit" : "Go Back"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Create Subject
              </h1>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Step {currentStep + 1} of {steps.length}:{" "}
                {steps[currentStep].label}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => redirect("/my-contents")}
              className="px-5 py-2.5 rounded-xl border border-border/50 font-bold text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-all text-sm"
            >
              Cancel
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? "Creating..." : "Create Subject"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <StepIndicator currentStep={currentStep} steps={steps} />

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden min-h-[400px]">
          {/* Step 1: Details */}
          {currentStep === 0 && (
            <div className="p-10 space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
              {/* Subject Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Mathematics, Science, English"
                  className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
                  autoFocus
                />
              </div>

              {/* Description - Rich Text Editor */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Description
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Add a detailed description for this subject..."
                />
                <p className="text-xs text-gray-400">
                  Use the toolbar to format your text (bold, italic, lists,
                  links, etc.)
                </p>
              </div>

              {/* Grade, Level, Course */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-500" />
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={formData.grade}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, grade: val }))
                    }
                    options={gradeOptions}
                    placeholder="Select Grade"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Level <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={formData.level}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, level: parseInt(val) }))
                    }
                    options={levelOptions}
                    placeholder="Select Level"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Courses
                  </label>
                  <CustomAsyncMultiSelect
                    resource="courses"
                    optionText="name"
                    value={formData.courses}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, courses: val }))
                    }
                    placeholder="Select courses..."
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Cover Image
                </label>
                {coverPreview ? (
                  <div className="relative">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-64 object-cover rounded-xl border border-border/50"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm font-medium text-gray-600">
                        <span className="font-bold text-primary">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {currentStep === 1 && (
            <div className="p-10 space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-foreground">
                  Review Your Subject
                </h2>
                <p className="text-muted-foreground">
                  Please review the details before creating
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-border/50 space-y-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Basic Information
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Name
                        </span>
                        <p className="font-bold text-foreground text-lg">
                          {formData.name || "Not specified"}
                        </p>
                      </div>
                      {formData.description && (
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Description
                          </span>
                          <div
                            className="text-sm text-foreground mt-1 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: formData.description,
                            }}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Grade
                          </span>
                          <p className="font-bold text-foreground">
                            {getGradeLabel(formData.grade)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Level
                          </span>
                          <p className="font-bold text-foreground">
                            {levelOptions.find(
                              (opt) => opt.id === formData.level
                            )?.name || `Level ${formData.level}`}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Courses
                        </span>
                        <p className="font-bold text-foreground">
                          {formData.courses && formData.courses.length > 0
                            ? `${formData.courses.length} course${
                                formData.courses.length !== 1 ? "s" : ""
                              } selected`
                            : "None"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Preview */}
                  {coverPreview && (
                    <div className="p-6 bg-gray-50 rounded-2xl border border-border/50">
                      <h3 className="font-bold text-foreground mb-3">
                        Cover Image
                      </h3>
                      <img
                        src={coverPreview}
                        alt="Cover"
                        className="w-full h-32 object-cover rounded-xl"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
