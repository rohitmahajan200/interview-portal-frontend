import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { loginSchema } from "@/lib/zod";
import toast, { Toaster } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { setUser } from "@/features/Org/Auth/orgAuthSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import Spinner from "@/components/ui/spinner";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, Building } from "lucide-react";

// Define login form input types
type OrgLoginFormInputs = {
  email: string;
  password: string;
};

const OrgLoginForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  // Setup form with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgLoginFormInputs>({ resolver: zodResolver(loginSchema) });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  // Handle login form submission
  const onSubmit = async (data: OrgLoginFormInputs) => {
    setLoading(true);
    try {
      const res = await api.post("/org/login", data);
      if (res.data && res.data.success && res.data.user) {
        dispatch(setUser(res.data.user)); // Redux state update for org user
        toast.success("Login successful!");
        setTimeout(() => navigate("/org"), 1000);
      } else {
        toast.error("Login failed, please try again.");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Login failed, please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-10 py-12">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="shadow-lg rounded-2xl border border-gray-200">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-semibold">
                Organization Portal
              </CardTitle>
              <CardDescription className="text-sm">
                Sign in to access your organization dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <span
                      onClick={() => navigate("/org/setup-password")}
                      className="text-xs text-primary hover:underline cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </span>
                  </div>

                  {/* Toggle show/hide password */}
                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      {...register("password", {
                        required: "Password is required",
                      })}
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

                  {/* Display password error */}
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Show loading spinner during API call */}
                {loading && <Spinner />}

                {/* Submit button */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full text-sm font-medium" 
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>

                {/* OTP login link */}
                <div className="text-center text-sm text-muted-foreground">
                  <span
                    onClick={() => navigate("/org/otp-login")}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Login with OTP
                  </span>
                </div>

                {/* Candidate portal link */}
                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                  Are you a candidate?{" "}
                  <span
                    onClick={() => navigate("/login")}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Go to Candidate Portal
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrgLoginForm;
