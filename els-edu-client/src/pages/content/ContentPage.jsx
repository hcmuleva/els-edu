import React, { useState, useEffect } from "react";
import { Title, useRedirect } from "react-admin";
import {
  FileQuestion,
  BookOpen,
  GraduationCap,
  PlusCircle,
  Layers,
  FolderTree,
  FileText,
  Link2,
} from "lucide-react";
import { QuestionsTab } from "./tabs/QuestionsTab";
import { QuizzesTab } from "./tabs/QuizzesTab";
import { CoursesTab } from "./tabs/CoursesTab";
import { SubjectsTab } from "./tabs/SubjectsTab";
import { TopicsTab } from "./tabs/TopicsTab";
import { ContentsTab } from "./tabs/ContentsTab";
import { AssignTab } from "./tabs/AssignTab";

// Action Button Component
const ActionButton = ({
  icon: Icon,
  title,
  description,
  onClick,
  colorClass,
  bgClass,
}) => (
  <button
    onClick={onClick}
    className="group relative flex flex-col items-start p-5 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] xl:w-[calc(25%-0.75rem)] bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
  >
    <div
      className={`absolute top-0 right-0 p-2.5 rounded-bl-2xl ${bgClass} opacity-50 group-hover:opacity-100 transition-opacity`}
    >
      <PlusCircle className={`w-5 h-5 ${colorClass}`} />
    </div>

    <div
      className={`p-3 rounded-xl ${bgClass} mb-3 group-hover:scale-110 transition-transform duration-300`}
    >
      <Icon className={`w-7 h-7 ${colorClass}`} />
    </div>

    <h3 className="text-base font-black text-gray-800 mb-1 group-hover:text-primary transition-colors">
      {title}
    </h3>
    <p className="text-xs text-gray-500 font-medium leading-relaxed">
      {description}
    </p>
  </button>
);

const ContentPage = () => {
  const redirect = useRedirect();
  const [studioMode, setStudioMode] = useState(
    () => localStorage.getItem("contentPage.mode") || "create"
  ); // "create" or "assign"
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("contentPage.activeTab") || "questions"
  ); // Default to questions

  useEffect(() => {
    localStorage.setItem("contentPage.mode", studioMode);
  }, [studioMode]);

  useEffect(() => {
    localStorage.setItem("contentPage.activeTab", activeTab);
  }, [activeTab]);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <Title title="My Studio" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-800 font-heading">
            Content Studio
          </h1>
          <p className="text-gray-500 font-medium">
            {studioMode === "create"
              ? "Create and manage your educational resources"
              : "Manage content assignments and relationships"}
          </p>
        </div>

        {/* Main Mode Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setStudioMode("create")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              studioMode === "create"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create
          </button>
          <button
            onClick={() => setStudioMode("assign")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              studioMode === "assign"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Link2 className="w-4 h-4" />
            Assign
          </button>
        </div>
      </div>

      {/* Create Mode */}
      {studioMode === "create" && (
        <>
          <div className="flex flex-wrap gap-4">
            <ActionButton
              icon={FileQuestion}
              title="New Question"
              description="Create a single question for quizzes or practice."
              onClick={() => redirect("/questions/create")}
              bgClass="bg-blue-50"
              colorClass="text-blue-600"
            />
            <ActionButton
              icon={BookOpen}
              title="New Quiz"
              description="Assemble questions into a graded assessment."
              onClick={() => redirect("/quizzes/create")}
              bgClass="bg-violet-50"
              colorClass="text-violet-600"
            />
            <ActionButton
              icon={GraduationCap}
              title="New Course"
              description="Build a comprehensive learning path."
              onClick={() => redirect("/courses/create")}
              bgClass="bg-emerald-50"
              colorClass="text-emerald-600"
            />
            <ActionButton
              icon={Layers}
              title="New Subject"
              description="Create a subject to organize topics and content."
              onClick={() => redirect("/subjects/create")}
              bgClass="bg-amber-50"
              colorClass="text-amber-600"
            />
            <ActionButton
              icon={FolderTree}
              title="New Topic"
              description="Add a topic under a subject for better organization."
              onClick={() => redirect("/topics/create")}
              bgClass="bg-indigo-50"
              colorClass="text-indigo-600"
            />
            <ActionButton
              icon={FileText}
              title="New Content"
              description="Add educational content like videos, images, or documents."
              onClick={() => redirect("/contents/create")}
              bgClass="bg-teal-50"
              colorClass="text-teal-600"
            />
          </div>
          <div className="bg-white rounded-3xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
              <h2 className="text-xl font-bold text-gray-800">Your Library</h2>
              <div className="flex gap-2">
                {[
                  { id: "questions", label: "Questions" },
                  { id: "quizzes", label: "Quizzes" },
                  { id: "courses", label: "Courses" },
                  { id: "subjects", label: "Subjects" },
                  { id: "topics", label: "Topics" },
                  { id: "contents", label: "Contents" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-bold rounded-xl text-sm cursor-pointer transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-gray-50 text-gray-500"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === "questions" && <QuestionsTab />}
              {activeTab === "quizzes" && <QuizzesTab />}
              {activeTab === "courses" && <CoursesTab />}
              {activeTab === "subjects" && <SubjectsTab />}
              {activeTab === "topics" && <TopicsTab />}
              {activeTab === "contents" && <ContentsTab />}
            </div>
          </div>
        </>
      )}

      {/* Assign Mode */}
      {studioMode === "assign" && (
        <div className="bg-white rounded-3xl border border-border/50 shadow-sm">
          <div className="p-6 pb-4 border-b border-border/50">
            <h2 className="text-xl font-bold text-gray-800">
              Content Assignments
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Assign subjects to courses, topics to subjects, and contents to
              topics
            </p>
          </div>
          <AssignTab />
        </div>
      )}
    </div>
  );
};

export default ContentPage;
