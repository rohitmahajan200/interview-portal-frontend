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
import { uploadProfilePhoto } from "@/lib/fileUpload"; // ✅ Updated import
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
    filename?: string;
    filepath?: string;
    publicId?: string; // Keep for backward compatibility
  };
  portfolio_url?: string;
}

const genders = ["male", "female"];

const pickSchemaFields = (data: Partial<User>): CandidateUpdateInput => {
  const schemaFields = Object.keys(candidateUpdateSchema.shape) as (keyof CandidateUpdateInput)[];
  const filtered: CandidateUpdateInput = {
    first_name: "",
    last_name: "",
  };
  for (const key of schemaFields) {
    if (key in data) {
      filtered[key] = data[key] as any;
    }
  }
  return filtered;
};

// ✅ REMOVED: All Cloudinary-related cleanup functions

export default function UpdateProfile({
  defaultValues,
  setIsEditing
}: {
  defaultValues: Partial<User>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [uploading, setUploading] = useState(false);
  const dispatch = useDispatch();
  const filteredDefaultValues = pickSchemaFields(defaultValues);
  
  const form = useForm<z.infer<typeof candidateUpdateSchema>>({
    resolver: zodResolver(candidateUpdateSchema),
    defaultValues: {
      ...filteredDefaultValues,
      date_of_birth: filteredDefaultValues.date_of_birth
        ? filteredDefaultValues.date_of_birth.slice(0, 10)
        : "",
    }
  }); 

  useEffect(() => {
    const cached = localStorage.getItem("tempProfilePhoto");
    if (cached) {
      const parsed = JSON.parse(cached);
      form.setValue("profile_photo_url", parsed);
    }
  }, [form]);

  // ✅ UPDATED: New backend file upload function
  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // File size validation
    if (file.size > 1 * 1024 * 1024) { // 1 MB
      toast.error("File size should not exceed 1 MB");
      setUploading(false);
      return;
    }

    // File type validation
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP files are allowed");
      setUploading(false);
      return;
    }

    try {
   
      
      // ✅ Use new backend upload system
      const result = await uploadProfilePhoto(file);
      
      
      if (result?.url) {
        const imageData = {
          url: result.url,
          filename: result.filename,
          filepath: result.filepath,
          publicId: result.filename, // Use filename as publicId for compatibility
        };

        // ✅ SIMPLIFIED: Just store the new temp image (no Cloudinary cleanup needed)
        localStorage.setItem("tempProfilePhoto", JSON.stringify(imageData));
        form.setValue("profile_photo_url", imageData, { shouldDirty: true });
        
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

  // ✅ SIMPLIFIED: No more Cloudinary cleanup needed
  const handleReset = async () => {
    localStorage.removeItem("tempProfilePhoto");
    form.reset({
      ...filteredDefaultValues,
      date_of_birth: filteredDefaultValues.date_of_birth
        ? filteredDefaultValues.date_of_birth.slice(0, 10)
        : "",
    });
    toast.success("Form reset to original values");
  };

  const handleCancel = async () => {
    localStorage.removeItem("tempProfilePhoto");
    setIsEditing(false);
    toast.success("Changes cancelled");
  };

  const onSubmit = async (data: z.infer<typeof candidateUpdateSchema>) => {
        
    try {
      const res = await api.put("/candidates/me", data);
            
      // Get updated user data
      const userRes = await api.get("/candidates/me");
            
      dispatch(setUser(userRes.data.user));
      
      toast.success("Profile updated successfully!", { 
        id: "profile-update", 
        duration: 3000 
      });
      
      setTimeout(() => {
        setIsEditing(false);
        localStorage.removeItem("tempProfilePhoto");
      }, 1000);
      
    } catch (err: any) {
            
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (err.response?.status === 401) {
        errorMessage = "Unauthorized: Please log in again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage, { 
        id: "profile-error", 
        duration: 4000 
      });
    }
  };

  return (
    <>
      <div className="px-4 py-0 sm:px-6 lg:px-8 max-w-4xl m-10">
        <h1 className="text-2xl font-semibold mb-6">Update Profile</h1>
        
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              
              {/* ✅ UPDATED: Profile photo upload section */}
              <label htmlFor="profile-upload" className="cursor-pointer shrink-0 relative group">
                <Avatar className="w-32 h-32 ring-2 ring-primary">
                  <AvatarImage
                    src={form.watch("profile_photo_url")?.url}
                    className="object-cover rounded-full"
                  />
                  <AvatarFallback className="text-2xl">
                    {defaultValues.first_name?.[0]}
                    {defaultValues.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
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

              {/* Form fields remain the same */}
              <div className="w-full grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. +919999999999"
                          {...field}
                          value={field.value ?? ""}
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
                        <Input type="date" {...field} value={field.value ?? ""} />
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
                        <Input {...field} value={field.value ?? ""} />
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
                      <FormLabel>Portfolio URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="https://your-portfolio.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-start items-center mt-10">
              <Button variant="default" type="button" size="lg" onClick={handleReset}>
                <span className="text-md">Reset</span> 
              </Button>  
              
              <Button 
                type="submit" 
                size="lg"
                disabled={uploading || !form.formState.isDirty}
              >
                {uploading ? "Uploading..." : "Save Changes"}
              </Button>
              
              <Button variant="outline" type="button" size="lg" onClick={handleCancel}>
                <span className="text-md">Cancel</span> 
              </Button>
            </div>
          </form>
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
