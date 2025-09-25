import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "@/features/Org/Auth/orgAuthSlice";
import api from "@/lib/api";
import { useAppSelector } from "@/hooks/useAuth";
import { Building, EyeIcon, EyeOffIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type Step = "otpLogin" | "setupPassword";

const OrgSetupPasswordForm: React.FC = () => {
  const [step, setStep] = useState<Step>("otpLogin");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpStep, setOtpStep] = useState<"enteremail" | "verifyOtp">("enteremail");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const state = useAppSelector((state) => state.orgAuth?.user);

  useEffect(() => {
    // If user is already logged in, skip to password setup
    if (state !== null) {
      setStep('setupPassword');
    }
  }, [state]);

  // Send OTP for login
  const sendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/org/otp-login", { email });
      setOtpStep("verifyOtp");
      toast.success("OTP sent successfully!");
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

  // Verify OTP and login user
  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/org/verify-otp", { email, otp });
      if (res.data && res.data.success && res.data.user) {
        dispatch(setUser(res.data.user)); // Set org user in redux
        toast.success("Login successful!");
        setStep("setupPassword"); // Move to password setup step
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

  // Setup password (authenticated route)
  const handleSetupPassword = async () => {
    setLoading(true);
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      const res = await api.post("/org/setup-password", { 
        password: password, 
        confirmPassword: confirmPassword 
      });
      if (res.data.success === true) {
        toast.success("Password set successfully!");
        setTimeout(() => navigate("/org"), 1000);
      } else {
        setError("Password setup failed.");
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to setup password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-sm">
        <Card className="shadow-lg rounded-2xl border">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              {step === "otpLogin" ? "Organization Login" : "Setup Password"}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground text-sm">
              {step === "otpLogin" && otpStep === "enteremail" && "Enter your organization email to receive an OTP."}
              {step === "otpLogin" && otpStep === "verifyOtp" && `Enter the OTP sent to ${email}.`}
              {step === "setupPassword" && "Set your organization password to complete setup."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: OTP Login */}
            {step === "otpLogin" && otpStep === "enteremail" && (
              <form
                className="space-y-6"
                onSubmit={e => {
                  e.preventDefault();
                  sendOtp();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">
                    Organization Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                {loading && <Spinner />}
                <Button type="submit" className="w-full text-sm py-2" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <span
                    onClick={() => navigate("/org/login")}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Back to login
                  </span>
                </div>
              </form>
            )}

            {step === "otpLogin" && otpStep === "verifyOtp" && (
              <form
                className="space-y-6"
                onSubmit={e => {
                  e.preventDefault();
                  verifyOtp();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="otp" className="font-medium">
                    Enter OTP sent to <span className="font-semibold text-foreground">{email}</span>
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    inputMode="numeric"
                    className="text-center tracking-wider text-lg"
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                {loading && <Spinner />}
                <Button type="submit" className="w-full text-sm py-2" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm py-2"
                  disabled={loading}
                  onClick={() => {
                    setOtpStep("enteremail");
                    setOtp("");
                    setError("");
                  }}
                >
                  Change email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm py-2"
                  disabled={loading}
                  onClick={sendOtp}
                >
                  Resend OTP
                </Button>
              </form>
            )}

            {/* Step 2: Setup Password (Authenticated) */}
            {step === "setupPassword" && (
              <form
                className="space-y-6"
                onSubmit={e => {
                  e.preventDefault();
                  handleSetupPassword();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                {loading && <Spinner />}
                <Button type="submit" className="w-full text-sm py-2" disabled={loading}>
                  {loading ? "Setting password..." : "Complete Setup"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <span
                    onClick={() => navigate("/org")}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Skip for now - Go to Dashboard
                  </span>
                </div>
              </form>
            )}

            {/* Candidate portal link */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t mt-6">
              Are you a candidate?{" "}
              <span
                onClick={() => navigate("/forget-password")}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Go to Candidate Portal
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrgSetupPasswordForm;
