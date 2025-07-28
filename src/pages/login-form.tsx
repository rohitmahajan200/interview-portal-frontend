import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { loginThunk } from "@/features/auth/authThunks";
import { useAppDispatch, useAppSelector } from "@/hooks/useAuth";
import Spinner from "../components/ui/spinner";
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

// Define login form input types
type LoginFormInputs = {
  email: string;
  password: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // Setup form with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  // Handle login form submission
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      await dispatch(loginThunk(data)).unwrap();
      navigate('/dashboard');
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-10 py-12">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="shadow-lg rounded-2xl border border-gray-200">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-center">
                Login to your account
              </CardTitle>
              <CardDescription className="text-center text-gray-500 text-sm">
                Enter your email below to log in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="abc123@example.com"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Show loading spinner during API call */}
                <div>{state.isLoading ? <Spinner /> : null}</div>

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <span
                      onClick={()=>navigate("/forget-password")}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </span>
                  </div>

                  {/* Toggle show/hide password */}
                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      {...register("password", {
                        required: "Password is required",
                      })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
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

                  {/* Display password error or backend message */}
                  {errors.password && (
                    <p className="text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                  {state.message && (
                    <p className="text-xs text-red-500">{state.message}</p>
                  )}
                </div>

                {/* Submit and Google login buttons */}
                <div className="space-y-3 pt-2">
                  <Button type="submit" className="w-full text-sm py-2">
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-sm py-2 hover:bg-gray-100"
                    type="button"
                  >
                    Login with Google
                  </Button>
                </div>

                {/* Login with OTP link */}
                <div className="text-center text-sm mt-4 text-gray-600">
                  <span
                    onClick={() => navigate("/login/otp")}
                    className="text-blue-600 hover:underline font-medium hover:cursor-pointer"
                  >
                    Login with OTP
                  </span>
                </div>

                {/* Signup link */}
                <div className="text-center text-sm mt-4 text-gray-600">
                  Don&apos;t have an account?{" "}
                  <span
                    onClick={() => navigate("/register/candidate")}
                    className="text-blue-600 hover:underline font-medium hover:cursor-pointer"
                  >
                    Sign up
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
