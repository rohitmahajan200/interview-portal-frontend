// ErrorPage.tsx
import React from "react";
import { Link, useRouteError } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex items-center justify-center h-screen bg-background px-4">
      <Card className="max-w-md w-full p-6 text-center">
        <h1 className="text-6xl font-extrabold text-destructive">404</h1>
        <h2 className="mt-2 text-xl font-semibold">Page not found</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Sorry, the page you were looking for doesn’t exist.
        </p>
        <Link to="/">
          <Button variant="outline" className="mt-6">
            Go Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
