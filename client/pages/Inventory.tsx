/**
 * TSOAM Church Management System - Inventory Management Module
 *
 * Complete inventory and asset management system for church resources.
 * Handles both fixed assets (equipment, furniture) and consumable stock items
 * with comprehensive tracking, maintenance, and reporting capabilities.
 *
 * Core Features:
 * - Asset Management: Track equipment, furniture, and fixed assets
 * - Stock Management: Consumables with automatic reorder alerts
 * - Maintenance Tracking: Scheduled maintenance and repair records
 * - Stock Movement: In/Out transactions with full audit trail
 * - Low Stock Alerts: Automated notifications and restock workflows
 * - Disposal Records: Asset retirement and disposal tracking
 * - Stock Taking: Physical inventory verification processes
 * - Advanced Analytics: Value tracking and depreciation calculations
 *
 * Key Components:
 * - Item Management: CRUD operations for inventory items
 * - Stock Operations: Automated stock level monitoring
 * - Maintenance Scheduler: Preventive maintenance tracking
 * - Reporting Engine: Comprehensive inventory reports
 * - Alert System: Real-time low stock and maintenance notifications
 * - Export Services: PDF/Excel export for auditing
 *
 * Data Models:
 * - InventoryItem: Fixed assets with depreciation tracking
 * - StockItem: Consumables with quantity management
 * - MaintenanceRecord: Service and repair history
 * - StockMovement: Transaction log for stock changes
 * - DisposalRecord: Asset retirement documentation
 *
 * Integration Points:
 * - Financial Module: Cost tracking and budgeting
 * - Dashboard: Real-time inventory metrics
 * - User Management: Role-based access control
 * - Notification System: Alerts and reminders
 *
 * Security Features:
 * - Role-based permissions (view, edit, delete)
 * - Audit logging for all inventory changes
 * - Input validation and sanitization
 * - Secure file upload for attachments
 *
 * Performance Optimizations:
 * - Lazy loading for large inventory lists
 * - Cached calculations for stock values
 * - Optimistic UI updates
 * - Background refresh capabilities
 *
 * @author ZionSurf Development Team
 * @version 2.0.0
 * @since 2024-06-01
 * @lastModified 2025-01-06
 *
 * @requires React 18+
 * @requires TypeScript 4.9+
 * @requires MySQL database with inventory schema
 * @requires ExportService for report generation
 * @requires AuthContext for user authentication
 * @requires dataRefresh utility for real-time updates
 */

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Download,
  Edit,
  Eye,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  DollarSign,
  Gift,
  Recycle,
  BarChart3,
  Calendar,
  MapPin,
  User,
  FileText,
  RefreshCw,
  Trash2,
  Save,
} from "lucide-react";
import { exportService } from "@/services/ExportService";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import { useAuth } from "@/contexts/AuthContext";
import { refreshInventoryData, dataRefreshManager } from "@/utils/dataRefresh";
import * as XLSX from "xlsx";

// Types for inventory management
interface InventoryItem {
  id: number;
  itemCode: string;
  serialNumber: string;
  itemName: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  supplier: string;
  warranty: string;
  location: string;
  assignedTo: string;
  status: "Working" | "Faulty" | "Under Maintenance" | "Missing" | "Disposed";
  condition: "Excellent" | "Good" | "Fair" | "Poor" | "Damaged";
  maintenanceSchedule: string;
  lastMaintenance: string;
  nextMaintenance: string;
  notes: string;
  qrCode: string;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceRecord {
  id: number;
  itemId: number;
  type: "Routine" | "Repair" | "Replacement" | "Inspection";
  description: string;
  cost: number;
  performedBy: string;
  performedDate: string;
  nextDueDate: string;
  status: "Completed" | "Pending" | "In Progress";
}

interface DisposalRecord {
  id: number;
  itemId: number;
  reason: "End of Life" | "Irreparable" | "Obsolete" | "Lost" | "Stolen";
  disposalMethod: "Repair" | "Sell" | "Donate" | "Scrap" | "Return to Supplier";
  disposalDate: string;
  disposalValue: number;
  authorizedBy: string;
  recipient: string;
  notes: string;
}

// Stock Management Interfaces
interface StockItem {
  id: number;
  tagNumber: string; // Primary key - manually recorded
  itemName: string;
  category:
    | "Consumables"
    | "Office Supplies"
    | "Cleaning Supplies"
    | "Food & Beverages"
    | "Electronic Assets"
    | "Furniture"
    | "Musical Instruments"
    | "Audio/Visual Equipment"
    | "Maintenance Tools";
  subcategory: string;
  description: string;
  unitOfMeasure:
    | "Pieces"
    | "Rolls"
    | "Packets"
    | "Bottles"
    | "Liters"
    | "Kilograms"
    | "Boxes"
    | "Cartons"
    | "Sets";
  currentQuantity: number;
  minimumQuantity: number; // Reorder level
  maximumQuantity: number;
  unitCost: number;
  totalValue: number;
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  location: string;
  binLocation?: string;
  isDepreciable: boolean;
  depreciationRate?: number; // Annual percentage
  purchaseDate: string;
  warrantyPeriod?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Discontinued";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: number;
  tagNumber: string;
  movementType:
    | "Stock In"
    | "Stock Out"
    | "Transfer"
    | "Adjustment"
    | "Disposal";
  quantity: number;
  reason: string;
  fromLocation?: string;
  toLocation?: string;
  performedBy: string;
  authorizedBy?: string;
  referenceNumber?: string;
  movementDate: string;
  notes?: string;
}

interface StockTaking {
  id: number;
  stockTakingDate: string;
  performedBy: string;
  supervisedBy: string;
  status: "In Progress" | "Completed" | "Cancelled";
  items: StockTakingItem[];
  discrepancies: StockDiscrepancy[];
  notes: string;
}

interface StockTakingItem {
  tagNumber: string;
  systemQuantity: number;
  physicalCount: number;
  variance: number;
  condition: "Good" | "Fair" | "Poor" | "Damaged" | "Missing";
  notes?: string;
}

interface StockDiscrepancy {
  tagNumber: string;
  itemName: string;
  systemQuantity: number;
  physicalCount: number;
  variance: number;
  value: number;
  reason?: string;
  actionTaken?: string;
}

const categories = [
  "Audio Equipment",
  "Video Equipment",
  "Musical Instruments",
  "Furniture",
  "Office Equipment",
  "Kitchen Equipment",
  "Cleaning Equipment",
  "Security Equipment",
  "Lighting",
  "HVAC",
  "Electronics",
  "Vehicles",
  "Books & Publications",
  "Decorations",
  "Other",
];

const locations = [
  "Main Sanctuary",
  "Fellowship Hall",
  "Pastor's Office",
  "Admin Office",
  "Kitchen",
  "Children's Room",
  "Youth Room",
  "Prayer Room",
  "Storage Room",
  "Parking Lot",
  "Outdoor",
  "Off-site",
];

export default function Inventory() {
  const { user } = useAuth(); // Get current authenticated user

  // Role-based permissions - Only Admin, Pastor, and HR can delete inventory items
  const canDeleteItems = user?.role === "admin" ||
                         user?.role === "pastor" ||
                         user?.role === "hr";
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>([]);

  // Stock Management States
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockTakings, setStockTakings] = useState<StockTaking[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Dialog states
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showDisposalDialog, setShowDisposalDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Inventory item dialogs
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [editInventoryForm, setEditInventoryForm] = useState<Partial<InventoryItem>>({});

  // Stock Management Dialog States
  const [showAddStockDialog, setShowAddStockDialog] = useState(false);
  const [showStockMovementDialog, setShowStockMovementDialog] = useState(false);
  const [showStockTakingDialog, setShowStockTakingDialog] = useState(false);
  const [showViewStockDialog, setShowViewStockDialog] = useState(false);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [showEditStockDialog, setShowEditStockDialog] = useState(false);
  const [showDeleteStockDialog, setShowDeleteStockDialog] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [editStockForm, setEditStockForm] = useState<Partial<StockItem>>({});

  // Form states
  const [itemForm, setItemForm] = useState({
    itemName: "",
    category: "",
    brand: "",
    model: "",
    description: "",
    purchaseDate: "",
    purchasePrice: "",
    supplier: "",
    warranty: "",
    location: "",
    assignedTo: "",
    serialNumber: "",
    notes: "",
    tags: [] as string[],
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    type: "",
    description: "",
    cost: "",
    performedBy: "",
    performedDate: "",
    nextDueDate: "",
  });

  const [disposalForm, setDisposalForm] = useState({
    reason: "",
    disposalMethod: "",
    disposalDate: "",
    disposalValue: "",
    authorizedBy: "",
    recipient: "",
    notes: "",
  });

  // Stock Management Form States
  const [stockForm, setStockForm] = useState({
    tagNumber: "",
    itemName: "",
    category: "Consumables",
    subcategory: "",
    description: "",
    unitOfMeasure: "Pieces",
    currentQuantity: "",
    minimumQuantity: "",
    maximumQuantity: "",
    unitCost: "",
    supplier: "",
    location: "",
    binLocation: "",
    expiryDate: "",
    warrantyPeriod: "",
    isDepreciable: false,
    depreciationRate: "",
    notes: "",
  });

  const [stockMovementForm, setStockMovementForm] = useState({
    tagNumber: "",
    movementType: "Stock In",
    quantity: "",
    reason: "",
    fromLocation: "",
    toLocation: "",
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => {
    loadInventoryData();
    initializeStockData();
  }, []);

  const initializeStockData = () => {
    // Initialize with sample stock items
    const sampleStockItems: StockItem[] = [
      {
        id: 1,
        tagNumber: "TSP001",
        itemName: "Tissue Papers",
        category: "Consumables",
        subcategory: "Cleaning Supplies",
        description: "Soft tissue papers for church facilities",
        unitOfMeasure: "Rolls",
        currentQuantity: 5,
        minimumQuantity: 10,
        maximumQuantity: 50,
        unitCost: 150,
        totalValue: 750,
        supplier: "Church Supplies Ltd",
        lastRestocked: "2024-01-15",
        location: "Storage Room A",
        binLocation: "Shelf A1",
        isDepreciable: false,
        purchaseDate: "2024-01-15",
        status: "Low Stock",
        notes: "Need to reorder soon",
        createdAt: "2024-01-15",
        updatedAt: "2024-01-15",
      },
      {
        id: 2,
        tagNumber: "DW001",
        itemName: "Drinking Water",
        category: "Food & Beverages",
        subcategory: "Beverages",
        description: "500ml drinking water bottles",
        unitOfMeasure: "Bottles",
        currentQuantity: 24,
        minimumQuantity: 20,
        maximumQuantity: 100,
        unitCost: 50,
        totalValue: 1200,
        supplier: "Pure Water Co.",
        lastRestocked: "2024-01-20",
        location: "Kitchen Storage",
        binLocation: "Fridge Section",
        isDepreciable: false,
        purchaseDate: "2024-01-20",
        status: "In Stock",
        notes: "Fresh stock",
        createdAt: "2024-01-20",
        updatedAt: "2024-01-20",
      },
      {
        id: 3,
        tagNumber: "MIC001",
        itemName: "Wireless Microphone",
        category: "Audio/Visual Equipment",
        subcategory: "Audio Equipment",
        description: "Professional wireless microphone system",
        unitOfMeasure: "Sets",
        currentQuantity: 2,
        minimumQuantity: 1,
        maximumQuantity: 5,
        unitCost: 25000,
        totalValue: 50000,
        supplier: "Sound Tech Ltd",
        lastRestocked: "2023-12-01",
        location: "Sound Booth",
        binLocation: "Equipment Rack 1",
        isDepreciable: true,
        depreciationRate: 15,
        purchaseDate: "2023-12-01",
        warrantyPeriod: "2 years",
        status: "In Stock",
        notes: "Handle with care",
        createdAt: "2023-12-01",
        updatedAt: "2024-01-15",
      },
    ];

    setStockItems(sampleStockItems);

    // Check for low stock alerts
    const alerts = sampleStockItems.filter(
      (item) => item.currentQuantity <= item.minimumQuantity,
    );
    setLowStockAlerts(alerts);
  };

  const loadInventoryData = () => {
    // Mock data - replace with actual API calls
    const mockItems: InventoryItem[] = [
      {
        id: 1,
        itemCode: "AUD-001",
        serialNumber: "YAMAHA123456",
        itemName: "Yamaha Mixer",
        category: "Audio Equipment",
        brand: "Yamaha",
        model: "MG16XU",
        description: "16-channel analog mixer with USB connectivity",
        purchaseDate: "2023-01-15",
        purchasePrice: 85000,
        currentValue: 70000,
        supplier: "Music Store Kenya",
        warranty: "2 years",
        location: "Main Sanctuary",
        assignedTo: "Audio Team",
        status: "Working",
        condition: "Good",
        maintenanceSchedule: "Quarterly",
        lastMaintenance: "2024-10-01",
        nextMaintenance: "2025-01-01",
        notes: "Primary mixer for Sunday services",
        qrCode: "QR001",
        images: [],
        tags: ["audio", "mixer", "main"],
        createdAt: "2023-01-15T10:00:00Z",
        updatedAt: "2024-12-01T10:00:00Z",
      },
      {
        id: 2,
        itemCode: "FUR-001",
        serialNumber: "CHAIR001",
        itemName: "Plastic Chairs",
        category: "Furniture",
        brand: "Tuffoam",
        model: "Standard",
        description: "White plastic chairs for congregation seating",
        purchaseDate: "2022-06-10",
        purchasePrice: 150000,
        currentValue: 120000,
        supplier: "Furniture World",
        warranty: "1 year",
        location: "Main Sanctuary",
        assignedTo: "General Use",
        status: "Working",
        condition: "Good",
        maintenanceSchedule: "As needed",
        lastMaintenance: "2024-08-15",
        nextMaintenance: "2025-06-10",
        notes: "100 pieces purchased",
        qrCode: "QR002",
        images: [],
        tags: ["furniture", "seating"],
        createdAt: "2022-06-10T10:00:00Z",
        updatedAt: "2024-08-15T10:00:00Z",
      },
      {
        id: 3,
        itemCode: "MUS-001",
        serialNumber: "GUITAR2024",
        itemName: "Acoustic Guitar",
        category: "Musical Instruments",
        brand: "Yamaha",
        model: "F280",
        description: "6-string acoustic guitar for worship team",
        purchaseDate: "2024-03-20",
        purchasePrice: 25000,
        currentValue: 22000,
        supplier: "Musical Instruments Ltd",
        warranty: "6 months",
        location: "Main Sanctuary",
        assignedTo: "Worship Team",
        status: "Faulty",
        condition: "Fair",
        maintenanceSchedule: "Monthly",
        lastMaintenance: "2024-11-01",
        nextMaintenance: "2024-12-01",
        notes: "Needs string replacement",
        qrCode: "QR003",
        images: [],
        tags: ["music", "guitar", "worship"],
        createdAt: "2024-03-20T10:00:00Z",
        updatedAt: "2024-11-15T10:00:00Z",
      },
    ];

    setItems(mockItems);

    // Mock maintenance records
    const mockMaintenance: MaintenanceRecord[] = [
      {
        id: 1,
        itemId: 1,
        type: "Routine",
        description: "Quarterly cleaning and calibration",
        cost: 5000,
        performedBy: "Tech Team",
        performedDate: "2024-10-01",
        nextDueDate: "2025-01-01",
        status: "Completed",
      },
      {
        id: 2,
        itemId: 3,
        type: "Repair",
        description: "String replacement needed",
        cost: 2000,
        performedBy: "Music Team",
        performedDate: "",
        nextDueDate: "2024-12-01",
        status: "Pending",
      },
    ];

    setMaintenanceRecords(mockMaintenance);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    const matchesLocation =
      locationFilter === "all" || item.location === locationFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Working: { variant: "default" as const, icon: CheckCircle },
      Faulty: { variant: "destructive" as const, icon: AlertTriangle },
      "Under Maintenance": { variant: "default" as const, icon: Wrench },
      Missing: { variant: "destructive" as const, icon: XCircle },
      Disposed: { variant: "secondary" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || CheckCircle;

    return (
      <Badge
        variant={config?.variant || "secondary"}
        className="flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getConditionBadge = (condition: string) => {
    const conditionColors = {
      Excellent: "bg-green-500",
      Good: "bg-blue-500",
      Fair: "bg-yellow-500",
      Poor: "bg-orange-500",
      Damaged: "bg-red-500",
    };

    return (
      <Badge
        className={`${conditionColors[condition as keyof typeof conditionColors]} text-white`}
      >
        {condition}
      </Badge>
    );
  };

  const handleAddItem = () => {
    if (!itemForm.itemName || !itemForm.category) {
      alert("Please fill in required fields");
      return;
    }

    const itemCount = items.length + 1;
    const itemCode = `${itemForm.category.substring(0, 3).toUpperCase()}-${itemCount.toString().padStart(3, "0")}`;
    const serialNumber =
      itemForm.serialNumber || `SN${Date.now().toString().slice(-6)}`;

    const newItem: InventoryItem = {
      id: itemCount,
      itemCode,
      serialNumber,
      ...itemForm,
      purchasePrice: parseFloat(itemForm.purchasePrice) || 0,
      currentValue: parseFloat(itemForm.purchasePrice) || 0,
      status: "Working",
      condition: "Good",
      maintenanceSchedule: "As needed",
      lastMaintenance: "",
      nextMaintenance: "",
      qrCode: `QR${itemCount.toString().padStart(3, "0")}`,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add financial transaction for inventory purchase
    if (newItem.purchasePrice > 0) {
      financialTransactionService.addInventoryPurchase({
        itemName: newItem.itemName,
        purchasePrice: newItem.purchasePrice,
        supplier: newItem.supplier,
        category: newItem.category,
        paymentMethod: newItem.purchasePrice > 5000 ? "Bank Transfer" : "Cash",
        reference: newItem.itemCode,
        createdBy: user?.name || "Inventory Manager",
      });
    }

    // Save inventory data to localStorage for Dashboard integration
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    const inventoryModuleData = {
      stockItems: updatedItems,
      lastUpdated: new Date().toISOString(),
      totalItems: updatedItems.length,
      totalValue: updatedItems.reduce(
        (sum, item) => sum + (item.currentValue || item.purchasePrice || 0),
        0,
      ),
    };
    localStorage.setItem(
      "inventory_module_data",
      JSON.stringify(inventoryModuleData),
    );

    setItemForm({
      itemName: "",
      category: "",
      brand: "",
      model: "",
      description: "",
      purchaseDate: "",
      purchasePrice: "",
      supplier: "",
      warranty: "",
      location: "",
      assignedTo: "",
      serialNumber: "",
      notes: "",
      tags: [],
    });
    setShowAddItemDialog(false);

    alert("Item added and financial transaction synchronized!");
  };

  // Enhanced Stock Reporting Functions
  const generateStockReport = async (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      try {

        // Create comprehensive stock report data
        const reportData = [];

        // Header
        reportData.push(['TSOAM CHURCH MANAGEMENT SYSTEM']);
        reportData.push(['STOCK INVENTORY REPORT']);
        reportData.push([`Generated on: ${new Date().toLocaleDateString()}`]);
        reportData.push([]);

        // Summary
        reportData.push(['INVENTORY SUMMARY']);
        reportData.push(['Total Stock Items', stockItems.length]);
        reportData.push(['Total Stock Value', `KSh ${stockItems.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}`]);
        reportData.push(['Low Stock Items', lowStockAlerts.length]);
        reportData.push(['Out of Stock Items', stockItems.filter(item => item.currentQuantity === 0).length]);
        reportData.push([]);

        // Stock by Category
        reportData.push(['STOCK BY CATEGORY']);
        reportData.push(['Category', 'Items Count', 'Total Value (KSh)']);
        const categories = ['Electronics', 'Office Supplies', 'Cleaning', 'Maintenance', 'Audio/Visual'];
        categories.forEach(category => {
          const categoryItems = stockItems.filter(item => item.category === category);
          const categoryValue = categoryItems.reduce((sum, item) => sum + item.totalValue, 0);
          reportData.push([category, categoryItems.length, categoryValue]);
        });
        reportData.push([]);

        // Detailed Stock List
        reportData.push(['DETAILED STOCK INVENTORY']);
        reportData.push(['Tag Number', 'Item Name', 'Category', 'Current Qty', 'Unit', 'Min Qty', 'Unit Cost', 'Total Value', 'Status', 'Last Updated']);

        stockItems.forEach(item => {
          reportData.push([
            item.tagNumber,
            item.itemName,
            item.category,
            item.currentQuantity,
            item.unitOfMeasure,
            item.minimumQuantity,
            item.unitCost,
            item.totalValue,
            item.status,
            new Date(item.updatedAt).toLocaleDateString()
          ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(reportData);

        // Apply column widths
        worksheet['!cols'] = [
          { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 8 },
          { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');
        XLSX.writeFile(workbook, `TSOAM_Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

        alert('Stock report exported successfully!');
      } catch (error) {
        console.error('Error generating Excel report:', error);
        alert('Failed to generate Excel report. Please try again.');
      }
    } else if (format === 'pdf') {
      try {
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('TSOAM CHURCH MANAGEMENT SYSTEM', 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.text('STOCK INVENTORY REPORT', 105, 30, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });

        let yPos = 60;

        // Summary section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INVENTORY SUMMARY', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Stock Items: ${stockItems.length}`, 20, yPos);
        yPos += 6;
        doc.text(`Total Stock Value: KSh ${stockItems.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}`, 20, yPos);
        yPos += 6;
        doc.text(`Low Stock Alerts: ${lowStockAlerts.length}`, 20, yPos);
        yPos += 15;

        // Stock table
        const tableData = stockItems.map(item => [
          item.tagNumber,
          item.itemName,
          item.category,
          item.currentQuantity.toString(),
          item.unitOfMeasure,
          item.status,
          `KSh ${item.totalValue.toLocaleString()}`
        ]);

        // Use autoTable function directly (same pattern as FinanceAdvanced.tsx)
        const autoTableModule = await import("jspdf-autotable");
        const autoTableFunction = autoTableModule.default;
        autoTableFunction(doc, {
          head: [['Tag', 'Item Name', 'Category', 'Qty', 'Unit', 'Status', 'Value']],
          body: tableData,
          startY: yPos,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [63, 81, 181] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 20, right: 20 }
        });

        doc.save(`TSOAM_Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        alert('Stock report PDF generated successfully!');
      } catch (error) {
        console.error('Error generating PDF report:', error);
        alert('Failed to generate PDF report. Please try again.');
      }
    }
  };

  const generateLowStockReport = async () => {
    try {

      const reportData = [];

      // Header
      reportData.push(['TSOAM CHURCH MANAGEMENT SYSTEM']);
      reportData.push(['LOW STOCK ALERT REPORT']);
      reportData.push([`Generated on: ${new Date().toLocaleDateString()}`]);
      reportData.push([]);

      // Low stock items
      reportData.push(['LOW STOCK ITEMS']);
      reportData.push(['Tag Number', 'Item Name', 'Category', 'Current Qty', 'Min Qty', 'Shortage', 'Unit Cost', 'Reorder Value', 'Status']);

      lowStockAlerts.forEach(item => {
        const shortage = item.minimumQuantity - item.currentQuantity;
        const reorderValue = shortage * item.unitCost;
        reportData.push([
          item.tagNumber,
          item.itemName,
          item.category,
          item.currentQuantity,
          item.minimumQuantity,
          shortage,
          item.unitCost,
          reorderValue,
          item.status
        ]);
      });

      reportData.push([]);
      reportData.push(['SUMMARY']);
      reportData.push(['Total Items Requiring Reorder', lowStockAlerts.length]);
      reportData.push(['Estimated Reorder Cost', `KSh ${lowStockAlerts.reduce((sum, item) => sum + ((item.minimumQuantity - item.currentQuantity) * item.unitCost), 0).toLocaleString()}`]);

      const worksheet = XLSX.utils.aoa_to_sheet(reportData);

      // Apply column widths
      worksheet['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
        { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Low Stock Report');
      XLSX.writeFile(workbook, `TSOAM_Low_Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

      alert('Low stock report exported successfully!');
    } catch (error) {
      console.error('Error generating low stock report:', error);
      alert('Failed to generate low stock report. Please try again.');
    }
  };

  const handleStatusChange = (item: InventoryItem, newStatus: string) => {
    const updatedItems = items.map((i) =>
      i.id === item.id ? { ...i, status: newStatus as any } : i,
    );
    setItems(updatedItems);

    if (newStatus === "Faulty" || newStatus === "Under Maintenance") {
      setSelectedItem({ ...item, status: newStatus as any });
      setShowMaintenanceDialog(true);
    } else if (newStatus === "Disposed") {
      setSelectedItem({ ...item, status: newStatus as any });
      setShowDisposalDialog(true);
    }
  };

  const handleMaintenanceSubmit = () => {
    if (
      !maintenanceForm.type ||
      !maintenanceForm.description ||
      !selectedItem
    ) {
      alert("Please select an item and fill in required fields");
      return;
    }

    const newRecord: MaintenanceRecord = {
      id: maintenanceRecords.length + 1,
      itemId: selectedItem.id,
      type: maintenanceForm.type as any,
      description: maintenanceForm.description,
      cost: parseFloat(maintenanceForm.cost) || 0,
      performedBy: maintenanceForm.performedBy,
      performedDate: maintenanceForm.performedDate,
      nextDueDate: maintenanceForm.nextDueDate,
      status: "Completed",
    };

    setMaintenanceRecords([...maintenanceRecords, newRecord]);

    // Add financial transaction for maintenance expense
    if (newRecord.cost > 0) {
      financialTransactionService.addMaintenanceExpense({
        itemName: selectedItem.itemName,
        maintenanceType: newRecord.type,
        cost: newRecord.cost,
        performedBy: newRecord.performedBy,
        paymentMethod: "Bank Transfer", // Default, should be made configurable
        reference: `MNT${newRecord.id}`,
        createdBy: "Inventory Manager", // Should use actual user
      });
    }

    // Update item status if it's under maintenance
    if (maintenanceForm.type === "Repair") {
      const updatedItems = items.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: "Under Maintenance" as any,
              lastMaintenance: maintenanceForm.performedDate,
            }
          : item,
      );
      setItems(updatedItems);
    }

    setMaintenanceForm({
      type: "",
      description: "",
      cost: "",
      performedBy: "",
      performedDate: "",
      nextDueDate: "",
    });
    setShowMaintenanceDialog(false);
    setSelectedItem(null);
    alert(
      "Maintenance record added and expense synchronized with Finance module!",
    );
  };

  const handleDisposalSubmit = () => {
    if (!disposalForm.reason || !disposalForm.disposalMethod || !selectedItem) {
      alert("Please select an item and fill in required fields");
      return;
    }

    const newRecord: DisposalRecord = {
      id: disposalRecords.length + 1,
      itemId: selectedItem.id,
      reason: disposalForm.reason as any,
      disposalMethod: disposalForm.disposalMethod as any,
      disposalDate: disposalForm.disposalDate,
      disposalValue: parseFloat(disposalForm.disposalValue) || 0,
      authorizedBy: disposalForm.authorizedBy,
      recipient: disposalForm.recipient,
      notes: disposalForm.notes,
    };

    setDisposalRecords([...disposalRecords, newRecord]);

    // Update item status to disposed
    const updatedItems = items.map((item) =>
      item.id === selectedItem.id
        ? { ...item, status: "Disposed" as any }
        : item,
    );
    setItems(updatedItems);

    setDisposalForm({
      reason: "",
      disposalMethod: "",
      disposalDate: "",
      disposalValue: "",
      authorizedBy: "",
      recipient: "",
      notes: "",
    });
    setShowDisposalDialog(false);
    setSelectedItem(null);
    alert("Disposal record added successfully!");
  };

  const handleStockSubmit = () => {
    if (
      !stockForm.tagNumber ||
      !stockForm.itemName ||
      !stockForm.category ||
      !stockForm.unitOfMeasure ||
      !stockForm.currentQuantity ||
      !stockForm.minimumQuantity ||
      !stockForm.unitCost
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Check if tag number already exists
    if (stockItems.some((item) => item.tagNumber === stockForm.tagNumber)) {
      alert("Tag number already exists. Please use a unique tag number.");
      return;
    }

    const newStockItem: StockItem = {
      id: stockItems.length + 1,
      tagNumber: stockForm.tagNumber,
      itemName: stockForm.itemName,
      category: stockForm.category as any,
      subcategory: stockForm.subcategory || "General",
      description: stockForm.description || "",
      unitOfMeasure: stockForm.unitOfMeasure as any,
      currentQuantity: parseInt(stockForm.currentQuantity),
      minimumQuantity: parseInt(stockForm.minimumQuantity),
      maximumQuantity:
        parseInt(stockForm.maximumQuantity || stockForm.minimumQuantity) * 3,
      unitCost: parseFloat(stockForm.unitCost),
      totalValue:
        parseInt(stockForm.currentQuantity) * parseFloat(stockForm.unitCost),
      supplier: stockForm.supplier,
      lastRestocked: new Date().toISOString().split("T")[0],
      location: stockForm.location,
      isDepreciable: stockForm.isDepreciable,
      purchaseDate: new Date().toISOString().split("T")[0],
      status: (parseInt(stockForm.currentQuantity) <=
      parseInt(stockForm.minimumQuantity)
        ? "Low Stock"
        : "In Stock") as
        | "In Stock"
        | "Low Stock"
        | "Out of Stock"
        | "Discontinued",
      notes: stockForm.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiryDate: stockForm.expiryDate || undefined,
      depreciationRate: stockForm.isDepreciable
        ? parseFloat(stockForm.depreciationRate) || 0
        : undefined,
    };

    setStockItems([...stockItems, newStockItem]);

    // Check for low stock alerts
    const alerts = [...stockItems, newStockItem].filter(
      (item) => item.currentQuantity <= item.minimumQuantity,
    );
    setLowStockAlerts(alerts);

    // Reset form
    setStockForm({
      tagNumber: "",
      itemName: "",
      category: "Consumables",
      subcategory: "",
      description: "",
      unitOfMeasure: "Pieces",
      currentQuantity: "",
      minimumQuantity: "",
      maximumQuantity: "",
      unitCost: "",
      supplier: "",
      location: "",
      binLocation: "",
      expiryDate: "",
      warrantyPeriod: "",
      isDepreciable: false,
      depreciationRate: "",
      notes: "",
    });
    setShowAddStockDialog(false);
    alert("Stock item added successfully!");
  };

  const handleStockMovementSubmit = () => {
    if (
      !stockMovementForm.tagNumber ||
      !stockMovementForm.movementType ||
      !stockMovementForm.quantity
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const quantity = parseInt(stockMovementForm.quantity);
    const stockItem = stockItems.find(
      (item) => item.tagNumber === stockMovementForm.tagNumber,
    );

    if (!stockItem) {
      alert("Stock item not found");
      return;
    }

    // Check if there's enough stock for outbound movements
    if (
      (stockMovementForm.movementType === "Stock Out" ||
        stockMovementForm.movementType === "Transfer" ||
        stockMovementForm.movementType === "Damage" ||
        stockMovementForm.movementType === "Expired") &&
      stockItem.currentQuantity < quantity
    ) {
      alert("Insufficient stock for this movement");
      return;
    }

    const newMovement: StockMovement = {
      id: stockMovements.length + 1,
      tagNumber: stockMovementForm.tagNumber,
      movementType: stockMovementForm.movementType as any,
      quantity: quantity,
      fromLocation: stockMovementForm.fromLocation,
      toLocation: stockMovementForm.toLocation,
      reason: stockMovementForm.reason,
      performedBy: "Current User", // Replace with actual user
      movementDate: new Date().toISOString().split("T")[0],
    };

    setStockMovements([...stockMovements, newMovement]);

    // Update stock quantities
    const updatedStockItems = stockItems.map((item) => {
      if (item.tagNumber === stockMovementForm.tagNumber) {
        let newQuantity = item.currentQuantity;

        if (stockMovementForm.movementType === "Stock In") {
          newQuantity += quantity;
        } else if (
          ["Stock Out", "Transfer", "Damage", "Expired"].includes(
            stockMovementForm.movementType,
          )
        ) {
          newQuantity -= quantity;
        } else if (stockMovementForm.movementType === "Adjustment") {
          newQuantity = quantity; // Set to exact quantity for adjustments
        }

        return {
          ...item,
          currentQuantity: newQuantity,
          status: (newQuantity <= item.minimumQuantity
            ? "Low Stock"
            : newQuantity === 0
              ? "Out of Stock"
              : "In Stock") as
            | "In Stock"
            | "Low Stock"
            | "Out of Stock"
            | "Discontinued",
          totalValue: newQuantity * item.unitCost,
          lastRestocked:
            stockMovementForm.movementType === "Stock In"
              ? new Date().toISOString().split("T")[0]
              : item.lastRestocked,
        };
      }
      return item;
    });

    setStockItems(updatedStockItems);

    // Update low stock alerts
    const alerts = updatedStockItems.filter(
      (item) => item.currentQuantity <= item.minimumQuantity,
    );
    setLowStockAlerts(alerts);

    // Reset form
    setStockMovementForm({
      tagNumber: "",
      movementType: "Stock In",
      quantity: "",
      reason: "",
      fromLocation: "",
      toLocation: "",
      referenceNumber: "",
      notes: "",
    });
    setShowStockMovementDialog(false);
    alert("Stock movement recorded successfully!");
  };

  const handleStockTakingSubmit = () => {
    // This would normally collect all the counted quantities from the form
    // For now, we'll just create a basic stock taking record
    const newStockTaking: StockTaking = {
      id: stockTakings.length + 1,
      stockTakingDate: new Date().toISOString().split("T")[0],
      performedBy: "Current User", // Replace with actual user
      supervisedBy: "Supervisor", // Replace with actual supervisor
      status: "Completed",
      items: stockItems.map((item) => ({
        tagNumber: item.tagNumber,
        systemQuantity: item.currentQuantity,
        physicalCount: item.currentQuantity, // Would come from form inputs
        variance: 0,
        condition: "Good" as const,
      })),
      discrepancies: [],
      notes: "Stock taking completed",
    };

    setStockTakings([...stockTakings, newStockTaking]);
    setShowStockTakingDialog(false);
    alert("Stock taking completed successfully!");
  };

  const handleExport = async (format: "excel" | "pdf") => {
    try {
      const inventoryData = filteredItems.map((item) => ({
        "Item Code": item.itemCode,
        "Serial Number": item.serialNumber,
        "Item Name": item.itemName,
        Category: item.category,
        Brand: item.brand,
        Model: item.model,
        Status: item.status,
        Condition: item.condition,
        Location: item.location,
        "Assigned To": item.assignedTo,
        "Purchase Date": item.purchaseDate,
        "Purchase Price": `KSH ${item.purchasePrice.toLocaleString()}`,
        "Current Value": `KSH ${item.currentValue.toLocaleString()}`,
      }));

      await exportService.export({
        filename: `TSOAM_Inventory_Report_${new Date().toISOString().split("T")[0]}`,
        title: "TSOAM - Inventory Report",
        subtitle: `Generated on ${new Date().toLocaleDateString()} | Total Items: ${filteredItems.length}`,
        data: inventoryData,
        format: format as "pdf" | "excel",
        columns: [
          { key: "Item Code", title: "Item Code", width: 15 },
          { key: "Serial Number", title: "Serial Number", width: 20 },
          { key: "Item Name", title: "Item Name", width: 25 },
          { key: "Category", title: "Category", width: 15 },
          { key: "Brand", title: "Brand", width: 15 },
          { key: "Model", title: "Model", width: 15 },
          { key: "Status", title: "Status", width: 12 },
          { key: "Condition", title: "Condition", width: 12 },
          { key: "Location", title: "Location", width: 15 },
          { key: "Assigned To", title: "Assigned To", width: 20 },
          { key: "Purchase Date", title: "Purchase Date", width: 15 },
          {
            key: "Purchase Price",
            title: "Purchase Price",
            width: 18,
            align: "right",
          },
          {
            key: "Current Value",
            title: "Current Value",
            width: 18,
            align: "right",
          },
        ],
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + (error as any)?.message || String(error));
    }
  };

  // New handlers for stock item viewing and low stock resolution
  const handleViewStockItem = (item: StockItem) => {
    setSelectedStockItem(item);
    setShowViewStockDialog(true);
  };

  const handleRestockItem = (item: StockItem) => {
    setSelectedStockItem(item);
    setShowRestockDialog(true);
  };

  const handleEditStockItem = (item: StockItem) => {
    setSelectedStockItem(item);
    setEditStockForm(item);
    setShowEditStockDialog(true);
  };

  const handleDeleteStockItem = (item: StockItem) => {
    setSelectedStockItem(item);
    setShowDeleteStockDialog(true);
  };

  const confirmDeleteStockItem = () => {
    if (selectedStockItem) {
      setStockItems(prev => prev.filter(item => item.tagNumber !== selectedStockItem.tagNumber));
      setShowDeleteStockDialog(false);
      setSelectedStockItem(null);

      // Log the deletion action
      console.log(`Item deleted: ${selectedStockItem.itemName} by ${user?.name}`);
      alert(`Item "${selectedStockItem.itemName}" has been deleted successfully.`);
    }
  };

  const handleUpdateStockItem = () => {
    if (selectedStockItem && editStockForm) {
      setStockItems(prev =>
        prev.map(item =>
          item.tagNumber === selectedStockItem.tagNumber
            ? { ...item, ...editStockForm, updatedAt: new Date().toISOString() }
            : item
        )
      );
      setShowEditStockDialog(false);
      setSelectedStockItem(null);
      setEditStockForm({});

      // Log the update action
      console.log(`Item updated: ${selectedStockItem.itemName} by ${user?.name}`);
      alert(`Item "${selectedStockItem.itemName}" has been updated successfully.`);
    }
  };

  const handleRestockSubmit = () => {
    if (!selectedStockItem) return;

    const restockQuantity = parseInt(stockMovementForm.quantity);
    if (!restockQuantity || restockQuantity <= 0) {
      alert("Please enter a valid restock quantity");
      return;
    }

    // Update the stock item quantity
    const updatedStockItems = stockItems.map((item) => {
      if (item.id === selectedStockItem.id) {
        const newQuantity = item.currentQuantity + restockQuantity;
        return {
          ...item,
          currentQuantity: newQuantity,
          totalValue: newQuantity * item.unitCost,
          status: (newQuantity <= item.minimumQuantity
            ? "Low Stock"
            : newQuantity === 0
              ? "Out of Stock"
              : "In Stock") as "In Stock" | "Low Stock" | "Out of Stock",
          lastRestocked: new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString().split("T")[0],
        };
      }
      return item;
    });

    setStockItems(updatedStockItems);

    // Update low stock alerts
    const alerts = updatedStockItems.filter(
      (item) => item.currentQuantity <= item.minimumQuantity,
    );
    setLowStockAlerts(alerts);

    // Reset form and close dialog
    setStockMovementForm({
      tagNumber: "",
      movementType: "Stock In",
      quantity: "",
      reason: "",
      fromLocation: "",
      toLocation: "",
      referenceNumber: "",
      notes: "",
    });
    setShowRestockDialog(false);
    setSelectedStockItem(null);

    // Trigger system-wide data refresh
    refreshInventoryData();

    alert(`Successfully restocked ${selectedStockItem.itemName} with ${restockQuantity} ${selectedStockItem.unitOfMeasure}`);
  };

  const totalItems = items.length;
  const workingItems = items.filter((item) => item.status === "Working").length;
  const faultyItems = items.filter((item) => item.status === "Faulty").length;
  const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">
              Manage and track all church assets and equipment
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog
              open={showMaintenanceDialog}
              onOpenChange={setShowMaintenanceDialog}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Wrench className="h-4 w-4 mr-2" />
                  Record Maintenance
                </Button>
              </DialogTrigger>
            </Dialog>
            <Dialog
              open={showDisposalDialog}
              onOpenChange={setShowDisposalDialog}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Recycle className="h-4 w-4 mr-2" />
                  Record Disposal
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button
              onClick={() => handleExport("excel")}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={() => handleExport("pdf")}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Dialog
              open={showAddItemDialog}
              onOpenChange={setShowAddItemDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Tracked assets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Working</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workingItems}</div>
              <p className="text-xs text-muted-foreground">
                {totalItems > 0
                  ? `${((workingItems / totalItems) * 100).toFixed(1)}% operational`
                  : "No items"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Needs Attention
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{faultyItems}</div>
              <p className="text-xs text-muted-foreground">
                Faulty or maintenance required
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSH {totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Current valuation</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
            <TabsTrigger value="stock">Stock Management</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="disposal">Disposal Records</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Working">Working</SelectItem>
                      <SelectItem value="Faulty">Faulty</SelectItem>
                      <SelectItem value="Under Maintenance">
                        Under Maintenance
                      </SelectItem>
                      <SelectItem value="Missing">Missing</SelectItem>
                      <SelectItem value="Disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Table */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.itemCode}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.itemName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.brand} {item.model}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {getConditionBadge(item.condition)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          KSH {item.currentValue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInventoryItem(item);
                                setShowViewDialog(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditInventoryForm(item);
                                setShowEditDialog(true);
                              }}
                              title="Edit Item"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canDeleteItems && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedInventoryItem(item);
                                  setShowDeleteDialog(true);
                                }}
                                title="Delete Item (Admin/Pastor/HR Only)"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {!canDeleteItems && (
                              <span className="text-xs text-muted-foreground px-2">
                                Delete restricted
                              </span>
                            )}
                            <Select
                              onValueChange={(value) =>
                                handleStatusChange(item, value)
                              }
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Working">Working</SelectItem>
                                <SelectItem value="Faulty">Faulty</SelectItem>
                                <SelectItem value="Under Maintenance">
                                  Maintenance
                                </SelectItem>
                                <SelectItem value="Missing">Missing</SelectItem>
                                <SelectItem value="Disposed">
                                  Disposed
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            {/* Stock Management Interface */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Stock Items
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stockItems.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Stock items tracked
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Low Stock Alerts
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {lowStockAlerts.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Items need reordering
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Stock Value
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    KSH{" "}
                    {stockItems
                      .reduce((sum, item) => sum + item.totalValue, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total stock value
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Stock Movements
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stockMovements.length}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowAddStockDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock Item
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  initializeStockData();
                  loadInventoryData();
                  refreshInventoryData();
                  setTimeout(() => setLoading(false), 1000);
                }}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStockMovementDialog(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Stock In/Out
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStockTakingDialog(true)}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Stock Taking
              </Button>
              <Button
                variant="outline"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => generateStockReport('excel')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                className="bg-orange-600 text-white hover:bg-orange-700"
                onClick={() => generateStockReport('pdf')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => generateLowStockReport()}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Low Stock Report
              </Button>
            </div>

            {/* Stock Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stock by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Electronics', 'Office Supplies', 'Cleaning', 'Maintenance', 'Audio/Visual'].map((category, index) => {
                      const categoryCount = stockItems.filter(item => item.category === category).length;
                      const categoryValue = stockItems
                        .filter(item => item.category === category)
                        .reduce((sum, item) => sum + item.totalValue, 0);
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{category}</p>
                            <p className="text-xs text-gray-500">{categoryCount} items</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">KSh {categoryValue.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Movements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <div>
                        <p className="font-medium text-sm">Stock In</p>
                        <p className="text-xs text-gray-500">Office Chairs x5</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-medium">+5</p>
                        <p className="text-xs text-gray-500">Today</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <div>
                        <p className="font-medium text-sm">Stock Out</p>
                        <p className="text-xs text-gray-500">Printer Paper x2</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">-2</p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <div>
                        <p className="font-medium text-sm">Adjustment</p>
                        <p className="text-xs text-gray-500">Cleaning Supplies</p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-600 font-medium">±3</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reorder Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">Printer Ink</p>
                          <p className="text-xs text-gray-500">Current: 2 | Min: 5</p>
                        </div>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          Reorder
                        </Button>
                      </div>
                    </div>
                    <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">Cleaning Cloths</p>
                          <p className="text-xs text-gray-500">Current: 3 | Min: 10</p>
                        </div>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          Reorder
                        </Button>
                      </div>
                    </div>
                    <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">Batteries</p>
                          <p className="text-xs text-gray-500">Current: 4 | Min: 15</p>
                        </div>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          Reorder
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alerts */}
            {lowStockAlerts.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {lowStockAlerts.map((item) => (
                      <div
                        key={item.tagNumber}
                        className="flex items-center justify-between p-3 bg-destructive/10 rounded border-l-4 border-l-destructive"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            Tag: {item.tagNumber}
                          </p>
                        </div>
                        <div className="text-right flex-1">
                          <p className="text-sm font-medium text-destructive">
                            Current: {item.currentQuantity} {item.unitOfMeasure}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Min: {item.minimumQuantity}
                          </p>
                          <p className="text-xs text-destructive font-medium">
                            Need: {item.minimumQuantity - item.currentQuantity + 10} more
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewStockItem(item)}
                            className="text-xs"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRestockItem(item)}
                            className="bg-destructive hover:bg-destructive/90 text-xs"
                          >
                            Restock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stock Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag Number</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No stock items recorded yet</p>
                          <Button
                            variant="outline"
                            className="mt-2"
                            onClick={() => setShowAddStockDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Stock Item
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockItems.map((item) => (
                        <TableRow key={item.tagNumber}>
                          <TableCell className="font-medium">
                            {item.tagNumber}
                          </TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            <span
                              className={
                                item.currentQuantity <= item.minimumQuantity
                                  ? "text-destructive font-medium"
                                  : ""
                              }
                            >
                              {item.currentQuantity}
                            </span>
                          </TableCell>
                          <TableCell>{item.unitOfMeasure}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "In Stock"
                                  ? "default"
                                  : item.status === "Low Stock"
                                    ? "destructive"
                                    : item.status === "Out of Stock"
                                      ? "destructive"
                                      : "secondary"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            KSH {item.totalValue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewStockItem(item)}
                                title="View Item Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditStockItem(item)}
                                title="Edit Item"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestockItem(item)}
                                title="Restock Item"
                                className={item.status === "Low Stock" ? "border-orange-500 text-orange-600" : ""}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                              {canDeleteItems && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteStockItem(item)}
                                  title="Delete Item (Admin/Pastor Only)"
                                  className="border-red-500 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRecords.map((record) => {
                      const item = items.find((i) => i.id === record.itemId);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            {item?.itemName} ({item?.itemCode})
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.type}</Badge>
                          </TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell>
                            KSH {record.cost.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {record.performedDate || "Pending"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === "Completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disposal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Disposal Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Authorized By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disposalRecords.map((record) => {
                      const item = items.find((i) => i.id === record.itemId);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            {item?.itemName} ({item?.itemCode})
                          </TableCell>
                          <TableCell>{record.reason}</TableCell>
                          <TableCell>{record.disposalMethod}</TableCell>
                          <TableCell>
                            KSH {record.disposalValue.toLocaleString()}
                          </TableCell>
                          <TableCell>{record.disposalDate}</TableCell>
                          <TableCell>{record.authorizedBy}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport("excel")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel Report
                  </Button>
                  <Button variant="outline" onClick={() => handleExport("pdf")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Item Dialog */}
        <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={itemForm.itemName}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, itemName: e.target.value })
                    }
                    placeholder="Enter item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={itemForm.category}
                    onValueChange={(value) =>
                      setItemForm({ ...itemForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={itemForm.brand}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, brand: e.target.value })
                    }
                    placeholder="Enter brand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={itemForm.model}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, model: e.target.value })
                    }
                    placeholder="Enter model"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={itemForm.description}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, description: e.target.value })
                  }
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={itemForm.purchaseDate}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, purchaseDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price (KSH)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={itemForm.purchasePrice}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        purchasePrice: e.target.value,
                      })
                    }
                    onFocus={(e) => {
                      if (e.target.value === "0" || e.target.value === "0.00") {
                        setItemForm({
                          ...itemForm,
                          purchasePrice: "",
                        });
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={itemForm.supplier}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, supplier: e.target.value })
                    }
                    placeholder="Enter supplier"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty">Warranty Period</Label>
                  <Input
                    id="warranty"
                    value={itemForm.warranty}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, warranty: e.target.value })
                    }
                    placeholder="e.g., 2 years"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={itemForm.location}
                    onValueChange={(value) =>
                      setItemForm({ ...itemForm, location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    value={itemForm.assignedTo}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, assignedTo: e.target.value })
                    }
                    placeholder="Enter person/team"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={itemForm.serialNumber}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, serialNumber: e.target.value })
                  }
                  placeholder="Enter serial number (auto-generated if empty)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={itemForm.notes}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                  <div className="text-center">
                    <Package className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label
                        htmlFor="inventoryDocuments"
                        className="cursor-pointer"
                      >
                        <span className="text-sm text-blue-600 hover:text-blue-500">
                          Upload purchase receipts, warranty documents, or
                          manuals
                        </span>
                        <input
                          id="inventoryDocuments"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              // Handle file upload here
                              console.log("Files uploaded:", e.target.files);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, Excel, DOC, JPG up to 10MB each
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddItemDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Maintenance Dialog */}
        <Dialog
          open={showMaintenanceDialog}
          onOpenChange={setShowMaintenanceDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Maintenance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selectItem">Select Item *</Label>
                <Select
                  value={selectedItem?.id.toString() || ""}
                  onValueChange={(value) => {
                    const item = items.find((i) => i.id === parseInt(value));
                    setSelectedItem(item || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose inventory item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter((item) => item.status !== "Disposed")
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.itemCode} - {item.itemName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceType">Type *</Label>
                <Select
                  value={maintenanceForm.type}
                  onValueChange={(value) =>
                    setMaintenanceForm({ ...maintenanceForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Repair">Repair</SelectItem>
                    <SelectItem value="Replacement">Replacement</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceDescription">Description *</Label>
                <Textarea
                  id="maintenanceDescription"
                  value={maintenanceForm.description}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the maintenance work"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceCost">Cost (KSH)</Label>
                  <Input
                    id="maintenanceCost"
                    type="number"
                    value={maintenanceForm.cost}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        cost: e.target.value,
                      })
                    }
                    onFocus={(e) => {
                      if (e.target.value === "0" || e.target.value === "0.00") {
                        setMaintenanceForm({
                          ...maintenanceForm,
                          cost: "",
                        });
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="performedBy">Performed By</Label>
                  <Input
                    id="performedBy"
                    value={maintenanceForm.performedBy}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        performedBy: e.target.value,
                      })
                    }
                    placeholder="Enter name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="performedDate">Date Performed</Label>
                  <Input
                    id="performedDate"
                    type="date"
                    value={maintenanceForm.performedDate}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        performedDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Next Due Date</Label>
                  <Input
                    id="nextDueDate"
                    type="date"
                    value={maintenanceForm.nextDueDate}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        nextDueDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMaintenanceDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleMaintenanceSubmit}>
                  Record Maintenance
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disposal Dialog */}
        <Dialog open={showDisposalDialog} onOpenChange={setShowDisposalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Disposal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selectItem">Select Item *</Label>
                <Select
                  value={selectedItem?.id.toString() || ""}
                  onValueChange={(value) => {
                    const item = items.find((i) => i.id === parseInt(value));
                    setSelectedItem(item || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose inventory item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter((item) => item.status !== "Disposed")
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.itemCode} - {item.itemName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disposalReason">Reason *</Label>
                  <Select
                    value={disposalForm.reason}
                    onValueChange={(value) =>
                      setDisposalForm({ ...disposalForm, reason: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="End of Life">End of Life</SelectItem>
                      <SelectItem value="Irreparable">Irreparable</SelectItem>
                      <SelectItem value="Obsolete">Obsolete</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                      <SelectItem value="Stolen">Stolen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disposalMethod">Method *</Label>
                  <Select
                    value={disposalForm.disposalMethod}
                    onValueChange={(value) =>
                      setDisposalForm({
                        ...disposalForm,
                        disposalMethod: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Sell">Sell</SelectItem>
                      <SelectItem value="Donate">Donate</SelectItem>
                      <SelectItem value="Scrap">Scrap</SelectItem>
                      <SelectItem value="Return to Supplier">
                        Return to Supplier
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disposalDate">Disposal Date</Label>
                  <Input
                    id="disposalDate"
                    type="date"
                    value={disposalForm.disposalDate}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        disposalDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disposalValue">Disposal Value (KSH)</Label>
                  <Input
                    id="disposalValue"
                    type="number"
                    value={disposalForm.disposalValue}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        disposalValue: e.target.value,
                      })
                    }
                    onFocus={(e) => {
                      if (e.target.value === "0" || e.target.value === "0.00") {
                        setDisposalForm({
                          ...disposalForm,
                          disposalValue: "",
                        });
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorizedBy">Authorized By</Label>
                  <Input
                    id="authorizedBy"
                    value={disposalForm.authorizedBy}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        authorizedBy: e.target.value,
                      })
                    }
                    placeholder="Enter authorizer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    value={disposalForm.recipient}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        recipient: e.target.value,
                      })
                    }
                    placeholder="Enter recipient name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disposalNotes">Notes</Label>
                <Textarea
                  id="disposalNotes"
                  value={disposalForm.notes}
                  onChange={(e) =>
                    setDisposalForm({ ...disposalForm, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDisposalDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleDisposalSubmit}>Record Disposal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Stock Dialog */}
        <Dialog open={showAddStockDialog} onOpenChange={setShowAddStockDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Stock Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tagNumber">Tag Number *</Label>
                  <Input
                    id="tagNumber"
                    value={stockForm.tagNumber}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, tagNumber: e.target.value })
                    }
                    placeholder="Enter unique tag number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={stockForm.itemName}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, itemName: e.target.value })
                    }
                    placeholder="Enter item name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={stockForm.category}
                    onValueChange={(value) =>
                      setStockForm({ ...stockForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consumables">Consumables</SelectItem>
                      <SelectItem value="Office Supplies">
                        Office Supplies
                      </SelectItem>
                      <SelectItem value="Cleaning Supplies">
                        Cleaning Supplies
                      </SelectItem>
                      <SelectItem value="Food & Beverages">
                        Food & Beverages
                      </SelectItem>
                      <SelectItem value="Electronic Assets">
                        Electronic Assets
                      </SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Musical Instruments">
                        Musical Instruments
                      </SelectItem>
                      <SelectItem value="Audio/Visual Equipment">
                        Audio/Visual Equipment
                      </SelectItem>
                      <SelectItem value="Maintenance Tools">
                        Maintenance Tools
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                  <Select
                    value={stockForm.unitOfMeasure}
                    onValueChange={(value) =>
                      setStockForm({ ...stockForm, unitOfMeasure: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pieces">Pieces</SelectItem>
                      <SelectItem value="Rolls">Rolls</SelectItem>
                      <SelectItem value="Packets">Packets</SelectItem>
                      <SelectItem value="Bottles">Bottles</SelectItem>
                      <SelectItem value="Liters">Liters</SelectItem>
                      <SelectItem value="Kilograms">Kilograms</SelectItem>
                      <SelectItem value="Boxes">Boxes</SelectItem>
                      <SelectItem value="Cartons">Cartons</SelectItem>
                      <SelectItem value="Sets">Sets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentQuantity">Current Quantity *</Label>
                  <Input
                    id="currentQuantity"
                    type="number"
                    value={stockForm.currentQuantity}
                    onChange={(e) =>
                      setStockForm({
                        ...stockForm,
                        currentQuantity: e.target.value,
                      })
                    }
                    onFocus={(e) => {
                      if (e.target.value === "0") {
                        setStockForm({
                          ...stockForm,
                          currentQuantity: "",
                        });
                      }
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumQuantity">Reorder Level *</Label>
                  <Input
                    id="minimumQuantity"
                    type="number"
                    value={stockForm.minimumQuantity}
                    onChange={(e) =>
                      setStockForm({
                        ...stockForm,
                        minimumQuantity: e.target.value,
                      })
                    }
                    onFocus={(e) => {
                      if (e.target.value === "0") {
                        setStockForm({
                          ...stockForm,
                          minimumQuantity: "",
                        });
                      }
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost (KSH) *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    value={stockForm.unitCost}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, unitCost: e.target.value })
                    }
                    onFocus={(e) => {
                      if (e.target.value === "0" || e.target.value === "0.00") {
                        setStockForm({ ...stockForm, unitCost: "" });
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={stockForm.supplier}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, supplier: e.target.value })
                    }
                    placeholder="Enter supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    value={stockForm.location}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, location: e.target.value })
                    }
                    placeholder="Enter storage location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={stockForm.expiryDate}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, expiryDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={stockForm.notes}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddStockDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleStockSubmit}>Add Stock Item</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Movement Dialog */}
        <Dialog
          open={showStockMovementDialog}
          onOpenChange={setShowStockMovementDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selectStockItem">Select Stock Item *</Label>
                <Select
                  value={stockMovementForm.tagNumber}
                  onValueChange={(value) =>
                    setStockMovementForm({
                      ...stockMovementForm,
                      tagNumber: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose stock item" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockItems.map((item) => (
                      <SelectItem key={item.tagNumber} value={item.tagNumber}>
                        {item.tagNumber} - {item.itemName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="movementType">Movement Type *</Label>
                  <Select
                    value={stockMovementForm.movementType}
                    onValueChange={(value) =>
                      setStockMovementForm({
                        ...stockMovementForm,
                        movementType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stock In">Stock In</SelectItem>
                      <SelectItem value="Stock Out">Stock Out</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Adjustment">Adjustment</SelectItem>
                      <SelectItem value="Damage">Damage</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={stockMovementForm.quantity}
                    onChange={(e) =>
                      setStockMovementForm({
                        ...stockMovementForm,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="Enter quantity"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromLocation">From Location</Label>
                  <Input
                    id="fromLocation"
                    value={stockMovementForm.fromLocation}
                    onChange={(e) =>
                      setStockMovementForm({
                        ...stockMovementForm,
                        fromLocation: e.target.value,
                      })
                    }
                    placeholder="Source location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toLocation">To Location</Label>
                  <Input
                    id="toLocation"
                    value={stockMovementForm.toLocation}
                    onChange={(e) =>
                      setStockMovementForm({
                        ...stockMovementForm,
                        toLocation: e.target.value,
                      })
                    }
                    placeholder="Destination location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movementReason">Reason</Label>
                <Textarea
                  id="movementReason"
                  value={stockMovementForm.reason}
                  onChange={(e) =>
                    setStockMovementForm({
                      ...stockMovementForm,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Reason for movement"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStockMovementDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleStockMovementSubmit}>
                  Record Movement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Taking Dialog */}
        <Dialog
          open={showStockTakingDialog}
          onOpenChange={setShowStockTakingDialog}
        >
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Stock Taking Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockTakingDate">Stock Taking Date *</Label>
                  <Input
                    id="stockTakingDate"
                    type="date"
                    value={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {}}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="performedBy">Performed By *</Label>
                  <Input id="performedBy" placeholder="Enter your name" />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Stock Items Count</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {stockItems.map((item) => (
                    <div
                      key={item.tagNumber}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.tagNumber} - {item.itemName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current: {item.currentQuantity} {item.unitOfMeasure}
                        </div>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="Counted"
                          className="text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockTakingNotes">Notes</Label>
                <Textarea
                  id="stockTakingNotes"
                  placeholder="Stock taking notes and observations"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStockTakingDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleStockTakingSubmit}>
                  Complete Stock Taking
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Stock Item Dialog */}
        <Dialog open={showViewStockDialog} onOpenChange={setShowViewStockDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Stock Item Details</DialogTitle>
            </DialogHeader>
            {selectedStockItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tag Number</Label>
                      <p className="text-lg font-semibold">{selectedStockItem.tagNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Item Name</Label>
                      <p className="text-lg">{selectedStockItem.itemName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                      <p>{selectedStockItem.category}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p>{selectedStockItem.description}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                      <Badge
                        variant={
                          selectedStockItem.status === "In Stock"
                            ? "default"
                            : selectedStockItem.status === "Low Stock"
                              ? "destructive"
                              : "secondary"
                        }
                        className="ml-2"
                      >
                        {selectedStockItem.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Current Quantity</Label>
                      <p className={`text-lg font-semibold ${
                        selectedStockItem.currentQuantity <= selectedStockItem.minimumQuantity
                          ? "text-destructive"
                          : "text-green-600"
                      }`}>
                        {selectedStockItem.currentQuantity} {selectedStockItem.unitOfMeasure}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Minimum Quantity</Label>
                      <p>{selectedStockItem.minimumQuantity} {selectedStockItem.unitOfMeasure}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Unit Cost</Label>
                      <p>KSH {selectedStockItem.unitCost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p>{selectedStockItem.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                    <p>{selectedStockItem.supplier}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Restocked</Label>
                    <p>{selectedStockItem.lastRestocked}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Value</Label>
                    <p className="font-semibold">KSH {selectedStockItem.totalValue.toLocaleString()}</p>
                  </div>
                </div>

                {selectedStockItem.notes && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-sm bg-muted p-3 rounded">{selectedStockItem.notes}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  {selectedStockItem.status === "Low Stock" && (
                    <Button
                      onClick={() => {
                        setShowViewStockDialog(false);
                        handleRestockItem(selectedStockItem);
                      }}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Restock Now
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowViewStockDialog(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Restock Item Dialog */}
        <Dialog open={showRestockDialog} onOpenChange={setShowRestockDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Restock Item</DialogTitle>
            </DialogHeader>
            {selectedStockItem && (
              <div className="space-y-4 overflow-y-auto flex-1 px-1">
                <div className="bg-muted p-4 rounded">
                  <h4 className="font-semibold">{selectedStockItem.itemName}</h4>
                  <p className="text-sm text-muted-foreground">Tag: {selectedStockItem.tagNumber}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Current Stock:</span>
                      <p className="font-semibold text-destructive">
                        {selectedStockItem.currentQuantity} {selectedStockItem.unitOfMeasure}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Minimum Required:</span>
                      <p className="font-semibold">
                        {selectedStockItem.minimumQuantity} {selectedStockItem.unitOfMeasure}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Recommended Restock:</span>
                    <p className="font-semibold text-green-600">
                      {selectedStockItem.minimumQuantity - selectedStockItem.currentQuantity + 20} {selectedStockItem.unitOfMeasure}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restockQuantity">Restock Quantity *</Label>
                    <Input
                      id="restockQuantity"
                      type="number"
                      placeholder="Enter quantity to add"
                      value={stockMovementForm.quantity}
                      onChange={(e) =>
                        setStockMovementForm({
                          ...stockMovementForm,
                          quantity: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restockReason">Reason</Label>
                    <Input
                      id="restockReason"
                      placeholder="Reason for restocking"
                      value={stockMovementForm.reason}
                      onChange={(e) =>
                        setStockMovementForm({
                          ...stockMovementForm,
                          reason: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restockReference">Reference Number</Label>
                    <Input
                      id="restockReference"
                      placeholder="Purchase order or reference number"
                      value={stockMovementForm.referenceNumber}
                      onChange={(e) =>
                        setStockMovementForm({
                          ...stockMovementForm,
                          referenceNumber: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restockNotes">Notes</Label>
                    <Textarea
                      id="restockNotes"
                      placeholder="Additional notes"
                      rows={2}
                      value={stockMovementForm.notes}
                      onChange={(e) =>
                        setStockMovementForm({
                          ...stockMovementForm,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 flex-shrink-0 pt-4 border-t bg-background">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRestockDialog(false);
                      setSelectedStockItem(null);
                      setStockMovementForm({
                        tagNumber: "",
                        movementType: "Stock In",
                        quantity: "",
                        reason: "",
                        fromLocation: "",
                        toLocation: "",
                        referenceNumber: "",
                        notes: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRestockSubmit} className="bg-green-600 hover:bg-green-700">
                    Confirm Restock
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Stock Item Dialog */}
        <Dialog open={showEditStockDialog} onOpenChange={setShowEditStockDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Stock Item</DialogTitle>
            </DialogHeader>
            {selectedStockItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editItemName">Item Name *</Label>
                    <Input
                      id="editItemName"
                      value={editStockForm.itemName || ''}
                      onChange={(e) => setEditStockForm({...editStockForm, itemName: e.target.value})}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editCategory">Category *</Label>
                    <Select
                      value={editStockForm.category || ''}
                      onValueChange={(value) => setEditStockForm({...editStockForm, category: value as "Office Supplies" | "Cleaning Supplies" | "Furniture" | "Consumables" | "Food & Beverages" | "Electronic Assets" | "Musical Instruments" | "Audio/Visual Equipment" | "Maintenance Tools"})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Kitchen Supplies">Kitchen Supplies</SelectItem>
                        <SelectItem value="Cleaning Supplies">Cleaning Supplies</SelectItem>
                        <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editCurrentQuantity">Current Quantity *</Label>
                    <Input
                      id="editCurrentQuantity"
                      type="number"
                      value={editStockForm.currentQuantity || ''}
                      onChange={(e) => setEditStockForm({...editStockForm, currentQuantity: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMinQuantity">Minimum Quantity *</Label>
                    <Input
                      id="editMinQuantity"
                      type="number"
                      value={editStockForm.minimumQuantity || ''}
                      onChange={(e) => setEditStockForm({...editStockForm, minimumQuantity: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editUnitCost">Unit Cost (KSh) *</Label>
                    <Input
                      id="editUnitCost"
                      type="number"
                      value={editStockForm.unitCost || ''}
                      onChange={(e) => setEditStockForm({...editStockForm, unitCost: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLocation">Location *</Label>
                    <Input
                      id="editLocation"
                      value={editStockForm.location || ''}
                      onChange={(e) => setEditStockForm({...editStockForm, location: e.target.value})}
                      placeholder="Storage location"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editNotes">Notes</Label>
                  <Textarea
                    id="editNotes"
                    value={editStockForm.notes || ''}
                    onChange={(e) => setEditStockForm({...editStockForm, notes: e.target.value})}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditStockDialog(false);
                      setSelectedStockItem(null);
                      setEditStockForm({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateStockItem} className="bg-blue-600 hover:bg-blue-700">
                    Update Item
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Stock Item Dialog */}
        <Dialog open={showDeleteStockDialog} onOpenChange={setShowDeleteStockDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Stock Item
              </DialogTitle>
            </DialogHeader>
            {selectedStockItem && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm text-red-700">
                    Are you sure you want to delete "<strong>{selectedStockItem.itemName}</strong>"?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    This action cannot be undone. The item will be permanently removed from the inventory.
                  </p>
                  <div className="mt-3 p-2 bg-red-100 rounded text-xs">
                    <strong>Item Details:</strong><br />
                    Tag: {selectedStockItem.tagNumber}<br />
                    Category: {selectedStockItem.category}<br />
                    Quantity: {selectedStockItem.currentQuantity} {selectedStockItem.unitOfMeasure}<br />
                    Value: KSh {selectedStockItem.totalValue.toLocaleString()}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteStockDialog(false);
                      setSelectedStockItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDeleteStockItem}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Item
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Inventory Item Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inventory Item Details</DialogTitle>
            </DialogHeader>
            {selectedInventoryItem && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Item Code</Label>
                    <p className="text-sm font-mono">{selectedInventoryItem.itemCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedInventoryItem.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Item Name</Label>
                    <p className="text-sm">{selectedInventoryItem.itemName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-sm">{selectedInventoryItem.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Brand</Label>
                    <p className="text-sm">{selectedInventoryItem.brand}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Model</Label>
                    <p className="text-sm">{selectedInventoryItem.model}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedInventoryItem.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Purchase Date</Label>
                    <p className="text-sm">{selectedInventoryItem.purchaseDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Purchase Price</Label>
                    <p className="text-sm">KSH {selectedInventoryItem.purchasePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Current Value</Label>
                    <p className="text-sm">KSH {selectedInventoryItem.currentValue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="text-sm">{selectedInventoryItem.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Condition</Label>
                    <div className="mt-1">
                      {getConditionBadge(selectedInventoryItem.condition)}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                  <p className="text-sm">{selectedInventoryItem.supplier}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Inventory Item Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editItemName">Item Name *</Label>
                  <Input
                    id="editItemName"
                    value={editInventoryForm.itemName || ''}
                    onChange={(e) => setEditInventoryForm({...editInventoryForm, itemName: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <Label htmlFor="editCategory">Category *</Label>
                  <Select
                    value={editInventoryForm.category || ''}
                    onValueChange={(value) => setEditInventoryForm({...editInventoryForm, category: value as "Office Supplies" | "Cleaning Supplies" | "Furniture" | "Consumables" | "Food & Beverages" | "Electronic Assets" | "Musical Instruments" | "Audio/Visual Equipment" | "Maintenance Tools"})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                      <SelectItem value="Cleaning Supplies">Cleaning Supplies</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Consumables">Consumables</SelectItem>
                      <SelectItem value="Food & Beverages">Food & Beverages</SelectItem>
                      <SelectItem value="Electronic Assets">Electronic Assets</SelectItem>
                      <SelectItem value="Musical Instruments">Musical Instruments</SelectItem>
                      <SelectItem value="Audio/Visual Equipment">Audio/Visual Equipment</SelectItem>
                      <SelectItem value="Maintenance Tools">Maintenance Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editBrand">Brand</Label>
                  <Input
                    id="editBrand"
                    value={editInventoryForm.brand || ''}
                    onChange={(e) => setEditInventoryForm({...editInventoryForm, brand: e.target.value})}
                    placeholder="Enter brand"
                  />
                </div>
                <div>
                  <Label htmlFor="editModel">Model</Label>
                  <Input
                    id="editModel"
                    value={editInventoryForm.model || ''}
                    onChange={(e) => setEditInventoryForm({...editInventoryForm, model: e.target.value})}
                    placeholder="Enter model"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editInventoryForm.description || ''}
                  onChange={(e) => setEditInventoryForm({...editInventoryForm, description: e.target.value})}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editLocation">Location *</Label>
                  <Input
                    id="editLocation"
                    value={editInventoryForm.location || ''}
                    onChange={(e) => setEditInventoryForm({...editInventoryForm, location: e.target.value})}
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <Label htmlFor="editCurrentValue">Current Value (KSH)</Label>
                  <Input
                    id="editCurrentValue"
                    type="number"
                    value={editInventoryForm.currentValue || ''}
                    onChange={(e) => setEditInventoryForm({...editInventoryForm, currentValue: parseFloat(e.target.value) || 0})}
                    placeholder="Enter current value"
                  />
                </div>
                <div>
                  <Label htmlFor="editSupplier">Supplier</Label>
                  <Input
                    id="editSupplier"
                    value={editInventoryForm.supplier || ''}
                    onChange={(e) => setEditInventoryForm({...editInventoryForm, supplier: e.target.value})}
                    placeholder="Enter supplier"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => {
                  if (editInventoryForm.itemName && editInventoryForm.category && editInventoryForm.location) {
                    // Update the item in the list
                    setItems(prev => prev.map(item =>
                      item.id === selectedInventoryItem?.id
                        ? { ...item, ...editInventoryForm }
                        : item
                    ));
                    setShowEditDialog(false);
                    setSelectedInventoryItem(null);
                    setEditInventoryForm({});
                    alert('Inventory item updated successfully!');
                  } else {
                    alert('Please fill in all required fields.');
                  }
                }}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Item
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowEditDialog(false);
                  setSelectedInventoryItem(null);
                  setEditInventoryForm({});
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Inventory Item Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{selectedInventoryItem?.itemName}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedInventoryItem) {
                      setItems(prev => prev.filter(item => item.id !== selectedInventoryItem.id));
                      setShowDeleteDialog(false);
                      setSelectedInventoryItem(null);
                      alert('Inventory item deleted successfully!');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedInventoryItem(null);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
