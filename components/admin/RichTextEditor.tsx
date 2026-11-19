"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/* ---------- ปุ่มใน toolbar ---------- */
function ToolButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "default" : "outline"}
      className="size-8"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px self-center bg-border" />;
}

/* ---------- Toolbar ---------- */
function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      "ใส่ลิงก์ (เว้นว่างเพื่อลบลิงก์)",
      previous ?? "",
    );
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  return (
    <div className="flex flex-wrap gap-1 rounded-md border bg-muted/40 p-1">
      <ToolButton
        label="ย้อนกลับ"
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 />
      </ToolButton>
      <ToolButton
        label="ทำซ้ำ"
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 />
      </ToolButton>

      <Divider />

      <ToolButton
        label="หัวข้อใหญ่"
        disabled={disabled}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolButton>
      <ToolButton
        label="หัวข้อรอง"
        disabled={disabled}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolButton>

      <Divider />

      <ToolButton
        label="ตัวหนา"
        disabled={disabled}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolButton>
      <ToolButton
        label="ตัวเอียง"
        disabled={disabled}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolButton>
      <ToolButton
        label="ขีดเส้นใต้"
        disabled={disabled}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon />
      </ToolButton>
      <ToolButton
        label="ขีดฆ่า"
        disabled={disabled}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </ToolButton>

      <Divider />

      <ToolButton
        label="รายการแบบจุด"
        disabled={disabled}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolButton>
      <ToolButton
        label="รายการแบบตัวเลข"
        disabled={disabled}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolButton>
      <ToolButton
        label="ข้อความอ้างอิง"
        disabled={disabled}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolButton>

      <Divider />

      <ToolButton
        label="ชิดซ้าย"
        disabled={disabled}
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft />
      </ToolButton>
      <ToolButton
        label="กึ่งกลาง"
        disabled={disabled}
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter />
      </ToolButton>
      <ToolButton
        label="ชิดขวา"
        disabled={disabled}
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight />
      </ToolButton>

      <Divider />

      <ToolButton
        label="ลิงก์"
        disabled={disabled}
        active={editor.isActive("link")}
        onClick={setLink}
      >
        <Link2 />
      </ToolButton>
      <ToolButton
        label="เส้นคั่น"
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus />
      </ToolButton>
      <ToolButton
        label="ล้างรูปแบบ"
        disabled={disabled}
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
      >
        <RemoveFormatting />
      </ToolButton>
    </div>
  );
}

/* ---------- Editor ---------- */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "รายละเอียดเกี่ยวกับงาน",
  disabled = false,
  className,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "max-w-none min-h-40 rounded-md border px-3 py-2 text-base leading-7 focus:outline-none",
          "[&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold",
          "[&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
          "[&_a]:text-blue-600 [&_a]:underline",
          disabled && "opacity-60",
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if (value !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  );
}
