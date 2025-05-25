// components/comments/CommentSection.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, MessageSquareText, Paperclip } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useDropzone } from "react-dropzone";
import { FileCard } from "./FileCard";
import { ShadcnMDE } from "./ShadcnMDE";
import { SingleComment } from "./SingleComment";
import { Comment, PaginatedCommentsResponse } from "./types";

// ... (todo el código del componente, igual que antes)
// Puedes copiar y pegar el cuerpo del componente desde tu archivo original.// --- Interfaces ---
interface CommentUser {
  id: number;
  name: string;
}

interface Attachment {
  id: number;
  original_file_name: string;
  file_size: number;
  mime_type: string;
  download_url: string;
}

interface CommentSectionProps {
  universitySlug: string;
  careerSlug: string;
  subjectSlug: string;
  examId: string;
}

const getInitials = (name: string = ""): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export function CommentSection({
  universitySlug,
  careerSlug,
  subjectSlug,
  examId,
}: CommentSectionProps) {
  const { token, user, isAuthenticated, verifyTokenAndExecute } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [commentTab, setCommentTab] = useState<"write" | "preview">("write");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);

  // Dropzone for main comment
  const onDropComment = useCallback(
    (acceptedFiles: File[]) => {
      setCommentFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [setCommentFiles],
  );
  const { getRootProps, getInputProps, open: openCommentFileDialog } = useDropzone({
    onDrop: onDropComment,
    noClick: true,
    noKeyboard: true,
  });
  // Dentro de CommentSection

  // Eliminar comentario
  const handleCommentDeleted = (commentId: number) => {
    const removeRecursive = (comments: Comment[]): Comment[] =>
      comments
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies ? removeRecursive(c.replies) : [],
        }));
    setComments((prev) => removeRecursive(prev));
  };

  // Actualizar comentario editado
  const handleCommentUpdated = (updatedComment: Comment) => {
    const updateRecursive = (comments: Comment[]): Comment[] =>
      comments.map((c) =>
        c.id === updatedComment.id
          ? { ...c, ...updatedComment }
          : { ...c, replies: updateRecursive(c.replies || []) }
      );
    setComments((prev) => updateRecursive(prev));
  };

  const handleRemoveCommentFile = (index: number) => {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      toast.error("URL API no configurada.");
      setIsLoading(false);
      return;
    }
    const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comments`;
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(
          `Error ${response.status}: No se pudieron cargar los comentarios.`,
        );
      const result: PaginatedCommentsResponse = await response.json();
      const commentsWithFoldState = (result.data || []).map(
        (comment): Comment => ({
          ...comment,
          isFolded: false,
          replies: (comment.replies || []).map(
            (reply): Comment => ({ ...reply, isFolded: false }),
          ),
        }),
      );
      setComments(commentsWithFoldState);
    } catch (error) {
      console.error("Error fetching comments:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Error al cargar comentarios.";
      setError(message);
      toast.error(message);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [universitySlug, careerSlug, subjectSlug, examId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleToggleFold = (commentId: number) => {
    const toggleFoldRecursive = (currentComments: Comment[]): Comment[] => {
      return currentComments.map((c) => {
        if (c.id === commentId) {
          return { ...c, isFolded: !c.isFolded };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: toggleFoldRecursive(c.replies) };
        }
        return c;
      });
    };
    setComments((prevComments) => toggleFoldRecursive(prevComments));
  };

  const handleCommentAdded = (
    newCommentData: Comment,
    parentId: number | null,
  ) => {
    const newCommentWithFoldState: Comment = {
      ...newCommentData,
      isFolded: false,
      replies: (newCommentData.replies || []).map((r) => ({
        ...r,
        isFolded: false,
      })),
    };

    if (parentId) {
      const addReplyRecursive = (
        existingComments: Comment[],
      ): Comment[] => {
        return existingComments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [
                ...(comment.replies || []),
                newCommentWithFoldState,
              ].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              ),
              isFolded: false,
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: addReplyRecursive(comment.replies) };
          }
          return comment;
        });
      };
      setComments((prevComments) => addReplyRecursive(prevComments));
    } else {
      setComments((prevComments) =>
        [newCommentWithFoldState, ...prevComments].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        ),
      );
    }
  };

  const handleNewCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCommentContent.trim() && commentFiles.length === 0) return;

    await verifyTokenAndExecute(async () => {
      setIsAddingComment(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        toast.error("URL API no configurada.");
        setIsAddingComment(false);
        return;
      }
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comments`;
      try {
        const formData = new FormData();
        formData.append("content", newCommentContent);
        commentFiles.forEach((file) => {
          formData.append("attachments[]", file);
        });

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
          let errorMessage =
            errorData.message ||
            `Error ${response.status}: No se pudo añadir el comentario.`;
          throw new Error(errorMessage);
        }
        const result = await response.json();
        if (result.data) {
          handleCommentAdded(result.data, null);
          setNewCommentContent("");
          setCommentFiles([]);
          toast.success("Comentario añadido.");
        } else {
          throw new Error("Respuesta de API inesperada al añadir comentario.");
        }
      } catch (error) {
        console.error("Error adding comment:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al añadir comentario.",
        );
      } finally {
        setIsAddingComment(false);
      }
    });
  };

  const handleVote = async (
    commentId: number,
    voteType: "up" | "down",
    currentVoteStatus: "up" | "down" | null,
  ) => {
    await verifyTokenAndExecute(async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        toast.error("URL API no configurada.");
        return;
      }
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comment/${commentId}/vote`;
      const payload = { vote_type: voteType };
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            `Error ${response.status}: No se pudo registrar el voto.`,
          );
        }
        const updatedCommentResponse = await response.json();
        if (updatedCommentResponse.data) {
          updateCommentInState(updatedCommentResponse.data);
          toast.success("Voto registrado.");
        } else {
          fetchComments();
          toast.info(
            "Voto registrado. Actualizando lista de comentarios...",
          );
        }
      } catch (error) {
        console.error("Error voting:", error);
        toast.error(
          error instanceof Error ? error.message : "Error al votar.",
        );
      }
    });
  };

  const updateCommentInState = (updatedComment: Comment) => {
    const updateRecursive = (existingComments: Comment[]): Comment[] => {
      return existingComments.map((c) => {
        if (c.id === updatedComment.id) {
          return {
            ...c,
            ...updatedComment,
            userVote: c.userVote,
            isFolded: c.isFolded,
            replies: updatedComment.replies?.map(updatedReply => {
              const existingReply = c.replies?.find(r => r.id === updatedReply.id);
              return { ...updatedReply, isFolded: existingReply?.isFolded ?? false };
            }) || c.replies
          };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateRecursive(c.replies) };
        }
        return c;
      });
    };
    setComments((prevComments) => updateRecursive(prevComments));
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            No se pudieron cargar los comentarios: {error}
          </p>
          <Button onClick={fetchComments} variant="outline" className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isAuthenticated && user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              Deja un Comentario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleNewCommentSubmit} className="space-y-3">
              <ShadcnMDE
                value={newCommentContent}
                onChange={setNewCommentContent}
                selectedTab={commentTab}
                onTabChange={setCommentTab}
                minHeight={80}
                placeholder="Escribe tu comentario aquí"
              />
              <div {...getRootProps()} className="flex flex-col gap-2">
                <input {...getInputProps()} />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={openCommentFileDialog}
                    tabIndex={-1}
                    aria-label="Adjuntar archivo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Adjuntar archivos (arrastrar o click en el clip)
                  </span>
                </div>
                {commentFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {commentFiles.map((file, idx) => (
                      <FileCard
                        key={idx}
                        file={file}
                        onRemove={() => handleRemoveCommentFile(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={isAddingComment || (!newCommentContent.trim() && commentFiles.length === 0)}
              >
                {isAddingComment ? "Publicando..." : "Publicar Comentario"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-6 bg-muted/30">
          <CardContent>
            <p className="text-muted-foreground">
              Inicia sesión para dejar un comentario o votar.
            </p>
            <Button
              variant="link"
              onClick={() => verifyTokenAndExecute(() => { }, true)}
              className="mt-2"
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {!isLoading && comments.length === 0 && !error && (
          <Card className="text-center py-10 bg-muted/30">
            <CardContent>
              <p className="text-muted-foreground">
                Aún no hay comentarios. ¡Sé el primero!
              </p>
            </CardContent>
          </Card>
        )}
        {comments.map((comment) => (
          <SingleComment
            key={comment.id}
            comment={comment}
            universitySlug={universitySlug}
            careerSlug={careerSlug}
            subjectSlug={subjectSlug}
            examId={examId}
            onCommentAdded={handleCommentAdded}
            onVote={handleVote}
            onToggleFold={handleToggleFold}
            onCommentDeleted={handleCommentDeleted}
            onCommentUpdated={handleCommentUpdated}
          />
        ))}
      </div>
    </div>
  );
}
