import React, { useState, useEffect } from "react";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Search,
  RotateCcw,
  X,
  Sparkles,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import CourseCard from "../../components/subscriptions/CourseCard";
import { CustomSelect } from "../../components/common/CustomSelect";
import { subscriptionService } from "../../services/subscriptionService";

const SUBSCRIPTION_TYPE_OPTIONS = [
  { id: null, name: "All Types" },
  { id: "FREE", name: "Free" },
  { id: "FREEMIUM", name: "Freemium" },
  { id: "PAID", name: "Paid" },
  { id: "TRIAL", name: "Trial" },
];

const STATUS_OPTIONS = [
  { id: null, name: "All Status" },
  { id: "ACTIVE", name: "Active" },
  { id: "PENDING", name: "Pending" },
  { id: "EXPIRED", name: "Expired" },
  { id: "CANCELLED", name: "Cancelled" },
];

const MySubscriptionsPage = () => {
  const dataProvider = useDataProvider();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Fetch subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!identity?.documentId) return;

      try {
        setLoading(true);
        const data = await subscriptionService.getUserSubscriptions(
          dataProvider,
          identity.documentId
        );
        setSubscriptions(data);
        setFilteredSubscriptions(data);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!identityLoading && identity?.documentId) {
      fetchSubscriptions();
    }
  }, [dataProvider, identity?.documentId, identityLoading]);

  // Apply filters
  useEffect(() => {
    let filtered = subscriptions;

    if (searchQuery) {
      filtered = filtered.filter((sub) =>
        sub.course?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(
        (sub) => sub.subscription_type === selectedType
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((sub) => sub.paymentstatus === selectedStatus);
    }

    setFilteredSubscriptions(filtered);
  }, [searchQuery, selectedType, selectedStatus, subscriptions]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType(null);
    setSelectedStatus(null);
  };

  const hasActiveFilters = searchQuery || selectedType || selectedStatus;

  if (identityLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-xl w-1/3" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
      <Title title="My Subscriptions" />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              My Subscriptions
            </h1>
            <button
              onClick={() => navigate("/progress")}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-violet-500 text-white rounded-lg text-xs font-semibold hover:from-primary-600 hover:to-violet-600 transition-all shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Progress
            </button>
          </div>

          {/* Search Row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-gray-600" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4 pb-20">
        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                  <div className="flex gap-3 mt-3">
                    <div className="h-10 bg-gray-100 rounded-lg flex-1 animate-pulse" />
                    <div className="h-10 bg-gray-100 rounded-lg flex-1 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSubscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubscriptions.map((subscription) => (
              <CourseCard
                key={subscription.documentId || subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {hasActiveFilters ? "No courses found" : "No subscriptions yet"}
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              {hasActiveFilters
                ? "Try adjusting your search or explore different filters"
                : "Start your learning journey by browsing available courses"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-100 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubscriptionsPage;
