// components/comments/types.ts

export interface CommentUser {
  id: number;
  display_name: string;
  name: string;
}

export interface Attachment {
  id: number;
  original_file_name: string;
  file_size: number;
  mime_type: string;
  download_url: string;
}

export interface Comment {
  comment_type: string;
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

export interface PaginatedCommentsResponse {
  data: Comment[];
  meta: any;
  links: any;
}
