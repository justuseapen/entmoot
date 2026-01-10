import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-6xl font-bold text-gray-300">404</h1>
      <p className="mb-8 text-lg text-gray-600">Page not found</p>
      <Link
        to="/"
        className="bg-primary hover:bg-primary-dark rounded-lg px-6 py-3 text-white"
      >
        Go Home
      </Link>
    </div>
  );
}
