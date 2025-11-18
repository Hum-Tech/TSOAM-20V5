/**
 * TSOAM Church Management System - Production Events Module
 *
 * Enhanced church events management with API integration, attendee tracking,
 * resource management, recurring events, financial integration, and analytics
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  Filter,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Repeat,
  Star,
  UserPlus,
  UserCheck,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ApiEventService, { Event as ApiEvent, EventRegistration } from "@/services/ApiEventService";
import ApiFinancialService from "@/services/ApiFinancialService";
import ApiMemberService from "@/services/ApiMemberService";
import EventCountdown from "@/components/EventCountdown";
import EventsCalendar from "@/components/EventsCalendar";
import BudgetProgress from "@/components/BudgetProgress";

// Use the API Event type with flexibility for demo data
type Event = ApiEvent & {
  updated_at?: string;
};

// Enhanced Types for Production
interface EventForm {
  title: string;
  description: string;
  category: string;
  location: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  max_attendees?: number;
  registration_required: boolean;
  registration_deadline?: string;
  organizer: string;
  contact_email?: string;
  contact_phone?: string;
  budget: number;
  actual_cost: number;
  status: string;
  is_active: boolean;
}

interface EventStats {
  total: number;
  upcoming: number;
  past: number;
  thisWeek: number;
  thisMonth: number;
  totalRegistrations: number;
  averageAttendance: number;
  totalBudget: number;
  totalSpent: number;
}

interface EventExpense {
  id: string;
  event_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt_url?: string;
}

interface EventResource {
  id: string;
  name: string;
  type: string;
  availability: boolean;
  cost?: number;
}

const EVENT_CATEGORIES = [
  "Worship Service",
  "Prayer Meeting",
  "Bible Study",
  "Youth Meeting",
  "Women Fellowship",
  "Men Fellowship",
  "Children Ministry",
  "Conference",
  "Seminar",
  "Workshop",
  "Outreach",
  "Community Service",
  "Wedding",
  "Baptism",
  "Funeral",
  "Special Event",
  "Holiday Celebration",
  "Fundraising",
];

const EVENT_STATUSES = [
  "Planned",
  "In Progress",
  "Completed",
  "Cancelled",
];

const RECURRENCE_PATTERNS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

export default function EventsEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize with demo data for immediate display
  const getDemoEvents = (): Event[] => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return [
      {
        id: "demo-1",
        event_id: "EVT-2025-001",
        title: "Sunday Morning Service",
        description: "Weekly Sunday worship service with Pastor John Kamau",
        start_date: tomorrow.toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "11:30",
        category: "Worship Service",
        location: "Main Sanctuary",
        organizer: "Pastor John Kamau",
        max_attendees: 500,
        status: "Planned" as const,
        is_recurring: true,
        recurrence_pattern: "weekly",
        budget: 25000,
        actual_cost: 12000,
        registration_required: false,
        is_active: true,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
      },
      {
        id: "demo-2",
        event_id: "EVT-2025-002",
        title: "Youth Bible Study",
        description: "Interactive Bible study session for youth members",
        start_date: nextWeek.toISOString().split('T')[0],
        start_time: "18:00",
        end_time: "20:00",
        category: "Bible Study",
        location: "Youth Hall",
        organizer: "Sarah Wanjiku",
        max_attendees: 80,
        status: "Planned" as const,
        is_recurring: true,
        recurrence_pattern: "weekly",
        budget: 15000,
        actual_cost: 5000,
        registration_required: true,
        registration_deadline: nextWeek.toISOString().split('T')[0],
        is_active: true,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
      },
      {
        id: "demo-3",
        event_id: "EVT-2025-003",
        title: "Easter Celebration",
        description: "Special Easter service and celebration with community feast",
        start_date: nextMonth.toISOString().split('T')[0],
        start_time: "07:00",
        end_time: "12:00",
        category: "Holiday Celebration",
        location: "Main Sanctuary & Community Hall",
        organizer: "Admin",
        max_attendees: 800,
        status: "Planned" as const,
        is_recurring: false,
        budget: 150000,
        actual_cost: 45000,
        registration_required: true,
        registration_deadline: new Date(nextMonth.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
      },
    ];
  };

  // State Management with demo data
  const [events, setEvents] = useState<Event[]>(getDemoEvents());
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<EventStats | null>({
    total: 3,
    upcoming: 3,
    past: 0,
    thisWeek: 2,
    thisMonth: 3,
    totalRegistrations: 45,
    averageAttendance: 85,
    totalBudget: 190000,
    totalSpent: 62000,
  });
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [expenses, setExpenses] = useState<EventExpense[]>([]);
  const [resources, setResources] = useState<EventResource[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [activeTab, setActiveTab] = useState("list");

  // Form State
  const [eventForm, setEventForm] = useState<EventForm>({
    title: "",
    description: "",
    category: "",
    location: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    is_recurring: false,
    recurrence_pattern: "",
    max_attendees: 0,
    registration_required: false,
    registration_deadline: "",
    organizer: user?.name || "",
    contact_email: "",
    contact_phone: "",
    budget: 0,
    actual_cost: 0,
    status: "Planned",
    is_active: true,
  });

  const [registrationForm, setRegistrationForm] = useState({
    name: "",
    email: "",
    phone: "",
    special_requirements: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: 0,
    category: "",
    receipt_url: "",
  });

  // Data Loading
  const loadEvents = useCallback(async (signal?: AbortSignal) => {
    try {
      // Only show loading for manual refresh, not initial load
      if (events.length === 0) {
        setLoading(false);
      }

      // Start with demo data for immediate UI
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Demo data as default
      let eventsData: Event[] = [
        {
          id: "demo-1",
          event_id: "EVT-2025-001",
          title: "Sunday Morning Service",
          description: "Weekly Sunday worship service with Pastor John Kamau",
          start_date: tomorrow.toISOString().split('T')[0],
          start_time: "09:00",
          end_time: "11:30",
          category: "Worship Service",
          location: "Main Sanctuary",
          organizer: "Pastor John Kamau",
          max_attendees: 500,
          status: "Planned" as const,
          is_recurring: true,
          recurrence_pattern: "weekly",
          budget: 25000,
          actual_cost: 12000,
          registration_required: false,
          is_active: true,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
        },
        {
          id: "demo-2",
          event_id: "EVT-2025-002",
          title: "Youth Bible Study",
          description: "Interactive Bible study session for youth members",
          start_date: nextWeek.toISOString().split('T')[0],
          start_time: "18:00",
          end_time: "20:00",
          category: "Bible Study",
          location: "Youth Hall",
          organizer: "Sarah Wanjiku",
          max_attendees: 80,
          status: "Planned" as const,
          is_recurring: true,
          recurrence_pattern: "weekly",
          budget: 15000,
          actual_cost: 5000,
          registration_required: true,
          registration_deadline: nextWeek.toISOString().split('T')[0],
          is_active: true,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
        },
        {
          id: "demo-3",
          event_id: "EVT-2025-003",
          title: "Easter Celebration",
          description: "Special Easter service and celebration with community feast",
          start_date: nextMonth.toISOString().split('T')[0],
          start_time: "07:00",
          end_time: "12:00",
          category: "Holiday Celebration",
          location: "Main Sanctuary & Community Hall",
          organizer: "Admin",
          max_attendees: 800,
          status: "Planned" as const,
          is_recurring: false,
          budget: 150000,
          actual_cost: 45000,
          registration_required: true,
          registration_deadline: new Date(nextMonth.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
        },
      ];

      let statsData: any = {
        total: eventsData.length,
        upcoming: eventsData.filter(e => new Date(e.start_date) >= today).length,
        past: 0,
        thisWeek: eventsData.filter(e => {
          const eventDate = new Date(e.start_date);
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return eventDate >= today && eventDate <= weekFromNow;
        }).length,
        thisMonth: eventsData.length,
        totalRegistrations: 45,
        averageAttendance: 85,
        totalBudget: eventsData.reduce((sum, e) => sum + e.budget, 0),
        totalSpent: eventsData.reduce((sum, e) => sum + e.actual_cost, 0),
      };

      // Try to enhance with API data (non-blocking) only if authenticated
      const authToken = localStorage.getItem('auth_token');
      const hasValidAuth = authToken && user?.id;

      if (hasValidAuth) {
        try {
          // Check if request was aborted before making API calls
          if (signal?.aborted) {
            return;
          }

          // Try API calls with better error handling
          const apiPromises = Promise.all([
            ApiEventService.getAllEvents().catch(error => {
              console.warn("Events API unavailable:", error.message);
              throw error;
            }),
            ApiEventService.getEventStatistics().catch(error => {
              console.warn("Event statistics API unavailable:", error.message);
              throw error;
            }),
          ]);

          const [apiEvents, apiStats] = await apiPromises;

          // Check if request was aborted after API calls
          if (signal?.aborted) {
            return;
          }

          // Use API data if successful
          eventsData = apiEvents;
          statsData = apiStats;
          console.log("Successfully loaded events from API");
        } catch (apiError) {
          // Check if the error is due to abort
          if (apiError instanceof Error && apiError.name === 'AbortError') {
            return;
          }

          // Handle different types of API errors
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';

          if (errorMessage.includes('401')) {
            console.log("Authentication required - using demo data");
          } else if (errorMessage.includes('Failed to fetch')) {
            console.log("API unavailable - using demo data");
          } else {
            console.log("API error - using demo data:", errorMessage);
          }

          // Demo data is already set above, so no need to reset it
        }
      } else {
        console.log("No authentication - using demo data for events");
      }

      // Final abort check before setting state
      if (signal?.aborted) {
        return;
      }

      setEvents(eventsData);
      setEventStats(statsData);

      // Apply current filters
      applyFilters(eventsData);
    } catch (error) {
      // Don't show error toast for aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Don't show user-facing errors for API unavailability - just use demo data
      console.log("Using demo data due to API unavailability");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [toast]);

  const loadEventRegistrations = useCallback(async (eventId: string) => {
    try {
      const data = await ApiEventService.getEventRegistrations(eventId);
      setRegistrations(data);
    } catch (error) {
      // Don't log AbortErrors as they're expected during cleanup
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error loading registrations:", error);
      }
    }
  }, []);

  // Filter Logic
  const applyFilters = useCallback((eventList: Event[]) => {
    let filtered = eventList;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.organizer || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((event) => event.category === filterCategory);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((event) => event.status === filterStatus);
    }

    // Date range filter
    if (filterDateRange !== "all") {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start_date);
        switch (filterDateRange) {
          case "today":
            return eventDate.toDateString() === new Date().toDateString();
          case "week":
            return eventDate >= startOfWeek && eventDate <= endOfWeek;
          case "month":
            return eventDate >= startOfMonth && eventDate <= endOfMonth;
          case "upcoming":
            return eventDate > new Date();
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  }, [searchTerm, filterCategory, filterStatus, filterDateRange]);

  // Event CRUD Operations
  const handleCreateEvent = async () => {
    try {
      if (!eventForm.title || !eventForm.start_date || !eventForm.start_time) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      let newEvent: Event | null = null;

      // Check if user is authenticated before trying API
      const authToken = localStorage.getItem('auth_token');
      const hasValidAuth = authToken && user?.id;

      // Try API first only if authenticated, otherwise fallback to local creation
      if (hasValidAuth) {
        try {
          newEvent = await ApiEventService.createEvent({
            ...eventForm,
            status: eventForm.status as "Planned" | "In Progress" | "Completed" | "Cancelled"
          });
          console.log("Event created via API");
        } catch (apiError) {
          // Handle different types of API errors
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';

          if (errorMessage.includes('401')) {
            console.log("Authentication required - creating event locally");
          } else if (errorMessage.includes('Failed to fetch')) {
            console.log("API unavailable - creating event locally");
          } else {
            console.log("API error - creating event locally:", errorMessage);
          }

          // Fallback to local creation on any API error
          newEvent = null;
        }
      }

      // Create event locally if API failed or user not authenticated
      if (!newEvent) {
        console.log("Creating event locally");
        newEvent = {
          id: `evt-${Date.now()}`,
          event_id: `EVT-${Date.now()}`,
          title: eventForm.title,
          description: eventForm.description,
          category: eventForm.category,
          location: eventForm.location,
          start_date: eventForm.start_date,
          end_date: eventForm.end_date,
          start_time: eventForm.start_time,
          end_time: eventForm.end_time,
          is_recurring: eventForm.is_recurring,
          recurrence_pattern: eventForm.recurrence_pattern,
          max_attendees: eventForm.max_attendees,
          registration_required: eventForm.registration_required,
          registration_deadline: eventForm.registration_deadline,
          organizer: eventForm.organizer,
          contact_email: eventForm.contact_email,
          contact_phone: eventForm.contact_phone,
          budget: eventForm.budget,
          actual_cost: eventForm.actual_cost,
          status: eventForm.status as "Planned" | "In Progress" | "Completed" | "Cancelled",
          is_active: eventForm.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Add to current events list
        setEvents([...events, newEvent]);
      }

      if (newEvent) {
        toast({
          title: "Success",
          description: "Event created successfully!",
        });
        setShowCreateDialog(false);
        resetEventForm();

        // Refresh events if API was used
        if (events.some(e => e.id.startsWith('evt-'))) {
          // If we have local events, just refresh the view
          loadEvents();
        }
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
      const updatedEvent = await ApiEventService.updateEvent(selectedEvent.id, {
        ...eventForm,
        status: eventForm.status as "Planned" | "In Progress" | "Completed" | "Cancelled"
      });
      if (updatedEvent) {
        toast({
          title: "Success",
          description: "Event updated successfully!",
        });
        setShowEditDialog(false);
        setSelectedEvent(null);
        resetEventForm();
        loadEvents();
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      const success = await ApiEventService.deleteEvent(selectedEvent.id);
      if (success) {
        toast({
          title: "Success",
          description: "Event deleted successfully!",
        });
        setShowDeleteDialog(false);
        setSelectedEvent(null);
        loadEvents();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Registration Management
  const handleRegisterForEvent = async () => {
    if (!selectedEvent) return;

    try {
      const registration = await ApiEventService.registerForEvent(
        selectedEvent.id,
        registrationForm
      );
      if (registration) {
        toast({
          title: "Success",
          description: "Registration successful!",
        });
        setShowRegistrationDialog(false);
        setRegistrationForm({ name: "", email: "", phone: "", special_requirements: "" });
        loadEventRegistrations(selectedEvent.id);
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Expense Management
  const handleAddExpense = async () => {
    if (!selectedEvent) return;

    try {
      // Create financial transaction
      await ApiFinancialService.createTransaction({
        date: new Date().toISOString().split('T')[0],
        type: "Expense",
        category: "Events",
        subcategory: expenseForm.category,
        description: `${selectedEvent.title} - ${expenseForm.description}`,
        amount: expenseForm.amount,
        currency: "KSh",
        payment_method: "Cash",
        reference: `EVT-EXP-${selectedEvent.event_id}`,
        status: "Completed",
        created_by: user?.name || "System",
        account_code: "EVT-EXPENSE",
      });

      toast({
        title: "Success",
        description: "Expense recorded successfully!",
      });
      setShowExpenseDialog(false);
      setExpenseForm({ description: "", amount: 0, category: "", receipt_url: "" });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to record expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Utility Functions
  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      category: "",
      location: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      is_recurring: false,
      recurrence_pattern: "",
      max_attendees: 0,
      registration_required: false,
      registration_deadline: "",
      organizer: user?.name || "",
      contact_email: "",
      contact_phone: "",
      budget: 0,
      actual_cost: 0,
      status: "Planned",
      is_active: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Planned: "secondary",
      "In Progress": "default",
      Completed: "outline",
      Cancelled: "destructive",
    };

    const icons = {
      Planned: <Settings className="h-3 w-3 mr-1" />,
      "In Progress": <Activity className="h-3 w-3 mr-1" />,
      Completed: <CheckCircle className="h-3 w-3 mr-1" />,
      Cancelled: <XCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status] as any} className="flex items-center">
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "Worship Service": "bg-blue-100 text-blue-800",
      "Prayer Meeting": "bg-purple-100 text-purple-800",
      "Bible Study": "bg-green-100 text-green-800",
      "Youth Meeting": "bg-orange-100 text-orange-800",
      "Women Fellowship": "bg-pink-100 text-pink-800",
      "Men Fellowship": "bg-indigo-100 text-indigo-800",
      "Children Ministry": "bg-yellow-100 text-yellow-800",
      Conference: "bg-red-100 text-red-800",
      Workshop: "bg-gray-100 text-gray-800",
      Outreach: "bg-teal-100 text-teal-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  // Effects
  useEffect(() => {
    const abortController = new AbortController();
    loadEvents(abortController.signal);

    // Cleanup function to abort any pending requests
    return () => {
      abortController.abort();
    };
  }, [loadEvents]);

  useEffect(() => {
    applyFilters(events);
  }, [events, applyFilters]);

  // Render Methods
  const renderEventCard = (event: Event) => (
    <Card key={event.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                  {event.category}
                </span>
                {getStatusBadge(event.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(event.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{event.start_time}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{event.max_attendees || "No limit"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span>Organizer: {event.organizer}</span>
                </div>
                {event.budget > 0 && (
                  <div className="min-w-[200px]">
                    <BudgetProgress
                      budget={event.budget}
                      spent={event.actual_cost}
                      showDetails={false}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEvent(event);
                    setActiveTab("details");
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {user?.permissions?.events && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setEventForm({
                          title: event.title,
                          description: event.description || "",
                          category: event.category,
                          location: event.location,
                          start_date: event.start_date,
                          end_date: event.end_date || "",
                          start_time: event.start_time,
                          end_time: event.end_time || "",
                          is_recurring: event.is_recurring,
                          recurrence_pattern: event.recurrence_pattern || "",
                          max_attendees: event.max_attendees || 0,
                          registration_required: event.registration_required,
                          registration_deadline: event.registration_deadline || "",
                          organizer: event.organizer,
                          contact_email: event.contact_email || "",
                          contact_phone: event.contact_phone || "",
                          budget: event.budget,
                          actual_cost: event.actual_cost,
                          status: event.status,
                          is_active: event.is_active,
                        });
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowDeleteDialog(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {event.registration_required && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowRegistrationDialog(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Register
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isUpcoming(event.start_date) && (
            <div className="min-w-[200px]">
              <EventCountdown
                eventDate={event.start_date}
                eventTime={event.start_time}
                eventEndTime={event.end_time}
                eventTitle={event.title}
                className="border rounded-lg p-3 bg-muted/30"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Component Loading State - Removed for immediate demo data display

  return (
    <Layout>
      <PageHeader
        title="Church Events"
        description="Comprehensive event management with registration, analytics, and financial tracking"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAnalyticsDialog(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            {user?.permissions?.events && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        }
      />

      {/* Statistics Cards */}
      {eventStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{eventStats.upcoming}</div>
                  <div className="text-sm text-muted-foreground">
                    Upcoming Events
                  </div>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{eventStats.totalRegistrations}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Registrations
                  </div>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(eventStats.totalBudget)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Budget
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round(eventStats.averageAttendance)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Attendance
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {EVENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDateRange} onValueChange={setFilterDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadEvents()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="list">Event List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(renderEventCard)
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                    ? "No events match your current filters."
                    : "Get started by creating your first event."}
                </p>
                {user?.permissions?.events && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Event
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <EventsCalendar
            events={filteredEvents}
            onEventClick={(event) => {
              setSelectedEvent(event as any);
              setActiveTab("details");
            }}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {(() => {
            const upcomingEvents = filteredEvents
              .filter((event) => new Date(event.start_date) >= new Date())
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

            return upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Upcoming Events</h3>
                  <Badge variant="outline" className="text-sm">
                    {upcomingEvents.length} upcoming events
                  </Badge>
                </div>

                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Event Info */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-xl font-semibold">{event.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                                  {event.category}
                                </span>
                                {getStatusBadge(event.status)}
                              </div>
                              <p className="text-muted-foreground text-sm mb-3">
                                {event.description || "No description provided"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {new Date(event.start_date).toLocaleDateString()}
                                </div>
                                {event.end_date && event.end_date !== event.start_date && (
                                  <div className="text-xs text-muted-foreground">
                                    to {new Date(event.end_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{event.start_time}</div>
                                {event.end_time && (
                                  <div className="text-xs text-muted-foreground">
                                    to {event.end_time}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{event.location}</div>
                                <div className="text-xs text-muted-foreground">Venue</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {event.max_attendees ? `${event.max_attendees} max` : "No limit"}
                                </div>
                                <div className="text-xs text-muted-foreground">Attendees</div>
                              </div>
                            </div>
                          </div>

                          {/* Budget Information */}
                          {event.budget > 0 && (
                            <div className="bg-muted/30 rounded-lg p-4">
                              <BudgetProgress
                                budget={event.budget}
                                spent={event.actual_cost}
                                showDetails={true}
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Organizer: {event.organizer}</span>
                            {event.is_recurring && (
                              <span className="flex items-center gap-1">
                                <Repeat className="h-3 w-3" />
                                {event.recurrence_pattern || "Recurring"}
                              </span>
                            )}
                            {event.registration_required && (
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                Registration Required
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEvent(event);
                                setActiveTab("details");
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            {event.registration_required && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowRegistrationDialog(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Register
                              </Button>
                            )}
                            {user?.permissions?.events && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowExpenseDialog(true);
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Add Expense
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Live Countdown */}
                        <div className="flex flex-col justify-center">
                          <EventCountdown
                            eventDate={event.start_date}
                            eventTime={event.start_time}
                            eventEndTime={event.end_time}
                            eventTitle={event.title}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                      ? "No upcoming events match your current filters."
                      : "There are no upcoming events scheduled at the moment."}
                  </p>
                  {user?.permissions?.events && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule New Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        <TabsContent value="details">
          {selectedEvent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {selectedEvent.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedEvent.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedEvent.category)}`}>
                      {selectedEvent.category}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEvent.description || "No description provided"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Date</Label>
                        <p className="text-sm">
                          {new Date(selectedEvent.start_date).toLocaleDateString()}
                          {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                            <> - {new Date(selectedEvent.end_date).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Time</Label>
                        <p className="text-sm">
                          {selectedEvent.start_time}
                          {selectedEvent.end_time && <> - {selectedEvent.end_time}</>}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="text-sm">{selectedEvent.location}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Organizer</Label>
                      <p className="text-sm">{selectedEvent.organizer}</p>
                      {selectedEvent.contact_email && (
                        <p className="text-xs text-muted-foreground">
                          {selectedEvent.contact_email}
                        </p>
                      )}
                      {selectedEvent.contact_phone && (
                        <p className="text-xs text-muted-foreground">
                          {selectedEvent.contact_phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isUpcoming(selectedEvent.start_date) && (
                      <div>
                        <Label className="text-sm font-medium">Countdown</Label>
                        <EventCountdown
                          eventDate={selectedEvent.start_date}
                          eventTime={selectedEvent.start_time}
                          eventEndTime={selectedEvent.end_time}
                          eventTitle={selectedEvent.title}
                          className="border rounded-lg p-3 bg-muted/30 mt-2"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Max Attendees</Label>
                        <p className="text-sm">
                          {selectedEvent.max_attendees || "No limit"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Registration Required</Label>
                        <p className="text-sm">
                          {selectedEvent.registration_required ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    {selectedEvent.registration_deadline && (
                      <div>
                        <Label className="text-sm font-medium">Registration Deadline</Label>
                        <p className="text-sm">
                          {new Date(selectedEvent.registration_deadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Budget</Label>
                        <p className="text-sm">{formatCurrency(selectedEvent.budget)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Actual Cost</Label>
                        <p className="text-sm">{formatCurrency(selectedEvent.actual_cost)}</p>
                      </div>
                    </div>

                    {selectedEvent.is_recurring && (
                      <div>
                        <Label className="text-sm font-medium">Recurring</Label>
                        <p className="text-sm flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {selectedEvent.recurrence_pattern || "Custom pattern"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedEvent.registration_required && (
                    <Button
                      onClick={() => {
                        setShowRegistrationDialog(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register for Event
                    </Button>
                  )}
                  {user?.permissions?.events && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowExpenseDialog(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          loadEventRegistrations(selectedEvent.id);
                          setActiveTab("registrations");
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Registrations
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
                <p className="text-muted-foreground">
                  Select an event from the list to view its details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle>Event Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvent ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{selectedEvent.title}</h4>
                    <Badge variant="outline">
                      {registrations.length} registered
                    </Badge>
                  </div>

                  {registrations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((registration) => (
                          <TableRow key={registration.id}>
                            <TableCell>{registration.name}</TableCell>
                            <TableCell>{registration.email}</TableCell>
                            <TableCell>{registration.phone || "—"}</TableCell>
                            <TableCell>
                              {new Date(registration.registration_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                registration.status === "Confirmed" ? "default" : "secondary"
                              }>
                                {registration.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Registrations Yet</h3>
                      <p className="text-muted-foreground">
                        Registrations will appear here once people sign up for the event.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
                  <p className="text-muted-foreground">
                    Select an event to view its registrations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                  placeholder="Event description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={eventForm.category}
                    onValueChange={(value) =>
                      setEventForm({ ...eventForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={eventForm.status}
                    onValueChange={(value) =>
                      setEventForm({ ...eventForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={eventForm.location}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, location: e.target.value })
                  }
                  placeholder="Event location"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={eventForm.start_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={eventForm.end_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={eventForm.start_time}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, start_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={eventForm.end_time}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  value={eventForm.organizer}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, organizer: e.target.value })
                  }
                  placeholder="Event organizer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={eventForm.contact_email}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, contact_email: e.target.value })
                    }
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={eventForm.contact_phone}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, contact_phone: e.target.value })
                    }
                    placeholder="+254-xxx-xxx-xxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    value={eventForm.max_attendees}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        max_attendees: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0 = no limit"
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget (KSh)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={eventForm.budget}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        budget: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="registration_required"
                    checked={eventForm.registration_required}
                    onCheckedChange={(checked) =>
                      setEventForm({
                        ...eventForm,
                        registration_required: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="registration_required">
                    Registration Required
                  </Label>
                </div>

                {eventForm.registration_required && (
                  <div>
                    <Label htmlFor="registration_deadline">
                      Registration Deadline
                    </Label>
                    <Input
                      id="registration_deadline"
                      type="date"
                      value={eventForm.registration_deadline}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          registration_deadline: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_recurring"
                    checked={eventForm.is_recurring}
                    onCheckedChange={(checked) =>
                      setEventForm({
                        ...eventForm,
                        is_recurring: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="is_recurring">Recurring Event</Label>
                </div>

                {eventForm.is_recurring && (
                  <div>
                    <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                    <Select
                      value={eventForm.recurrence_pattern}
                      onValueChange={(value) =>
                        setEventForm({
                          ...eventForm,
                          recurrence_pattern: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_PATTERNS.map((pattern) => (
                          <SelectItem key={pattern.value} value={pattern.value}>
                            {pattern.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateEvent} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Event
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetEventForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {/* Same form structure as create dialog, but with update handler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Same form fields as create dialog */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                  placeholder="Event description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={eventForm.category}
                    onValueChange={(value) =>
                      setEventForm({ ...eventForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={eventForm.status}
                    onValueChange={(value) =>
                      setEventForm({ ...eventForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={eventForm.location}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, location: e.target.value })
                  }
                  placeholder="Event location"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start_date">Start Date *</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={eventForm.start_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end_date">End Date</Label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={eventForm.end_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start_time">Start Time *</Label>
                  <Input
                    id="edit-start_time"
                    type="time"
                    value={eventForm.start_time}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, start_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end_time">End Time</Label>
                  <Input
                    id="edit-end_time"
                    type="time"
                    value={eventForm.end_time}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-organizer">Organizer</Label>
                <Input
                  id="edit-organizer"
                  value={eventForm.organizer}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, organizer: e.target.value })
                  }
                  placeholder="Event organizer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-contact_email">Contact Email</Label>
                  <Input
                    id="edit-contact_email"
                    type="email"
                    value={eventForm.contact_email}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, contact_email: e.target.value })
                    }
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact_phone">Contact Phone</Label>
                  <Input
                    id="edit-contact_phone"
                    value={eventForm.contact_phone}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, contact_phone: e.target.value })
                    }
                    placeholder="+254-xxx-xxx-xxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-max_attendees">Max Attendees</Label>
                  <Input
                    id="edit-max_attendees"
                    type="number"
                    value={eventForm.max_attendees}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        max_attendees: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0 = no limit"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-budget">Budget (KSh)</Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    value={eventForm.budget}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        budget: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-registration_required"
                    checked={eventForm.registration_required}
                    onCheckedChange={(checked) =>
                      setEventForm({
                        ...eventForm,
                        registration_required: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="edit-registration_required">
                    Registration Required
                  </Label>
                </div>

                {eventForm.registration_required && (
                  <div>
                    <Label htmlFor="edit-registration_deadline">
                      Registration Deadline
                    </Label>
                    <Input
                      id="edit-registration_deadline"
                      type="date"
                      value={eventForm.registration_deadline}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          registration_deadline: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-is_recurring"
                    checked={eventForm.is_recurring}
                    onCheckedChange={(checked) =>
                      setEventForm({
                        ...eventForm,
                        is_recurring: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="edit-is_recurring">Recurring Event</Label>
                </div>

                {eventForm.is_recurring && (
                  <div>
                    <Label htmlFor="edit-recurrence_pattern">Recurrence Pattern</Label>
                    <Select
                      value={eventForm.recurrence_pattern}
                      onValueChange={(value) =>
                        setEventForm({
                          ...eventForm,
                          recurrence_pattern: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_PATTERNS.map((pattern) => (
                          <SelectItem key={pattern.value} value={pattern.value}>
                            {pattern.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdateEvent} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Update Event
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedEvent(null);
                resetEventForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action
              cannot be undone. All registrations and associated data will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Register for Event
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedEvent.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedEvent.start_date).toLocaleDateString()} at{" "}
                  {selectedEvent.start_time}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.location}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="reg-name">Full Name *</Label>
                  <Input
                    id="reg-name"
                    value={registrationForm.name}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="reg-email">Email *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={registrationForm.email}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="reg-phone">Phone Number</Label>
                  <Input
                    id="reg-phone"
                    value={registrationForm.phone}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+254-xxx-xxx-xxx"
                  />
                </div>

                <div>
                  <Label htmlFor="reg-requirements">Special Requirements</Label>
                  <Textarea
                    id="reg-requirements"
                    value={registrationForm.special_requirements}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        special_requirements: e.target.value,
                      })
                    }
                    placeholder="Any special requirements or notes..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleRegisterForEvent} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Register
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRegistrationDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Add Event Expense
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedEvent.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Budget: {formatCurrency(selectedEvent.budget)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Spent: {formatCurrency(selectedEvent.actual_cost)}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="exp-description">Description *</Label>
                  <Input
                    id="exp-description"
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="What was purchased/paid for?"
                  />
                </div>

                <div>
                  <Label htmlFor="exp-amount">Amount (KSh) *</Label>
                  <Input
                    id="exp-amount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="exp-category">Category</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) =>
                      setExpenseForm({ ...expenseForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="catering">Catering</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="decorations">Decorations</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="materials">Materials</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="exp-receipt">Receipt URL</Label>
                  <Input
                    id="exp-receipt"
                    value={expenseForm.receipt_url}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        receipt_url: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddExpense} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  Add Expense
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExpenseDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Event Analytics
            </DialogTitle>
          </DialogHeader>
          {eventStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {eventStats.total}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Events
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {eventStats.upcoming}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Upcoming
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {eventStats.totalRegistrations}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Registrations
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(eventStats.averageAttendance)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg Attendance
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Budget Allocated:</span>
                      <span className="font-medium">
                        {formatCurrency(eventStats.totalBudget)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Spent:</span>
                      <span className="font-medium">
                        {formatCurrency(eventStats.totalSpent)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Budget:</span>
                      <span className={`font-medium ${
                        eventStats.totalBudget - eventStats.totalSpent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}>
                        {formatCurrency(eventStats.totalBudget - eventStats.totalSpent)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(
                        events.reduce((acc, event) => {
                          acc[event.category] = (acc[event.category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([category, count]) => (
                          <div key={category} className="flex justify-between">
                            <span className="text-sm">{category}</span>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {events
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((event) => (
                        <div key={event.id} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium">{event.title}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {new Date(event.start_date).toLocaleDateString()}
                            </span>
                          </div>
                          {getStatusBadge(event.status)}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
