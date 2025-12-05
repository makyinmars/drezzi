import { useCanGoBack, useRouter } from "@tanstack/react-router";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type CustomErrorProps = {
  title: string;
  description: string;
};

const CustomError = ({ title, description }: CustomErrorProps) => {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-red-400">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-row items-center justify-center gap-4">
        <Button onClick={() => router.navigate({ to: "/" })}>Home</Button>
        {canGoBack && (
          <Button onClick={() => router.history.back()}>Back</Button>
        )}
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </CardContent>
    </Card>
  );
};

export default CustomError;
