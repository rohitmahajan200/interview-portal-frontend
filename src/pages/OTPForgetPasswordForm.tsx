import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "@/features/Candidate/auth/authSlice";
import api from "@/lib/api";
import { useAppSelector } from "@/hooks/useAuth";

type Step = "enteremail" | "verifyOtp" | "resetPassword";

const OTPForgetPasswordForm: React.FC = () => {
  const [step, setStep] = useState<Step>("enteremail");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const state = useAppSelector((state) => state.auth?.user);

  useEffect(() => {
    if (state == null) {
      return;
    }
    setStep('resetPassword');
  }, []);

  // Send OTP
  const sendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/candidates/forget-password", { email });
      setStep("verifyOtp");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/candidates/verify-otp", { email, otp });
      // If backend logs in the user and returns user info:
      if (res.data && res.data.success && res.data.user) {
        dispatch(setUser(res.data.user)); // <--- Set user in redux
        setStep("resetPassword");
      } else if (res.data && res.data.success) {
        // If backend just returns success, move to reset password
        setStep("resetPassword");
      } else {
        setError("Verification failed.");
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Set new password
  const handleNewPassword = async () => {
    setLoading(true);
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      // You may need to send { email, password: newPassword } or just password, depending on backend
      const res = await api.put("/candidates/new-password", { newPassword: newPassword, confirmPassword: confirmPassword });
      if (res.data.success == true) {
        alert("Password reset successfully! Logged in.");
        navigate("/");
      } else {
        setError("Password reset failed.");
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center text-gray-900 dark:text-gray-100">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400 text-sm">
              {step === "enteremail" && "Enter your email to receive an OTP."}
              {step === "verifyOtp" && `Enter the OTP sent to ${email}.`}
              {step === "resetPassword" && "Set your new password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "enteremail" && (
              <form
                className="space-y-6"
                onSubmit={e => {
                  e.preventDefault();
                  sendOtp();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium text-gray-900 dark:text-gray-100">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary dark:focus:border-primary"
                  />
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                {loading && <Spinner />}
                <Button type="submit" className="w-full text-sm py-2 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <span
                    onClick={() => navigate("/login")}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Back to login
                  </span>
                </div>
              </form>
            )}

            {step === "verifyOtp" && (
              <form
                className="space-y-6"
                onSubmit={e => {
                  e.preventDefault();
                  verifyOtp();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="otp" className="font-medium text-gray-900 dark:text-gray-100">
                    Enter OTP sent to <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span>
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    inputMode="numeric"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary dark:focus:border-primary text-center font-mono text-lg tracking-widest"
                  />
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                {loading && <Spinner />}
                <Button type="submit" className="w-full text-sm py-2 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={loading}
                  onClick={() => {
                    setStep("enteremail");
                    setOtp("");
                  }}
                >
                  Change email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={loading}
                  onClick={sendOtp}
                >
                  Resend OTP
                </Button>
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <span
                    onClick={() => navigate("/login")}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Back to login
                  </span>
                </div>
              </form>
            )}

            {step === "resetPassword" && (
              <form
                className="space-y-6"
                onSubmit={e => {
                  e.preventDefault();
                  handleNewPassword();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="font-medium text-gray-900 dark:text-gray-100">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary dark:focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="font-medium text-gray-900 dark:text-gray-100">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary dark:focus:border-primary"
                  />
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                {loading && <Spinner />}
                <Button type="submit" className="w-full text-sm py-2 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                  {loading ? "Setting password..." : "Set New Password"}
                </Button>
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <span
                    onClick={() => navigate("/login")}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Back to login
                  </span>
                </div>
                {state !== null ? (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <span
                      onClick={() => navigate("/")}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    >
                      Back to Settings
                    </span>
                  </div>
                ) : null}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OTPForgetPasswordForm;
