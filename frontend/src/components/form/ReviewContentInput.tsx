import { useEffect, useRef } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";

interface ReviewContentInputProps {
  registration: UseFormRegisterReturn;
  value?: string;
}

export const ReviewContentInput = ({ registration, value = "" }: ReviewContentInputProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    resize();
    textarea.addEventListener("input", resize);
    return () => textarea.removeEventListener("input", resize);
  }, [value]);

  const applyFormatting = (format: string) => {
    if (!ref.current) return;
    const textarea = ref.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      toast.info("Please select some text first");
      return;
    }
    let prefix = "";
    let suffix = "";
    switch (format) {
      case "bold":
        prefix = "**";
        suffix = "**";
        break;
      case "italic":
        prefix = "*";
        suffix = "*";
        break;
      case "underline":
        prefix = "__";
        suffix = "__";
        break;
      case "color":
        prefix = "{color:#fb2c36}";
        suffix = "{color}";
        break;
    }
    const current = textarea.value;
    const selected = current.substring(start, end);
    const updated =
      current.substring(0, start) + prefix + selected + suffix + current.substring(end);
    textarea.value = updated;
    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    setTimeout(() => {
      textarea.focus();
      const pos = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className="w-full my-6">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => applyFormatting("bold")}
          className="p-1 px-3 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => applyFormatting("italic")}
          className="p-1 px-3 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => applyFormatting("underline")}
          className="p-1 px-3 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => applyFormatting("color")}
          className="p-1 px-3 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
          title="Red Text"
        >
          <span className="text-[#fb2c36]">A</span>
        </button>
      </div>
      <div className="rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900/40 overflow-hidden">
        <div className="relative px-5 py-4 border-l-4 border-neutral-800">
          <blockquote className="text-zinc-200 text-sm sm:text-base font-light">
            <textarea
              {...registration}
              ref={e => {
                ref.current = e;
                if (e) registration.ref(e);
              }}
              defaultValue={value}
              className="w-full bg-transparent resize-none leading-relaxed text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-opacity-50 rounded-lg"
              rows={3}
              placeholder="Write your review here..."
              data-testid="review-content-textarea"
            />
          </blockquote>
        </div>
      </div>
    </div>
  );
};
