// FILE: components/exam/CommentSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  RotateCw,
  ChevronDown,
  ChevronRight,
  MessageSquareText,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// --- Import Markdown and Math Plugins ---
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkMath from "remark-math";
import rehypeKaTeX from "rehype-katex";
// --- End Imports ---

// --- Interfaces ---
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

interface Comment {
  id: number;
  user_id: number;
  exam_id: number;
  parent_id: number | null;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  user: CommentUser;
  replies: Comment[];
  attachments: Attachment[];
  // UI state, not from API
  showReplyForm?: boolean;
  userVote?: "up" | "down" | null;
  isFolded?: boolean;
}

interface PaginatedCommentsResponse {
  data: Comment[];
  meta: any;
  links: any;
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
}

const SingleCommentComponent: React.FC<SingleCommentProps> = ({
  comment,
  universitySlug,
  careerSlug,
  subjectSlug,
  examId,
  onCommentAdded, // Use the prop here
  onVote,
  onToggleFold,
}) => {
  const { token, user, verifyTokenAndExecute } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(
    comment.showReplyForm || false,
  );
  const [replyContent, setReplyContent] = useState("");
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    comment.userVote || null,
  );

  const handleReplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyContent.trim()) return;

    await verifyTokenAndExecute(async () => {
      setIsAddingReply(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        toast.error("URL API no configurada.");
        setIsAddingReply(false);
        return;
      }
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comment/${comment.id}`;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ content: replyContent }),
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
          onCommentAdded(result.data, comment.id); // Use the prop here
          setReplyContent("");
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
            <p className="font-medium">{comment.user.name}</p>
            <span className="text-muted-foreground text-xs">
              ·{" "}
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>

          {!comment.isFolded && (
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
                    <Button
                      key={attachment.id}
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={attachment.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-x-1 text-xs"
                      >
                        <Paperclip className="h-3 w-3" />
                        {attachment.original_file_name}
                      </a>
                    </Button>
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
                  <Textarea
                    placeholder={`Responder a ${comment.user.name}... Puedes usar Markdown y \$LaTeX\$. Ejemplo: $(a^2 + b^2 = c^2)$ para inline, o $$ \\int_0^1 x^2 dx $$ para display.`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                    disabled={isAddingReply}
                    className="text-sm"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isAddingReply || !replyContent.trim()}
                  >
                    {isAddingReply ? "Enviando..." : "Enviar Respuesta"}
                  </Button>
                </form>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                  {comment.replies.map((reply) => (
                    <SingleCommentComponent
                      key={reply.id}
                      comment={reply}
                      universitySlug={universitySlug}
                      careerSlug={careerSlug}
                      subjectSlug={subjectSlug}
                      examId={examId}
                      onCommentAdded={onCommentAdded} // Pass the prop down
                      onVote={onVote}
                      onToggleFold={onToggleFold}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
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
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!newCommentContent.trim()) return;

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
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newCommentContent }),
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
          // Merge updated data, but preserve local UI state like isFolded
          return {
            ...c,
            ...updatedComment,
            userVote: c.userVote,
            isFolded: c.isFolded,
            // Ensure replies preserve their folded state if they exist in updatedComment
            replies: updatedComment.replies?.map(updatedReply => {
              const existingReply = c.replies?.find(r => r.id === updatedReply.id);
              return { ...updatedReply, isFolded: existingReply?.isFolded ?? false };
            }) || c.replies // Fallback to existing replies if API doesn't return them
          };
        }
        if (c.replies && c.replies.length > 0) {
          // Recursively update replies, preserving their state
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
            <Textarea
              placeholder="Escribe tu comentario aquí... Puedes usar Markdown y \$LaTeX\$. Ejemplo: `$(a^2 + b^2 = c^2)$` para inline, o `$$ \int_0^1 x^2 dx $$` para display."
              rows={4}
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              disabled={isAddingComment}
            />
            {/* TODO: Implementar adjuntos */}
            <Button
              onClick={handleNewCommentSubmit}
              disabled={isAddingComment || !newCommentContent.trim()}
            >
              {isAddingComment ? "Publicando..." : "Publicar Comentario"}
            </Button>
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
          <SingleCommentComponent
            key={comment.id}
            comment={comment}
            universitySlug={universitySlug}
            careerSlug={careerSlug}
            subjectSlug={subjectSlug}
            examId={examId}
            onCommentAdded={handleCommentAdded} // Pass the function reference
            onVote={handleVote}
            onToggleFold={handleToggleFold}
          />
        ))}
      </div>
    </div>
  );
}
