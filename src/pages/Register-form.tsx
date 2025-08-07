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
import { Check, ChevronsUpDown, EyeIcon, EyeOffIcon } from "lucide-react";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Controller } from "react-hook-form";
import { PhoneInput } from "@/components/ui/phone-input";
import Spinner from "../components/ui/spinner";
import { uploadToCloudinary } from "@/lib/clodinary";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { registerCandidateSchema } from '@/lib/zod';
import { zodResolver } from './../../node_modules/@hookform/resolvers/zod/src/zod';
type job = {
  _id: string;
  name: string;
};


type FormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  portfolio_url?:string,
  profile_photo_url: FileList;
  applied_job: string;
  resume: FileList; // set this after upload
  password: string;
};


export default function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    setValue,
    watch,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({resolver: zodResolver(registerCandidateSchema)});
  const [open, setOpen] = useState(false);
  const [jobs, setjobs] = useState<job[]>([]);
  const [loadingjobs, setLoadingjobs] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setLoadingjobs(true);
    api.get("/candidates/jobs")
      .then(res => setjobs(res.data.jobs))
      .catch(() => setjobs([]))
      .finally(() => setLoadingjobs(false));
  }, []);
  const selectedjobId = watch("applied_job");


const onSubmit = async (data: FormValues) => {
    setLoading(true);
    console.log(data)
    try {
      const profilePhotoFile = data.profile_photo_url[0];
      const resumeFile = data.resume[0];

      // 1. Upload both files
      const profilePhotoUrl = await uploadToCloudinary(profilePhotoFile, "profiles");
      const resumeUrl = await uploadToCloudinary(resumeFile, "resume");

      // 2. Make backend-compatible payload
      const payload = {
        ...data,
        profile_photo_url: profilePhotoUrl,
        documents: [
          { document_type: "resume", document_url: resumeUrl.url, publicid: resumeUrl.publicId }
        ],
      };

      // Remove the `resume` property so backend doesn't complain
      delete (payload as any).resume;

      // 3. POST to backend
      await api.post("/candidates/register", payload);

      toast.success("Account created successfully. Please verify your email.");
      setTimeout(() => {
        navigate("/email-verification");
      }, 1000);
    } catch (err: any) {
    // Zod / backend validation error format
    if (err?.response?.data?.errors) {
      Object.entries(err.response.data.errors).forEach(([field, msg]) => {
        setError(field as keyof FormValues, {
          type: "manual",
          message: Array.isArray(msg) ? msg[0] : msg,
        });
        toast.error(`${Array.isArray(msg) ? msg[0] : msg}`);
      });
    } else if (err?.response?.data?.message) {
      toast.error(err.response.data.message);
    } else if (err?.message) {
      toast.error(err.message);
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }
 finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 px-4 py-12">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-5xl">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="shadow-xl rounded-2xl border border-gray-200">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-semibold text-center">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-center text-gray-500 text-base">
                Please fill in the details below to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      {...register("first_name", { required: true })}
                      id="first_name"
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.first_name.message}
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
                      <p className="text-red-500 text-sm mt-1">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      {...register("email", { required: true })}
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                 <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{ required: "Phone number is required" }}
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        id="phone"
                        international
                        defaultCountry="IN" // or any default
                        className="w-full"
                      />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                  <div>
                    <Label htmlFor="date_of_birth">Date Of Birth</Label>
                    <Input
                      {...register("date_of_birth")}
                      id="date_of_birth"
                      type="date"
                    />
                    {errors.date_of_birth && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.date_of_birth.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      {...register("gender", { required: true })}
                      id="gender"
                      className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">
                        Selection is required
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      {...register("address", { required: true })}
                      id="address"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="portfolio_url">PortFolio URL</Label>
                    <Input
                      {...register("portfolio_url")}
                      id="portfolio_url"
                    />
                    {errors.portfolio_url && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.portfolio_url.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="profile_photo_url">Profile Photo</Label>
                    <Input
                      {...register("profile_photo_url", { required: true })}
                      id="profile_photo_url"
                      type="file"
                      accept="image/*"
                    />
                    {errors.profile_photo_url && (
                      <p className="text-red-500 text-sm mt-1">
                        Profile Photo is required
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="resume">Resume (PDF)</Label>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf"
                      {...register("resume", { required: true })}
                      multiple={false}
                    />
                    {errors.resume && (
                      <p className="text-red-500 text-sm mt-1">
                        Resume is required
                      </p>
                    )}
                 </div>
                  <div>
                    <Label htmlFor="applied_job">Applied job</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-[300px] justify-between"
                          type="button"
                        >
                          {selectedjobId
                            ? jobs.find((r) => r._id === selectedjobId)?.name
                            : loadingjobs
                              ? "Loading..."
                              : "Select job..."}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search job..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No jobs found.</CommandEmpty>
                            <CommandGroup>
                              {jobs.map((job) => (
                                <CommandItem
                                  key={job._id}
                                  value={job._id}
                                  onSelect={(currentValue) => {
                                    setValue("applied_job", currentValue, { shouldValidate: true });
                                    setOpen(false);
                                  }}
                                >
                                  {job.name}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      selectedjobId === job._id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.applied_job && (
                      <p className="text-red-500 text-sm mt-1">{errors.applied_job.message}</p>
                    )}
                  </div>


                  <div className="md:col-span-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
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
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <Button type="submit" className="w-full text-base py-2.5">
                    Register
                  </Button>

                  
                  <div>{loading ? <Spinner /> : null}</div>

                  <div className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <span
                      onClick={() => navigate("/login")}
                      className="text-blue-600 hover:underline font-medium cursor-pointer"
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

