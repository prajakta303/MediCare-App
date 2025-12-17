import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Brain, Activity, Pill, FlaskConical, MessageCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface Forum {
  id: string;
  name: string;
  description: string;
  posts: { count: number }[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Diabetes": <Activity className="h-8 w-8 text-primary" />,
  "Heart Health": <Heart className="h-8 w-8 text-red-500" />,
  "Mental Wellness": <Brain className="h-8 w-8 text-purple-500" />,
  "Parkinson's": <Activity className="h-8 w-8 text-blue-500" />,
  "Clinical Trials": <FlaskConical className="h-8 w-8 text-green-500" />,
};

export const ForumCategories = () => {
  const { data: forums, isLoading } = useQuery({
    queryKey: ["community-forums"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("community_forums")
        .select(`
          *,
          posts:community_posts(count)
        `)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-32 mt-2" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Topic Forums</h2>
        <Badge variant="outline" className="gap-1">
          <MessageCircle className="h-3 w-3" />
          {forums?.length || 0} Categories
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forums?.map((forum) => (
          <Link key={forum.id} to={`/community/forum/${forum.id}`}>
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    {categoryIcons[forum.name] || <MessageCircle className="h-8 w-8 text-primary" />}
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {(forum.posts as any)?.[0]?.count || 0} posts
                  </Badge>
                </div>
                <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                  {forum.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {forum.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Symptoms", "Lifestyle", "Recovery"].map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
