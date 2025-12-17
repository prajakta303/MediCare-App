import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { ArrowLeft, Plus, MessageCircle, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Helmet } from "react-helmet";

const ForumDetail = () => {
  const { forumId } = useParams();
  const { user } = useAuth();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const { data: forum, isLoading: forumLoading } = useQuery({
    queryKey: ["forum", forumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_forums")
        .select("*")
        .eq("id", forumId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["forum-posts", forumId, sortBy, filterTag],
    queryFn: async () => {
      let query = supabase
        .from("community_posts")
        .select(`
          *,
          forum:community_forums(name),
          author:profiles!community_posts_author_id_fkey(first_name, last_name, avatar_url),
          comments:community_comments(count),
          reactions:community_reactions(count)
        `)
        .eq("forum_id", forumId!)
        .eq("is_hidden", false);
      
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "popular") {
        query = query.order("created_at", { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let filteredData = data;
      if (filterTag) {
        filteredData = data.filter((post) => 
          post.tags?.some((tag: string) => tag.toLowerCase() === filterTag.toLowerCase())
        );
      }
      
      if (sortBy === "popular") {
        filteredData = filteredData.sort((a, b) => {
          const aEngagement = ((a.comments as any)?.[0]?.count || 0) + ((a.reactions as any)?.[0]?.count || 0);
          const bEngagement = ((b.comments as any)?.[0]?.count || 0) + ((b.reactions as any)?.[0]?.count || 0);
          return bEngagement - aEngagement;
        });
      }
      
      return filteredData;
    },
    enabled: !!forumId,
  });

  const tags = ["Symptoms", "Lifestyle", "Recovery", "Medication"];

  if (forumLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{forum?.name} Forum | HealthConnect Community</title>
        <meta name="description" content={forum?.description || `Discuss ${forum?.name} with the HealthConnect community.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link to="/community">
            <Button variant="ghost" className="gap-2 mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Button>
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{forum?.name}</h1>
              <p className="text-muted-foreground mt-1">{forum?.description}</p>
            </div>
            
            {user && (
              <Button onClick={() => setCreatePostOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant={filterTag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterTag(null)}
              >
                All
              </Badge>
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={filterTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Posts */}
          {postsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {posts?.map((post) => (
                <PostCard key={post.id} post={post} showForum={false} />
              ))}

              {posts?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No posts in this forum yet. Be the first to start a discussion!</p>
                </div>
              )}
            </div>
          )}
        </div>

        <CreatePostDialog 
          open={createPostOpen} 
          onOpenChange={setCreatePostOpen}
          forumId={forumId}
        />
      </div>
    </>
  );
};

export default ForumDetail;
