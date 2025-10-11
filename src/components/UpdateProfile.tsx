import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { candidateUpdateSchema } from "@/lib/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { setUser } from "@/features/Candidate/auth/authSlice";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { uploadProfilePhoto } from "@/lib/fileUpload";
import api from "@/lib/api";
import type { User } from "@/types/types";
import { useDispatch } from "react-redux";
import DocumentCRUD from "./DocumentCRUD";

export interface CandidateUpdateInput {
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: "male" | "female";
  address?: string;
  profile_photo_url?: {
    url: string;
    publicId: string;
    filename?: string;
    filepath?: string;
  };
  portfolio_url?: string;
}

const genders = ["male", "female"];

const pickSchemaFields = (data: Partial<User>): CandidateUpdateInput => {
  return {
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    phone: data.phone,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    address: data.address,
    profile_photo_url: data.profile_photo_url,
    portfolio_url: data.portfolio_url,
  };
};

export default function UpdateProfile({
  defaultValues,
  setIsEditing,
}: {
  defaultValues: Partial<User>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const dispatch = useDispatch();

  const filteredDefaultValues = pickSchemaFields(defaultValues);

  const form = useForm<z.infer<typeof candidateUpdateSchema>>({
    resolver: zodResolver(candidateUpdateSchema),
    defaultValues: {
      ...filteredDefaultValues,
      date_of_birth: filteredDefaultValues.date_of_birth
        ? filteredDefaultValues.date_of_birth.slice(0, 10)
        : "",
    },
  });

  useEffect(() => {
    const cached = localStorage.getItem("tempProfilePhoto");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.url && parsed.publicId) {
          form.setValue("profile_photo_url", parsed);
          setHasChanges(true);
        } else {
          localStorage.removeItem("tempProfilePhoto");
        }
      } catch {
        localStorage.removeItem("tempProfilePhoto");
      }
    }
  }, [form]);

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    if (file.size > 1 * 1024 * 1024) {
      toast.error("File size should not exceed 1 MB");
      setUploading(false);
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP files are allowed");
      setUploading(false);
      return;
    }

    try {
      const result = await uploadProfilePhoto(file);
      if (result?.url) {
        const imageData = {
          url: result.url,
          publicId: result.publicId || result.filename || `photo_${Date.now()}`,
          filename: result.filename,
          filepath: result.filepath,
        };
        localStorage.setItem("tempProfilePhoto", JSON.stringify(imageData));
        form.setValue("profile_photo_url", imageData);
        setHasChanges(true);
        toast.success("Profile photo uploaded successfully!");
      } else {
        throw new Error("Upload failed - no URL returned");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("tempProfilePhoto");
    form.reset({
      ...filteredDefaultValues,
      date_of_birth: filteredDefaultValues.date_of_birth
        ? filteredDefaultValues.date_of_birth.slice(0, 10)
        : "",
    });
    setHasChanges(false);
    toast.success("Form reset to original values");
  };

  const handleCancel = () => {
    localStorage.removeItem("tempProfilePhoto");
    setHasChanges(false);
    setIsEditing(false);
    toast.success("Changes cancelled");
  };

  const handleFormSubmit = async () => {
    const formData = form.getValues();
    
    try {
      const backendData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      if (formData.phone?.trim()) backendData.phone = formData.phone.trim();
      if (formData.date_of_birth?.trim()) backendData.date_of_birth = formData.date_of_birth.trim();
      if (formData.gender) backendData.gender = formData.gender;
      if (formData.address?.trim()) backendData.address = formData.address.trim();
      if (formData.portfolio_url?.trim()) backendData.portfolio_url = formData.portfolio_url.trim();

      if (formData.profile_photo_url?.url && formData.profile_photo_url?.publicId) {
        backendData.profile_photo_url = {
          url: formData.profile_photo_url.url,
          publicId: formData.profile_photo_url.publicId,
        };
      }

      await api.put("/candidates/me", backendData);

      const userRes = await api.get("/candidates/me");
      dispatch(setUser(userRes.data.user));

      toast.success("Profile updated successfully!");

      setTimeout(() => {
        setIsEditing(false);
        localStorage.removeItem("tempProfilePhoto");
        setHasChanges(false);
      }, 800);
    } catch (err: any) {
      // Check if it's a validation error with errors object
      if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
        const errors = err.response.data.errors;
        
        // Display each field's validation errors
        Object.entries(errors).forEach(([fieldName, fieldErrors]) => {
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((errorMessage: string) => {
              toast.error(errorMessage, {
                duration: 5000,
                id: `validation-${fieldName}-${Date.now()}`,
              });
            });
          }
        });
      } 
      // Check if there's a general validation message
      else if (err.response?.data?.message === "Validation failed" && err.response?.data?.success === false) {
        toast.error("Please check your input and try again.", {
          duration: 4000,
          id: "validation-general",
        });
      }
      // Handle other errors
      else {
        let errorMessage = "Failed to update profile. Please try again.";
        
        if (err.response?.status === 401) {
          errorMessage = "Unauthorized: Please log in again.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
        
        toast.error(errorMessage, {
          duration: 4000,
          id: "profile-error",
        });
      }
    }
  };

  return (
    <>
      <div className="px-4 py-0 sm:px-6 lg:px-8 max-w-4xl m-10">
        <h1 className="text-2xl font-semibold mb-6">Update Profile</h1>

        <FormProvider {...form}>
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <label htmlFor="profile-upload" className="cursor-pointer relative group">
                <Avatar className="w-32 h-32 ring-2 ring-primary">
                  <AvatarImage
                    src={form.watch("profile_photo_url")?.url}
                    alt="Profile photo"
                    className="object-cover rounded-full"
                  />
                  <AvatarFallback className="text-2xl">
                    {defaultValues.first_name?.[0]?.toUpperCase()}
                    {defaultValues.last_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <span className="text-white text-sm font-medium">
                    {uploading ? "Uploading..." : "Change Photo"}
                  </span>
                </div>

                <input
                  id="profile-upload"
                  type="file"
                  className="hidden"
                  onChange={onImageChange}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  disabled={uploading}
                />
              </label>

              <div className="w-full grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ""}
                          onChange={(e) => {
                            field.onChange(e);
                            setHasChanges(true);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ""}
                          onChange={(e) => {
                            field.onChange(e);
                            setHasChanges(true);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ""}
                          placeholder="+91XXXXXXXXXX"
                          onChange={(e) => {
                            field.onChange(e);
                            setHasChanges(true);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ""}
                          type="date"
                          onChange={(e) => {
                            field.onChange(e);
                            setHasChanges(true);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <select 
                          {...field} 
                          value={field.value ?? ""}
                          className="w-full border rounded px-3 py-2 dark:bg-background"
                          onChange={(e) => {
                            field.onChange(e);
                            setHasChanges(true);
                          }}
                        >
                          <option value="">Select Gender</option>
                          {genders.map((g) => (
                            <option key={g} value={g}>
                              {g.charAt(0).toUpperCase() + g.slice(1)}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ""}
                          onChange={(e) => {
                            field.onChange(e);
                            setHasChanges(true);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="portfolio_url"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Portfolio URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ""}
                          placeholder="https://your-portfolio.com"
                          onChange={(e) => {
                            field.onChange(e);
                            setHasChanges(true);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-start items-center mt-10">
              <Button variant="default" type="button" size="lg" onClick={handleReset}>
                <span className="text-md">Reset</span>
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={handleFormSubmit}
                disabled={uploading || !hasChanges}
              >
                {uploading ? "Saving..." : "Save Changes"}
              </Button>

              <Button variant="outline" type="button" size="lg" onClick={handleCancel}>
                <span className="text-md">Cancel</span>
              </Button>
            </div>
          </div>
        </FormProvider>
      </div>

      <DocumentCRUD />

      <div className="w-10 flex justify-start items-center ml-14 mb-10">
        <Button variant="outline" type="button" size="lg" onClick={() => setIsEditing(false)}>
          <span className="text-md">Back to profile</span>
        </Button>
      </div>
    </>
  );
}
