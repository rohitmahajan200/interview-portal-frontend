import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

const dummyQuestions = [
  {
    id: 1,
    type: "mcq",
    question: "What is the output of 2 + '2' in JavaScript?",
    options: ["4", "22", "NaN", "undefined"],
  },
  {
    id: 2,
    type: "descriptive",
    question: "Explain event loop in JavaScript.",
  },
  {
    id: 3,
    type: "case",
    question: "Watch the following video and summarize the key points.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 4,
    type: "code",
    question: "Write a function to check if a number is prime.",
    language: "javascript",
  },
  {
  id: 5,
  type: "video-response",
  question: "Please explain your solution approach by recording a short video (max 1 minute)."
}

];

export default function SecureAssessmentLanding() {
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSEB, setIsSEB] = useState(false);
  const [timer, setTimer] = useState(60);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const userAgent = navigator.userAgent || "";
    if (userAgent.includes("SEB")) setIsSEB(true);
    else setIsSEB(false);
  }, []);

  useEffect(() => {
    if (started && timer > 0) {
      const countdown = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0) {
      handleSubmit();
    }
  }, [started, timer]);

  const handleStart = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStarted(true);
    } catch (err) {
      setError("Camera and microphone access is required to start the assessment.");
    }
  };

  const handleAnswerChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = () => {
    alert("Assessment Submitted!\n" + JSON.stringify(answers, null, 2));
    // Navigate or send to backend here
  };

  const currentQuestion = dummyQuestions[currentQuestionIndex];
  const total = dummyQuestions.length;
  const attempted = Object.keys(answers).length;

  if (!isSEB) {
    return (
      <div className="h-screen flex flex-col justify-center items-center px-4">
        <h1 className="text-2xl font-semibold text-red-700 dark:text-red-400 mb-4">
          Unauthorized Browser
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md">
          Please open this assessment using the <strong>Safe Exam Browser</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {!started ? (
        <>
          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
            Secure Assessment Instructions
          </h1>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6 space-y-4">
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>The assessment Id is <strong>{assessmentId}</strong>.</li>
              <li>The assessment duration is <strong>1 minute</strong>.</li>
              <li>Once started, you <strong>cannot end or pause</strong> the assessment.</li>
              <li><strong>Camera and microphone access</strong> is mandatory for monitoring.</li>
              <li>Make sure you are in a quiet, distraction-free environment.</li>
              <li>Do not switch tabs or minimize the browser during the test.</li>
            </ul>

            {error && (
              <div className="bg-red-100 dark:bg-red-200 text-red-800 px-4 py-2 rounded-md border border-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={handleStart}
                className="px-6 py-2 rounded-md text-white text-sm font-semibold bg-green-600 hover:bg-green-700 transition"
              >
                Start Assessment
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Time left: {timer}s</h2>
            <button
              onClick={handleSubmit}
              className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Submit Now
            </button>
          </div>

          <div className="flex gap-6">
            <div className="w-2/3 space-y-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded shadow">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Question {currentQuestionIndex + 1}</h3>
                <p className="mb-4 text-gray-800 dark:text-white">{currentQuestion.question}</p>
                {currentQuestion.type === "mcq" && (
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt, idx) => (
                      <label key={idx} className="block text-gray-700 dark:text-gray-200">
                        <input
                          type="radio"
                          name={`q_${currentQuestion.id}`}
                          value={opt}
                          checked={answers[currentQuestion.id] === opt}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="mr-2"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.type === "descriptive" && (
                  <textarea
                    rows={4}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded"
                  ></textarea>
                )}

                {currentQuestion.type === "case" && (
                  <>
                    <video controls className="w-full rounded mb-2">
                      <source src={currentQuestion.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <textarea
                      rows={3}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded"
                    ></textarea>
                  </>
                )}

                {currentQuestion.type === "code" && (
                  <div className="bg-gray-900 p-2 rounded">
                    <Editor
                      height="200px"
                      defaultLanguage={currentQuestion.language}
                      defaultValue={"// write your code here"}
                      onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                      theme="vs-dark"
                      options={{ fontSize: 14, minimap: { enabled: false } }}
                    />
                    <div className="mt-2 p-2 bg-gray-800 text-green-400 rounded">
                      Output: <span>(Simulated Output...)</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Previous
                </button>
                <button
                  disabled={currentQuestionIndex === total - 1}
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="w-1/3 bg-white dark:bg-gray-900 p-4 rounded shadow space-y-4">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200">Dashboard</h4>
              <p>Total: {total}</p>
              <p>Attempted: {attempted}</p>
              <p>Pending: {total - attempted}</p>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {dummyQuestions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`px-2 py-1 rounded text-white text-sm ${
                      answers[q.id] ? "bg-green-600" : "bg-gray-400"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
