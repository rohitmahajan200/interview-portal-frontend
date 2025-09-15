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
import { uploadToCloudinary } from '@/lib/clodinary';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const orgProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type OrgProfileUpdateData = z.infer<typeof orgProfileUpdateSchema>;

interface OrgProfileUpdateProps {
  className?: string;
}

export const OrgProfileUpdate = ({ className }: OrgProfileUpdateProps) => {
  const dispatch = useDispatch();
  const currentUser = useAppSelector((state) => state.orgAuth.user);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState<string | null>(null);

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
        name: currentUser.name,
      });
    }
  }, [currentUser, reset]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const result = await uploadToCloudinary(file, 'profiles');
      
      if (result?.url) {
        setPendingProfilePhoto(result.url);
        toast.success('Image uploaded. Click "Save Changes" to update your profile.');
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error(error?.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

    const onSubmit = async (data: OrgProfileUpdateData) => {
      if (!currentUser) return;

      try {
        setIsSubmitting(true);
        
        // Prepare the update payload
        const updatePayload: { name: string; profilephotourl?: string } = {
          name: data.name,
        };

        // Include profile photo URL if there's a pending one
        if (pendingProfilePhoto) {
          updatePayload.profilephotourl = pendingProfilePhoto;
        }

        const response = await api.patch('/org/profile', updatePayload);

        if (response.data.success) {
          // Fetch fresh user data from server
          try {
            const userResponse = await api.get('/org/me');
            
            if (userResponse.data.success && userResponse.data.user) {
              // Update Redux state with fresh data from server
              dispatch(setUser(userResponse.data.user));
              
              toast.success('Profile updated successfully');
              reset(data); // Reset form dirty state
              setPendingProfilePhoto(null); // Clear pending photo
            } else {
              // Fallback to manual update if /org/me fails
              dispatch(setUser({
                ...currentUser,
                name: data.name,
                ...(pendingProfilePhoto && { profilephotourl: pendingProfilePhoto }),
              }));
              
              toast.success('Profile updated successfully');
              window.location.reload();
            }
          } catch (fetchError) {
            console.error('Failed to fetch updated user data:', fetchError);
            
            // Fallback to manual update if /org/me fails
            dispatch(setUser({
              ...currentUser,
              name: data.name,
              ...(pendingProfilePhoto && { profilephotourl: pendingProfilePhoto }),
            }));
            
            toast.success('Profile updated successfully');
            reset(data);
            setPendingProfilePhoto(null);
          }
        }
      } catch (error: any) {
        console.error('Failed to update profile:', error);
        toast.error(error?.response?.data?.message || 'Failed to update profile');
      } finally {
        setIsSubmitting(false);
      }
    };


  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Check if there are any changes to save
  const hasChanges = isDirty || pendingProfilePhoto !== null;

  // Display current or pending profile photo
  const displayPhotoUrl = pendingProfilePhoto || currentUser?.profile_photo_url;

  if (!currentUser) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No user data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription>
          Update your profile information and photo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Photo Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage 
                src={displayPhotoUrl} 
                alt={currentUser.name}
              />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload Button Overlay */}
            <label 
              htmlFor="profile-photo-upload"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 cursor-pointer transition-opacity"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </label>
            
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>
          
          <div className="text-center sm:text-left">
            <h3 className="font-medium">{currentUser.name}</h3>
            <p className="text-sm text-muted-foreground">{currentUser.role}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click on avatar to change photo (Max 5MB)
            </p>
            {pendingProfilePhoto && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                New photo ready - click Save Changes to update
              </p>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!hasChanges || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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
