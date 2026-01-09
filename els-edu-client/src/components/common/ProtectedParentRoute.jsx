import React, { useState, useEffect } from "react";
import { useGetIdentity } from "react-admin";
import LockModal from "../../components/auth/ParentalLockModal";

export const ProtectedParentRoute = ({ children }) => {
    const { data: identity, isLoading } = useGetIdentity();
    const [isVerified, setIsVerified] = useState(false);
    const [showLock, setShowLock] = useState(false);

    // Check current role from session
    const currentRole = localStorage.getItem("current_role");

    useEffect(() => {
        if (!isLoading && identity) {
            if (identity.control_type === "PARENT") {
                if (currentRole === "PARENT") {
                    setIsVerified(true);
                } else {
                    // If not in parent mode, show lock
                    setShowLock(true);
                }
            } else {
                // STUDENT account or undefined, unrestricted
                setIsVerified(true);
            }
        }
    }, [isLoading, identity, currentRole]);

    const handleSuccess = () => {
        // Temporarily verify for this route or switch mode?
        // "if parent ... to access settings/profile ... enter code"
        // Ideally this switches them to parent mode or just grants one-time access?
        // Let's switch to PARENT mode for simplicity as per "switch role" button usually implies.
        // Or just render the children if we want granular access.
        // The requirement says "access settings/profile ... enter aprent code".
        // Let's just set Verified to true for this component instance.
        setIsVerified(true);
        setShowLock(false);
    };

    const handleClose = () => {
        // Go back or stay locked?
        // Ideally redirect to home if cancelled
        window.history.back();
    };

    if (isLoading) return null;

    if (isVerified) {
        return children;
    }

    return (
        <>
            {/* Show children but maybe blurred or hidden? Or just the modal? */
                /* If we show nothing, the page is blank behind the modal. */
            }
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-400">Restricted Access</p>
            </div>

            <LockModal
                isOpen={showLock}
                onClose={handleClose}
                onSuccess={handleSuccess}
                correctPin={identity?.parental_lock_code}
            />
        </>
    );
};
