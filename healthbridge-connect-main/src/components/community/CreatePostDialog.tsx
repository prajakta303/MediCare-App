import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Eye, X } from "lucide-react";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forumId?: string;
}

interface CreatePostForm {
  title: string;
  content: string;
  forum_id: string;
  is_anonymous: boolean;
  tags: string[];
}

const availableTags = ["Symptoms", "Lifestyle", "Recovery", "Medication"];

export const CreatePostDialog = ({ open, onOpenChange, forumId }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { register, handleSubmit, reset, setValue, watch } = useForm<CreatePostForm>({
    defaultValues: {
      forum_id: forumId || "",
      is_anonymous: false,
      tags: [],
    },
  });

  const isAnonymous = watch("is_anonymous");

  const { data: forums } = useQuery({
    queryKey: ["community-forums"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("community_forums")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm) => {
      const { error } = await (supabase as any).from("community_posts").insert({
        title: data.title,
        content: data.content,
        forum_id: data.forum_id,
        author_id: user!.id,
        is_anonymous: data.is_anonymous,
        tags: selectedTags,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trending-posts"] });
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      toast.success("Post created successfully!");
      onOpenChange(false);
      reset();
      setSelectedTags([]);
    },
    onError: (error) => {
      console.error("Create post error:", error);
      toast.error("Failed to create post");
    },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your experiences, ask questions, or start a discussion with the community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => createPostMutation.mutate(data))} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="forum">Forum Category</Label>
            <Select 
              onValueChange={(value) => setValue("forum_id", value)} 
              defaultValue={forumId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a forum" />
              </SelectTrigger>
              <SelectContent>
                {forums?.map((forum) => (
                  <SelectItem key={forum.id} value={forum.id}>
                    {forum.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="What's your post about?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              {...register("content", { required: true })}
              placeholder="Share your thoughts, experiences, or questions..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="anonymous" className="cursor-pointer">
                  Post Anonymously
                </Label>
                <p className="text-xs text-muted-foreground">
                  Your identity will be hidden from other users
                </p>
              </div>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setValue("is_anonymous", checked)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? "Posting..." : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
