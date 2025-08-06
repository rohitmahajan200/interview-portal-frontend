// src/pages/Candidate/HRQuestionnaireResponse.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Loader2, Mic, MicOff, Upload, Calendar, Type, Volume2, Play, Pause, Square } from 'lucide-react';

import api from '@/lib/api';
import { uploadToCloudinary } from '@/lib/clodinary';

// Types
interface Question {
  question: string;
  input_type: 'text' | 'audio' | 'date';
  id:string
}

interface QuestionnaireData {
  questions: Question[];
}

// Form schema
const hrQuestionnaireResponseSchema = z.object({
  responses: z.array(
    z.object({
      question: z.string().min(1, "Question ID is required"),
      answer: z.string().min(1, "Answer is required"),
      attachment: z.string().url().optional()
    })
  ).min(1, "At least one answer is required")
});

type FormData = z.infer<typeof hrQuestionnaireResponseSchema>;

const HRQuestionnaireResponse: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  // New audio playback states
  const [audioUrls, setAudioUrls] = useState<{ [key: number]: string | null }>({});
  const [playingStates, setPlayingStates] = useState<{ [key: number]: boolean }>({});
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recordingStates, setRecordingStates] = useState<{ [key: number]: boolean }>({});
  const [mediaRecorders, setMediaRecorders] = useState<{ [key: number]: MediaRecorder | null }>({});
  const [audioBlobs, setAudioBlobs] = useState<{ [key: number]: Blob | null }>({});
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({});

  // Form
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(hrQuestionnaireResponseSchema),
    defaultValues: {
      responses: []
    }
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "responses"
  });

  const watchedResponses = watch("responses");

  // Fetch questionnaire
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await api.get('/candidates/hr-questions');
        const data = response.data.questionnaire;
        
        setQuestionnaire(data);
        
        // Initialize form with questions
        const initialResponses = data.questions.map((q: Question, index: number) => ({
          question:q.id, // We'll need to map this to actual IDs
          answer: "",
          attachment: undefined
        }));
        
        replace(initialResponses);
      } catch (error) {
        console.error('Failed to fetch questionnaire:', error);
        toast.error('Failed to load questionnaire. Please try again.');

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
        Object.values(audioUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
        });
        
        // Cleanup audio elements
        Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
            audio.pause();
            audio.src = '';
        }
        });
    };
    }, []);


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
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlobs(prev => ({ ...prev, [questionIndex]: audioBlob }));
        
        // Create audio URL for playback
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrls(prev => ({ ...prev, [questionIndex]: audioUrl }));
        
        stream.getTracks().forEach(track => track.stop());
    };


      mediaRecorder.start();
      setMediaRecorders(prev => ({ ...prev, [questionIndex]: mediaRecorder }));
      setRecordingStates(prev => ({ ...prev, [questionIndex]: true }));

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');

    }
  };

  const stopRecording = (questionIndex: number) => {
    const mediaRecorder = mediaRecorders[questionIndex];
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        setRecordingStates(prev => ({ ...prev, [questionIndex]: false }));
    }
    };


  const uploadAudio = async (questionIndex: number) => {
    const audioBlob = audioBlobs[questionIndex];
    if (!audioBlob) return;

    setUploading(prev => ({ ...prev, [questionIndex]: true }));

    try {
      const audioFile = new File([audioBlob], `audio_${questionIndex}.wav`, { type: 'audio/wav' });
      const result = await uploadToCloudinary(audioFile, 'audio');
      
      setValue(`responses.${questionIndex}.answer`, result.url);
      
      toast.success('Audio uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload audio. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [questionIndex]: false }));
    }
  };
  // New audio playback functions
    const playAudio = (questionIndex: number) => {
    const audioUrl = audioUrls[questionIndex];
    if (!audioUrl) return;

    // Stop any currently playing audio
    Object.keys(audioRefs.current).forEach(key => {
        const audio = audioRefs.current[parseInt(key)];
        if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        setPlayingStates(prev => ({ ...prev, [parseInt(key)]: false }));
        }
    });

    // Create new audio element if it doesn't exist
    if (!audioRefs.current[questionIndex]) {
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
        setPlayingStates(prev => ({ ...prev, [questionIndex]: false }));
        };
        
        audio.onerror = () => {
        toast.error('Error playing audio');
        setPlayingStates(prev => ({ ...prev, [questionIndex]: false }));
        };
        
        audioRefs.current[questionIndex] = audio;
    }

    const audio = audioRefs.current[questionIndex];
    if (audio) {
        audio.play()
        .then(() => {
            setPlayingStates(prev => ({ ...prev, [questionIndex]: true }));
        })
        .catch(error => {
            console.error('Error playing audio:', error);
            toast.error('Error playing audio');
        });
    }
    };

    const pauseAudio = (questionIndex: number) => {
    const audio = audioRefs.current[questionIndex];
    if (audio && !audio.paused) {
        audio.pause();
        setPlayingStates(prev => ({ ...prev, [questionIndex]: false }));
    }
    };

    const stopAudio = (questionIndex: number) => {
    const audio = audioRefs.current[questionIndex];
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        setPlayingStates(prev => ({ ...prev, [questionIndex]: false }));
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
    setAudioBlobs(prev => ({ ...prev, [questionIndex]: null }));
    setAudioUrls(prev => ({ ...prev, [questionIndex]: null }));
    setPlayingStates(prev => ({ ...prev, [questionIndex]: false }));
    
    toast.success('Recording deleted');
    };



  // Form submission
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);

    try {
      // Map responses to include actual question IDs (you'll need to store these from the API)
      const submissionData = {
        responses: data.responses.map((response) => ({
          question: response.question, // Replace with actual question IDs
          answer: response.answer,
          attachment: response.attachment
        }))
      };

      console.log("Answers data==>",submissionData);

      await api.post('/candidates/hr-questionnaire-response', submissionData);
      
      // Success toast:
      toast.success('Questionnaire submitted successfully!');

      // Error toast:
      
      
      navigate('/candidate/dashboard');
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('Failed to submit questionnaire. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render question input based on type
  const renderQuestionInput = (question: Question, index: number) => {
    const currentAnswer = watchedResponses[index]?.answer || "";
    
    switch (question.input_type) {
      case 'text':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4" />
              <span className="text-sm font-medium">Text Response</span>
            </div>
            <Textarea
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => setValue(`responses.${index}.answer`, e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        );

      case 'audio':
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="w-4 h-4" />
        <span className="text-sm font-medium">Audio Response</span>
      </div>
      
      {/* Recording Controls */}
      <div className="flex items-center gap-2">
        {!recordingStates[index] ? (
          <Button
            type="button"
            onClick={() => startRecording(index)}
            variant="outline"
            size="sm"
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
      {audioBlobs[index] && (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Recorded Audio:</div>
              
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
              {/* Delete Recording */}
              <Button
                type="button"
                onClick={() => deleteRecording(index)}
                variant="outline"
                size="sm"
              >
                Delete
              </Button>
              
              {/* Upload Audio */}
              <Button
                type="button"
                onClick={() => uploadAudio(index)}
                disabled={uploading[index]}
                size="sm"
              >
                {uploading[index] ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload
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

      {currentAnswer && (
        <div className="text-sm text-green-600">
          ✓ Audio uploaded successfully
        </div>
      )}
    </div>
  );


      case 'date':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Date Selection</span>
            </div>
            <Input
              type="date"
              value={currentAnswer}
              onChange={(e) => setValue(`responses.${index}.answer`, e.target.value)}
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
              <h2 className="text-xl font-semibold mb-2">No Questionnaire Available</h2>
              <p className="text-gray-600">You don't have any pending HR questionnaire.</p>
              <Button 
                onClick={() => navigate('/candidate/dashboard')} 
                className="mt-4"
              >
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
            Please answer all questions. You can provide text responses, upload audio recordings, or select dates as required.
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
                onClick={() => navigate('/candidate/dashboard')}
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
                  'Submit Questionnaire'
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
