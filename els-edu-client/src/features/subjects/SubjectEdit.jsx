import React, { useState, useEffect } from "react";
import {
  useNotify,
  useRedirect,
  Title,
  useUpdate,
  useGetOne,
} from "react-admin";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  X,
  GraduationCap,
  Star,
  Layers,
} from "lucide-react";
import { CustomSelect } from "../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../components/common/CustomAsyncSelect";

// Level options for dropdown
const levelOptions = [
  { id: 1, name: "Level 1 - Beginner" },
  { id: 2, name: "Level 2 - Elementary" },
  { id: 3, name: "Level 3 - Intermediate" },
  { id: 4, name: "Level 4 - Advanced" },
  { id: 5, name: "Level 5 - Expert" },
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

export const SubjectEdit = () => {
  const { id } = useParams();
  const notify = useNotify();
  const redirect = useRedirect();
  const [update, { isLoading }] = useUpdate();
  const { data: subject, isPending } = useGetOne("subjects", {
    id,
    meta: { populate: ["coverpage", "courses"] },
  });

  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    level: 3,
    coverpage: null,
    courses: null,
  });

  const [coverPreview, setCoverPreview] = useState(null);
  // Store full course object for initialData
  const [initialCourse, setInitialCourse] = useState(null);

  // Load existing data when subject is fetched
  useEffect(() => {
    if (subject) {
      console.log("SubjectEdit - subject loaded:", subject);
      console.log("SubjectEdit - subject.courses:", subject.courses);

      setFormData({
        name: subject.name || "",
        grade: subject.grade || "",
        level: subject.level || 3,
        coverpage: null,
        courses: subject.courses?.[0]?.id || null,
      });

      if (subject.coverpage?.url) {
        setCoverPreview(subject.coverpage.url);
      }

      // Store the full course object for initialData
      if (subject.courses?.[0]) {
        console.log("SubjectEdit - setting initialCourse:", subject.courses[0]);
        setInitialCourse(subject.courses[0]);
      }
    }
  }, [subject]);

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
    if (subject?.coverpage?.url) {
      setCoverPreview(subject.coverpage.url);
    } else {
      setCoverPreview(null);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        notify("Please enter a subject name", { type: "warning" });
        return;
      }

      if (!formData.grade) {
        notify("Please select a grade", { type: "warning" });
        return;
      }

      const subjectData = {
        name: formData.name,
        grade: formData.grade,
        level: formData.level,
      };

      if (formData.courses) {
        subjectData.courses = [formData.courses];
      }

      if (formData.coverpage) {
        const submitData = new FormData();
        submitData.append("data", JSON.stringify(subjectData));
        submitData.append("files.coverpage", formData.coverpage);

        await update(
          "subjects",
          { id, data: submitData },
          {
            meta: {
              isFormData: true,
            },
          }
        );
      } else {
        await update("subjects", { id, data: subjectData });
      }

      notify("Subject updated successfully!", { type: "success" });

      setTimeout(() => {
        redirect("/my-contents");
      }, 500);
    } catch (error) {
      console.error("Error updating subject:", error);
      notify("Error updating subject. Please try again.", { type: "error" });
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subject...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title={`Edit ${subject?.name || "Subject"}`} />

      {/* Header */}
      <div className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => redirect("/my-contents")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to My Studio"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Edit Subject
              </h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Update subject details
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => redirect("/my-contents")}
              className="px-5 py-2 rounded-lg border border-border/50 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 space-y-6">
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
                Course
              </label>
              <CustomAsyncSelect
                resource="courses"
                optionText="name"
                value={formData.courses}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, courses: val }))
                }
                placeholder="Select course..."
                initialData={initialCourse}
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
      </div>
    </div>
  );
};
