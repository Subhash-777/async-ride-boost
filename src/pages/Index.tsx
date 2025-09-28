import { useEffect } from "react";
import { authService } from "@/lib/auth";

const Index = () => {
  useEffect(() => {
    // Redirect if authenticated
    if (authService.isAuthenticated()) {
      window.location.href = '/home';
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ride-primary mx-auto mb-4"></div>
        <p className="text-xl text-muted-foreground">Loading RideShare...</p>
      </div>
    </div>
  );
};

export default Index;
