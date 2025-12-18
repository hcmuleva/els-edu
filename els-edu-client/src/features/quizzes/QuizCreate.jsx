import React, { useState } from "react";
import {
  useCreate,
  useUpdate,
  useRedirect,
  useNotify,
  useGetIdentity,
  Title,
  useGetOne,
} from "react-admin";
import { useParams } from "react-router-dom";
import {
  Plus,
  FileQuestion,
  ArrowLeft,
  Clock,
  Target,
  Shuffle,
  Eye,
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Settings,
  Hash,
} from "lucide-react";
import { QuestionBuilder } from "../questions/components/QuestionBuilder";
import { QuestionSelector } from "../../components/common/QuestionSelector";
import { CustomSelect } from "../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../components/common/CustomAsyncSelect";

// Step components for cleaner code
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

export const QuizCreate = () => {
  const [questions, setQuestions] = useState([]);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { id } = useParams();
  const isEdit = !!id;
  const redirect = useRedirect();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();
  const [create, { isPending: isCreating }] = useCreate();
  const [update, { isPending: isUpdating }] = useUpdate();
  const isPending = isCreating || isUpdating;

  const { data: quizDataLoaded, isLoading: isLoadingQuiz } = useGetOne(
    "quizzes",
    { id },
    { enabled: isEdit }
  );

  // Form state matching schema
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    quizType: "standalone",
    difficulty: "beginner",
    timeLimit: 30,
    maxAttempts: 3,
    passingScore: 70,
    isActive: true,
    isRandomized: false,
    showCorrectAnswers: "after-submission",
    allowReview: true,
    topic: null,
    subject: null,
  });

  // Populate form data on edit
  React.useEffect(() => {
    if (quizDataLoaded && isEdit) {
      setFormData({
        title: quizDataLoaded.title || "",
        description: quizDataLoaded.description || "",
        instructions: quizDataLoaded.instructions || "",
        quizType: quizDataLoaded.quizType || "standalone",
        difficulty: quizDataLoaded.difficulty || "beginner",
        timeLimit: quizDataLoaded.timeLimit || 30,
        maxAttempts: quizDataLoaded.maxAttempts || 3,
        passingScore: quizDataLoaded.passingScore || 70,
        isActive: quizDataLoaded.isActive ?? true,
        isRandomized: quizDataLoaded.isRandomized ?? false,
        showCorrectAnswers:
          quizDataLoaded.showCorrectAnswers || "after-submission",
        allowReview: quizDataLoaded.allowReview ?? true,
        topic: quizDataLoaded.topic?.id || quizDataLoaded.topic || null,
        subject: quizDataLoaded.subject?.id || quizDataLoaded.subject || null,
      });

      // Populate questions if available
      if (quizDataLoaded.questions) {
        // Map loaded questions to expected format
        const loadedQuestions = quizDataLoaded.questions.map((q) => ({
          ...q,
          existingId: q.id, // Keep track of original ID
          isNew: false,
        }));
        setQuestions(loadedQuestions);
      }
    }
  }, [quizDataLoaded, isEdit]);

  const steps = [
    { label: "Details", icon: BookOpen },
    { label: "Settings", icon: Settings },
    { label: "Questions", icon: Hash },
  ];

  const updateFormData = (field, value) => {
    console.log("field", field, "value", value);

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Question management functions
  // Note: Question creation removed as per requirements. Questions must be selected from library.

  const handleSelectQuestions = (selectedQuestions) => {
    const formattedQuestions = selectedQuestions.map((q) => ({
      ...q,
      id: Date.now() + Math.random(),
      isNew: false,
      existingId: q.id,
    }));
    setQuestions([...questions, ...formattedQuestions]);
  };

  const updateQuestion = (index, updatedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
  };

  // Duplicate question removed as creating questions is disabled

  // Navigation and Saving
  const handleNext = () => {
    console.log("formdata", formData);

    // Step 1 Validation
    if (currentStep === 0) {
      if (!formData.title.trim()) {
        notify("Please enter a quiz title", { type: "warning" });
        return;
      }
      if (!formData.topic) {
        notify("Please select a topic", { type: "warning" });
        return;
      }
      if (!formData.subject) {
        notify("Please select a subject", { type: "warning" });
        return;
      }
    }

    // Step 2 Validation
    if (currentStep === 1) {
      if (!formData.timeLimit || formData.timeLimit < 1) {
        notify("Please enter a valid time limit", { type: "warning" });
        return;
      }
      if (
        formData.passingScore === undefined ||
        formData.passingScore < 0 ||
        formData.passingScore > 100
      ) {
        notify("Please enter a valid passing score (0-100)", {
          type: "warning",
        });
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveDraft = async () => {
    notify("Draft saved!", { type: "success" });
  };

  const handlePublish = async () => {
    if (questions.length === 0) {
      notify("Please add at least one question", { type: "warning" });
      return;
    }

    console.log("formdata inside handle submit", formData);

    try {
      // 1. Get all question IDs
      const allQuestionIds = questions.map(
        (q) => q.existingId || q.id || q.documentId
      );

      // Note: Inline creation logic removed. We only link existing questions.

      // 4. Create the Quiz
      const quizData = {
        ...formData,
        creator: identity?.id,
        questions: allQuestionIds,
        topic: formData.topic, // Assuming ID from CustomAsyncSelect
        subject: formData.subject, // Assuming ID from CustomAsyncSelect
      };

      console.log("quizData", quizData);

      if (isEdit) {
        await update("quizzes", { id, data: quizData });
        notify("Quiz updated successfully!", { type: "success" });
      } else {
        await create("quizzes", { data: quizData });
        notify("Quiz published successfully!", { type: "success" });
      }
      redirect("/my-contents");
    } catch (error) {
      console.error("Error creating quiz:", error);
      notify("Error creating quiz. Please try again.", { type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Title title={isEdit ? `Edit Quiz #${id}` : "Create Quiz"} />

      {/* Sticky Header with Actions */}
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
              {currentStep === 0 ? (
                <ArrowLeft className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {isEdit ? "Edit Quiz" : "Create Quiz"}
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
              onClick={handleSaveDraft}
              className="px-5 py-2.5 rounded-xl border border-border/50 font-bold text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-all text-sm"
            >
              Save Draft
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
                onClick={handlePublish}
                disabled={isPending || questions.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Sparkles className="w-4 h-4" />
                {isEdit ? "Update Quiz" : "Publish Quiz"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <StepIndicator currentStep={currentStep} steps={steps} />

        {isLoadingQuiz ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden min-h-[400px]">
            {/* Step 1: Details */}
            {currentStep === 0 && (
              <div className="p-10 space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Quiz Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormData("title", e.target.value)}
                      placeholder="e.g., Mathematics Final Exam 2024"
                      className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        updateFormData("description", e.target.value)
                      }
                      placeholder="Briefly describe what this quiz is about..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground">
                        Topic <span className="text-red-500">*</span>
                      </label>
                      <CustomAsyncSelect
                        resource="topics"
                        optionText="name"
                        value={formData.topic}
                        onChange={(val) => updateFormData("topic", val)}
                        placeholder="Select topic..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <CustomAsyncSelect
                        resource="subjects"
                        optionText="name"
                        value={formData.subject}
                        onChange={(val) => updateFormData("subject", val)}
                        placeholder="Select subject..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-bold text-foreground">
                      Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) =>
                        updateFormData("instructions", e.target.value)
                      }
                      placeholder="Instructions for students taking this quiz..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Settings */}
            {currentStep === 1 && (
              <div className="p-10 space-y-10 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Quiz Type
                    </label>
                    <CustomSelect
                      value={formData.quizType}
                      onChange={(val) => updateFormData("quizType", val)}
                      options={[
                        { id: "standalone", name: "Standalone Quiz" },
                        { id: "kit", name: "Kit Assessment" },
                        { id: "level", name: "Level Check" },
                        { id: "lesson", name: "Lesson Review" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Difficulty Level
                    </label>
                    <CustomSelect
                      value={formData.difficulty}
                      onChange={(val) => updateFormData("difficulty", val)}
                      options={[
                        { id: "beginner", name: "Beginner" },
                        { id: "intermediate", name: "Intermediate" },
                        { id: "advanced", name: "Advanced" },
                      ]}
                    />
                  </div>
                </div>

                <div className="border-t border-border/50 my-6" />

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" /> Time (min){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) =>
                        updateFormData(
                          "timeLimit",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border/50 focus:border-primary outline-none text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" /> Pass Score %{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) =>
                        updateFormData(
                          "passingScore",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border/50 focus:border-primary outline-none text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-500" /> Attempts
                    </label>
                    <input
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) =>
                        updateFormData(
                          "maxAttempts",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border/50 focus:border-primary outline-none text-center font-bold"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl grid grid-cols-2 gap-4">
                  {[
                    {
                      key: "isActive",
                      label: "Active",
                      desc: "Visible to students",
                    },
                    {
                      key: "isRandomized",
                      label: "Randomize",
                      desc: "Shuffle questions",
                    },
                    {
                      key: "allowReview",
                      label: "Allow Review",
                      desc: "Review answers later",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() =>
                        updateFormData(item.key, !formData[item.key])
                      }
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-border/50 cursor-pointer hover:border-primary/50 transition-all hover:shadow-sm"
                    >
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          {item.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          formData[item.key] ? "bg-primary" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                            formData[item.key] ? "left-6" : "left-1"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-border/50">
                    <span className="font-bold text-sm">Show Answers</span>
                    <CustomSelect
                      value={formData.showCorrectAnswers}
                      onChange={(val) =>
                        updateFormData("showCorrectAnswers", val)
                      }
                      options={[
                        { id: "immediately", name: "Immediately" },
                        { id: "after-submission", name: "After Submit" },
                        { id: "never", name: "Never" },
                      ]}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Questions */}
            {currentStep === 2 && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300 min-h-[500px] flex flex-col">
                <div className="p-4 border-b border-border/50 bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                  <h3 className="font-bold text-foreground">
                    Questions ({questions.length}){" "}
                    <span className="text-red-500">*</span>
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowQuestionSelector(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <FileQuestion className="w-4 h-4 text-purple-600" />
                      Select Questions from Library
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-8 bg-gray-50/30">
                  {questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <FileQuestion className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-bold text-foreground">
                        No questions yet
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        Start adding questions to your quiz using the buttons
                        above.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <QuestionBuilder
                          key={question.id}
                          question={question}
                          index={index}
                          onChange={updateQuestion}
                          onDelete={deleteQuestion}
                          onMoveUp={(i) => moveQuestion(i, "up")}
                          onMoveDown={(i) => moveQuestion(i, "down")}
                          canMoveUp={index > 0}
                          canMoveDown={index < questions.length - 1}
                          readOnly={true} // Force read-only mode
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Questions Selector */}
      <QuestionSelector
        open={showQuestionSelector}
        onClose={() => setShowQuestionSelector(false)}
        onSelectQuestions={handleSelectQuestions}
        selectedIds={questions
          .filter((q) => q.existingId)
          .map((q) => q.existingId)}
      />
    </div>
  );
};
