import React, { useState, useEffect } from "react";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import { GraduationCap, Search, RotateCcw } from "lucide-react";
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
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <Title title="My Subscriptions" />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-800 font-heading">
          My Subscriptions
        </h1>
        <p className="text-gray-500 font-medium">
          Your enrolled courses and learning paths
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
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            {/* Subscription Type Filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedType}
                onChange={setSelectedType}
                options={SUBSCRIPTION_TYPE_OPTIONS}
                placeholder="All Types"
              />
            </div>

            {/* Status Filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={STATUS_OPTIONS}
                placeholder="All Status"
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
        {!loading && filteredSubscriptions.length > 0 && (
          <div className="px-6 pt-6 pb-2">
            <p className="text-sm font-semibold text-gray-500">
              Showing {filteredSubscriptions.length} course
              {filteredSubscriptions.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Courses Grid */}
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
          ) : filteredSubscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubscriptions.map((subscription) => (
                <CourseCard
                  key={subscription.documentId || subscription.id}
                  subscription={subscription}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <GraduationCap className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">
                No subscriptions found
              </h3>
              <p className="text-gray-500 font-medium">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "You haven't enrolled in any courses yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySubscriptionsPage;
