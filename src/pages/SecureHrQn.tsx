// src/pages/Candidate/HRQuestionnaireResponse.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import {
  Loader2,
  Mic,
  MicOff,
  Calendar,
  Type,
  Volume2,
  Play,
  Pause,
  Square,
  Upload,
  CheckCircle2,
  FileAudio,
  X,
} from "lucide-react";
import api from "@/lib/api";

interface Question {
  question: string;
  input_type: "text" | "audio" | "date" | "mcq" | "checkbox";
  id: string;
  options?: string[]; // For MCQ questions
}

interface QuestionnaireData {
  questions: Question[];
}

// Form schema
const hrQuestionnaireResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        question: z.string().min(1, "Question ID is required"),
        answer: z.string().min(1, "Answer is required"),
        attachment: z.string().url().optional(),
      })
    )
    .min(1, "At least one answer is required"),
});

type FormData = z.infer<typeof hrQuestionnaireResponseSchema>;

// 🆕 ADDED: Audio upload function using your API
const uploadAudioToBackend = async (file: File, questionId: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', file); // Field name for audio files
    formData.append('questionId', questionId);
    formData.append('type', 'questionnaire_audio');
    formData.append('timestamp', Date.now().toString());

        
    const response = await api.post('/candidates/audio-response', formData);

    if (response.data?.success && response.data?.data?.url) {
      return response.data.data.url;
    } else if (response.data?.url) {
      return response.data.url;
    } else {
      throw new Error(response.data?.message || 'Upload failed - no URL returned');
    }
  } catch (error: any) {
        
    let errorMessage = 'Audio upload failed';
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

const HRQuestionnaireResponse: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [audioUrls, setAudioUrls] = useState<{ [key: number]: string | null }>({});
  const [playingStates, setPlayingStates] = useState<{ [key: number]: boolean }>({});
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recordingStates, setRecordingStates] = useState<{ [key: number]: boolean }>({});
  const [mediaRecorders, setMediaRecorders] = useState<{ [key: number]: MediaRecorder | null }>({});
  const [audioBlobs, setAudioBlobs] = useState<{ [key: number]: Blob | null }>({});
  const [checkboxSelections, setCheckboxSelections] = useState<{ [key: number]: string[] }>({});

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File | null }>({});
  const [uploadingStates, setUploadingStates] = useState<{ [key: number]: boolean }>({});

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(hrQuestionnaireResponseSchema),
    defaultValues: {
      responses: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "responses",
  });

  const watchedResponses = watch("responses");

  // Fetch questionnaire
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await api.get("/candidates/hr-questions");
        const data = response.data.questionnaire;

        setQuestionnaire(data);

        // Initialize form with questions
        const initialResponses = data.questions.map((q: Question) => ({
          question: q.id,
          answer: "",
          attachment: undefined,
        }));
        replace(initialResponses);
        
        const initialCheckboxSelections: { [key: number]: string[] } = {};
        data.questions.forEach((q: Question, index: number) => {
          if (q.input_type === "checkbox") {
            initialCheckboxSelections[index] = [];
          }
        });
        setCheckboxSelections(initialCheckboxSelections);
      } catch (error) {
                toast.error("Failed to load questionnaire. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [replace]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup audio URLs
      Object.values(audioUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });

      // Cleanup audio elements
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, []);

  // 🆕 UPDATED: File upload with backend API
  const handleFileUpload = async (questionIndex: number, file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file");
      return;
    }

    setUploadingStates((prev) => ({ ...prev, [questionIndex]: true }));

    try {
      const question = questionnaire?.questions[questionIndex];
      if (!question) {
        throw new Error("Question not found");
      }

      // Upload to backend
      const audioUrl = await uploadAudioToBackend(file, question.id);
      
      setUploadedFiles((prev) => ({ ...prev, [questionIndex]: file }));
      
      // Create local URL for playback
      const localAudioUrl = URL.createObjectURL(file);
      setAudioUrls((prev) => ({ ...prev, [questionIndex]: localAudioUrl }));

      // Set the actual uploaded URL as answer
      setValue(`responses.${questionIndex}.answer`, audioUrl);
      setValue(`responses.${questionIndex}.attachment`, audioUrl);

      toast.success("Audio file uploaded successfully");
    } catch (error: any) {
            toast.error(error.message || "Failed to upload audio file");
    } finally {
      setUploadingStates((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  const removeUploadedFile = (questionIndex: number) => {
    // Stop and cleanup audio
    stopAudio(questionIndex);

    // Cleanup audio references
    if (audioRefs.current[questionIndex]) {
      audioRefs.current[questionIndex] = null;
    }

    // Cleanup URLs to prevent memory leaks
    const audioUrl = audioUrls[questionIndex];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset states
    setUploadedFiles((prev) => ({ ...prev, [questionIndex]: null }));
    setAudioUrls((prev) => ({ ...prev, [questionIndex]: null }));
    setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));

    // Clear the form answer
    setValue(`responses.${questionIndex}.answer`, "");
    setValue(`responses.${questionIndex}.attachment`, undefined);

    toast.success("Audio file removed");
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

        // Create audio URL for playback
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrls((prev) => ({ ...prev, [questionIndex]: audioUrl }));

        // Set a temporary answer to indicate audio is recorded (will be uploaded on submit)
        setValue(`responses.${questionIndex}.answer`, `audio_recorded_${questionIndex}`);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setMediaRecorders((prev) => ({
        ...prev,
        [questionIndex]: mediaRecorder,
      }));
      setRecordingStates((prev) => ({ ...prev, [questionIndex]: true }));
    } catch (error) {
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

  // Audio playback functions (unchanged)
  const playAudio = (questionIndex: number) => {
    const audioUrl = audioUrls[questionIndex];
    if (!audioUrl) return;

    // Stop any currently playing audio
    Object.keys(audioRefs.current).forEach((key) => {
      const audio = audioRefs.current[parseInt(key)];
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        setPlayingStates((prev) => ({ ...prev, [parseInt(key)]: false }));
      }
    });

    // Create new audio element if it doesn't exist
    if (!audioRefs.current[questionIndex]) {
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));
      };

      audio.onerror = () => {
        toast.error("Error playing audio");
        setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));
      };

      audioRefs.current[questionIndex] = audio;
    }

    const audio = audioRefs.current[questionIndex];
    if (audio) {
      audio
        .play()
        .then(() => {
          setPlayingStates((prev) => ({ ...prev, [questionIndex]: true }));
        })
    }
  };

  const pauseAudio = (questionIndex: number) => {
    const audio = audioRefs.current[questionIndex];
    if (audio && !audio.paused) {
      audio.pause();
      setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  const stopAudio = (questionIndex: number) => {
    const audio = audioRefs.current[questionIndex];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  const deleteRecording = (questionIndex: number) => {
    // Stop and cleanup audio
    stopAudio(questionIndex);

    // Cleanup audio references
    if (audioRefs.current[questionIndex]) {
      audioRefs.current[questionIndex] = null;
    }

    // Cleanup URLs to prevent memory leaks
    const audioUrl = audioUrls[questionIndex];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset states
    setAudioBlobs((prev) => ({ ...prev, [questionIndex]: null }));
    setAudioUrls((prev) => ({ ...prev, [questionIndex]: null }));
    setPlayingStates((prev) => ({ ...prev, [questionIndex]: false }));

    // Clear the form answer
    setValue(`responses.${questionIndex}.answer`, "");

    toast.success("Recording deleted");
  };

  // 🆕 UPDATED: Form submission with backend audio upload
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);

    try {
      // Process responses and upload audio files
      const processedResponses = await Promise.all(
        data.responses.map(async (response, index) => {
          const question = questionnaire?.questions[index];

          // If it's an audio question and we have a recorded blob, upload it
          if (question?.input_type === "audio" && response.answer.startsWith("audio_recorded_")) {
            const audioBlob = audioBlobs[index];
            
            if (audioBlob) {
              try {
                // Convert blob to file for upload
                const audioFile = new File(
                  [audioBlob],
                  `recording_${question.id}_${Date.now()}.wav`,
                  { type: "audio/wav" }
                );

                // Upload to backend
                const audioUrl = await uploadAudioToBackend(audioFile, question.id);

                return {
                  question: response.question,
                  answer: audioUrl,
                  attachment: audioUrl,
                };
              } catch (uploadError) {
                    throw new Error(`audio recording is ${uploadError.message}`);
              }
            }
          }

          // Handle checkbox responses
          if (question?.input_type === 'checkbox') {
            let answer = response.answer;
            if (answer) {
              try {
                const parsed = JSON.parse(answer);
                if (Array.isArray(parsed)) {
                  answer = JSON.stringify(parsed);
                }
              } catch (e) {
                answer = JSON.stringify([answer]);
              }
            }
            
            return {
              question: response.question,
              answer: answer,
              attachment: response.attachment
            };
          }

          // For other question types (including uploaded audio files), return as is
          return {
            question: response.question,
            answer: response.answer,
            attachment: response.attachment,
          };
        })
      );

      const submissionData = {
        responses: processedResponses,
      };

      
      await api.post("/candidates/hr-questionnaire-response", submissionData);

      toast.success("Questionnaire submitted successfully!");
      navigate("/");
    } catch (error) {
        if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit questionnaire. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render question input based on type (keeping existing MCQ, checkbox, text, date cases unchanged)
  const renderQuestionInput = (question: Question, index: number) => {
    const currentAnswer = watchedResponses[index]?.answer || "";

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
              value={currentAnswer}
              onChange={(e) =>
                setValue(`responses.${index}.answer`, e.target.value)
              }
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
              {question.options?.map((optionText, optionIndex) => {
                return (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={optionText}
                      id={`question-${index}-option-${optionIndex}`}
                      checked={currentAnswer === optionText}
                      onChange={(e) =>
                        setValue(`responses.${index}.answer`, e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <Label
                      htmlFor={`question-${index}-option-${optionIndex}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {optionText}
                    </Label>
                  </div>
                );
              })}
            </div>

            {currentAnswer && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Option selected: {currentAnswer}
              </div>
            )}
          </div>
        );

      case "checkbox":
        const selectedOptions = checkboxSelections[index] || [];

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                Multiple Selection (Check all that apply)
              </span>
            </div>

            <div className="space-y-3">
              {question.options?.map((optionText, optionIndex) => {
                const isSelected = selectedOptions.includes(optionText);

                return (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`question-${index}-checkbox-${optionIndex}`}
                      checked={isSelected}
                      onChange={(e) => {
                        let newSelections;
                        if (e.target.checked) {
                          newSelections = [...selectedOptions, optionText];
                        } else {
                          newSelections = selectedOptions.filter(
                            (option) => option !== optionText
                          );
                        }

                        setCheckboxSelections((prev) => ({
                          ...prev,
                          [index]: newSelections,
                        }));

                        setValue(
                          `responses.${index}.answer`,
                          newSelections.length > 0 ? JSON.stringify(newSelections) : ""
                        );
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label
                      htmlFor={`question-${index}-checkbox-${optionIndex}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {optionText}
                    </Label>
                  </div>
                );
              })}
            </div>

            {selectedOptions.length > 0 && (
              <div className="text-sm text-green-600 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5" />
                <div>
                  <div className="font-medium">Selected options:</div>
                  <ul className="list-disc list-inside ml-2">
                    {selectedOptions.map((option, idx) => (
                      <li key={idx}>{option}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );

      case "audio":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">Audio Response</span>
            </div>

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="text-center">
                <FileAudio className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Upload an audio file or record below
                </p>
                
                {uploadingStates[index] ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(index, file);
                        }
                      }}
                      className="hidden"
                      id={`file-upload-${index}`}
                      disabled={uploadingStates[index]}
                    />
                    <Label
                      htmlFor={`file-upload-${index}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-md cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Audio File
                    </Label>
                  </>
                )}
              </div>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-2">
              {!recordingStates[index] ? (
                <Button
                  type="button"
                  onClick={() => startRecording(index)}
                  variant="outline"
                  size="sm"
                  disabled={!!uploadedFiles[index]} // Disable if file is uploaded
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
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      {uploadedFiles[index]
                        ? `Uploaded: ${uploadedFiles[index]?.name}`
                        : "Recorded Audio:"}
                    </div>

                    {/* Play/Pause Button */}
                    {!playingStates[index] ? (
                      <Button
                        type="button"
                        onClick={() => playAudio(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => pauseAudio(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}

                    {/* Stop Button */}
                    <Button
                      type="button"
                      onClick={() => stopAudio(index)}
                      variant="outline"
                      size="sm"
                      disabled={!playingStates[index]}
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delete/Remove */}
                    <Button
                      type="button"
                      onClick={() =>
                        uploadedFiles[index]
                          ? removeUploadedFile(index)
                          : deleteRecording(index)
                      }
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Playing indicator */}
                {playingStates[index] && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-sm">Playing audio...</span>
                  </div>
                )}
              </div>
            )}

            {/* Status indicators */}
            {currentAnswer && currentAnswer.startsWith("audio_recorded_") && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Audio recorded and ready for submission
              </div>
            )}

            {currentAnswer && currentAnswer.startsWith("http") && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Audio file uploaded and ready for submission
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
              value={currentAnswer}
              onChange={(e) =>
                setValue(`responses.${index}.answer`, e.target.value)
              }
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                No Questionnaire Available
              </h2>
              <p className="text-gray-600">
                You don't have any pending HR questionnaire.
              </p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">HR Questionnaire</CardTitle>
          <p className="text-gray-600">
            Please answer all questions. You can provide text responses, select
            from multiple choices, record audio, upload audio files, or select
            dates as required.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {questionnaire.questions.map((question, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      {index + 1}. {question.question}
                    </h3>

                    {renderQuestionInput(question, index)}

                    {errors.responses?.[index] && (
                      <p className="text-red-500 text-sm">
                        {errors.responses[index]?.answer?.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className="min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Questionnaire"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRQuestionnaireResponse;
