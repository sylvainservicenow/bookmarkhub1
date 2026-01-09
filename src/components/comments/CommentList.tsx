import { User, Calendar, Trash2 } from 'lucide-react'
import { DeleteCommentButton } from './DeleteCommentButton'

interface Comment {
  id: string
  author_id: string
  author_name: string | null
  content: string
  created_at: string
}

interface CommentListProps {
  comments: Comment[]
  currentUserId?: string
  isAdmin?: boolean
}

export function CommentList({ comments, currentUserId, isAdmin }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const canDelete = currentUserId === comment.author_id || isAdmin
        
        return (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <span className="font-medium text-gray-900">
                  {comment.author_name || 'Anonymous'}
                </span>
                <span className="text-gray-400">·</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {canDelete && (
                <DeleteCommentButton commentId={comment.id} />
              )}
            </div>
            
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        )
      })}
    </div>
  )
}
