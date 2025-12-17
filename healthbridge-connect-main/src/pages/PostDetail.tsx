import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserTrustBadge } from "@/components/community/UserTrustBadge";
import { ReportDialog } from "@/components/community/ReportDialog";
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Flag,
  Eye,
  CheckCircle2,
  Shield,
  Send
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

const PostDetail = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          forum:community_forums(id, name),
          author:profiles!community_posts_author_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq("id", postId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_comments")
        .select(`
          *,
          author:profiles!community_comments_author_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq("post_id", postId!)
        .eq("is_hidden", false)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  const { data: reactions } = useQuery({
    queryKey: ["post-reactions", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_reactions")
        .select("*")
        .eq("post_id", postId!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("community_comments").insert({
        post_id: postId!,
        author_id: user!.id,
        content: commentContent,
        is_anonymous: isAnonymous,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      setCommentContent("");
      toast.success("Comment added!");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("community_reactions").insert({
        post_id: postId!,
        user_id: user!.id,
        reaction_type: "like",
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-reactions", postId] });
      toast.success("Post liked!");
    },
    onError: () => {
      toast.error("Already liked this post");
    },
  });

  const authorName = post?.is_anonymous 
    ? "Anonymous" 
    : `${post?.author?.first_name || ""} ${post?.author?.last_name || ""}`.trim() || "User";

  const userHasLiked = reactions?.some((r) => r.user_id === user?.id);

  if (postLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post?.title} | HealthConnect Community</title>
        <meta name="description" content={post?.content?.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Link to={`/community/forum/${post?.forum?.id}`}>
            <Button variant="ghost" className="gap-2 mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to {post?.forum?.name}
            </Button>
          </Link>

          {/* Post */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {post?.is_anonymous ? (
                      <AvatarFallback className="bg-muted">
                        <Eye className="h-5 w-5" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={post?.author?.avatar_url} />
                        <AvatarFallback>
                          {authorName.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{authorName}</span>
                      {post?.is_expert_response && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Expert
                        </Badge>
                      )}
                      {post?.is_verified_doctor && (
                        <Badge className="gap-1 bg-primary">
                          <Shield className="h-3 w-3" /> Doctor
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(post?.created_at), { addSuffix: true })}
                    </p>
                    {!post?.is_anonymous && post?.author_id && (
                      <UserTrustBadge userId={post.author_id} showScore={false} />
                    )}
                  </div>
                </div>

                <Button variant="ghost" size="icon" onClick={() => setReportOpen(true)}>
                  <Flag className="h-4 w-4" />
                </Button>
              </div>

              <h1 className="text-2xl font-bold mt-4">{post?.title}</h1>

              {post?.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{post?.content}</p>

              <div className="flex items-center gap-4 mt-6 pt-6 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`gap-2 ${userHasLiked ? "text-red-500" : "text-muted-foreground"}`}
                  onClick={() => likeMutation.mutate()}
                  disabled={userHasLiked || !user}
                >
                  <Heart className={`h-4 w-4 ${userHasLiked ? "fill-current" : ""}`} />
                  {reactions?.length || 0}
                </Button>

                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {comments?.length || 0}
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 text-muted-foreground ml-auto"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({comments?.length || 0})
            </h2>

            {/* Add Comment */}
            {user && (
              <Card>
                <CardContent className="pt-6">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="anonymous-comment"
                        checked={isAnonymous}
                        onCheckedChange={setIsAnonymous}
                      />
                      <Label htmlFor="anonymous-comment" className="text-sm flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        Post anonymously
                      </Label>
                    </div>
                    <Button 
                      onClick={() => addCommentMutation.mutate()}
                      disabled={!commentContent.trim() || addCommentMutation.isPending}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            {commentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {comments?.map((comment) => {
                  const commentAuthorName = comment.is_anonymous 
                    ? "Anonymous" 
                    : `${comment.author?.first_name || ""} ${comment.author?.last_name || ""}`.trim() || "User";

                  return (
                    <Card key={comment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            {comment.is_anonymous ? (
                              <AvatarFallback className="bg-muted">
                                <Eye className="h-4 w-4" />
                              </AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={comment.author?.avatar_url} />
                                <AvatarFallback>
                                  {commentAuthorName.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{commentAuthorName}</span>
                                {comment.is_expert_response && (
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <CheckCircle2 className="h-3 w-3" /> Expert
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => {
                                  setReportCommentId(comment.id);
                                  setReportOpen(true);
                                }}
                              >
                                <Flag className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {comments?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <ReportDialog 
          open={reportOpen} 
          onOpenChange={(open) => {
            setReportOpen(open);
            if (!open) setReportCommentId(null);
          }}
          contentType={reportCommentId ? "comment" : "post"}
          contentId={reportCommentId || postId!}
        />
      </div>
    </>
  );
};

export default PostDetail;
