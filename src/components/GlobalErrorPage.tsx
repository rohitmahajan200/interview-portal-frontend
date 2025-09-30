import { useRouteError } from "react-router-dom";

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export default function GlobalErrorPage() {
  const error = useRouteError();

  const message = isError(error) ? error.message : "An unexpected error occurred.";

  
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Oops! Something went wrong.
        </h1>
        <p className="text-gray-700 mb-4">
          {message}
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