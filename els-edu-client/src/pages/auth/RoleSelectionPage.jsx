import React, { useState, useEffect } from "react";
import { useGetIdentity, useRedirect, useNotify, useDataProvider } from "react-admin";
import { Users, Baby, ShieldCheck, ChevronRight } from "lucide-react";
import ParentalLockModal from "../../components/auth/ParentalLockModal";
import { refreshUser } from "../../api/authProvider";

const RoleSelectionPage = () => {
    const { data: identity, isLoading, refetch } = useGetIdentity();
    const [showLockModal, setShowLockModal] = useState(false);
    // Pin setup state
    const [setupMode, setSetupMode] = useState(false); // True if we are setting up a PIN

    const redirect = useRedirect();
    const notify = useNotify();
    const dataProvider = useDataProvider();

    // Force refresh user data on mount to ensure we have the latest control_type and PIN
    useEffect(() => {
        const syncUser = async () => {
            try {
                await refreshUser();
                refetch(); // Update identity hook
            } catch (error) {
                console.error("Failed to refresh user:", error);
            }
        };
        syncUser();
    }, [refetch]);

    // If user is STUDENT type, auto-redirect to home
    useEffect(() => {
        if (identity && identity.control_type === "STUDENT") {
            localStorage.setItem("current_role", "STUDENT"); // No restrictions for student accounts
            redirect("/");
        }
    }, [identity, redirect]);

    const handleSelectRole = async (role) => {
        // CASE 1: Initial Setup (Legacy User with no control_type)
        if (!identity.control_type) {
            if (role === "PARENT") {
                // Open modal in SETUP mode to create PIN
                setSetupMode(true);
                setShowLockModal(true);
            } else {
                // Set as STUDENT type and proceed
                try {
                    await dataProvider.update("users", {
                        id: identity.id,
                        data: { control_type: "STUDENT" }
                    });
                    await refreshUser();
                    localStorage.setItem("current_role", "STUDENT");
                    notify("Account set to Student mode", { type: "success" });
                    redirect("/");
                } catch (error) {
                    console.error(error);
                    notify("Failed to update account type", { type: "error" });
                }
            }
            return;
        }

        // CASE 2: Normal Flow
        if (role === "PARENT") {
            setSetupMode(false);
            setShowLockModal(true);
        } else {
            // Set session role to STUDENT (Kid)
            localStorage.setItem("current_role", "STUDENT");
            redirect("/");
        }
    };

    const handleParentVerifySuccess = () => {
        localStorage.setItem("current_role", "PARENT");
        redirect("/");
    };

    const handlePinSetupComplete = async (newPin) => {
        try {
            // Update user with PARENT type and new PIN
            await dataProvider.update("users", {
                id: identity.id,
                data: {
                    control_type: "PARENT",
                    parental_lock_code: newPin
                }
            });
            await refreshUser();
            localStorage.setItem("current_role", "PARENT");
            notify("Parent PIN created successfully", { type: "success" });
            setShowLockModal(false);
            redirect("/");
        } catch (error) {
            console.error(error);
            notify("Failed to set up PIN", { type: "error" });
        }
    };

    if (isLoading || !identity) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If accidentally reached here but user is student type
    if (identity.control_type === "STUDENT") return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">
                        {!identity?.control_type ? "Welcome! Let's get set up" : "Who is watching?"}
                    </h1>
                    <p className="text-gray-500">
                        {!identity?.control_type
                            ? "Select how this account will be used"
                            : "Choose a profile to continue"}
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Student / Kid Profile */}
                    <button
                        onClick={() => handleSelectRole("STUDENT")}
                        className="group relative bg-white rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-primary hover:shadow-xl transition-all duration-300 text-left"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Baby className="w-10 h-10 text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">Student</h3>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600 font-medium">For Learners & Kids</p>
                                    <p className="text-xs text-gray-400">
                                        • Access to all courses and quizzes<br />
                                        • Earn points and track progress<br />
                                        {!identity?.control_type
                                            ? "• Full access to learning & profile"
                                            : "• Only access subscribed courses & progress"
                                        }
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>

                    {/* Parent Profile */}
                    <button
                        onClick={() => handleSelectRole("PARENT")}
                        className="group relative bg-white rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-violet-500 hover:shadow-xl transition-all duration-300 text-left"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <ShieldCheck className="w-10 h-10 text-violet-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-600 transition-colors">Parent / Admin</h3>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600 font-medium">For Account Management</p>
                                    <p className="text-xs text-gray-400">
                                        • Manage subscriptions & billing<br />
                                        • Edit profile and account settings<br />
                                        • Requires 4-digit PIN access
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>
                </div>
            </div>

            <ParentalLockModal
                isOpen={showLockModal}
                onClose={() => setShowLockModal(false)}
                correctPin={identity?.parental_lock_code}
                onSuccess={handleParentVerifySuccess}
                mode={setupMode ? "SETUP" : "VERIFY"}
                onSetupComplete={handlePinSetupComplete}
            />
        </div>
    );
};

export default RoleSelectionPage;
