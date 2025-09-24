import { useForm, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { 
  Check, 
  ChevronsUpDown, 
  EyeIcon, 
  EyeOffIcon,
  Mic,
  MicOff,
  Calendar,
  Type,
  Volume2,
  Play,
  Pause,
  Upload,
  CheckCircle2,
  FileAudio,
  X,
  Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { uploadToCloudinary } from "@/lib/clodinary";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { registerCandidateSchema } from '@/lib/zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Job = {
  _id: string;
  title: string;
};

type HRQuestion = {
  _id: string;
  question: string;
  input_type: "text" | "audio" | "date" | "mcq" | "checkbox";
  options?: string[];
};

type FormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female";
  address: string;
  portfolio_url?: string | null;
  profile_photo_url: FileList;
  applied_job: string;
  resume: FileList;
  password: string;
  hr_responses?: Array<{
    question_text: string;
    response: string | string[] | Date;
    input_type: "text" | "audio" | "date" | "mcq" | "checkbox";
  }>;
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
  } = useForm<FormValues>({ resolver: zodResolver(registerCandidateSchema) });

  // Basic states
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [jobIdFromUrl, setJobIdFromUrl] = useState<string | null>(null);
  // Basic Details states
  const [hrQuestionnaireOpen, setHrQuestionnaireOpen] = useState(false);
  const [hrQuestions, setHrQuestions] = useState<HRQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [hrResponses, setHrResponses] = useState<FormValues['hr_responses']>([]);
  // Helper function to get query parameter
  const getQueryParam = (name: string): string | null => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get(name);
  };

  // Audio states for Basic Details
  const [recordingStates, setRecordingStates] = useState<{ [key: number]: boolean }>({});
  const [mediaRecorders, setMediaRecorders] = useState<{ [key: number]: MediaRecorder | null }>({});
  const [audioBlobs, setAudioBlobs] = useState<{ [key: number]: Blob | null }>({});
  const [audioUrls, setAudioUrls] = useState<{ [key: number]: string | null }>({});
  const [playingStates, setPlayingStates] = useState<{ [key: number]: boolean }>({});
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File | null }>({});
  const [checkboxSelections, setCheckboxSelections] = useState<{ [key: number]: string[] }>({});
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});

  const selectedJobId = watch("applied_job");

  // Load jobs on component mount and handle jobId from URL
  useEffect(() => {
    const loadJobsAndHandleUrl = async () => {
      setLoadingJobs(true);
      
      try {
        const res = await api.get("/candidates/jobs");
        const fetchedJobs = res.data.jobs || [];
        setJobs(fetchedJobs);
        
        // Extract jobId from URL
        const urlJobId = getQueryParam('jobId');
        
        if (urlJobId) {
          setJobIdFromUrl(urlJobId);
          
          // Check if the jobId exists in the fetched jobs
          const matchingJob = fetchedJobs.find((job: Job) => 
            job._id === urlJobId
          );
          
          if (matchingJob) {
            // Auto-select the job using the internal _id
            setValue("applied_job", matchingJob._id, { shouldValidate: true });
            
            // Show success toast
            toast.success(`🎯 Auto-applying for: ${matchingJob.title}`, {
              duration: 4000,
              style: {
                background: '#10B981',
                color: 'white',
              },
            });
          } else {
            // Show error toast for invalid jobId
            toast.error(`❌ Invalid job ID. Please select a job manually.`, {
              duration: 4000,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
        setJobs([]);
        toast.error('Failed to load available jobs');
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobsAndHandleUrl();
  }, [location.search, setValue]);

  // Load HR questions when dialog opens
  const loadHRQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await api.get("/candidates/hr-questions/default");
      setHrQuestions(response.data.data || []);
      
      // Initialize responses array
      const initialResponses = response.data.data.map((q: HRQuestion) => ({
        question_text: q.question,
        response: "",
        input_type: q.input_type
      }));
      setHrResponses(initialResponses);

      // Initialize checkbox selections
      const initialCheckboxSelections: { [key: number]: string[] } = {};
      response.data.data.forEach((q: HRQuestion, index: number) => {
        if (q.input_type === "checkbox") {
          initialCheckboxSelections[index] = [];
        }
      });
      setCheckboxSelections(initialCheckboxSelections);
    } catch (error) {
      console.error("Failed to load HR questions:", error);
      toast.error("Failed to load HR questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Audio recording functions
  const startRecording = async (questionIndex: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlobs((prev) => ({ ...prev, [questionIndex]: audioBlob }));

        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrls((prev) => ({ ...prev, [questionIndex]: audioUrl }));

        // Update hr_responses
        const updatedResponses = [...(hrResponses || [])];
        updatedResponses[questionIndex] = {
          ...updatedResponses[questionIndex],
          response: `audio_recorded_${questionIndex}`
        };
        setHrResponses(updatedResponses);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setMediaRecorders((prev) => ({ ...prev, [questionIndex]: mediaRecorder }));
      setRecordingStates((prev) => ({ ...prev, [questionIndex]: true }));
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = (questionIndex: number) => {
    const mediaRecorder = mediaRecorders[questionIndex];
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setRecordingStates((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  // Audio playback functions
  const playAudio = (questionIndex: number) => {
    const audioUrl = audioUrls[questionIndex];
    if (!audioUrl) return;

    Object.keys(audioRefs.current).forEach((key) => {
      const audio = audioRefs.current[parseInt(key)];
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        setPlayingStates((prev) => ({ ...prev, [parseInt(key)]: false }));
      }
    });

    if (!audioRefs.current[questionIndex]) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));
      audio.onerror = () => {
        toast.error("Error playing audio");
        setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));
      };
      audioRefs.current[questionIndex] = audio;
    }

    const audio = audioRefs.current[questionIndex];
    if (audio) {
      audio.play()
        .then(() => setPlayingStates((prev) => ({ ...prev, [questionIndex]: true })))
        .catch(() => toast.error("Error playing audio"));
    }
  };

  const pauseAudio = (questionIndex: number) => {
    const audio = audioRefs.current[questionIndex];
    if (audio && !audio.paused) {
      audio.pause();
      setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  const deleteRecording = (questionIndex: number) => {
    const audio = audioRefs.current[questionIndex];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    const audioUrl = audioUrls[questionIndex];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlobs((prev) => ({ ...prev, [questionIndex]: null }));
    setAudioUrls((prev) => ({ ...prev, [questionIndex]: null }));
    setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));

    const updatedResponses = [...(hrResponses || [])];
    updatedResponses[questionIndex] = {
      ...updatedResponses[questionIndex],
      response: ""
    };
    setHrResponses(updatedResponses);

    toast.success("Recording deleted");
  };

  // Handle file upload for audio questions
  const handleFileUpload = async (questionIndex: number, file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file");
      return;
    }

    setUploadedFiles((prev) => ({ ...prev, [questionIndex]: file }));
    const audioUrl = URL.createObjectURL(file);
    setAudioUrls((prev) => ({ ...prev, [questionIndex]: audioUrl }));

    const updatedResponses = [...(hrResponses || [])];
    updatedResponses[questionIndex] = {
      ...updatedResponses[questionIndex],
      response: `audio_uploaded_${questionIndex}`
    };
    setHrResponses(updatedResponses);

    toast.success("Audio file uploaded successfully");
  };

  // Update HR response for a question
  const updateHRResponse = (questionIndex: number, response: string | string[]) => {
    const updatedResponses = [...(hrResponses || [])];
    updatedResponses[questionIndex] = {
      ...updatedResponses[questionIndex],
      response
    };
    setHrResponses(updatedResponses);
  };

  // Open Basic Details dialog
  const openHRQuestionnaire = () => {
    setHrQuestionnaireOpen(true);
    loadHRQuestions();
  };

  // Close Basic Details dialog
  const closeHRQuestionnaire = () => {
    setHrQuestionnaireOpen(false);
    // Cleanup audio URLs
    Object.values(audioUrls).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setAudioUrls({});
    setAudioBlobs({});
    setPlayingStates({});
    setRecordingStates({});
    setUploadedFiles({});
  };

  // Render HR question input based on type
  const renderHRQuestionInput = (question: HRQuestion, index: number) => {
    const currentResponse = hrResponses?.[index]?.response || "";

    switch (question.input_type) {
      case "text":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4" />
              <span className="text-sm font-medium">Text Response</span>
            </div>
            <Textarea
              placeholder="Type your answer here..."
              value={typeof currentResponse === 'string' ? currentResponse : ''}
              onChange={(e) => updateHRResponse(index, e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        );

      case "mcq":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Multiple Choice</span>
            </div>
            <div className="space-y-3">
              {question.options?.map((optionText, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`hr-question-${index}`}
                    value={optionText}
                    id={`hr-question-${index}-option-${optionIndex}`}
                    checked={currentResponse === optionText}
                    onChange={(e) => updateHRResponse(index, e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <Label
                    htmlFor={`hr-question-${index}-option-${optionIndex}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {optionText}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

case "checkbox": {
  const selectedOptions = checkboxSelections[index] || [];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Multiple Selection</span>
      </div>
      <div className="space-y-3">
        {question.options?.map((optionText, optionIndex) => {
          const isSelected = selectedOptions.includes(optionText);
          return (
            <div key={optionIndex} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`hr-question-${index}-checkbox-${optionIndex}`}
                checked={isSelected}
                onChange={(e) => {
                  let newSelections;
                  if (e.target.checked) {
                    newSelections = [...selectedOptions, optionText];
                  } else {
                    newSelections = selectedOptions.filter(option => option !== optionText);
                  }

                  setCheckboxSelections((prev) => ({
                    ...prev,
                    [index]: newSelections,
                  }));

                  updateHRResponse(index, newSelections.length > 0 ? newSelections : []);
                }}
                className="w-4 h-4 text-primary"
              />
              <Label
                htmlFor={`hr-question-${index}-checkbox-${optionIndex}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {optionText}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

      case "audio":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">Audio Response</span>
            </div>

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="text-center">
                <FileAudio className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Upload an audio file or record below</p>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(index, file);
                  }}
                  className="hidden"
                  id={`hr-file-upload-${index}`}
                />
                <Label
                  htmlFor={`hr-file-upload-${index}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-md cursor-pointer hover:bg-primary/20"
                >
                  <Upload className="w-4 h-4" />
                  Choose Audio File
                </Label>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-2">
              {!recordingStates[index] ? (
                <Button
                  type="button"
                  onClick={() => startRecording(index)}
                  variant="outline"
                  size="sm"
                  disabled={!!uploadedFiles[index]}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => stopRecording(index)}
                  variant="destructive"
                  size="sm"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>

            {/* Audio Playback Controls */}
            {(audioBlobs[index] || uploadedFiles[index]) && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      {uploadedFiles[index] ? `Uploaded: ${uploadedFiles[index]?.name}` : "Recorded Audio:"}
                    </div>

                    {!playingStates[index] ? (
                      <Button type="button" onClick={() => playAudio(index)} variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                    ) : (
                      <Button type="button" onClick={() => pauseAudio(index)} variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}

                    <Button
                      type="button"
                      onClick={() => deleteRecording(index)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Date Selection</span>
            </div>
            <Input
              type="date"
              value={typeof currentResponse === 'string' ? currentResponse : ''}
              onChange={(e) => updateHRResponse(index, e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Main form submission
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      if (!hrResponses || hrResponses.length === 0) {
        toast.error("Please complete the Basic Details to continue");
        setHrQuestionnaireOpen(true);
        await loadHRQuestions();
        setLoading(false);
        return;
      }

      // Check if all questions are answered
      const unansweredQuestions = hrResponses.filter(response => 
        !response.response || 
        (Array.isArray(response.response) && response.response.length === 0) ||
        response.response === ""
      );

      if (unansweredQuestions.length > 0) {
        toast.error(`Please answer all ${hrResponses.length} HR questions`);
        setHrQuestionnaireOpen(true);
        await loadHRQuestions();
        setLoading(false);
        return;
      }
      const profilePhotoFile = data.profile_photo_url[0];
      const resumeFile = data.resume[0];

      // Upload files
      const profilePhotoUrl = await uploadToCloudinary(profilePhotoFile, "profiles");
      const resumeUrl = await uploadToCloudinary(resumeFile, "resume");

      // Process HR responses - upload audio files if any
      let processedHRResponses: FormValues['hr_responses'] = [];
      
      if (hrResponses && hrResponses.length > 0) {
        processedHRResponses = await Promise.all(
          hrResponses.map(async (response, index) => {
            if (response.input_type === "audio") {
              let fileToUpload: File | null = null;

              if (uploadedFiles[index]) {
                fileToUpload = uploadedFiles[index];
              } else if (audioBlobs[index]) {
                fileToUpload = new File([audioBlobs[index]!], `audio_${index}.wav`, { type: "audio/wav" });
              }

              if (fileToUpload) {
                try {
                  const uploadResult = await uploadToCloudinary(fileToUpload, "audio");
                  return {
                    ...response,
                    response: uploadResult.url
                  };
                } catch (uploadError) {
                  console.error(`Failed to upload audio for question ${index}:`, uploadError);
                  throw new Error(`Failed to upload audio for question ${index + 1}`);
                }
              }
            }

            // For checkbox, ensure it's properly formatted
            if (response.input_type === 'checkbox' && Array.isArray(response.response)) {
              return {
                ...response,
                response: response.response
              };
            }

            return response;
          })
        );
      }

      // Prepare payload
      const payload = {
        ...data,
        profile_photo_url: profilePhotoUrl,
        documents: [
          { document_type: "resume", document_url: resumeUrl.url, publicid: resumeUrl.publicId }
        ],
        hr_responses: processedHRResponses
      };

      // Remove the resume property
      delete (payload as any).resume;

      // Submit to backend
      await api.post("/candidates/register", payload);

      toast.success("Account created successfully. Please verify your email.");
      setTimeout(() => {
        navigate(`/email-verification?email=${data.email}`);
      }, 1000);
    } catch (err: any) {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="shadow-xl rounded-2xl border">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-semibold text-center">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground text-base">
                Please fill in the details below to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* All your existing form fields remain the same */}
                  <div>
                    <Label htmlFor="first_name">First Name<span className="text-destructive">*</span></Label>
                    <Input
                      {...register("first_name", { required: true })}
                      id="first_name"
                    />
                    {errors.first_name && (
                      <p className="text-destructive text-sm mt-1">
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
                      <p className="text-destructive text-sm mt-1">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email<span className="text-destructive">*</span></Label>
                    <Input
                      {...register("email", { required: true })}
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone<span className="text-destructive">*</span></Label>
                    <Controller
                      name="phone"
                      control={control}
                      rules={{ required: "Phone number is required" }}
                      render={({ field }) => (
                        <PhoneInput
                          {...field}
                          id="phone"
                          international
                          defaultCountry="IN"
                          className="w-full"
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="date_of_birth">Date Of Birth<span className="text-destructive">*</span></Label>
                    <Input
                      {...register("date_of_birth")}
                      id="date_of_birth"
                      type="date"
                    />
                    {errors.date_of_birth && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.date_of_birth.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender<span className="text-destructive">*</span></Label>
                    <select
                      {...register("gender", { required: true })}
                      id="gender"
                      className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    {errors.gender && (
                      <p className="text-destructive text-sm mt-1">
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
                      <p className="text-destructive text-sm mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="portfolio_url">Portfolio URL</Label>
                    <Input
                      {...register("portfolio_url")}
                      id="portfolio_url"
                    />
                    {errors.portfolio_url && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.portfolio_url.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="profile_photo_url">Profile Photo<span className="text-destructive">*</span></Label>
                    <Input
                      {...register("profile_photo_url", { required: true })}
                      id="profile_photo_url"
                      type="file"
                      accept="image/*"
                    />
                    {errors.profile_photo_url && (
                      <p className="text-destructive text-sm mt-1">
                        Profile Photo is required
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="resume">Resume (PDF)<span className="text-destructive">*</span></Label>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf"
                      {...register("resume", { required: true })}
                      multiple={false}
                    />
                    {errors.resume && (
                      <p className="text-destructive text-sm mt-1">
                        Resume is required
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="applied_job">Applied Job<span className="text-destructive">*</span></Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className={`w-[300px] justify-between ${
                            jobIdFromUrl && selectedJobId && 
                            jobs.find(job => job._id === selectedJobId && (job._id === jobIdFromUrl || job._id === jobIdFromUrl))
                              ? 'border-green-500 bg-green-500/10' : ''
                          }`}
                          type="button"
                        >
                          {selectedJobId
                            ? `${jobIdFromUrl && 
                                jobs.find(job => job._id === selectedJobId && (job._id === jobIdFromUrl || job._id === jobIdFromUrl))
                                  ? '🎯 ' : ''}${
                                  jobs.find((r) => r._id === selectedJobId)?.title
                                }`
                            : loadingJobs
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
                                  {job.title}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      selectedJobId === job._id ? "opacity-100" : "opacity-0"
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
                      <p className="text-destructive text-sm mt-1">{errors.applied_job.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="password">Password<span className="text-destructive">*</span></Label>
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
                    {errors.password && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Basic Details Section */}
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Basic Details <span className="text-destructive">*</span></h3>
                      <p className="text-sm text-muted-foreground">Please answer all questions to complete your registration</p>
                    </div>
                    <Button
                      type="button"
                      variant={hrResponses && hrResponses.length > 0 ? "outline" : "destructive"}
                      onClick={openHRQuestionnaire}
                    >
                      {hrResponses && hrResponses.length > 0 ? "Edit Responses" : "Complete Required Questions"}
                    </Button>
                  </div>

                  {hrResponses && hrResponses.length > 0 && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ You have answered {hrResponses.filter(r => r.response).length} out of {hrResponses.length} questions
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-6 space-y-4">
                  <Button type="submit" className="w-full text-base py-2.5" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Register"
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <span
                      onClick={() => navigate("/login")}
                      className="text-primary hover:underline font-medium cursor-pointer"
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

      {/* Basic Details Dialog */}
      <Dialog open={hrQuestionnaireOpen} onOpenChange={setHrQuestionnaireOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-11/12 flex flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Basic Details</DialogTitle>
            <DialogDescription>
              Please answer the following questions. You can provide text responses, select from multiple choices, 
              record audio, upload audio files, or select dates as required.
            </DialogDescription>
          </DialogHeader>

          {loadingQuestions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {hrQuestions.map((question, index) => (
                <Card key={question._id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        {index + 1}. {question.question}
                      </h3>
                      {renderHRQuestionInput(question, index)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeHRQuestionnaire}>
              Cancel
            </Button>
            <Button type="button" onClick={() => setHrQuestionnaireOpen(false)}>
              Save Responses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
