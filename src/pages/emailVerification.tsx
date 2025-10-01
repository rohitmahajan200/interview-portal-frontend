import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
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
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 sm:px-6 md:px-10 py-12">
      <div className="w-full max-w-lg">
        <Card className="shadow-lg rounded-2xl border p-8 space-y-6">
          
          {/* Header section */}
          <CardHeader className="text-center space-y-2 p-0">
            <CardTitle className="text-2xl font-semibold">Email Verification Required</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Please verify your email address to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-0">
            {/* Instructional text */}
            <div className="text-sm text-muted-foreground space-y-4 text-center">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
