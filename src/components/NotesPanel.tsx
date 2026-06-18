import React, { useEffect, useRef } from "react";
import { useDayStore } from "../store/useDayStore";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Link as LinkIcon, List } from "lucide-react";

interface NotesPanelProps {
  isReadOnly?: boolean;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ isReadOnly = false }) => {
  const { activeDate, days, setNotes } = useDayStore();
  const dayData = days[activeDate];
  const notesContent = dayData?.notes || "";
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-accent underline cursor-pointer",
        },
      }),
    ],
    content: notesContent,
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setNotes(html);
      }, 800);
    },
  });

  // Handle date changes and load new content
  useEffect(() => {
    if (editor) {
      const currentHTML = editor.getHTML();
      if (notesContent !== currentHTML) {
        editor.commands.setContent(notesContent);
      }
    }
  }, [activeDate, editor, notesContent]);

  // Handle read-only status changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const toggleLink = () => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) return null;

  return (
    <div className="w-full bg-surface border border-border p-4 rounded flex flex-col gap-4">
      {/* Header and Toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-2 select-none">
        <h3 className="font-display font-bold text-[10px] tracking-[0.15em] text-textMuted uppercase">
          NOTES
        </h3>

        {/* Rich Text Toolbar */}
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded text-textMuted hover:text-accent transition-colors ${
                editor.isActive("bold") ? "text-accent bg-border/40" : ""
              }`}
              title="Bold"
            >
              <Bold size={11} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded text-textMuted hover:text-accent transition-colors ${
                editor.isActive("italic") ? "text-accent bg-border/40" : ""
              }`}
              title="Italic"
            >
              <Italic size={11} />
            </button>
            <button
              onClick={toggleLink}
              className={`p-1 rounded text-textMuted hover:text-accent transition-colors ${
                editor.isActive("link") ? "text-accent bg-border/40" : ""
              }`}
              title="Link"
            >
              <LinkIcon size={11} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1 rounded text-textMuted hover:text-accent transition-colors ${
                editor.isActive("bulletList") ? "text-accent bg-border/40" : ""
              }`}
              title="Bullet List"
            >
              <List size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Editor Container with Dot Grid background */}
      <div className="dot-grid w-full min-h-[160px] max-h-[300px] overflow-y-auto border border-border/60 p-3 rounded font-sans text-xs text-textPrimary leading-relaxed">
        <EditorContent editor={editor} className="h-full min-h-[140px] focus:outline-none" />
      </div>
    </div>
  );
};
