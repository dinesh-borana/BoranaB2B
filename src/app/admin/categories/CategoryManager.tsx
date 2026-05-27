"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";

type Category = { id: string; name: string; slug: string; imageUrl: string | null; sortOrder: number };

export function CategoryManager({
  initial,
}: {
  initial: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newImage, setNewImage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editSort, setEditSort] = useState("");
  const [loading, setLoading] = useState(false);

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newSlug) return;
    setLoading(true);
    const fd = new FormData();
    fd.set("name", newName);
    fd.set("slug", newSlug);
    fd.set("imageUrl", newImage);
    fd.set("sortOrder", String(categories.length + 1));
    await createCategory(fd);
    setNewName("");
    setNewSlug("");
    setNewImage("");
    setLoading(false);
  }

  async function handleUpdate(cat: Category) {
    setLoading(true);
    const fd = new FormData();
    fd.set("name", editName);
    fd.set("slug", editSlug);
    fd.set("imageUrl", editImage);
    fd.set("sortOrder", editSort || String(cat.sortOrder));
    await updateCategory(cat.id, fd);
    setEditingId(null);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in this category will lose their category.")) return;
    setLoading(true);
    await deleteCategory(id);
    setCategories(categories.filter((c) => c.id !== id));
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="Category name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug) setNewSlug(slugify(e.target.value));
                }}
                required
              />
              <Input
                placeholder="slug"
                value={newSlug}
                onChange={(e) => setNewSlug(slugify(e.target.value))}
                required
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Image URL (https://...)"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="admin" size="md" disabled={loading}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-2">
        {categories.map((c) => (
          <Card key={c.id}>
            <CardBody className="flex items-center gap-3">
              {editingId === c.id ? (
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      placeholder="Name"
                    />
                    <Input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="flex-1"
                      placeholder="Slug"
                    />
                    <Input
                      type="number"
                      value={editSort}
                      onChange={(e) => setEditSort(e.target.value)}
                      className="w-20"
                      placeholder="Order"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      className="flex-1"
                      placeholder="Image URL (https://...)"
                    />
                    <Button
                      type="button"
                      variant="admin"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleUpdate(c)}
                    >
                      <Save className="h-4 w-4" /> Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-stone-300">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-900">{c.name}</p>
                    <p className="text-xs text-stone-500">
                      /{c.slug} · order {c.sortOrder}
                      {c.imageUrl && <span className="ml-1 text-green-600">· image set</span>}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                      setEditSlug(c.slug);
                      setEditImage(c.imageUrl ?? "");
                      setEditSort(String(c.sortOrder));
                    }}
                  >
                    Edit
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={loading}
                    className="grid h-9 w-9 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </CardBody>
          </Card>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-stone-500">
            No categories yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}
