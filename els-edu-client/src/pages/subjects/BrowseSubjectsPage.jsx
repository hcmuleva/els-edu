import React, { useState, useEffect } from "react";
import { Title, useDataProvider } from "react-admin";
import { BookOpen, Search, RotateCcw } from "lucide-react";
import SubjectCard from "../../components/subjects/SubjectCard";
import { CustomSelect } from "../../components/common/CustomSelect";

const GRADE_OPTIONS = [
  { id: null, name: "All Grades" },
  { id: "PLAYSCHOOL", name: "Playschool" },
  { id: "LKG", name: "LKG" },
  { id: "UKG", name: "UKG" },
  { id: "FIRST", name: "First" },
  { id: "SECOND", name: "Second" },
  { id: "THIRD", name: "Third" },
  { id: "FOURTH", name: "Fourth" },
  { id: "FIFTH", name: "Fifth" },
  { id: "SIXTH", name: "Sixth" },
  { id: "SEVENTH", name: "Seventh" },
  { id: "EIGHTH", name: "Eighth" },
  { id: "NINTH", name: "Ninth" },
  { id: "TENTH", name: "Tenth" },
  { id: "ELEVENTH", name: "Eleventh" },
  { id: "TWELFTH", name: "Twelfth" },
];

const LEVEL_OPTIONS = [
  { id: null, name: "All Levels" },
  { id: 1, name: "Level 1" },
  { id: 2, name: "Level 2" },
  { id: 3, name: "Level 3" },
  { id: 4, name: "Level 4" },
  { id: 5, name: "Level 5" },
];

const BrowseSubjectsPage = () => {
  const dataProvider = useDataProvider();
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const { data } = await dataProvider.getList("subjects", {
          pagination: { page: 1, perPage: 100 },
          sort: { field: "name", order: "ASC" },
          filter: {},
          meta: {
            populate: ["topics", "quizzes", "coverpage"],
          },
        });
        setSubjects(data);
        setFilteredSubjects(data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [dataProvider]);

  // Apply filters
  useEffect(() => {
    let filtered = subjects;

    if (searchQuery) {
      filtered = filtered.filter((subject) =>
        subject.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGrade) {
      filtered = filtered.filter((subject) => subject.grade === selectedGrade);
    }

    if (selectedLevel !== null) {
      filtered = filtered.filter((subject) => subject.level === selectedLevel);
    }

    setFilteredSubjects(filtered);
  }, [searchQuery, selectedGrade, selectedLevel, subjects]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedGrade(null);
    setSelectedLevel(null);
  };

  const hasActiveFilters =
    searchQuery || selectedGrade || selectedLevel !== null;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <Title title="Browse Subjects" />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-800 font-heading">
          Browse Subjects
        </h1>
        <p className="text-gray-500 font-medium">
          Explore subjects, topics, and learning materials
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl border border-border/50 shadow-sm">
        {/* Filters Section */}
        <div className="p-6 pt-4 border-b border-border/30 bg-gray-50 rounded-t-3xl">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            {/* Grade Filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedGrade}
                onChange={setSelectedGrade}
                options={GRADE_OPTIONS}
                placeholder="All Grades"
              />
            </div>

            {/* Level Filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedLevel}
                onChange={setSelectedLevel}
                options={LEVEL_OPTIONS}
                placeholder="All Levels"
              />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!loading && filteredSubjects.length > 0 && (
          <div className="px-6 pt-6 pb-2">
            <p className="text-sm font-semibold text-gray-500">
              Showing {filteredSubjects.length} subject
              {filteredSubjects.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-3xl h-80 animate-pulse"
                />
              ))}
            </div>
          ) : filteredSubjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <BookOpen className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">
                No subjects found
              </h3>
              <p className="text-gray-500 font-medium">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseSubjectsPage;
