import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  content: string;
  isUser?: boolean;
  image?: string;
}

export function ChatBubble({ content, isUser = false, image }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-4 my-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <p className="text-sm">{content}</p>
        {image && (
          <img
            src={image}
            alt="Preview"
            className="mt-2 rounded-md max-w-full h-auto cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}
