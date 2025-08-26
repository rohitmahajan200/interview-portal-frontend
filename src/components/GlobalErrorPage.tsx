// GlobalErrorPage.jsx
import { useRouteError } from "react-router-dom";

export default function GlobalErrorPage() {
  const error = useRouteError();
  console.error("Route Error:", error);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Oops! Something went wrong.
        </h1>
        <p className="text-gray-700 mb-4">
          {error?.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
