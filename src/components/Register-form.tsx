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

type FormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  profile_photo_url: string;
  resume_url: string;
  password: string;
};

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted:", data);
    // TODO: Send data to API
  };

  const navigate = useNavigate();
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-10 py-12">
      <div className="w-full max-w-md">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="shadow-lg rounded-2xl border border-gray-200">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-center">
                Create your account
              </CardTitle>
              <CardDescription className="text-center text-gray-500 text-sm">
                Fill in the details to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* First & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      {...register("first_name", { required: true })}
                      id="first_name"
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs">
                        First name is required
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      {...register("last_name", { required: true })}
                      id="last_name"
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-xs">
                        Last name is required
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    {...register("email", { required: true })}
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">Email is required</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    {...register("phone", { required: true })}
                    id="phone"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">
                      Phone Number is required
                    </p>
                  )}
                </div>

                {/* DOB and Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      {...register("date_of_birth")}
                      id="date_of_birth"
                      type="date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      {...register("gender")}
                      id="gender"
                      className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    {...register("address", { required: true })}
                    id="address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">Address is required</p>
                  )}
                </div>

                {/* Profile Photo & Resume */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile_photo_url">Profile Photo</Label>
                    <Input
                      {...register("profile_photo_url", { required: true })}
                      id="profile_photo_url"
                      type="file"
                      accept="image/*"
                    />
                    {errors.email && (
                    <p className="text-red-500 text-xs">Profile Photo is required</p>
                  )}
                  </div>
                  <div>
                    <Label htmlFor="resume_url">Resume (PDF)</Label>
                    <Input
                      {...register("resume_url", { required: true })}
                      id="resume_url"
                      type="file"
                      accept=".pdf"
                    />
                    {errors.email && (
                    <p className="text-red-500 text-xs">Resume is required</p>
                  )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    {...register("password", { required: true })}
                    id="password"
                    type="password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs">Password is required</p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full text-sm py-2">
                    Register
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <span
                      onClick={() => navigate("/")}
                      className="text-blue-600 hover:underline font-medium hover:cursor-pointer"
                    >
                      Login
                    </span>

                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
