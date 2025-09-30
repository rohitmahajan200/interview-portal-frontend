// src/components/OrgProfileUpdate.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Save, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { setUser } from '@/features/Org/Auth/orgAuthSlice';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const orgProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type OrgProfileUpdateData = z.infer<typeof orgProfileUpdateSchema>;

interface OrgProfileUpdateProps {
  className?: string;
}

// 🆕 ADDED: Type definition for profile photo URL
type ProfilePhotoUrl = string | {
  url: string;
  filepath?: string;
  filename?: string;
} | null | undefined;

// File validation function
const validateFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file (JPG, PNG, GIF, WEBP)';
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return 'Image size should be less than 5MB';
  }

  return null;
};

// 🆕 ADDED: Helper function to extract URL from profile photo
const getProfilePhotoUrl = (profilePhoto: ProfilePhotoUrl): string | undefined => {
  if (!profilePhoto) return undefined;
  
  if (typeof profilePhoto === 'string') {
    return profilePhoto;
  }
  
  if (typeof profilePhoto === 'object' && profilePhoto.url) {
    return profilePhoto.url;
  }
  
  return undefined;
};

export const OrgProfileUpdate = ({ className }: OrgProfileUpdateProps) => {
  const dispatch = useDispatch();
  const currentUser = useAppSelector((state) => state.orgAuth.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<OrgProfileUpdateData>({
    resolver: zodResolver(orgProfileUpdateSchema),
    defaultValues: {
      name: currentUser?.name || '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      reset({
        name: currentUser.name || '', // 🆕 FIXED: Handle undefined name
      });
    }
  }, [currentUser, reset]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    toast.success('Photo selected. Click "Save Changes" to update.');
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = async (data: OrgProfileUpdateData) => {
    if (!currentUser) return;

    try {
      setIsSubmitting(true);
      
            
      const formData = new FormData();
      formData.append('name', data.name);
      
      if (selectedFile) {
        formData.append('profilephoto', selectedFile);
              }

      // Debug FormData contents
            for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      const response = await api.patch('/org/profile', formData);

      if (response.data?.success) {
        try {
          const userResponse = await api.get('/org/me');
          
          if (userResponse.data?.success && userResponse.data?.user) {
            dispatch(setUser(userResponse.data.user));
            toast.success('Profile updated successfully');
            reset(data);
            setSelectedFile(null);
            setPreviewUrl(null);
          } else {
            // Fallback to response data
            if (response.data?.data?.user) {
              dispatch(setUser(response.data.data.user));
            }
            toast.success('Profile updated successfully');
            reset(data);
            setSelectedFile(null);
            setPreviewUrl(null);
          }
        } catch (fetchError) {
                    if (response.data?.data?.user) {
            dispatch(setUser(response.data.data.user));
          }
          toast.success('Profile updated successfully');
          reset(data);
          setSelectedFile(null);
          setPreviewUrl(null);
        }
      }
    } catch (error: unknown) {
            
      // 🆕 FIXED: Proper error type handling
      let errorMessage = 'Failed to update profile';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Debug error details
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        if (axiosError.response?.data) {
                  }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return 'U'; // Default fallback
    
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2); // Limit to 2 characters
  };

  const hasChanges = isDirty || selectedFile !== null;

  // 🆕 FIXED: Handle different possible field names for profile photo with proper typing
  const displayPhotoUrl = previewUrl || 
    getProfilePhotoUrl(currentUser?.profile_photo_url?.url as ProfilePhotoUrl);

  if (!currentUser) {
    return (
      <Card className={`w-full ${className || ''}`}>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center text-muted-foreground text-sm sm:text-base">
            No user data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className || ''}`}>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="truncate">Profile Settings</span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Update your profile information and photo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
        {/* Profile Photo Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative flex-shrink-0">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
              <AvatarImage 
                src={displayPhotoUrl} 
                alt={currentUser.name || 'User avatar'}
              />
              <AvatarFallback className="text-base sm:text-lg font-semibold">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            
            <label 
              htmlFor="profile-photo-upload"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 cursor-pointer transition-opacity"
            >
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </label>
            
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="text-center sm:text-left min-w-0 flex-1">
            <h3 className="font-medium text-base sm:text-lg truncate">
              {currentUser.name || 'No name set'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {currentUser.role || 'No role assigned'}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Click on avatar to change photo (Max 5MB, JPG/PNG/GIF/WEBP)
            </p>
            {selectedFile && (
              <div className="mt-1">
                <p className="text-xs sm:text-sm text-amber-600 font-medium">
                  New photo selected - click Save Changes to update
                </p>
                <p className="text-xs text-gray-500">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...register('name')}
              disabled={isSubmitting}
              className="text-sm sm:text-base"
            />
            {errors.name && (
              <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              disabled={!hasChanges || isSubmitting}
              className="w-full sm:w-auto sm:min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin flex-shrink-0" />
                  <span className="truncate">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrgProfileUpdate;
