import { useForm } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"


type LoginFormInputs = {
  email: string
  password: string
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>()

  const onSubmit = (data: LoginFormInputs) => {
    console.log("Login submitted:", data)
    // TODO: Add actual login logic here (e.g., API call)
  }

  const navigate=useNavigate();

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
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <a
                      href="#"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", { required: "Password is required" })}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Buttons */}
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

                {/* Link to sign up */}
                <div className="text-center text-sm mt-4 text-gray-600">
                  Don&apos;t have an account?{" "}
                  <a
                    onClick={()=>navigate("/register/candidate")}
                    className="text-blue-600 hover:underline font-medium hover:cursor-pointer"
                  >
                    Sign up
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
