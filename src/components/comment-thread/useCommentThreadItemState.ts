import { useEffect, useRef, useState } from 'react';

export function useCommentThreadItemState(commentBody: string, isHighlighted: boolean) {
  const itemRef = useRef<HTMLLIElement | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingBody, setEditingBody] = useState(commentBody);

  useEffect(() => {
    setEditingBody(commentBody);
  }, [commentBody]);

  useEffect(() => {
    if (!isHighlighted) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      itemRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isHighlighted]);

  return {
    itemRef,
    replyOpen,
    setReplyOpen,
    editing,
    setEditing,
    editingBody,
    setEditingBody,
  };
}
