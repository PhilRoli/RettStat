"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Plus, Edit, Trash2 } from "lucide-react";
import type { Database } from "@/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type VehicleType = Database["public"]["Tables"]["vehicle_types"]["Row"];
type Unit = Database["public"]["Tables"]["units"]["Row"];

interface VehicleWithRelations extends Vehicle {
  vehicle_types?: VehicleType;
  primary_units?: Unit;
  secondary_units?: Unit;
}

export function VehiclesManagement() {
  const t = useTranslations("admin.vehicles");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  // Vehicles state
  const [vehicles, setVehicles] = useState<VehicleWithRelations[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithRelations[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Vehicle dialog state
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithRelations | null>(null);
  const [saving, setSaving] = useState(false);
  const [vehicleFormData, setVehicleFormData] = useState({
    callSign: "",
    vehicleTypeId: "",
    primaryUnitId: "",
    secondaryUnitId: "",
  });

  // Vehicle Type dialog state
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<VehicleType | null>(null);
  const [typeFormData, setTypeFormData] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#b70e0c",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVehicles(vehicles);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredVehicles(
        vehicles.filter(
          (vehicle) =>
            vehicle.call_sign.toLowerCase().includes(query) ||
            vehicle.vehicle_types?.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, vehicles]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch vehicles with relations
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select(
          `
          *,
          vehicle_types (id, name, description, icon, color),
          primary_units:units!vehicles_primary_unit_id_fkey (id, name),
          secondary_units:units!vehicles_secondary_unit_id_fkey (id, name)
        `
        )
        .order("call_sign");

      if (vehiclesError) throw vehiclesError;

      // Fetch vehicle types
      const { data: typesData, error: typesError } = await supabase
        .from("vehicle_types")
        .select("*")
        .order("name");

      if (typesError) throw typesError;

      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .order("name");

      if (unitsError) throw unitsError;

      setVehicles((vehiclesData as VehicleWithRelations[]) || []);
      setFilteredVehicles((vehiclesData as VehicleWithRelations[]) || []);
      setVehicleTypes(typesData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: t("fetchErrorTitle"),
        description: t("fetchErrorDescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Vehicle CRUD operations
  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setVehicleFormData({
      callSign: "",
      vehicleTypeId: "",
      primaryUnitId: "",
      secondaryUnitId: "",
    });
    setVehicleDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: VehicleWithRelations) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      callSign: vehicle.call_sign,
      vehicleTypeId: vehicle.vehicle_type_id,
      primaryUnitId: vehicle.primary_unit_id,
      secondaryUnitId: vehicle.secondary_unit_id || "",
    });
    setVehicleDialogOpen(true);
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const vehicleData = {
        call_sign: vehicleFormData.callSign,
        vehicle_type_id: vehicleFormData.vehicleTypeId,
        primary_unit_id: vehicleFormData.primaryUnitId,
        secondary_unit_id: vehicleFormData.secondaryUnitId || null,
      };

      if (selectedVehicle) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("vehicles")
          .update(vehicleData)
          .eq("id", selectedVehicle.id);

        if (error) throw error;

        toast({
          title: t("vehicleUpdateSuccessTitle"),
          description: t("vehicleUpdateSuccessDescription"),
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("vehicles").insert([vehicleData]);

        if (error) throw error;

        toast({
          title: t("vehicleCreateSuccessTitle"),
          description: t("vehicleCreateSuccessDescription"),
        });
      }

      setVehicleDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast({
        variant: "destructive",
        title: t("vehicleSaveErrorTitle"),
        description: t("vehicleSaveErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: VehicleWithRelations) => {
    if (!confirm(t("deleteVehicleConfirm"))) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicle.id);

      if (error) throw error;

      toast({
        title: t("vehicleDeleteSuccessTitle"),
        description: t("vehicleDeleteSuccessDescription"),
      });

      await fetchData();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast({
        variant: "destructive",
        title: t("vehicleDeleteErrorTitle"),
        description: t("vehicleDeleteErrorDescription"),
      });
    }
  };

  // Vehicle Type CRUD operations
  const handleAddType = () => {
    setSelectedType(null);
    setTypeFormData({
      name: "",
      description: "",
      icon: "",
      color: "#b70e0c",
    });
    setTypeDialogOpen(true);
  };

  const handleEditType = (type: VehicleType) => {
    setSelectedType(type);
    setTypeFormData({
      name: type.name,
      description: type.description || "",
      icon: type.icon || "",
      color: type.color || "#b70e0c",
    });
    setTypeDialogOpen(true);
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const typeData = {
        name: typeFormData.name,
        description: typeFormData.description || null,
        icon: typeFormData.icon || null,
        color: typeFormData.color,
      };

      if (selectedType) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("vehicle_types")
          .update(typeData)
          .eq("id", selectedType.id);

        if (error) throw error;

        toast({
          title: t("typeUpdateSuccessTitle"),
          description: t("typeUpdateSuccessDescription"),
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("vehicle_types").insert([typeData]);

        if (error) throw error;

        toast({
          title: t("typeCreateSuccessTitle"),
          description: t("typeCreateSuccessDescription"),
        });
      }

      setTypeDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving vehicle type:", error);
      toast({
        variant: "destructive",
        title: t("typeSaveErrorTitle"),
        description: t("typeSaveErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async (type: VehicleType) => {
    if (!confirm(t("deleteTypeConfirm"))) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("vehicle_types").delete().eq("id", type.id);

      if (error) throw error;

      toast({
        title: t("typeDeleteSuccessTitle"),
        description: t("typeDeleteSuccessDescription"),
      });

      await fetchData();
    } catch (error) {
      console.error("Error deleting vehicle type:", error);
      toast({
        variant: "destructive",
        title: t("typeDeleteErrorTitle"),
        description: t("typeDeleteErrorDescription"),
      });
    }
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Tabs for Vehicles and Vehicle Types */}
      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vehicles">{t("vehiclesTab")}</TabsTrigger>
          <TabsTrigger value="types">{t("typesTab")}</TabsTrigger>
        </TabsList>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          {/* Search & Add Button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleAddVehicle}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addVehicle")}
            </Button>
          </div>

          {/* Vehicles Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("callSignColumn")}</TableHead>
                    <TableHead>{t("typeColumn")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("primaryUnitColumn")}</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {t("secondaryUnitColumn")}
                    </TableHead>
                    <TableHead className="text-right">{t("actionsColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {searchQuery ? t("noResults") : t("noVehicles")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.call_sign}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {vehicle.vehicle_types?.color && (
                              <div
                                className="h-4 w-4 rounded"
                                style={{ backgroundColor: vehicle.vehicle_types.color }}
                              />
                            )}
                            {vehicle.vehicle_types?.name || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {vehicle.primary_units?.name || "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {vehicle.secondary_units?.name || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVehicle(vehicle)}
                              title={t("editButton")}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVehicle(vehicle)}
                              title={t("deleteButton")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Vehicle Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAddType}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addType")}
            </Button>
          </div>

          {/* Vehicle Types Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("nameColumn")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("descriptionColumn")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("iconColumn")}</TableHead>
                    <TableHead>{t("colorColumn")}</TableHead>
                    <TableHead className="text-right">{t("actionsColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {t("noTypes")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicleTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {type.description || "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{type.icon || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-6 w-6 rounded border"
                              style={{ backgroundColor: type.color || "#b70e0c" }}
                            />
                            <span className="text-muted-foreground text-sm">
                              {type.color || "#b70e0c"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditType(type)}
                              title={t("editButton")}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteType(type)}
                              title={t("deleteButton")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Vehicle Add/Edit Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicle ? t("editVehicleTitle") : t("addVehicleTitle")}
            </DialogTitle>
            <DialogDescription>{t("vehicleDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVehicleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="callSign">{t("callSignLabel")}</Label>
                <Input
                  id="callSign"
                  value={vehicleFormData.callSign}
                  onChange={(e) =>
                    setVehicleFormData({ ...vehicleFormData, callSign: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicleType">{t("typeLabel")}</Label>
                <Select
                  value={vehicleFormData.vehicleTypeId}
                  onValueChange={(value) =>
                    setVehicleFormData({ ...vehicleFormData, vehicleTypeId: value })
                  }
                >
                  <SelectTrigger id="vehicleType">
                    <SelectValue placeholder={t("selectTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="primaryUnit">{t("primaryUnitLabel")}</Label>
                <Select
                  value={vehicleFormData.primaryUnitId}
                  onValueChange={(value) =>
                    setVehicleFormData({ ...vehicleFormData, primaryUnitId: value })
                  }
                >
                  <SelectTrigger id="primaryUnit">
                    <SelectValue placeholder={t("selectUnitPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secondaryUnit">{t("secondaryUnitLabel")}</Label>
                <Select
                  value={vehicleFormData.secondaryUnitId}
                  onValueChange={(value) =>
                    setVehicleFormData({ ...vehicleFormData, secondaryUnitId: value })
                  }
                >
                  <SelectTrigger id="secondaryUnit">
                    <SelectValue placeholder={t("selectUnitPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("noSecondaryUnit")}</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVehicleDialogOpen(false)}>
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

      {/* Vehicle Type Add/Edit Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedType ? t("editTypeTitle") : t("addTypeTitle")}</DialogTitle>
            <DialogDescription>{t("typeDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTypeSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="typeName">{t("nameLabel")}</Label>
                <Input
                  id="typeName"
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="typeDescription">{t("descriptionLabel")}</Label>
                <Textarea
                  id="typeDescription"
                  value={typeFormData.description}
                  onChange={(e) =>
                    setTypeFormData({ ...typeFormData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="typeIcon">{t("iconLabel")}</Label>
                <Input
                  id="typeIcon"
                  value={typeFormData.icon}
                  onChange={(e) => setTypeFormData({ ...typeFormData, icon: e.target.value })}
                  placeholder="car, truck, ambulance"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="typeColor">{t("colorLabel")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="typeColor"
                    type="color"
                    value={typeFormData.color}
                    onChange={(e) => setTypeFormData({ ...typeFormData, color: e.target.value })}
                    className="h-10 w-20"
                  />
                  <Input
                    type="text"
                    value={typeFormData.color}
                    onChange={(e) => setTypeFormData({ ...typeFormData, color: e.target.value })}
                    placeholder="#b70e0c"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)}>
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
