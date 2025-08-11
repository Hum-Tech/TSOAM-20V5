import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { exportService } from "@/services/ExportService";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import EventCountdown from "@/components/EventCountdown";
import EventsCalendar from "@/components/EventsCalendar";

const eventTypes = [
  "Sunday Service",
  "Prayer Meeting",
  "Youth Service",
  "Bible Study",
  "Special Event",
  "Conference",
  "Workshop",
  "Outreach",
  "Fellowship",
  "Wedding",
  "Funeral",
  "Baptism",
];

const eventCategories = [
  "Worship",
  "Education",
  "Fellowship",
  "Outreach",
  "Administrative",
  "Special Occasion",
];

// Generate future dates for mock events
const today = new Date();
const getDateString = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Mock events data with upcoming events
const mockEvents = [
  {
    id: "EVT-2025-001",
    title: "Sunday Morning Service",
    description: "Weekly Sunday worship service with Pastor John Kamau",
    date: getDateString(1), // Tomorrow
    time: "09:00",
    endTime: "11:30",
    type: "Sunday Service",
    category: "Worship",
    location: "Main Sanctuary",
    organizer: "Pastor John Kamau",
    expectedAttendees: 500,
    status: "Active",
    recurring: "Weekly",
    budget: 25000,
    actualCost: 12000,
  },
  {
    id: "EVT-2025-002",
    title: "Youth Bible Study",
    description: "Interactive Bible study session for youth members",
    date: getDateString(3), // 3 days from now
    time: "18:00",
    endTime: "20:00",
    type: "Bible Study",
    category: "Education",
    location: "Youth Hall",
    organizer: "Sarah Wanjiku",
    expectedAttendees: 80,
    status: "Active",
    recurring: "Weekly",
    budget: 15000,
    actualCost: 5000,
  },
  {
    id: "EVT-2025-003",
    title: "Community Outreach",
    description: "Feeding program and community service in Kibera",
    date: getDateString(7), // 1 week from now
    time: "08:00",
    endTime: "16:00",
    type: "Special Event",
    category: "Outreach",
    location: "Kibera Community Center",
    organizer: "Community Ministry Team",
    expectedAttendees: 200,
    status: "Active",
    recurring: "Monthly",
    budget: 75000,
    actualCost: 25000,
  },
  {
    id: "EVT-2025-004",
    title: "Mid-week Prayer Meeting",
    description: "Corporate prayer and fellowship",
    date: getDateString(2), // 2 days from now
    time: "19:00",
    endTime: "20:30",
    type: "Prayer Meeting",
    category: "Worship",
    location: "Main Sanctuary",
    organizer: "Pastor Mary Wanjiku",
    expectedAttendees: 150,
    status: "Active",
    recurring: "Weekly",
    budget: 5000,
    actualCost: 2000,
  },
  {
    id: "EVT-2025-005",
    title: "Women's Fellowship Conference",
    description: "Annual women's conference with guest speakers and workshops",
    date: getDateString(14), // 2 weeks from now
    time: "09:00",
    endTime: "17:00",
    type: "Conference",
    category: "Fellowship",
    location: "Conference Hall",
    organizer: "Women's Ministry",
    expectedAttendees: 300,
    status: "Planning",
    recurring: "Yearly",
    budget: 120000,
    actualCost: 45000,
  },
  {
    id: "EVT-2025-006",
    title: "Youth Sports Tournament",
    description: "Inter-church youth sports competition and fellowship",
    date: getDateString(10), // 10 days from now
    time: "14:00",
    endTime: "18:00",
    type: "Special Event",
    category: "Fellowship",
    location: "Church Grounds",
    organizer: "Youth Ministry",
    expectedAttendees: 150,
    status: "Active",
    recurring: "None",
    budget: 30000,
    actualCost: 10000,
  },
  {
    id: "EVT-2025-007",
    title: "Easter Celebration",
    description: "Special Easter service and celebration",
    date: getDateString(30), // 1 month from now
    time: "07:00",
    endTime: "12:00",
    type: "Special Event",
    category: "Special Occasion",
    location: "Main Sanctuary",
    organizer: "Admin",
    expectedAttendees: 800,
    status: "Planning",
    recurring: "Yearly",
    budget: 200000,
    actualCost: 65000,
  },
];

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState(mockEvents);

  // Add error handling for any unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.name === 'AbortError') {
        event.preventDefault(); // Prevent console error for expected AbortErrors
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // Form state for creating new events
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    endTime: "",
    type: "",
    category: "",
    location: "",
    organizer: "",
    expectedAttendees: "",
    recurring: "none",
    budget: "",
    registrationRequired: "no",
  });

  const filteredEvents = events.filter(
    (event) =>
      (filterType === "all" || event.type === filterType) &&
      (filterCategory === "all" || event.category === filterCategory) &&
      (event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "default",
      Planning: "secondary",
      Completed: "outline",
      Cancelled: "destructive",
    };

    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Worship: "bg-blue-100 text-blue-800",
      Education: "bg-green-100 text-green-800",
      Fellowship: "bg-purple-100 text-purple-800",
      Outreach: "bg-orange-100 text-orange-800",
      Administrative: "bg-gray-100 text-gray-800",
      "Special Occasion": "bg-pink-100 text-pink-800",
    };

    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  // Record event expense
  const recordEventExpense = (
    eventId: string,
    eventName: string,
    expenseType: string,
    amount: number,
    description: string,
  ) => {
    financialTransactionService.addEventExpense({
      eventName: eventName,
      eventId: eventId,
      expenseType: expenseType,
      amount: amount,
      description: description,
    });

    // Save events data for Dashboard integration
    const eventsModuleData = {
      events: events,
      lastUpdated: new Date().toISOString(),
      totalEvents: events.length,
      upcomingEvents: events.filter((e) => new Date(e.date) > new Date())
        .length,
    };
    localStorage.setItem(
      "events_module_data",
      JSON.stringify(eventsModuleData),
    );
  };

  const handleDeleteEvent = (event: any) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
      alert(`Event "${selectedEvent.title}" has been deleted successfully.`);
    }
  };

  // Handle creating new event
  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      alert("Please fill in required fields: Title, Date, and Start Time");
      return;
    }

    const createdEvent = {
      id: `EVT-${Date.now()}`,
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      endTime: newEvent.endTime || "",
      type: newEvent.type || "Special Event",
      category: newEvent.category || "Administrative",
      location: newEvent.location,
      organizer: newEvent.organizer || "Admin",
      expectedAttendees: parseInt(newEvent.expectedAttendees) || 0,
      status: "Active",
      recurring: newEvent.recurring,
      budget: parseInt(newEvent.budget) || 0,
      actualCost: 0,
    };

    setEvents([...events, createdEvent]);
    setIsAddDialogOpen(false);

    // Reset form
    setNewEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      endTime: "",
      type: "",
      category: "",
      location: "",
      organizer: "",
      expectedAttendees: "",
      recurring: "none",
      budget: "",
      registrationRequired: "no",
    });

    alert(`Event "${createdEvent.title}" has been created successfully!`);
  };

  // Filter for upcoming events (events happening today or later)
  const upcomingEvents = events.filter(
    (event) => new Date(event.date) >= new Date(),
  );

  const thisWeekEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return eventDate >= today && eventDate <= nextWeek;
  });

  // Export function
  const handleExport = async (format: "excel" | "pdf" | "csv") => {
    const exportEvents = filteredEvents.map((event) => ({
      "Event Title": event.title,
      Type: event.type,
      Category: event.category,
      Date: event.date,
      "Start Time": event.time,
      "End Time": event.endTime,
      Location: event.location,
      Organizer: event.organizer,
      "Expected Attendees": event.expectedAttendees,
      Status: event.status,
      Description: event.description,
    }));

    try {
      await exportService.export({
        filename: `TSOAM_Events_Report_${new Date().toISOString().split("T")[0]}`,
        title: "TSOAM Church Events Report",
        subtitle: `Generated on ${new Date().toLocaleDateString()} | Total Events: ${exportEvents.length}`,
        data: exportEvents,
        format: format as "pdf" | "excel" | "csv",
        columns: [
          { key: "Event Title", title: "Event Title", width: 25 },
          { key: "Type", title: "Type", width: 15 },
          { key: "Category", title: "Category", width: 15 },
          { key: "Date", title: "Date" },
          { key: "Start Time", title: "Start Time" },
          { key: "End Time", title: "End Time" },
          { key: "Location", title: "Location" },
          { key: "Organizer", title: "Organizer" },
          { key: "Expected Attendees", title: "Expected Attendees" },
          { key: "Status", title: "Status" },
          { key: "Description", title: "Description" },
        ],
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + (error as any)?.message || String(error));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Church Events
            </h1>
            <p className="text-muted-foreground">
              Create and manage church events, services, and special gatherings
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <div className="space-y-4 pb-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Event description..."
                    rows={3}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Event Type</Label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newEvent.category} onValueChange={(value) => setNewEvent({...newEvent, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Event location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="organizer">Organizer</Label>
                    <Input
                      id="organizer"
                      placeholder="Event organizer"
                      value={newEvent.organizer}
                      onChange={(e) => setNewEvent({...newEvent, organizer: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expectedAttendees">
                      Expected Attendees
                    </Label>
                    <Input
                      id="expectedAttendees"
                      type="number"
                      placeholder="100"
                      value={newEvent.expectedAttendees}
                      onChange={(e) => setNewEvent({...newEvent, expectedAttendees: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recurring">Recurring</Label>
                    <Select value={newEvent.recurring} onValueChange={(value) => setNewEvent({...newEvent, recurring: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">One-time</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget Field */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget (KSh)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0"
                      value={newEvent.budget}
                      onChange={(e) => setNewEvent({...newEvent, budget: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationRequired">Registration Required</Label>
                    <Select value={newEvent.registrationRequired} onValueChange={(value) => setNewEvent({...newEvent, registrationRequired: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Registration required?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex-shrink-0 flex gap-2 pt-4 border-t bg-background">
                <Button onClick={handleCreateEvent} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {upcomingEvents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Upcoming Events
                  </div>
                </div>
                <CalendarIcon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {thisWeekEvents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">This Week</div>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {events.filter((e) => e.status === "Active").length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Active Events
                  </div>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {events
                      .reduce((sum, e) => sum + e.expectedAttendees, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Expected
                  </div>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Event List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {eventCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => handleExport("excel")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>

                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-6 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold">
                              {event.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}
                            >
                              {event.category}
                            </span>
                            {getStatusBadge(event.status)}
                          </div>
                          <p className="text-muted-foreground">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {event.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {event.time} - {event.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.expectedAttendees} expected
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Organized by: {event.organizer} • {event.recurring}{" "}
                            event
                          </div>
                        </div>

                        {/* Event Countdown */}
                        <div className="flex gap-4 items-start">
                          <div className="min-w-[200px]">
                            <EventCountdown
                              eventDate={event.date}
                              eventTime={event.time}
                              eventEndTime={event.endTime}
                              eventTitle={event.title}
                              className="border rounded-lg p-3 bg-muted/30"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEvent(event)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Event"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event)}
                              title="Delete Event"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="calendar">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {eventCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterType("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
            <EventsCalendar
              events={filteredEvents as any}
              selectedCategory={filterCategory}
              onEventClick={(event) => {
                handleViewEvent(event);
              }}
              onCategoryClick={(category) => {
                setFilterCategory(category);
              }}
            />
          </div>
        </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Events (Updated: {new Date().toLocaleTimeString()})</CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {upcomingEvents.length} upcoming events
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime(),
                    )
                    .map((event) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Event Info */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-xl font-semibold">{event.title}</h4>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}
                                  >
                                    {event.category}
                                  </span>
                                  {getStatusBadge(event.status)}
                                </div>
                                <p className="text-muted-foreground text-sm mb-3">
                                  {event.description}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {new Date(event.date).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Date</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{event.time}</div>
                                  <div className="text-xs text-muted-foreground">Start Time</div>
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
                                  <div className="font-medium">{event.expectedAttendees}</div>
                                  <div className="text-xs text-muted-foreground">Expected</div>
                                </div>
                              </div>
                            </div>

                            {/* Budget Information */}
                            {event.budget && event.budget > 0 && (
                              <div className="bg-muted/30 rounded-lg p-4">
                                <h5 className="font-medium mb-2 flex items-center gap-2">
                                  <span className="text-green-600">💰</span>
                                  Budget Information
                                </h5>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="text-muted-foreground">Total Budget</div>
                                    <div className="font-semibold text-green-600">
                                      KSh {event.budget.toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">Spent</div>
                                    <div className="font-semibold text-orange-600">
                                      KSh {(event.actualCost || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">Remaining</div>
                                    <div className={`font-semibold ${
                                      event.budget - (event.actualCost || 0) >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}>
                                      KSh {(event.budget - (event.actualCost || 0)).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        (event.actualCost || 0) <= event.budget
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{
                                        width: `${Math.min(((event.actualCost || 0) / event.budget) * 100, 100)}%`
                                      }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {(((event.actualCost || 0) / event.budget) * 100).toFixed(1)}% of budget used
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Organizer: {event.organizer}</span>
                              <span>🔄 {event.recurring}</span>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewEvent(event)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteEvent(event)}
                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>

                          {/* Live Countdown */}
                          <div className="flex flex-col justify-center">
                            <EventCountdown
                              eventDate={event.date}
                              eventTime={event.time}
                              eventEndTime={event.endTime}
                              eventTitle={event.title}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Event Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Event Details
              </DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Event Title</Label>
                    <p className="text-lg font-semibold">
                      {selectedEvent.title}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <div className="mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedEvent.category)}`}
                      >
                        {selectedEvent.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedEvent.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Date & Time</Label>
                    <p className="text-sm">
                      📅 {selectedEvent.date}
                      <br />⏰ {selectedEvent.time} - {selectedEvent.endTime}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm">📍 {selectedEvent.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Organizer</Label>
                    <p className="text-sm">👤 {selectedEvent.organizer}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Expected Attendees
                    </Label>
                    <p className="text-sm">
                      ���� {selectedEvent.expectedAttendees}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedEvent.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Recurring</Label>
                    <p className="text-sm">{selectedEvent.recurring}</p>
                  </div>
                </div>

                {/* Event Countdown */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Event Countdown</Label>
                  <div className="mt-2">
                    <EventCountdown
                      eventDate={selectedEvent.date}
                      eventTime={selectedEvent.time}
                      eventEndTime={selectedEvent.endTime}
                      eventTitle={selectedEvent.title}
                      className="border rounded-lg p-3 bg-muted/30"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleDeleteEvent(selectedEvent);
                    }}
                    variant="destructive"
                  >
                    Delete Event
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete Event
              </DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm text-red-700">
                    Are you sure you want to delete "
                    <strong>{selectedEvent.title}</strong>"?
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    This action cannot be undone. The event will be permanently
                    removed from the system.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmDeleteEvent}>
                    Delete Event
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
