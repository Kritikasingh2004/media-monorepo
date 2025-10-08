"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
      toast.success("Logged in", { description: values.email });
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setSubmitError(msg);
      toast.error("Login failed", { description: msg });
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Access your media library.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {submitError && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to sign you in</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-xs opacity-70">
          Need an account?{" "}
          <a className="underline ml-1" href="/register">
            Register
          </a>
        </CardFooter>
      </Card>
    </main>
  );
}
