import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Heart, 
  Share2, 
  Flag, 
  MoreHorizontal,
  CheckCircle2,
  Shield,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from "./ReportDialog";

interface PostCardProps {
  post: any;
  showForum?: boolean;
}

const tagColors: Record<string, string> = {
  symptoms: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  lifestyle: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  recovery: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  medication: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export const PostCard = ({ post, showForum = true }: PostCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await (supabase as any).from("community_reactions").insert({
        post_id: post.id,
        user_id: user.id,
        reaction_type: "like",
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setLiked(true);
      queryClient.invalidateQueries({ queryKey: ["trending-posts"] });
      toast.success("Post liked!");
    },
    onError: () => {
      toast.error("Already liked this post");
    },
  });

  const commentCount = (post.comments as any)?.[0]?.count || 0;
  const reactionCount = (post.reactions as any)?.[0]?.count || 0;
  const authorName = post.is_anonymous 
    ? "Anonymous" 
    : `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim() || "User";

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {post.is_anonymous ? (
                  <AvatarFallback className="bg-muted">
                    <Eye className="h-4 w-4" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={post.author?.avatar_url} />
                    <AvatarFallback>
                      {authorName.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{authorName}</span>
                  {post.is_expert_response && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Expert
                    </Badge>
                  )}
                  {post.is_verified_doctor && (
                    <Badge className="gap-1 text-xs bg-primary">
                      <Shield className="h-3 w-3" /> Doctor
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  {showForum && post.forum && (
                    <> in <span className="text-primary">{post.forum.name}</span></>
                  )}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  <Flag className="h-4 w-4 mr-2" /> Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <Link to={`/community/post/${post.id}`}>
            <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
              {post.title}
            </h3>
          </Link>
          <p className="text-muted-foreground text-sm line-clamp-3">
            {post.content}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.tags.map((tag: string) => (
                <Badge 
                  key={tag} 
                  variant="outline"
                  className={tagColors[tag.toLowerCase()] || ""}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center gap-4 w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground hover:text-red-500"
              onClick={() => likeMutation.mutate()}
              disabled={liked || !user}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
              {reactionCount + (liked ? 1 : 0)}
            </Button>

            <Link to={`/community/post/${post.id}`}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {commentCount}
              </Button>
            </Link>

            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground ml-auto"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + `/community/post/${post.id}`);
                toast.success("Link copied to clipboard!");
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ReportDialog 
        open={reportOpen} 
        onOpenChange={setReportOpen}
        contentType="post"
        contentId={post.id}
      />
    </>
  );
};
