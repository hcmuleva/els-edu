import React, { useEffect, useState } from "react";
import { Title } from "react-admin";
import { useNavigate } from "react-router-dom";
import { Building2, Users, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import api from "../../services/api";
import { cn } from "../../lib/utils";

const OrgCard = ({ org, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl border border-border/50 p-6 cursor-pointer",
        "hover:shadow-xl hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 group"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Building2 className="w-6 h-6" />
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>

      <h3 className="text-lg font-heading font-bold text-foreground mb-1 truncate">
        {org.org_name || org.name || "Unnamed Org"}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        ID: {org.documentId?.slice(0, 8)}...
      </p>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{org.usersCount || 0} users</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span>{org.coursesCount || 0} courses</span>
        </div>
      </div>
    </div>
  );
};

const SuperAdminOrgsPage = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is SUPERADMIN
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserRole = storedUser?.user_role || "STUDENT";

  useEffect(() => {
    if (currentUserRole !== "SUPERADMIN") {
      navigate("/");
      return;
    }

    const fetchOrgs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all orgs
        const orgsRes = await api.get("orgs", {
          params: {
            "pagination[limit]": 100,
            "fields[0]": "id",
            "fields[1]": "org_name",
            "fields[2]": "documentId",
            "fields[3]": "createdAt",
          },
        });

        const orgsData = orgsRes.data?.data || orgsRes.data || [];

        // Fetch counts for each org (simplified - can be optimized with aggregation)
        const orgsWithCounts = await Promise.all(
          orgsData.map(async (org) => {
            try {
              const [usersRes, coursesRes] = await Promise.all([
                api.get("users", {
                  params: {
                    "pagination[limit]": 1,
                    "filters[org][id][$eq]": org.id,
                  },
                }),
                api.get("courses", {
                  params: {
                    "pagination[limit]": 1,
                  },
                }),
              ]);

              return {
                ...org,
                usersCount:
                  usersRes.data?.meta?.pagination?.total ||
                  usersRes.headers?.["x-total-count"] ||
                  usersRes.data?.length ||
                  0,
                coursesCount:
                  coursesRes.data?.meta?.pagination?.total ||
                  coursesRes.data?.length ||
                  0,
              };
            } catch {
              return { ...org, usersCount: 0, coursesCount: 0 };
            }
          })
        );

        setOrgs(orgsWithCounts);
      } catch (e) {
        console.error(e);
        setError(
          e.response?.data?.error?.message ||
            e.message ||
            "Failed to load organizations"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, [currentUserRole, navigate]);

  const handleOrgClick = (org) => {
    navigate(`/admin/org/${org.documentId}`);
  };

  if (currentUserRole !== "SUPERADMIN") {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Title title="All Organizations | ELS Kids" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            All Organizations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and view all organizations in the system. Click on an
            organization to view its details.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Building2 className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-amber-700">
            {orgs.length} Organizations
          </span>
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading organizations...
          </p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <div className="p-4 rounded-full bg-muted">
            <Building2 className="w-8 h-8" />
          </div>
          <p className="font-medium">No organizations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map((org) => (
            <OrgCard
              key={org.documentId || org.id}
              org={org}
              onClick={() => handleOrgClick(org)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperAdminOrgsPage;
