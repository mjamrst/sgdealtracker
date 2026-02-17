"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import type { Product } from "@/lib/types/database";

interface ProductsListProps {
  initialProducts: (Product & { startup: { name: string } | null })[];
  startups: { id: string; name: string }[];
  isAdmin: boolean;
}

export function ProductsList({ initialProducts, startups, isAdmin }: ProductsListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    startup_id: startups[0]?.id || "",
    name: "",
    description: "",
    pricing: "",
  });
  const supabase = createClient();

  const resetForm = () => {
    setFormData({
      startup_id: startups[0]?.id || "",
      name: "",
      description: "",
      pricing: "",
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        startup_id: product.startup_id,
        name: product.name,
        description: product.description || "",
        pricing: product.pricing || "",
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

    if (editingProduct) {
      // Update existing product
      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description || null,
          pricing: formData.pricing || null,
        })
        .eq("id", editingProduct.id);

      if (error) {
        toast.error("Failed to update product");
        return;
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...p, name: formData.name, description: formData.description, pricing: formData.pricing }
            : p
        )
      );
      toast.success("Product updated");
    } else {
      // Create new product
      const { data, error } = await supabase
        .from("products")
        .insert({
          startup_id: formData.startup_id,
          name: formData.name,
          description: formData.description || null,
          pricing: formData.pricing || null,
        })
        .select("*, startup:startups(name)")
        .single();

      if (error) {
        toast.error("Failed to create product");
        return;
      }

      setProducts((prev) => [data, ...prev]);
      toast.success("Product created");
    }

    handleCloseDialog();
  };

  const handleDelete = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast.error("Failed to delete product");
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Product deleted");
  };

  // Group products by startup
  const productsByStartup = products.reduce((acc, product) => {
    const startupName = product.startup?.name || "Unknown";
    if (!acc[startupName]) {
      acc[startupName] = [];
    }
    acc[startupName].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground">Manage your product offerings and pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Update the product details"
                  : "Enter the details for the new product"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingProduct && startups.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="startup">Company</Label>
                  <Select
                    value={formData.startup_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, startup_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
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
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Monthly Trends Newsletter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Brief description of the product"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricing">Pricing</Label>
                <Input
                  id="pricing"
                  value={formData.pricing}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pricing: e.target.value }))
                  }
                  placeholder="e.g., $X/mo or $X/yr"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? "Save Changes" : "Add Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No products yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Get started by adding your first product
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(productsByStartup).map(([startupName, startupProducts]) => (
            <div key={startupName}>
              {isAdmin && Object.keys(productsByStartup).length > 1 && (
                <h2 className="text-lg font-medium mb-4">{startupName}</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {startupProducts.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
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
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{product.name}&quot;? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {product.pricing && (
                        <CardDescription className="text-primary font-medium">
                          {product.pricing}
                        </CardDescription>
                      )}
                    </CardHeader>
                    {product.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
