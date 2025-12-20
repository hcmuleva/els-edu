import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, PartyPopper } from "lucide-react";

/**
 * SuccessModal - Success confirmation after enrollment
 *
 * Props:
 * - isOpen: Whether modal is open
 * - onClose: Close callback
 * - course: Enrolled course
 * - subject: Optional - enrolled subject (for single subject)
 */
const SuccessModal = ({ isOpen, onClose, course, subject = null }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isSubjectEnroll = !!subject;
  const title = isSubjectEnroll ? subject.name : course?.name;

  const handleGoToSubscriptions = () => {
    onClose();
    navigate("/my-subscriptions");
  };

  const handleContinueBrowsing = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Animation */}
          <div className="p-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-center relative overflow-hidden">
            {/* Confetti-like elements */}
            <div className="absolute inset-0 opacity-20">
              <div
                className="absolute top-4 left-8 w-3 h-3 bg-yellow-300 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="absolute top-8 right-12 w-2 h-2 bg-pink-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="absolute bottom-12 left-16 w-2 h-2 bg-blue-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
              <div
                className="absolute bottom-8 right-8 w-3 h-3 bg-purple-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
            </div>

            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black">Successfully Enrolled!</h2>
              <p className="text-white/80 text-sm mt-2">
                You now have access to this content
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">
                {isSubjectEnroll
                  ? "Subject added to your account"
                  : `All subjects are now available`}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoToSubscriptions}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                Go to My Subscriptions
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleContinueBrowsing}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessModal;
