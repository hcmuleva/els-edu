import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Lock, Delete, X } from "lucide-react";

/**
 * ParentalLockModal
 *
 * A modal that requests a 4-digit PIN code.
 * Used for verifying parental access.
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to close the modal (cancelled)
 * @param {function} onSuccess - Function called when correct PIN is entered
 * @param {string} correctPin - The correct PIN to validate against (optional if verify is handled externally)
 * @param {string} mode - "VERIFY" | "SETUP"
 * @param {function} onSetupComplete - Called when setup sends a code back
 */
const ParentalLockModal = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
  mode = "VERIFY",
  onSetupComplete,
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [confirmPin, setConfirmPin] = useState(""); // For setup mode
  const [step, setStep] = useState("ENTER"); // "ENTER", "CONFIRM" (for setup)

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setConfirmPin("");
      setError(false);
      setStep("ENTER");
    }
  }, [isOpen]);

  const handleNumberClick = (num) => {
    if (error) setError(false);

    // Determine which pin string we are editing based on mode/step
    const currentPin =
      mode === "SETUP" && step === "CONFIRM" ? confirmPin : pin;

    if (currentPin.length < 4) {
      const newPin = currentPin + num;
      if (mode === "SETUP" && step === "CONFIRM") {
        setConfirmPin(newPin);
        if (newPin.length === 4) handleSubmit(pin, newPin);
      } else {
        setPin(newPin);
        if (newPin.length === 4) handleSubmit(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (error) setError(false);
    if (mode === "SETUP" && step === "CONFIRM") {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = (enteredPin, confirmationPin) => {
    if (mode === "VERIFY") {
      if (enteredPin === correctPin) {
        onSuccess?.();
        setPin(""); // Clear for security
      } else {
        setError(true);
        setTimeout(() => setPin(""), 500);
      }
    } else if (mode === "SETUP") {
      if (step === "ENTER") {
        // First entry done, move to confirm
        setTimeout(() => {
          setStep("CONFIRM");
        }, 200);
      } else if (step === "CONFIRM") {
        // Confirmation done
        if (enteredPin === confirmationPin) {
          onSetupComplete?.(enteredPin);
        } else {
          setError(true);
          // Reset confirmation
          setTimeout(() => {
            setConfirmPin("");
            setError(false);
          }, 1000);
        }
      }
    }
  };

  if (!isOpen) return null;

  const title =
    mode === "SETUP"
      ? step === "ENTER"
        ? "Create a Parent PIN"
        : "Confirm Admin PIN"
      : "Parental Lock";

  const subtitle =
    mode === "SETUP"
      ? step === "ENTER"
        ? "Enter a 4-digit code"
        : "Re-enter to confirm"
      : "Enter PIN to access";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-primary text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-primary-100 text-sm mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* PIN Display */}
          <div className="flex justify-center gap-4 mb-8">
            {[...Array(4)].map((_, i) => {
              const activePin =
                mode === "SETUP" && step === "CONFIRM" ? confirmPin : pin;
              const filled = i < activePin.length;
              return (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    error
                      ? "bg-red-500 animate-shake"
                      : filled
                      ? "bg-primary scale-110"
                      : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="aspect-square rounded-full bg-gray-50 hover:bg-gray-100 active:bg-primary-50 text-xl font-bold text-gray-700 transition-all flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <div /> {/* Spacer */}
            <button
              onClick={() => handleNumberClick("0")}
              className="aspect-square rounded-full bg-gray-50 hover:bg-gray-100 active:bg-primary-50 text-xl font-bold text-gray-700 transition-all flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="aspect-square rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <p className="text-center text-red-500 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
              {mode === "SETUP" && step === "CONFIRM"
                ? "PINs do not match"
                : "Incorrect PIN"}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ParentalLockModal;
