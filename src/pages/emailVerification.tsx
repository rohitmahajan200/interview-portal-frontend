import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const EmailVerification=()=> {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-10 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Email Verification Required</h2>
            <p className="text-sm text-gray-500">
              Please verify your email address to continue
            </p>
          </div>

          <div className="text-sm text-gray-700 space-y-4 text-center">
            <p>
              We have sent a verification link to your registered email address.
            </p>
            <p>
              Please check your inbox and click the verification link to activate your account.
            </p>
            <p>
              After verification, return here and log in again.
            </p>
          </div>

          <Button
            type="button"
            className="w-full text-sm py-2"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
