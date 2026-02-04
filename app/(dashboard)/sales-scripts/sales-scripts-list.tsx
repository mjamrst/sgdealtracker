"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Copy, Pencil, Trash2, Filter } from "lucide-react";
import type { SalesScript, ScriptChannel } from "@/lib/types/database";

const channelLabels: Record<ScriptChannel, string> = {
  text: "Text",
  email: "Email",
  linkedin: "LinkedIn",
  social_media: "Social Media",
};

const channelColors: Record<ScriptChannel, string> = {
  text: "bg-gray-100 text-gray-700",
  email: "bg-blue-100 text-blue-700",
  linkedin: "bg-indigo-100 text-indigo-700",
  social_media: "bg-purple-100 text-purple-700",
};

interface SalesScriptsListProps {
  initialScripts: (SalesScript & { startup: { name: string } | null })[];
  startups: { id: string; name: string }[];
  isAdmin: boolean;
}

export function SalesScriptsList({ initialScripts, startups, isAdmin }: SalesScriptsListProps) {
  const [scripts, setScripts] = useState(initialScripts);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<SalesScript | null>(null);
  const [formData, setFormData] = useState({
    startup_id: startups[0]?.id || "",
    title: "",
    content: "",
    channel: "email" as ScriptChannel,
  });
  const supabase = createClient();

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch =
      script.title.toLowerCase().includes(search.toLowerCase()) ||
      script.content.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = channelFilter === "all" || script.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const resetForm = () => {
    setFormData({
      startup_id: startups[0]?.id || "",
      title: "",
      content: "",
      channel: "email",
    });
    setEditingScript(null);
  };

  const handleOpenDialog = (script?: SalesScript) => {
    if (script) {
      setEditingScript(script);
      setFormData({
        startup_id: script.startup_id,
        title: script.title,
        content: script.content,
        channel: script.channel,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingScript) {
      // Update existing script
      const { error } = await supabase
        .from("sales_scripts")
        .update({
          title: formData.title,
          content: formData.content,
          channel: formData.channel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingScript.id);

      if (error) {
        toast.error("Failed to update script");
        return;
      }

      setScripts((prev) =>
        prev.map((s) =>
          s.id === editingScript.id
            ? { ...s, ...formData, updated_at: new Date().toISOString() }
            : s
        )
      );
      toast.success("Script updated");
    } else {
      // Create new script
      const { data, error } = await supabase
        .from("sales_scripts")
        .insert({
          startup_id: formData.startup_id,
          title: formData.title,
          content: formData.content,
          channel: formData.channel,
        })
        .select("*, startup:startups(name)")
        .single();

      if (error) {
        toast.error("Failed to create script");
        return;
      }

      setScripts((prev) => [data, ...prev]);
      toast.success("Script created");
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("sales_scripts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete script");
      return;
    }

    setScripts((prev) => prev.filter((s) => s.id !== id));
    toast.success("Script deleted");
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sales Scripts</h1>
          <p className="text-sm text-muted-foreground">
            Reusable text snippets for sales outreach
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Script
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingScript ? "Edit Script" : "Add New Script"}
              </DialogTitle>
              <DialogDescription>
                {editingScript
                  ? "Update your sales script"
                  : "Create a reusable text snippet for sales outreach"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g., Initial Outreach"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(value: ScriptChannel) =>
                      setFormData((prev) => ({ ...prev, channel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(channelLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Script Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Enter your script content here..."
                  rows={10}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingScript ? "Save Changes" : "Create Script"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scripts..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {Object.entries(channelLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scripts Grid */}
      {filteredScripts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {search || channelFilter !== "all"
                ? "No scripts match your filters"
                : "No scripts yet. Create your first one!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScripts.map((script) => (
            <Card key={script.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        channelColors[script.channel]
                      }`}
                    >
                      {channelLabels[script.channel]}
                    </span>
                    <CardTitle className="text-base mt-2 truncate">
                      {script.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopy(script.content)}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(script)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Script</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{script.title}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(script.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {script.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
