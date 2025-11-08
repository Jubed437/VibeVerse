import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center gradient-calm">
      <div className="text-center glass-card p-12 rounded-2xl">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-xl">Oops! Page not found</p>
        <p className="text-sm text-muted-foreground mb-6">The page {location.pathname} doesn't exist</p>
        <a href="/" className="inline-block px-6 py-3 gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
