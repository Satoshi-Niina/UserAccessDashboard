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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
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

  const registerForm = useForm<LoginFormData & { isAdmin: boolean }>({
    resolver: zodResolver(loginSchema.extend({
      isAdmin: z.boolean().default(false),
    })),
    defaultValues: {
      username: "",
      password: "",
      isAdmin: false,
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="grid lg:grid-cols-2 gap-8 w-full max-w-4xl mx-4">
        <div className="flex flex-col justify-center">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="register">新規登録</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
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
            </TabsContent>
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>新規登録</CardTitle>
                  <CardDescription>
                    新しいアカウントを作成します。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={registerForm.handleSubmit((data) =>
                      registerMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">ユーザー名</Label>
                      <Input
                        id="reg-username"
                        {...registerForm.register("username")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">パスワード</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        {...registerForm.register("password")}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isAdmin"
                        {...registerForm.register("isAdmin")}
                      />
                      <Label htmlFor="isAdmin">管理者として登録</Label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "登録中..." : "登録"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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