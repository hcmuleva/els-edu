import React, { useState, useEffect, useMemo, useRef } from "react";
import { Title, useGetIdentity, usePermissions } from "react-admin";
import {
  Database,
  PlusCircle,
  Building2,
  Globe,
  Briefcase,
  Code,
  GraduationCap,
  FileText,
  Users,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  School,
  ClipboardList,
} from "lucide-react";
import SkillsTab from "./tabs/SkillsTab";
import CompaniesTab from "./tabs/CompaniesTab";
import DomainsTab from "./tabs/DomainsTab";
import RolesTab from "./tabs/RolesTab";
import UserCustomCoursesTab from "./tabs/UserCustomCoursesTab";
import UserQuizzesTab from "./tabs/UserQuizzesTab";
import UserSurveysTab from "./tabs/UserSurveysTab";
import ClassroomsTab from "./tabs/ClassroomsTab";
import AssignmentsTab from "./tabs/AssignmentsTab";

const MongoStudioPage = () => {
  const { data: identity } = useGetIdentity();
  const { permissions } = usePermissions();
  const [activeTab, setActiveTab] = useState("classrooms");
  const [tabSearchQuery, setTabSearchQuery] = useState("");
  const tabsScrollRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

  // Check if user has permission (ADMIN, SUPERADMIN, or TEACHER)
  const isAuthorized = ["ADMIN", "SUPERADMIN", "TEACHER"].includes(permissions);

  // Define allTabs before hooks (must be before useMemo)
  const allTabs = [
    { id: "classrooms", label: "Classrooms", icon: School },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "skills", label: "Skills", icon: Code },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "domains", label: "Domains", icon: Globe },
    { id: "roles", label: "Roles", icon: Briefcase },
    { id: "userCustomCourses", label: "Custom Courses", icon: GraduationCap },
    { id: "userquizzes", label: "User Quizzes", icon: FileText },
    { id: "usersurveys", label: "User Surveys", icon: Users },
  ];

  // Filter tabs based on role and search query
  const filteredTabs = useMemo(() => {
    let availableTabs = allTabs;

    // Teachers only see Classrooms and Assignments
    if (permissions === "TEACHER") {
      availableTabs = allTabs.filter((tab) =>
        ["classrooms", "assignments"].includes(tab.id)
      );
    }

    if (!tabSearchQuery.trim()) return availableTabs;
    const query = tabSearchQuery.toLowerCase();
    return availableTabs.filter(
      (tab) =>
        tab.label.toLowerCase().includes(query) ||
        tab.id.toLowerCase().includes(query)
    );
  }, [tabSearchQuery, permissions]);

  // Check scroll position to show/hide scroll indicators
  const checkScrollPosition = React.useCallback(() => {
    if (!tabsScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Scroll tabs horizontally
  const scrollTabs = React.useCallback((direction) => {
    if (!tabsScrollRef.current) return;
    const scrollAmount = 200;
    tabsScrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    // Load active tab from localStorage
    const savedTab = localStorage.getItem("mongoStudio.activeTab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    // Save active tab to localStorage
    localStorage.setItem("mongoStudio.activeTab", activeTab);
  }, [activeTab]);

  // Update scroll indicators on scroll and resize
  useEffect(() => {
    const scrollContainer = tabsScrollRef.current;
    if (!scrollContainer) return;

    checkScrollPosition();
    scrollContainer.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);

    return () => {
      scrollContainer.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [filteredTabs, checkScrollPosition]);

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (!tabsScrollRef.current) return;
    const activeButton = tabsScrollRef.current.querySelector(
      `[data-tab-id="${activeTab}"]`
    );
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  if (!isAuthorized) {
    return (
      <div className="p-6">
        <Title title="MongoDB Studio" />
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">
            You need ADMIN or SUPERADMIN permissions to access MongoDB Studio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <Title title="MongoDB Studio" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white -mx-6 -mt-6 px-6 py-6 border-b border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-800 font-heading">
                  MongoDB Studio
                </h1>
                <p className="text-gray-500 font-medium">
                  Manage MongoDB collections and data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3 gap-4">
            <h2 className="text-lg font-bold text-gray-800">
              Collections ({filteredTabs.length})
            </h2>
            <div className="relative w-64 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search collections..."
                value={tabSearchQuery}
                onChange={(e) => setTabSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {tabSearchQuery && (
                <button
                  onClick={() => setTabSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Tabs Container */}
          <div className="relative">
            {/* Left Scroll Indicator */}
            {showLeftScroll && (
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none flex items-center">
                <button
                  onClick={() => scrollTabs("left")}
                  className="pointer-events-auto p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors ml-2"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}

            {/* Right Scroll Indicator */}
            {showRightScroll && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none flex items-center justify-end">
                <button
                  onClick={() => scrollTabs("right")}
                  className="pointer-events-auto p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors mr-2"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}

            {/* Scrollable Tabs */}
            <div
              ref={tabsScrollRef}
              className="overflow-x-auto scrollbar-thin scroll-smooth"
              style={{
                msOverflowStyle: "-ms-autohiding-scrollbar",
              }}
            >
              <div className="flex gap-2 min-w-max pb-2 px-1">
                {filteredTabs.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No collections found matching "{tabSearchQuery}"
                  </div>
                ) : (
                  filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        data-tab-id={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg text-xs cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${
                          activeTab === tab.id
                            ? "bg-primary/10 text-primary border-2 border-primary/30 shadow-sm"
                            : "hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "classrooms" && <ClassroomsTab />}
          {activeTab === "assignments" && <AssignmentsTab />}
          {activeTab === "skills" && <SkillsTab />}
          {activeTab === "companies" && <CompaniesTab />}
          {activeTab === "domains" && <DomainsTab />}
          {activeTab === "roles" && <RolesTab />}
          {activeTab === "userCustomCourses" && <UserCustomCoursesTab />}
          {activeTab === "userquizzes" && <UserQuizzesTab />}
          {activeTab === "usersurveys" && <UserSurveysTab />}
        </div>
      </div>
    </div>
  );
};

export default MongoStudioPage;
