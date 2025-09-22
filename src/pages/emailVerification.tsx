import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

// Email verification page UI
export const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email");
  const [loading, setLoading] = useState(false);

  // Function to resend verification email
  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/candidates/resend-verification", { email });

      if (res.data.success === false) {
        toast.error(res.data.message || "Cannot resend verification");
        return;
      }

      toast.success("Verification email sent again");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-10 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
          
          {/* Header section */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Email Verification Required</h2>
            <p className="text-sm text-gray-500">
              Please verify your email address to continue
            </p>
          </div>

          {/* Instructional text */}
          <div className="text-sm text-gray-700 space-y-4 text-center">
            <p>We have sent a verification link to your registered email address.</p>
            <p>Please check your inbox and click the verification link to activate your account.</p>
            <p>After verification, return here and log in again.</p>
          </div>

          {/* Resend verification button */}
          {email && (
            <Button
              type="button"
              className="w-full text-sm py-2"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend Verification Email"}
            </Button>
          )}

          {/* Back to login button */}
          <Button
            type="button"
            className="w-full text-sm py-2"
            variant="outline"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
};
