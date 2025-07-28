import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner"; // Use your spinner
import { useNavigate } from "react-router-dom";

type Step = "enteremail" | "verifyOtp";

const OTPForgetPasswordForm: React.FC = () => {
  const [step, setStep] = useState<Step>("enteremail");
  const [email, setemail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Simulate API call for sending OTP
  const sendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      // TODO: Replace with your backend call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep("verifyOtp");
    } catch (e: unknown) {
      setError("Failed to send OTP. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Simulate API call for verifying OTP
  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      // TODO: Replace with your backend call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("OTP verified! Logged in successfully.");
      // You might want to navigate("/dashboard") here
    } catch (e: unknown) {
      setError("Invalid OTP. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg rounded-2xl border border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Verify You Email To Rest-Password
            </CardTitle>
            <CardDescription className="text-center text-gray-500 text-sm">
              {step === "enteremail"
                ? "Enter your email to receive an OTP."
                : `Enter the OTP sent to ${email}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "enteremail" && (
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendOtp();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">
                    email
                  </Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setemail(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {loading && <Spinner />}
                <Button type="submit" className="w-full text-sm py-2" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
                <div className="text-center text-sm text-gray-600">
                  <span
                    onClick={() => navigate("/")}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Back to login
                  </span>
                </div>
              </form>
            )}

            {step === "verifyOtp" && (
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyOtp();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="otp" className="font-medium">
                    Enter OTP sent to <span className="font-semibold">{email}</span>
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
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
                    setStep("enteremail");
                    setOtp("");
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
                <div className="text-center text-sm text-gray-600">
                  <span
                    onClick={() => navigate("/")}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Back to login
                  </span>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OTPForgetPasswordForm;
