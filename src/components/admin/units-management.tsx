"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Edit, Trash2, ChevronRight } from "lucide-react";
import type { Database } from "@/types/database";

type Unit = Database["public"]["Tables"]["units"]["Row"];

interface UnitTreeNode extends Unit {
  children?: UnitTreeNode[];
  level?: number;
}

export function UnitsManagement() {
  const t = useTranslations("admin.units");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [units, setUnits] = useState<Unit[]>([]);
  const [unitTree, setUnitTree] = useState<UnitTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    parentUnitId: "",
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    buildUnitTree();
  }, [units]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase.from("units").select("*").order("name");

      if (error) throw error;

      setUnits(data || []);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast({
        variant: "destructive",
        title: t("fetchErrorTitle"),
        description: t("fetchErrorDescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  const buildUnitTree = () => {
    const unitMap = new Map<string, UnitTreeNode>();
    const roots: UnitTreeNode[] = [];

    // Create map of all units
    units.forEach((unit) => {
      unitMap.set(unit.id, { ...unit, children: [], level: 0 });
    });

    // Build tree structure
    unitMap.forEach((unit) => {
      if (unit.parent_unit_id) {
        const parent = unitMap.get(unit.parent_unit_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(unit);
        } else {
          // Parent not found, treat as root
          roots.push(unit);
        }
      } else {
        roots.push(unit);
      }
    });

    // Set levels recursively
    const setLevels = (nodes: UnitTreeNode[], level: number) => {
      nodes.forEach((node) => {
        node.level = level;
        if (node.children && node.children.length > 0) {
          setLevels(node.children, level + 1);
        }
      });
    };

    setLevels(roots, 0);

    setUnitTree(roots);
  };

  const flattenTree = (nodes: UnitTreeNode[]): UnitTreeNode[] => {
    const result: UnitTreeNode[] = [];

    const traverse = (items: UnitTreeNode[]) => {
      items.forEach((item) => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };

    traverse(nodes);
    return result;
  };

  const handleAdd = () => {
    setSelectedUnit(null);
    setFormData({
      name: "",
      parentUnitId: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      parentUnitId: unit.parent_unit_id || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const unitData = {
        name: formData.name,
        parent_unit_id: formData.parentUnitId || null,
      };

      if (selectedUnit) {
        // Prevent circular references (check if parent is the unit itself or any descendant)
        if (formData.parentUnitId) {
          const isCircular = (parentId: string): boolean => {
            if (parentId === selectedUnit.id) return true;
            const parent = units.find((u) => u.id === parentId);
            if (!parent || !parent.parent_unit_id) return false;
            return isCircular(parent.parent_unit_id);
          };

          if (isCircular(formData.parentUnitId)) {
            toast({
              variant: "destructive",
              title: t("circularRefErrorTitle"),
              description: t("circularRefErrorDescription"),
            });
            setSaving(false);
            return;
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("units")
          .update(unitData)
          .eq("id", selectedUnit.id);

        if (error) throw error;

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("units").insert([unitData]);

        if (error) throw error;

        toast({
          title: t("createSuccessTitle"),
          description: t("createSuccessDescription"),
        });
      }

      setDialogOpen(false);
      await fetchUnits();
    } catch (error) {
      console.error("Error saving unit:", error);
      toast({
        variant: "destructive",
        title: t("saveErrorTitle"),
        description: t("saveErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit: Unit) => {
    if (!confirm(t("deleteConfirm"))) return;

    // Check if unit has children
    const hasChildren = units.some((u) => u.parent_unit_id === unit.id);
    if (hasChildren) {
      toast({
        variant: "destructive",
        title: t("deleteErrorTitle"),
        description: t("hasChildrenError"),
      });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("units").delete().eq("id", unit.id);

      if (error) throw error;

      toast({
        title: t("deleteSuccessTitle"),
        description: t("deleteSuccessDescription"),
      });

      await fetchUnits();
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast({
        variant: "destructive",
        title: t("deleteErrorTitle"),
        description: t("deleteErrorDescription"),
      });
    }
  };

  const renderUnitRow = (unit: UnitTreeNode) => {
    const indentStyle = {
      paddingLeft: `${(unit.level || 0) * 2}rem`,
    };

    return (
      <div key={unit.id}>
        <div className="hover:bg-muted/50 flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2" style={indentStyle}>
            {(unit.level || 0) > 0 && <ChevronRight className="text-muted-foreground h-4 w-4" />}
            <span className="font-medium">{unit.name}</span>
            {(unit.children?.length || 0) > 0 && (
              <span className="text-muted-foreground text-sm">
                ({unit.children?.length} {t("subUnits")})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(unit)}
              title={t("editButton")}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(unit)}
              title={t("deleteButton")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {unit.children && unit.children.length > 0 && (
          <div>{unit.children.map((child) => renderUnitRow(child))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addUnit")}
        </Button>
      </div>

      {/* Unit Tree */}
      <div className="rounded-md border">
        {unitTree.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{t("noUnits")}</p>
          </div>
        ) : (
          <div>{unitTree.map((unit) => renderUnitRow(unit))}</div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedUnit ? t("editUnitTitle") : t("addUnitTitle")}</DialogTitle>
            <DialogDescription>{t("unitDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("nameLabel")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parentUnit">{t("parentUnitLabel")}</Label>
                <Select
                  value={formData.parentUnitId}
                  onValueChange={(value) => setFormData({ ...formData, parentUnitId: value })}
                >
                  <SelectTrigger id="parentUnit">
                    <SelectValue placeholder={t("noParentUnit")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("noParentUnit")}</SelectItem>
                    {units
                      .filter((u) => u.id !== selectedUnit?.id) // Prevent self-selection
                      .map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
