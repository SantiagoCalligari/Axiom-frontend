"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  X,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkMath from "remark-math";
import rehypeKaTeX from "rehype-katex";
import "katex/dist/katex.min.css";
import ReactMde from "react-mde";
import "react-mde/lib/styles/css/react-mde-all.css";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";

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

interface FileCardProps {
  file: File;
  onRemove: () => void;
}
function FileCard({ file, onRemove }: FileCardProps) {
  return (
    <div className="flex items-center gap-2 bg-muted border rounded px-3 py-2 shadow-sm">
      <Paperclip className="h-4 w-4 text-muted-foreground" />
      <span className="truncate max-w-[120px] text-xs">{file.name}</span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={onRemove}
        aria-label="Quitar archivo"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// --- Custom Editor Component ---
function ShadcnMDE({
  value,
  onChange,
  selectedTab,
  onTabChange,
  minHeight = 80,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  selectedTab: "write" | "preview";
  onTabChange: (tab: "write" | "preview") => void;
  minHeight?: number;
  placeholder?: string;
}) {
  return (
    <div>
      {/* Custom Tabs */}
      <div className="mb-1 flex gap-1">
        <button
          type="button"
          className={clsx(
            "px-3 py-1 rounded-t-md text-xs font-medium border-b-2 transition",
            selectedTab === "write"
              ? "border-primary bg-background text-primary"
              : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("write")}
        >
          Escribir
        </button>
        <button
          type="button"
          className={clsx(
            "px-3 py-1 rounded-t-md text-xs font-medium border-b-2 transition",
            selectedTab === "preview"
              ? "border-primary bg-background text-primary"
              : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("preview")}
        >
          Vista previa
        </button>
      </div>
      {/* Editor */}
      <div className="[&_.mde-tabs]:hidden [&_.mde-header]:hidden">
        <ReactMde
          value={value}
          onChange={onChange}
          selectedTab={selectedTab}
          onTabChange={onTabChange}
          minEditorHeight={minHeight}
          minPreviewHeight={minHeight}
          generateMarkdownPreview={async (markdown) => (
            <div className="bg-muted border rounded-md p-3 min-h-[80px] prose prose-sm dark:prose-invert text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeSanitize, rehypeKaTeX]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          )}
          childProps={{
            writeButton: { tabIndex: -1 },
            previewButton: { tabIndex: -1 },
          }}
          classes={{
            textArea: "bg-background border rounded-md border-input focus:outline-none focus:ring-2 focus:ring-primary/30 px-3 py-2 min-h-[80px] text-sm font-mono",
            toolbar: "flex gap-1 bg-muted border-b rounded-t-md px-2 py-1",
            toolbarButton: "rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:ring-2 focus:ring-primary/30 focus:outline-none transition",
            toolbarButtonSelected: "bg-accent text-foreground",
            preview: "bg-muted border rounded-md p-3 min-h-[80px] prose prose-sm dark:prose-invert text-foreground",
          }}
          placeholder={placeholder}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Soporta <b>Markdown</b> y <b>LaTeX</b> (<span className="font-mono">{"$a^2 + b^2 = c^2$"}</span>).
        <span className="ml-2">Usá los botones para listas, negrita, etc.</span>
      </div>
    </div>
  );
}

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
  onCommentAdded,
  onVote,
  onToggleFold,
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
      // Use the comment creation endpoint (no comment.id in the URL)
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comments`;
      try {
        const formData = new FormData();
        formData.append("content", replyContent);
        formData.append("parent_id", comment.id); // Add parent_id for reply
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
                    placeholder={`Responder a ${comment.user.name}...`}
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
                    <SingleCommentComponent
                      key={reply.id}
                      comment={reply}
                      universitySlug={universitySlug}
                      careerSlug={careerSlug}
                      subjectSlug={subjectSlug}
                      examId={examId}
                      onCommentAdded={onCommentAdded}
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
          <SingleCommentComponent
            key={comment.id}
            comment={comment}
            universitySlug={universitySlug}
            careerSlug={careerSlug}
            subjectSlug={subjectSlug}
            examId={examId}
            onCommentAdded={handleCommentAdded}
            onVote={handleVote}
            onToggleFold={handleToggleFold}
          />
        ))}
      </div>
    </div>
  );
}
