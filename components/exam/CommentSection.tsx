// components/exam/CommentSection.tsx
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Para mostrar el avatar del usuario
import { ThumbsUp, ThumbsDown, MessageCircle, Send, User as UserIcon, Paperclip, RotateCw } from 'lucide-react'; // Iconos
import { useAuth } from '@/app/context/AuthContext'; // Para saber si el usuario está logueado y obtener token
import { formatDistanceToNow } from 'date-fns'; // Para fechar comentarios
import { es } from 'date-fns/locale'; // Localizar fechas

// --- Interfaces (basadas en tu respuesta API) ---
interface User {
  id: number;
  name: string;
  // email y otras propiedades pueden no ser necesarias aquí
}

interface Attachment {
    id: number;
    original_file_name: string;
    file_size: number; // opcional si quieres mostrar el tamaño
    mime_type: string; // opcional
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
  created_at: string; // ISO string
  updated_at: string; // ISO string
  user: User; // Relación anidada
  replies: Comment[]; // Recursivo para respuestas
  attachments: Attachment[]; // Adjuntos en comentarios
  // Propiedades que podríamos añadir en el frontend para estado UI
  showReplyForm?: boolean;
  userVote?: 'up' | 'down' | null; // Estado del voto del usuario actual
}

interface PaginatedCommentsResponse {
    data: Comment[]; // Comentarios de nivel superior
    // meta y links de paginación (si la API principal de comentarios está paginada)
    meta: any;
    links: any;
}

interface CommentSectionProps {
  universitySlug: string;
  careerSlug: string;
  subjectSlug: string;
  examId: string;
}

// Helper para obtener iniciales
const getInitials = (name: string = ""): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// --- Componente Individual de Comentario ---
interface CommentProps {
    comment: Comment;
    universitySlug: string;
    careerSlug: string;
    subjectSlug: string;
    examId: string;
    onCommentAdded: (newComment: Comment, parentId: number | null) => void; // Callback para añadir comentario
    onVote: (commentId: number, voteType: 'up' | 'down', currentVoteStatus: 'up' | 'down' | null) => void; // Callback para votar
    currentUserId: number | null; // ID del usuario logueado
}

const Comment: React.FC<CommentProps> = ({
    comment,
    universitySlug,
    careerSlug,
    subjectSlug,
    examId,
    onCommentAdded,
    onVote,
    currentUserId
}) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isAddingReply, setIsAddingReply] = useState(false);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(comment.userVote || null); // Estado local del voto

    const handleReplySubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!replyContent.trim()) return;

        setIsAddingReply(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) { toast.error("URL API no configurada."); setIsAddingReply(false); return; }

        const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comment/${comment.id}/replies`; // Endpoint para responder
        const token = localStorage.getItem('axiom_access_token'); // O usar contexto de auth

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ content: replyContent }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}: No se pudo añadir la respuesta.`);
            }

            const result = await response.json();
            // Asumiendo que la API devuelve el nuevo comentario anidado bajo 'data'
            if (result.data) {
                onCommentAdded(result.data, comment.id); // Llamar al callback
                setReplyContent('');
                setShowReplyForm(false);
                toast.success("Respuesta añadida.");
            } else {
                 throw new Error("Respuesta de API inesperada al añadir respuesta.");
            }

        } catch (error) {
            console.error("Error adding reply:", error);
            toast.error(error instanceof Error ? error.message : "Error al añadir respuesta.");
        } finally {
            setIsAddingReply(false);
        }
    };

    const handleVoteClick = async (voteType: 'up' | 'down') => {
         if (!currentUserId) { // O usar el token para verificar autenticación
             toast.info("Debes iniciar sesión para votar.");
             return;
         }
         // Llama al callback del componente padre
         onVote(comment.id, voteType, userVote);

         // Actualiza estado local optimista
         setUserVote(prevVote => {
             if (prevVote === voteType) return null; // Quitar voto si se vota dos veces igual
             return voteType;
         });
         // Nota: La API debería devolver el comentario actualizado con los votos reales.
         // Idealmente, la lista principal se actualizaría al recibir el comentario modificado.
    };


    return (
        <div className="space-y-3 border-l-2 pl-4 py-2"> {/* Indicador de anidamiento */}
            <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8 text-xs flex-shrink-0">
                    {/* <AvatarImage src={comment.user.avatar_url} /> */}
                    <AvatarFallback>{getInitials(comment.user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                        <p className="font-medium">{comment.user.name}</p>
                        <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                        </span>
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap break-words"> {/* Permite saltos de línea */}
                         {/* TODO: Renderizar LaTeX correctamente */}
                         {comment.content}
                    </div>

                     {/* Adjuntos */}
                    {comment.attachments && comment.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {comment.attachments.map(attachment => (
                                <Button key={attachment.id} variant="outline" size="sm" asChild>
                                    <a href={attachment.download_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-x-1 text-xs">
                                        <Paperclip className="h-3 w-3"/> {attachment.original_file_name}
                                    </a>
                                </Button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                        {/* Controles de Voto */}
                        <div className="flex items-center space-x-1">
                           <Button
                              variant="ghost"
                              size="sm"
                              className={`h-auto px-1 ${userVote === 'up' ? 'text-primary' : ''}`}
                              onClick={() => handleVoteClick('up')}
                              disabled={isAddingReply} // Deshabilitar si está añadiendo respuesta
                           >
                              <ThumbsUp className="h-3.5 w-3.5 mr-1"/> {comment.upvotes}
                           </Button>
                           <Button
                              variant="ghost"
                              size="sm"
                              className={`h-auto px-1 ${userVote === 'down' ? 'text-destructive' : ''}`}
                              onClick={() => handleVoteClick('down')}
                              disabled={isAddingReply}
                           >
                              <ThumbsDown className="h-3.5 w-3.5 mr-1"/> {comment.downvotes}
                           </Button>
                        </div>
                        {/* Botón Responder */}
                        <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => setShowReplyForm(!showReplyForm)}>
                            {showReplyForm ? 'Cancelar' : 'Responder'}
                        </Button>
                    </div>

                    {/* Formulario de Respuesta Anidado */}
                    {showReplyForm && (
                        <form onSubmit={handleReplySubmit} className="mt-3 space-y-2 pl-6 border-l"> {/* Sangría y borde */}
                            <Textarea
                                placeholder={`Responder a ${comment.user.name}...`}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                rows={2}
                                disabled={isAddingReply}
                            />
                            <Button type="submit" size="sm" disabled={isAddingReply || !replyContent.trim()}>
                                {isAddingReply ? 'Enviando...' : 'Enviar Respuesta'}
                            </Button>
                        </form>
                    )}

                    {/* Renderizar Respuestas Anidadas Recursivamente */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {comment.replies.map(reply => (
                                <Comment // Llamada recursiva
                                    key={reply.id}
                                    comment={reply}
                                    universitySlug={universitySlug}
                                    careerSlug={careerSlug}
                                    subjectSlug={subjectSlug}
                                    examId={examId}
                                    onCommentAdded={onCommentAdded}
                                    onVote={onVote}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Componente Principal de la Sección de Comentarios ---
export function CommentSection({ universitySlug, careerSlug, subjectSlug, examId }: CommentSectionProps) {
  const { token, user } = useAuth(); // Obtener usuario logueado y token
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [error, setError] = useState<string | null>(null); // Para errores de carga inicial

  // --- Fetch Comentarios ---
  const fetchComments = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) { toast.error("URL API no configurada."); setIsLoading(false); return; }

      // Endpoint API para obtener comentarios del examen
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comments`;

      try {
          const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error(`Error ${response.status}: No se pudieron cargar los comentarios.`);
          const result: PaginatedCommentsResponse = await response.json(); // Esperar respuesta paginada
          // La API devuelve comentarios de nivel superior anidados bajo 'data'
          // Los hijos están en la propiedad 'replies' de cada comentario padre
          setComments(result.data || []);
          // TODO: Implementar paginación para comentarios de nivel superior si es necesario
      } catch (error) {
          console.error("Error fetching comments:", error);
          setError(error instanceof Error ? error.message : "Error al cargar comentarios.");
          toast.error(error instanceof Error ? error.message : "Error al cargar comentarios.");
          setComments([]);
      } finally {
          setIsLoading(false);
      }
  }, [universitySlug, careerSlug, subjectSlug, examId]);

  // --- Efecto para Cargar Comentarios al Montar ---
  useEffect(() => {
      fetchComments();
  }, [fetchComments]);

    // --- Manejar Comentario Añadido (callback para Comments hijos) ---
    const handleCommentAdded = (newComment: Comment, parentId: number | null) => {
        // Encuentra el padre y añade la respuesta
        if (parentId) {
            setComments(prevComments =>
                prevComments.map(comment =>
                    comment.id === parentId
                        ? { ...comment, replies: [...(comment.replies || []), newComment] }
                        : { ...comment, replies: comment.replies?.map(reply => reply.id === parentId ? { ...reply, replies: [...(reply.replies || []), newComment] } : reply) || [] } // Manejar anidamiento profundo si la API lo soporta
                )
            );
        } else {
            // Es un comentario de nivel superior
            setComments(prevComments => [newComment, ...prevComments]); // Añadir al inicio
        }
    };


  // --- Manejar Envío de Nuevo Comentario Principal ---
  const handleNewCommentSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!newCommentContent.trim()) return;

      if (!token) { // Verificar si el usuario está logueado
          toast.info("Debes iniciar sesión para comentar.");
          return;
      }

      setIsAddingComment(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) { toast.error("URL API no configurada."); setIsAddingComment(false); return; }

      // Endpoint API para añadir comentario principal (sin parent_id)
      const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comments`;

      try {
          const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${token}`, // Enviar token
              },
              body: JSON.stringify({ content: newCommentContent }), // No incluir parent_id
          });

          if (!response.ok) {
               const errorData = await response.json().catch(() => ({}));
               let errorMessage = errorData.message || `Error ${response.status}: No se pudo añadir el comentario.`;
               // Manejar errores de validación si vienen anidados
               if (response.status === 422 && errorData.errors) {
                   const firstError = Object.values(errorData.errors)[0]?.[0];
                   if (firstError) errorMessage = firstError;
               }
               throw new Error(errorMessage);
           }


          const result = await response.json();
          // Asumiendo que la API devuelve el nuevo comentario bajo 'data'
          if (result.data) {
              handleCommentAdded(result.data, null); // Llamar al manejador general
              setNewCommentContent(''); // Limpiar formulario
              toast.success("Comentario añadido.");
          } else {
              throw new Error("Respuesta de API inesperada al añadir comentario.");
          }

      } catch (error) {
          console.error("Error adding comment:", error);
          toast.error(error instanceof Error ? error.message : "Error al añadir comentario.");
      } finally {
          setIsAddingComment(false);
      }
  };

  // --- Manejar Votos ---
  const handleVote = async (commentId: number, voteType: 'up' | 'down', currentVoteStatus: 'up' | 'down' | null) => {
       if (!token) { // Verificar si el usuario está logueado
            toast.info("Debes iniciar sesión para votar.");
            return;
        }

       const apiUrl = process.env.NEXT_PUBLIC_API_URL;
       if (!apiUrl) { toast.error("URL API no configurada."); return; }

       const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}/comment/${commentId}/vote`;

       // Determinar el vote_type a enviar: 'up', 'down', o 'unvote'
       let actualVoteTypeToSend: 'up' | 'down' | 'unvote' = voteType;
       if (currentVoteStatus === voteType) {
           // Si el usuario ya votó igual, es un "unvote"
           actualVoteTypeToSend = 'unvote' as any; // Casteo temporal, la API espera 'up'/'down' o quizás un DELETE?
                                                    // Según tu Postman, parece que envía 'up'/'down' y la API decide si es unvote.
                                                    // Usaremos 'up'/'down' y confiaremos en la API para manejar el toggle.
       }

       const payload = { vote_type: voteType }; // API espera 'up' o 'down' en el body


       try {
           const response = await fetch(endpoint, {
               method: 'POST', // Según tu Postman, es POST
               headers: {
                   'Content-Type': 'application/json', // O 'application/x-www-form-urlencoded' según tu API
                   'Accept': 'application/json',
                   'Authorization': `Bearer ${token}`, // Enviar token
               },
               // Si la API espera form-data, usar URLSearchParams
               body: JSON.stringify(payload), // JSON body
               // body: new URLSearchParams(payload).toString(), // form-data body
           });

           if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}: No se pudo registrar el voto.`);
            }

            // Si la API devuelve el comentario actualizado, úsalo para actualizar el estado
            // Esto asegura que los conteos de upvotes/downvotes sean correctos.
            const updatedCommentResponse = await response.json();
            if (updatedCommentResponse.data) {
                 updateCommentInState(updatedCommentResponse.data); // Función para actualizar el comentario en el estado
            } else {
                 // Fallback: si la API no devuelve el comentario completo, re-fetch la lista completa (menos eficiente)
                 // fetchComments();
                 // O actualizar el estado localmente (puede desincronizarse si hay otros usuarios votando)
                 toast.success("Voto registrado.");
            }

       } catch (error) {
           console.error("Error voting:", error);
           toast.error(error instanceof Error ? error.message : "Error al votar.");
       }
   };

   // Función para actualizar un comentario en el estado (profundidad limitada)
   const updateCommentInState = (updatedComment: Comment) => {
      setComments(prevComments =>
          prevComments.map(comment => {
              // Si es el comentario principal o su respuesta directa
              if (comment.id === updatedComment.id) {
                  return { ...comment, ...updatedComment };
              }
              // Si es una respuesta anidada (solo busca en el primer nivel de replies por simplicidad)
              const updatedReplies = comment.replies?.map(reply => {
                  if (reply.id === updatedComment.id) {
                       return { ...reply, ...updatedComment };
                  }
                   return reply; // No anidamos más profundo aquí
              }) || [];

              // Solo actualiza si alguna respuesta fue modificada
              if (updatedReplies.length > 0 && updatedReplies !== comment.replies) {
                   return { ...comment, replies: updatedReplies };
              }

              return comment; // No es este comentario ni una respuesta directa
          })
      );
      // TODO: Actualizar userVote localmente también si la API no lo devuelve
      // o si se hace la lógica de unvote/toggle en el frontend
   };



  // --- Renderizado ---
  if (isLoading && comments.length === 0) { // Mostrar spinner solo en carga inicial sin datos
     return (
         <div className="flex items-center justify-center py-20">
            <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
     );
  }

  if (error && comments.length === 0) { // Mostrar error si falló la carga inicial
      return <p className="text-center text-red-600 py-10">Error al cargar comentarios: {error}</p>;
  }


  return (
    <div className="space-y-6">
      {/* Formulario para Añadir Nuevo Comentario Principal */}
      {token ? ( // Mostrar formulario solo si está logueado
         <Card>
             <CardHeader><CardTitle className="text-lg">Deja un Comentario</CardTitle></CardHeader>
             <CardContent className="space-y-3">
                 <Textarea
                     placeholder="Escribe tu comentario aquí..."
                     rows={4}
                     value={newCommentContent}
                     onChange={(e) => setNewCommentContent(e.target.value)}
                     disabled={isAddingComment}
                 />
                 {/* TODO: Implementar adjuntos */}
                 <Button onClick={handleNewCommentSubmit} disabled={isAddingComment || !newCommentContent.trim()}>
                     {isAddingComment ? 'Publicando...' : 'Publicar Comentario'}
                 </Button>
             </CardContent>
         </Card>
      ) : (
         <Card className="text-center py-6 bg-muted/50">
            <CardContent>
               <p className="text-muted-foreground">Inicia sesión para dejar un comentario.</p>
               {/* Opcional: Botón para abrir modal de login */}
            </CardContent>
         </Card>
      )}


      {/* Lista de Comentarios */}
      <div className="space-y-4"> {/* space-y para separación entre comentarios principales */}
          {!isLoading && comments.length === 0 && !error && ( // Mostrar mensaje si no hay comentarios y no hay error/carga
             <p className="text-center text-muted-foreground py-10">Aún no hay comentarios. ¡Sé el primero!</p>
          )}

          {/* Mapear comentarios de nivel superior */}
          {comments.map(comment => (
              <Comment
                  key={comment.id}
                  comment={comment}
                  universitySlug={universitySlug}
                  careerSlug={careerSlug}
                  subjectSlug={subjectSlug}
                  examId={examId}
                  onCommentAdded={handleCommentAdded}
                  onVote={handleVote}
                  currentUserId={user?.id || null} // Pasar el ID del usuario logueado
              />
          ))}
      </div>

      {/* TODO: Implementar Paginación para Comentarios de Nivel Superior */}
       {/* <Pagination>...</Pagination> */}

    </div>
  );
}

