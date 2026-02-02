"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { pb } from "@/lib/pocketbase";
import type { VehicleRecord, VehicleTypeRecord, UnitRecord } from "@/lib/pocketbase/types";
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

interface VehicleWithRelations extends VehicleRecord {
  expand?: {
    vehicle_type?: VehicleTypeRecord;
    unit?: UnitRecord;
  };
}

export function VehiclesManagement() {
  const t = useTranslations("admin.vehicles");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  // Vehicles state
  const [vehicles, setVehicles] = useState<VehicleWithRelations[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithRelations[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Vehicle dialog state
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithRelations | null>(null);
  const [saving, setSaving] = useState(false);
  const [vehicleFormData, setVehicleFormData] = useState({
    callSign: "",
    vehicleTypeId: "",
    unitId: "",
    status: "active" as VehicleRecord["status"],
    registrationNumber: "",
  });

  // Vehicle Type dialog state
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<VehicleTypeRecord | null>(null);
  const [typeFormData, setTypeFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            vehicle.expand?.vehicle_type?.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, vehicles]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch vehicles with relations
      const vehiclesData = await pb.collection("vehicles").getFullList<VehicleWithRelations>({
        sort: "call_sign",
        expand: "vehicle_type,unit",
      });

      // Fetch vehicle types
      const typesData = await pb.collection("vehicle_types").getFullList<VehicleTypeRecord>({
        sort: "name",
      });

      // Fetch units
      const unitsData = await pb.collection("units").getFullList<UnitRecord>({
        sort: "name",
      });

      setVehicles(vehiclesData);
      setFilteredVehicles(vehiclesData);
      setVehicleTypes(typesData);
      setUnits(unitsData);
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
      unitId: "",
      status: "active",
      registrationNumber: "",
    });
    setVehicleDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: VehicleWithRelations) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      callSign: vehicle.call_sign,
      vehicleTypeId: vehicle.vehicle_type,
      unitId: vehicle.unit,
      status: vehicle.status,
      registrationNumber: vehicle.registration_number || "",
    });
    setVehicleDialogOpen(true);
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const vehicleData = {
        call_sign: vehicleFormData.callSign,
        vehicle_type: vehicleFormData.vehicleTypeId,
        unit: vehicleFormData.unitId,
        status: vehicleFormData.status,
        registration_number: vehicleFormData.registrationNumber || undefined,
      };

      if (selectedVehicle) {
        await pb.collection("vehicles").update(selectedVehicle.id, vehicleData);

        toast({
          title: t("vehicleUpdateSuccessTitle"),
          description: t("vehicleUpdateSuccessDescription"),
        });
      } else {
        await pb.collection("vehicles").create(vehicleData);

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
      await pb.collection("vehicles").delete(vehicle.id);

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
    });
    setTypeDialogOpen(true);
  };

  const handleEditType = (type: VehicleTypeRecord) => {
    setSelectedType(type);
    setTypeFormData({
      name: type.name,
      description: type.description || "",
    });
    setTypeDialogOpen(true);
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const typeData = {
        name: typeFormData.name,
        description: typeFormData.description || undefined,
        required_qualifications: [],
      };

      if (selectedType) {
        await pb.collection("vehicle_types").update(selectedType.id, typeData);

        toast({
          title: t("typeUpdateSuccessTitle"),
          description: t("typeUpdateSuccessDescription"),
        });
      } else {
        await pb.collection("vehicle_types").create(typeData);

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

  const handleDeleteType = async (type: VehicleTypeRecord) => {
    if (!confirm(t("deleteTypeConfirm"))) return;

    try {
      await pb.collection("vehicle_types").delete(type.id);

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
                    <TableHead className="hidden md:table-cell">{t("unitColumn")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("statusColumn")}</TableHead>
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
                        <TableCell>{vehicle.expand?.vehicle_type?.name || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {vehicle.expand?.unit?.name || "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{vehicle.status}</TableCell>
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
                    <TableHead className="text-right">{t("actionsColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
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
        <DialogContent className="sm:max-w-md">
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
                <Label htmlFor="unit">{t("unitLabel")}</Label>
                <Select
                  value={vehicleFormData.unitId}
                  onValueChange={(value) =>
                    setVehicleFormData({ ...vehicleFormData, unitId: value })
                  }
                >
                  <SelectTrigger id="unit">
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
                <Label htmlFor="status">{t("statusLabel")}</Label>
                <Select
                  value={vehicleFormData.status}
                  onValueChange={(value: VehicleRecord["status"]) =>
                    setVehicleFormData({ ...vehicleFormData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t("selectStatusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("statusActive")}</SelectItem>
                    <SelectItem value="maintenance">{t("statusMaintenance")}</SelectItem>
                    <SelectItem value="inactive">{t("statusInactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registrationNumber">{t("registrationNumberLabel")}</Label>
                <Input
                  id="registrationNumber"
                  value={vehicleFormData.registrationNumber}
                  onChange={(e) =>
                    setVehicleFormData({ ...vehicleFormData, registrationNumber: e.target.value })
                  }
                />
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
        <DialogContent className="sm:max-w-md">
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
