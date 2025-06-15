"use client";

import React, { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Save,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkMath from "remark-math";
import rehypeKaTeX from "rehype-katex";
import { ShadcnMDE } from "./ShadcnMDE";
import { FileCard } from "./FileCard";
import { Comment } from "./types";

const getInitials = (name: string = ""): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

interface SingleCommentProps {
  comment: Comment;
  universitySlug: string;
  careerSlug: string;
  subjectSlug: string;
  examId: string;
  onCommentAdded: (newComment: Comment, parentId: number | null) => void;
  onVote: (
    commentId: number,
    voteType: "up" | "down",
    currentVoteStatus: "up" | "down" | null,
  ) => void;
  onToggleFold: (commentId: number) => void;
  // Nuevo: para eliminar comentario
  onCommentDeleted?: (commentId: number) => void;
  // Nuevo: para actualizar comentario editado
  onCommentUpdated?: (updatedComment: Comment) => void;
}

export const SingleComment: React.FC<SingleCommentProps> = ({
  comment,
  universitySlug,
  careerSlug,
  subjectSlug,
  examId,
  onCommentAdded,
  onVote,
  onToggleFold,
  onCommentDeleted,
  onCommentUpdated,
}) => {
  const { token, user, verifyTokenAndExecute } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(
    comment.showReplyForm || false,
  );
  const [replyContent, setReplyContent] = useState("");
  const [replyTab, setReplyTab] = useState<"write" | "preview">("write");
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    comment.userVote || null,
  );
  const [replyFiles, setReplyFiles] = useState<File[]>([]);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editTab, setEditTab] = useState<"write" | "preview">("write");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Dropzone for reply
  const onDropReply = useCallback(
    (acceptedFiles: File[]) => {
      setReplyFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [setReplyFiles],
  );
  const { getRootProps, getInputProps, open: openReplyFileDialog } = useDropzone({
    onDrop: onDropReply,
    noClick: true,
    noKeyboard: true,
  });

  const handleRemoveReplyFile = (index: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyContent.trim() && replyFiles.length === 0) return;

    await verifyTokenAndExecute(async () => {
      setIsAddingReply(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        toast.error("URL API no configurada.");
        setIsAddingReply(false);
        return;
      }
      // Always POST to the /comments endpoint (not /comment/:id)
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comments`;
      try {
        const formData = new FormData();
        formData.append("content", replyContent);
        formData.append("parent_id", String(comment.id)); // <-- parent_id is required
        formData.append("comment_type", comment.comment_type || "exam"); // <-- must match parent
        replyFiles.forEach((file) => {
          formData.append("attachments[]", file);
        });

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            Accept: "application/json",
          },
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            `Error ${response.status}: No se pudo añadir la respuesta.`,
          );
        }
        const result = await response.json();
        if (result.data) {
          onCommentAdded(result.data, comment.id);
          setReplyContent("");
          setReplyFiles([]);
          setShowReplyForm(false);
          toast.success("Respuesta añadida.");
        } else {
          throw new Error("Respuesta de API inesperada al añadir respuesta.");
        }
      } catch (error) {
        console.error("Error adding reply:", error);
        toast.error(
          error instanceof Error ? error.message : "Error al añadir respuesta.",
        );
      } finally {
        setIsAddingReply(false);
      }
    });
  };

  const handleVoteClick = async (voteType: "up" | "down") => {
    await verifyTokenAndExecute(() => {
      onVote(comment.id, voteType, userVote);
      setUserVote((prevVote) => (prevVote === voteType ? null : voteType));
    });
  };

  const toggleFold = () => {
    onToggleFold(comment.id);
  };

  // --- ELIMINAR COMENTARIO ---
  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar este comentario?")) return;
    await verifyTokenAndExecute(async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        toast.error("URL API no configurada.");
        return;
      }
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comment/${comment.id}`;
      try {
        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            `Error ${response.status}: No se pudo eliminar el comentario.`,
          );
        }
        toast.success("Comentario eliminado.");
        if (onCommentDeleted) onCommentDeleted(comment.id);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al eliminar comentario.",
        );
      }
    });
  };

  // --- EDITAR COMENTARIO ---
  const handleEdit = () => {
    setEditContent(comment.content);
    setIsEditing(true);
    setEditTab("write");
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleEditSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editContent.trim()) return;
    await verifyTokenAndExecute(async () => {
      setIsSavingEdit(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        toast.error("URL API no configurada.");
        setIsSavingEdit(false);
        return;
      }
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comment/${comment.id}`;
      try {
        const formData = new FormData();
        formData.append("content", editContent);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            `Error ${response.status}: No se pudo editar el comentario.`,
          );
        }
        const result = await response.json();
        if (result.data) {
          toast.success("Comentario editado.");
          setIsEditing(false);
          if (onCommentUpdated) onCommentUpdated(result.data);
        } else {
          throw new Error("Respuesta de API inesperada al editar comentario.");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al editar comentario.",
        );
      } finally {
        setIsSavingEdit(false);
      }
    });
  };

  // ¿Es el dueño?
  const isOwner = user && user.id === comment.user_id;
  return (
    <div className="space-y-1 border-l-2 pl-3 py-2 hover:bg-muted/20 rounded-r-md group">
      <div className="flex items-start space-x-2.5">
        <Avatar className="h-7 w-7 text-xs flex-shrink-0 mt-1">
          <AvatarFallback>{getInitials(comment.user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow space-y-1">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={toggleFold}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={
                comment.isFolded ? "Expandir comentario" : "Plegar comentario"
              }
            >
              {comment.isFolded ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <p className="font-medium">{comment.user.display_name}</p>
            <span className="text-muted-foreground text-xs">
              ·{" "}
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
            {isOwner && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleEdit}
                  title="Editar comentario"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleDelete}
                  title="Eliminar comentario"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {!comment.isFolded && (
            <>
              {/* EDIT MODE */}
              {isEditing ? (
                <form onSubmit={handleEditSave} className="space-y-2">
                  <ShadcnMDE
                    value={editContent}
                    onChange={setEditContent}
                    selectedTab={editTab}
                    onTabChange={setEditTab}
                    minHeight={60}
                    placeholder="Edita tu comentario"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSavingEdit || !editContent.trim()}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSavingEdit ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleEditCancel}
                      disabled={isSavingEdit}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeSanitize, rehypeKaTeX]}
                    >
                      {comment.content}
                    </ReactMarkdown>
                  </div>

                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {comment.attachments.map((attachment) => (
                        <Card
                          key={attachment.id}
                          className="flex items-center gap-2 px-3 py-2 bg-muted border rounded shadow-sm"
                        >
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="Descargar archivo"
                          >
                            <a
                              href={attachment.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Paperclip className="h-4 w-4" />
                            </a>
                          </Button>
                          <a
                            href={attachment.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate max-w-[120px] text-xs hover:underline"
                          >
                            {attachment.original_file_name}
                          </a>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1.5">
                    <div className="flex items-center space-x-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-auto px-1 py-0.5 rounded ${userVote === "up" ? "text-primary bg-primary/10" : "hover:bg-accent"}`}
                        onClick={() => handleVoteClick("up")}
                        disabled={isAddingReply}
                      >
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {comment.upvotes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-auto px-1 py-0.5 rounded ${userVote === "down" ? "text-destructive bg-destructive/10" : "hover:bg-accent"}`}
                        onClick={() => handleVoteClick("down")}
                        disabled={isAddingReply}
                      >
                        <ThumbsDown className="h-3.5 w-3.5 mr-1" />{" "}
                        {comment.downvotes}
                      </Button>
                    </div>
                    {user && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-0 text-xs py-0.5"
                        onClick={() => setShowReplyForm(!showReplyForm)}
                      >
                        {showReplyForm ? "Cancelar" : "Responder"}
                      </Button>
                    )}
                  </div>

                  {showReplyForm && user && (
                    <form
                      onSubmit={handleReplySubmit}
                      className="mt-2.5 space-y-2 pl-5 border-l ml-1"
                    >
                      <ShadcnMDE
                        value={replyContent}
                        onChange={setReplyContent}
                        selectedTab={replyTab}
                        onTabChange={setReplyTab}
                        minHeight={60}
                        placeholder={`Responder a ${comment.user.display_name}...`}
                      />
                      <div {...getRootProps()} className="flex flex-col gap-2">
                        <input {...getInputProps()} />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={openReplyFileDialog}
                            tabIndex={-1}
                            aria-label="Adjuntar archivo"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Adjuntar archivos (arrastrar o click en el clip)
                          </span>
                        </div>
                        {replyFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {replyFiles.map((file, idx) => (
                              <FileCard
                                key={idx}
                                file={file}
                                onRemove={() => handleRemoveReplyFile(idx)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isAddingReply || (!replyContent.trim() && replyFiles.length === 0)}
                      >
                        {isAddingReply ? "Enviando..." : "Enviar Respuesta"}
                      </Button>
                    </form>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {comment.replies.map((reply) => (
                        <SingleComment
                          key={reply.id}
                          comment={reply}
                          universitySlug={universitySlug}
                          careerSlug={careerSlug}
                          subjectSlug={subjectSlug}
                          examId={examId}
                          onCommentAdded={onCommentAdded}
                          onVote={onVote}
                          onToggleFold={onToggleFold}
                          onCommentDeleted={onCommentDeleted}
                          onCommentUpdated={onCommentUpdated}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
