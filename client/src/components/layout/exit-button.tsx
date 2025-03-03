
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface ExitButtonProps {
  // 変更があるかどうかを示すフラグ
  hasChanges?: boolean;
  // 保存関数（提供される場合）
  onSave?: () => Promise<boolean>;
  // 終了後のリダイレクト先
  redirectTo?: string;
}

export function ExitButton({ hasChanges = false, onSave, redirectTo = "/" }: ExitButtonProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleExit = async () => {
    if (hasChanges) {
      if (window.confirm('保存されていない変更があります。保存しますか？')) {
        if (onSave) {
          setIsSaving(true);
          try {
            const success = await onSave();
            if (success) {
              toast({
                title: "保存完了",
                description: "変更が正常に保存されました。",
              });
              setLocation(redirectTo);
            } else {
              toast({
                variant: "destructive",
                title: "保存エラー",
                description: "変更の保存中にエラーが発生しました。",
              });
            }
          } catch (error) {
            toast({
              variant: "destructive",
              title: "保存エラー",
              description: "変更の保存中にエラーが発生しました。",
            });
            console.error("保存エラー:", error);
          } finally {
            setIsSaving(false);
          }
        } else {
          toast({
            variant: "destructive",
            title: "注意",
            description: "変更が保存されていません。",
          });
        }
      } else {
        // 保存せずに終了
        if (window.confirm('保存せずに終了しますか？変更は失われます。')) {
          setLocation(redirectTo);
        }
      }
    } else {
      // 変更がない場合は確認なしで終了
      setLocation(redirectTo);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleExit}
      className="gap-2"
      disabled={isSaving}
    >
      <XCircle className="h-4 w-4" />
      {isSaving ? "保存中..." : "終了"}
    </Button>
  );
}
