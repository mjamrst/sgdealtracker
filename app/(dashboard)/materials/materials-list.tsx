"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Upload, FileText, Trash2, Download, FolderOpen } from "lucide-react";
import type { Material, MaterialType, MaterialVersion } from "@/lib/types/database";

const typeLabels: Record<MaterialType, string> = {
  pitch_deck: "Pitch Deck",
  trend_report: "Trend Report",
  other: "Other",
};

const typeColors: Record<MaterialType, string> = {
  pitch_deck: "bg-blue-100 text-blue-700",
  trend_report: "bg-purple-100 text-purple-700",
  other: "bg-slate-100 text-slate-700",
};

interface MaterialWithVersions extends Material {
  startup: { name: string } | null;
  versions: MaterialVersion[];
}

interface MaterialsListProps {
  initialMaterials: MaterialWithVersions[];
  startups: { id: string; name: string }[];
  isAdmin: boolean;
}

export function MaterialsList({ initialMaterials, startups, isAdmin }: MaterialsListProps) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState<MaterialWithVersions | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    startup_id: startups[0]?.id || "",
    name: "",
    type: "other" as MaterialType,
    notes: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const resetForm = () => {
    setFormData({
      startup_id: startups[0]?.id || "",
      name: "",
      type: "other",
      notes: "",
    });
    setSelectedFile(null);
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);

    try {
      // Create the material record
      const { data: material, error: materialError } = await supabase
        .from("materials")
        .insert({
          startup_id: formData.startup_id,
          name: formData.name,
          type: formData.type,
          notes: formData.notes || null,
        })
        .select("*, startup:startups(name)")
        .single();

      if (materialError) throw materialError;

      // Upload the file
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${formData.startup_id}/${material.id}/v1.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create version record
      const { data: { user } } = await supabase.auth.getUser();
      const { data: version, error: versionError } = await supabase
        .from("material_versions")
        .insert({
          material_id: material.id,
          version_number: 1,
          file_path: filePath,
          file_name: selectedFile.name,
          uploaded_by: user?.id || "",
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Log activity
      await supabase.from("activity_log").insert({
        startup_id: formData.startup_id,
        user_id: user?.id || "",
        action_type: "material_uploaded",
        description: `Uploaded ${formData.name} (v1)`,
      });

      setMaterials((prev) => [{ ...material, versions: [version] }, ...prev]);
      setIsDialogOpen(false);
      resetForm();
      toast.success("Material uploaded successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to upload material");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadingMaterial || !selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const nextVersion = (uploadingMaterial.versions.length || 0) + 1;
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${uploadingMaterial.startup_id}/${uploadingMaterial.id}/v${nextVersion}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: version, error: versionError } = await supabase
        .from("material_versions")
        .insert({
          material_id: uploadingMaterial.id,
          version_number: nextVersion,
          file_path: filePath,
          file_name: selectedFile.name,
          uploaded_by: user?.id || "",
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Log activity
      await supabase.from("activity_log").insert({
        startup_id: uploadingMaterial.startup_id,
        user_id: user?.id || "",
        action_type: "material_uploaded",
        description: `Uploaded ${uploadingMaterial.name} (v${nextVersion})`,
      });

      setMaterials((prev) =>
        prev.map((m) =>
          m.id === uploadingMaterial.id
            ? { ...m, versions: [...m.versions, version] }
            : m
        )
      );

      setIsUploadDialogOpen(false);
      setUploadingMaterial(null);
      setSelectedFile(null);
      toast.success(`Version ${nextVersion} uploaded`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to upload version");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("materials")
      .download(filePath);

    if (error) {
      toast.error("Failed to download file");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (materialId: string, startupId: string) => {
    const material = materials.find((m) => m.id === materialId);
    if (!material) return;

    // Delete files from storage
    for (const version of material.versions) {
      await supabase.storage.from("materials").remove([version.file_path]);
    }

    // Delete material record (cascades to versions)
    const { error } = await supabase.from("materials").delete().eq("id", materialId);

    if (error) {
      toast.error("Failed to delete material");
      return;
    }

    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    toast.success("Material deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Materials Library</h1>
          <p className="text-muted-foreground">Upload and manage sales materials</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>Upload a new sales material</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              {startups.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="startup">Startup</Label>
                  <Select
                    value={formData.startup_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, startup_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select startup" />
                    </SelectTrigger>
                    <SelectContent>
                      {startups.map((startup) => (
                        <SelectItem key={startup.id} value={startup.id}>
                          {startup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Material Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Q1 2024 Trends Deck"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: MaterialType) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.pptx,.ppt,.doc,.docx,.xls,.xlsx"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Accepted: PDF, PowerPoint, Word, Excel
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Optional notes about this material"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Material"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upload Version Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Upload a new version of {uploadingMaterial?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadVersion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version-file">File *</Label>
              <Input
                id="version-file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.pptx,.ppt,.doc,.docx,.xls,.xlsx"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setUploadingMaterial(null);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Version"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No materials yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Upload your first sales material
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {materials.map((material) => (
            <Card key={material.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{material.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={typeColors[material.type]} variant="secondary">
                          {typeLabels[material.type]}
                        </Badge>
                        {isAdmin && material.startup && (
                          <span className="text-xs text-muted-foreground">
                            {material.startup.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setUploadingMaterial(material);
                        setIsUploadDialogOpen(true);
                      }}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Material</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{material.name}&quot;? This will
                            delete all versions and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(material.id, material.startup_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {material.notes && (
                  <CardDescription className="mt-2">{material.notes}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-medium mb-2">
                  Versions ({material.versions.length})
                </div>
                <div className="space-y-2">
                  {material.versions
                    .sort((a, b) => b.version_number - a.version_number)
                    .map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div>
                          <span className="text-sm font-medium">v{version.version_number}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {version.file_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(version.uploaded_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownload(version.file_path, version.file_name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
