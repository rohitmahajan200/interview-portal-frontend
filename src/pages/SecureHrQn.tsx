import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { hrQuestions } from "@/test/hrQna";

export default function SecureHRInterview() {
  const { interviewId } = useParams();
  const navigate        = useNavigate();

  /* state ----------------------------------------------------- */
  const [started, setStarted] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [timer,   setTimer]   = useState(120);          // 2 min
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [current, setCurrent] = useState(0);
  const submittedRef          = useRef(false);

  const q         = hrQuestions[current];
  const total     = hrQuestions.length;
  const attempted = Object.keys(answers).length;

  /* submit (idempotent) --------------------------------------- */
  const handleSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (document.fullscreenElement) document.exitFullscreen?.();
    alert("Interview submitted successfully!");
    navigate("/");
  };

  /* guards ---------------------------------------------------- */
  useEffect(() => {
    if (!started) return;

    let isTabActive = true;
    let lastActivity = Date.now();

    const triggerViolation = (msg: string) => {
      if (submittedRef.current) return;
      alert(msg);
      handleSubmit();
    };

    const keyGuard = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const refresh    = k === "f5" || ((e.ctrlKey || e.metaKey) && k === "r");
      const clipboard  = (e.ctrlKey || e.metaKey) && ["c", "v", "x"].includes(k);
      const taskSwitch = (e.altKey && k === "tab") || (e.metaKey && k === "tab");
      if (refresh || clipboard || taskSwitch) {
        e.preventDefault();
        triggerViolation("Blocked shortcut detected. Interview auto-submitted.");
      } else {
        lastActivity = Date.now();
      }
    };

    const ctxGuard       = (e: MouseEvent)    => e.preventDefault();
    const clipGuard      = (e: ClipboardEvent)=> e.preventDefault();
    const mouseMoveGuard = () => (lastActivity = Date.now());

    const visibilityGuard = () => {
      isTabActive = document.visibilityState === "visible";
      if (!isTabActive) triggerViolation("Tab/window switch detected. Interview auto-submitted.");
      lastActivity = Date.now();
    };

    const blurGuard       = () => triggerViolation("Window focus lost. Interview auto-submitted.");
    const mouseLeaveGuard = (e: MouseEvent) => { if (e.clientY < 0) triggerViolation("Cursor left window. Interview auto-submitted."); };
    const fullscreenGuard = () => { if (!document.fullscreenElement) triggerViolation("Fullscreen exited. Interview auto-submitted."); };

    const inactivityTimer = setInterval(() => {
      if (isTabActive && Date.now() - lastActivity > 30_000)
        triggerViolation("30 s inactivity. Interview auto-submitted.");
    }, 5_000);

    window.addEventListener("keydown", keyGuard, true);
    window.addEventListener("contextmenu", ctxGuard, true);
    window.addEventListener("copy",  clipGuard, true);
    window.addEventListener("paste", clipGuard, true);
    window.addEventListener("cut",   clipGuard, true);
    window.addEventListener("mousemove", mouseMoveGuard);
    window.addEventListener("blur", blurGuard);
    window.addEventListener("mouseleave", mouseLeaveGuard);
    window.addEventListener("beforeunload", e => { e.preventDefault(); e.returnValue = ""; });
    document.addEventListener("visibilitychange", visibilityGuard);
    document.addEventListener("fullscreenchange", fullscreenGuard);

    return () => {
      clearInterval(inactivityTimer);
      window.removeEventListener("keydown", keyGuard, true);
      window.removeEventListener("contextmenu", ctxGuard, true);
      window.removeEventListener("copy",  clipGuard, true);
      window.removeEventListener("paste", clipGuard, true);
      window.removeEventListener("cut",   clipGuard, true);
      window.removeEventListener("mousemove", mouseMoveGuard);
      window.removeEventListener("blur", blurGuard);
      window.removeEventListener("mouseleave", mouseLeaveGuard);
      document.removeEventListener("visibilitychange", visibilityGuard);
      document.removeEventListener("fullscreenchange", fullscreenGuard);
    };
  }, [started]);

  /* timer ------------------------------------------------------ */
  useEffect(() => {
    if (!started) return;
    if (timer === 0) handleSubmit();
    const id = setInterval(() => setTimer(t => t - 1), 1_000);
    return () => clearInterval(id);
  }, [started, timer]);

  /* start ------------------------------------------------------ */
  const handleStart = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
      setStarted(true);
    } catch {
      setError("Fullscreen permission is required to begin.");
    }
  };

  /* helpers ---------------------------------------------------- */
  const handleAnswerChange = (id: string, v: string) =>
    setAnswers(p => ({ ...p, [id]: v }));

  /* UI --------------------------------------------------------- */
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 bg-white dark:bg-gray-900 min-h-screen transition-colors">
      {!started ? (
        <>
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Secure HR Interview
          </h1>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 space-y-4">
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Interview ID: <strong className="text-gray-900 dark:text-white">{interviewId}</strong></li>
              <li>Total questions: <strong className="text-gray-900 dark:text-white">{total}</strong></li>
              <li>Duration: <strong className="text-gray-900 dark:text-white">2 minutes</strong></li>
              <li>The interview runs in <strong>mandatory fullscreen</strong>. Pressing Esc or exiting fullscreen auto-submits.</li>
              <li>Switching tabs/windows or using Alt/⌘-Tab will auto-submit.</li>
              <li>Copy, paste, cut, refresh, F5, Ctrl/⌘-R and right-click are disabled; attempting them auto-submits.</li>
              <li>If no input is detected for <strong>30 seconds</strong>, the interview auto-submits.</li>
              <li>Leaving the browser window with your mouse or losing focus auto-submits.</li>
              <li><strong>Violations result in immediate submission</strong>; unanswered questions will be graded as blank.</li>
            </ul>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-4 py-2 rounded border border-red-300 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={handleStart}
                className="px-6 py-2 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Start Interview
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ... interview body remains unchanged ... */
        <>
          {/* header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Time left: {timer}s
            </h2>
            <button
              onClick={handleSubmit}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded transition-colors"
            >
              Submit
            </button>
          </div>

          {/* body */}
          <div className="flex gap-6">
            {/* question panel */}
            <div className="w-2/3 space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Question {current + 1}
                </h3>
                <p className="mb-4 text-gray-700 dark:text-gray-300">{q.question}</p>

                {/* TEXT INPUT */}
                {q.input_type === "text" && (
                  <textarea
                    rows={4}
                    value={answers[q._id] || ""}
                    onChange={e => handleAnswerChange(q._id, e.target.value)}
                    onCopy={e => e.preventDefault()}
                    onPaste={e => e.preventDefault()}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  />
                )}

                {/* AUDIO INPUT (SIMULATED) */}
                {q.input_type === "audio" && (
                  <input
                    type="text"
                    placeholder="Simulated audio input"
                    value={answers[q._id] || ""}
                    onChange={e => handleAnswerChange(q._id, e.target.value)}
                    onCopy={e => e.preventDefault()}
                    onPaste={e => e.preventDefault()}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  />
                )}

                {/* DATE INPUT */}
                {q.input_type === "date" && (
                  <input
                    type="date"
                    value={answers[q._id] || ""}
                    onChange={e => handleAnswerChange(q._id, e.target.value)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  />
                )}
              </div>

              {/* nav buttons */}
              <div className="flex justify-between">
                <button
                  disabled={current === 0}
                  onClick={() => setCurrent(p => p - 1)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={current === total - 1}
                  onClick={() => setCurrent(p => p + 1)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            {/* dashboard */}
            <div className="w-1/3 bg-white dark:bg-gray-800 p-4 rounded shadow-lg border border-gray-200 dark:border-gray-700 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Dashboard</h4>
              <p className="text-gray-700 dark:text-gray-300">Total: {total}</p>
              <p className="text-gray-700 dark:text-gray-300">Attempted: {attempted}</p>
              <p className="text-gray-700 dark:text-gray-300">Pending: {total - attempted}</p>

              <div className="grid grid-cols-4 gap-2">
                {hrQuestions.map((it, i) => (
                  <button
                    key={it._id}
                    onClick={() => setCurrent(i)}
                    className={`px-2 py-1 rounded text-white text-sm ${
                      answers[it._id]
                        ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                        : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
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
