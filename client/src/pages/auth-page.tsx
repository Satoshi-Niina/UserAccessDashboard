import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="grid lg:grid-cols-2 gap-8 w-full max-w-4xl mx-4">
        <div className="flex flex-col justify-center">
          <Card>
            <CardHeader>
              <CardTitle>ログイン</CardTitle>
              <CardDescription>
                アカウント情報を入力してログインしてください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={loginForm.handleSubmit((data) =>
                  loginMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="username">ユーザー名</Label>
                  <Input
                    id="username"
                    {...loginForm.register("username")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    {...loginForm.register("password")}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "ログイン中..." : "ログイン"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:flex flex-col justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">ビジネスプラットフォーム</h1>
            <p className="text-muted-foreground">
              効率的な業務サポートと円滑なコミュニケーションを実現する総合プラットフォームへようこそ。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}