import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  Settings,
  User,
  LogOut,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  Mail,
  CheckCheck,
  Eye,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// Types for notifications and messages
interface Notification {
  id: number;
  type: "message" | "system" | "welfare" | "maintenance";
  title: string;
  message: string;
  time: string;
  unread: boolean;
  sender?: string;
  recipient?: string;
  priority: "low" | "medium" | "high";
  messageType?: string;
  subject?: string;
  fullMessage?: string;
  senderId?: string;
}

interface Message {
  id: number;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  delivered: boolean;
  category: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const navigate = useNavigate();

  // Add error handling for auth context
  let user, logout;
  try {
    const authContext = useAuth();
    user = authContext.user;
    logout = authContext.logout;
  } catch (error) {
    console.error('Auth context error in Header:', error);
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center">
          <div className="text-red-500">Authentication Error - Please refresh the page</div>
        </div>
      </header>
    );
  }
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "message",
      title: "New Message",
      message: "You have a new message from Pastor James",
      time: "5 min ago",
      unread: true,
      sender: "Pastor James Kuria",
      recipient: user?.name || "You",
      priority: "medium",
    },
    {
      id: 2,
      type: "system",
      title: "Payroll Processed",
      message: "Monthly payroll has been successfully processed",
      time: "1 hour ago",
      unread: true,
      priority: "low",
    },
    {
      id: 3,
      type: "welfare",
      title: "Welfare Request",
      message: "New welfare request requires your approval",
      time: "2 hours ago",
      unread: false,
      priority: "high",
    },
    {
      id: 4,
      type: "maintenance",
      title: "Equipment Maintenance",
      message: "Sound system maintenance is due tomorrow",
      time: "3 hours ago",
      unread: false,
      priority: "medium",
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: "Pastor James Kuria",
      to: user?.name || "You",
      subject: "Weekly Service Preparation",
      content:
        "Please prepare the worship songs for this Sunday's service. We'll need 4 songs for the opening and 2 for the closing.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
      delivered: true,
      category: "Worship Team",
    },
    {
      id: 2,
      from: "Mary Wanjiku",
      to: user?.name || "You",
      subject: "HR Policy Update",
      content:
        "New HR policies have been updated. Please review the changes in the HR module.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
      delivered: true,
      category: "HR Team",
    },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyingToNotification, setReplyingToNotification] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };

  // Count unread notifications
  const unreadCount = notifications.filter((n) => n.unread).length;
  const unreadInternalMessages = notifications.filter((n) => n.unread && n.type === "message").length;
  const unreadMessages = messages.filter((m) => !m.read).length;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (user) {
      // Check user-specific notifications first
      const userSpecificKey = `notifications_${user.id}`;
      const userSpecificNotifications = JSON.parse(localStorage.getItem(userSpecificKey) || '[]');

      // Also check general notifications for backward compatibility
      const generalNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');

      // Combine and filter notifications for current user
      const allNotifications = [...userSpecificNotifications, ...generalNotifications];
      const userNotifications = allNotifications.filter((notif: any, index: number, arr: any[]) => {
        // Remove duplicates based on ID
        const isUnique = arr.findIndex(n => n.id === notif.id) === index;
        if (!isUnique) return false;

        // If it's an internal message, only show to the specific recipient
        if (notif.type === "internal" && notif.recipientId) {
          return notif.recipientId === user.id ||
                 notif.recipientEmail === user.email ||
                 notif.recipientId === `E00${user.id}`;
        }
        // Show all other types of notifications
        return true;
      });

      // Convert to header notification format and sort by timestamp
      const headerNotifications = userNotifications
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map((notif: any) => ({
          id: notif.id || Date.now(),
          type: (notif.type === "internal" ? "message" : "system") as "message" | "system" | "welfare" | "maintenance",
          title: notif.title || "New Notification",
          message: notif.message || "You have a new notification",
          time: notif.timestamp ? formatTime(notif.timestamp) : "Recently",
          unread: !notif.read,
          priority: notif.type === "internal" ? "high" : "medium" as "high" | "medium" | "low",
          fullMessage: notif.fullMessage,
          sender: notif.sender,
          subject: notif.subject,
          messageType: notif.messageType
        }));

      setNotifications(headerNotifications);
    }
  }, [user]);

  // Listen for new notifications from messaging system
  useEffect(() => {
    const handleNotificationAdded = (event: CustomEvent) => {
      const { count, type, sender } = event.detail;

      // Reload notifications from localStorage to get the latest data
      if (user) {
        const userSpecificKey = `notifications_${user.id}`;
        const userSpecificNotifications = JSON.parse(localStorage.getItem(userSpecificKey) || '[]');
        const generalNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');

        const allNotifications = [...userSpecificNotifications, ...generalNotifications];
        const userNotifications = allNotifications.filter((notif: any, index: number, arr: any[]) => {
          const isUnique = arr.findIndex(n => n.id === notif.id) === index;
          if (!isUnique) return false;

          if (notif.type === "internal" && notif.recipientId) {
            return notif.recipientId === user.id ||
                   notif.recipientEmail === user.email ||
                   notif.recipientId === `E00${user.id}`;
          }
          return true;
        });

        const headerNotifications = userNotifications
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
          .map((notif: any) => ({
            id: notif.id || Date.now(),
            type: (notif.type === "internal" ? "message" : "system") as "message" | "system" | "welfare" | "maintenance",
            title: notif.title || "New Notification",
            message: notif.message || "You have a new notification",
            time: notif.timestamp ? formatTime(notif.timestamp) : "Recently",
            unread: !notif.read,
            priority: notif.type === "internal" ? "high" : "medium" as "high" | "medium" | "low",
            fullMessage: notif.fullMessage,
            sender: notif.sender,
            subject: notif.subject,
            messageType: notif.messageType
          }));

        setNotifications(headerNotifications);

        // Show toast notification for new internal messages
        const latestNotification = userNotifications[0];
        if (latestNotification && latestNotification.type === "internal" && !latestNotification.read) {
          console.log(`🔔 New internal message from ${latestNotification.sender}`);
        }
      }
    };

    // Listen for localStorage changes (when other tabs/windows update notifications)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('notifications_') && user) {
        // Reload notifications when localStorage changes
        window.dispatchEvent(new CustomEvent('notificationAdded', { detail: { type: 'Internal', sender: 'System', count: 1 } }));
      }
    };

    window.addEventListener('notificationAdded', handleNotificationAdded as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('notificationAdded', handleNotificationAdded as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // Handle sending a reply to a notification
  const handleSendReply = async () => {
    if (!replyingToNotification || !replyContent.trim() || !user) return;

    try {
      // Send reply through API
      const response = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: user.id,
          original_message_id: replyingToNotification.id,
          reply_content: replyContent,
          recipient_id: replyingToNotification.senderId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Also store locally for immediate UI update
        const replyNotification = {
          id: result.replyId,
          title: `Reply from ${user.name}`,
          message: replyContent.length > 100 ? replyContent.substring(0, 100) + "..." : replyContent,
          fullMessage: replyContent,
          sender: user.name,
          senderId: user.id,
          recipient: replyingToNotification.sender,
          recipientId: replyingToNotification.senderId,
          type: "internal",
          timestamp: new Date().toISOString(),
          read: false,
          messageType: "Reply",
          originalMessageId: replyingToNotification.id,
          isReply: true
        };

        // Store reply notification for the original sender
        if (replyingToNotification.senderId) {
          const senderKey = `notifications_${replyingToNotification.senderId}`;
          const senderNotifications = JSON.parse(localStorage.getItem(senderKey) || '[]');
          senderNotifications.unshift(replyNotification);
          localStorage.setItem(senderKey, JSON.stringify(senderNotifications));
        }

        // Dispatch notification event for real-time updates
        window.dispatchEvent(new CustomEvent('notificationAdded', {
          detail: {
            count: 1,
            type: "Reply",
            sender: user.name,
            recipient: replyingToNotification.sender,
            recipientId: replyingToNotification.senderId
          }
        }));

        // Close dialog and reset state
        setShowReplyDialog(false);
        setReplyingToNotification(null);
        setReplyContent("");

        alert(`Reply sent to ${replyingToNotification.sender} successfully!`);
      } else {
        throw new Error(result.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Reply send error:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  // Mark notification as read and track delivery
  const markNotificationAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification,
      ),
    );

    // Update in localStorage as well and track delivery
    if (user) {
      const readTimestamp = new Date().toISOString();

      // Update user-specific notifications
      const userSpecificKey = `notifications_${user.id}`;
      const userNotifications = JSON.parse(localStorage.getItem(userSpecificKey) || '[]');
      const updatedUserNotifications = userNotifications.map((notif: any) =>
        notif.id === id ? {
          ...notif,
          read: true,
          readAt: readTimestamp,
          deliveryStatus: "delivered"
        } : notif
      );
      localStorage.setItem(userSpecificKey, JSON.stringify(updatedUserNotifications));

      // Update general notifications
      const generalNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const updatedGeneralNotifications = generalNotifications.map((notif: any) =>
        notif.id === id ? {
          ...notif,
          read: true,
          readAt: readTimestamp,
          deliveryStatus: "delivered"
        } : notif
      );
      localStorage.setItem('notifications', JSON.stringify(updatedGeneralNotifications));

      // Create delivery receipt for sender
      const notification = userNotifications.find((n: any) => n.id === id);
      if (notification && notification.senderId && notification.type === "internal") {
        const deliveryReceipt = {
          id: `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "delivery",
          originalMessageId: id,
          messageTitle: notification.title,
          recipient: user?.name,
          recipientId: user?.id,
          sender: notification.sender,
          senderId: notification.senderId,
          deliveredAt: readTimestamp,
          status: "delivered"
        };

        // Store delivery receipt for sender
        const senderKey = `deliveries_${notification.senderId}`;
        const senderDeliveries = JSON.parse(localStorage.getItem(senderKey) || '[]');
        senderDeliveries.unshift(deliveryReceipt);
        localStorage.setItem(senderKey, JSON.stringify(senderDeliveries));
      }
    }
  };

  // Mark message as read
  const markMessageAsRead = (id: number) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, read: true } : message,
      ),
    );
  };

  // Delete notification
  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      case "welfare":
        return <User className="h-4 w-4" />;
      case "maintenance":
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - Greeting and Time */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-foreground">
              {getTimeBasedGreeting()}, {user.name.split(" ")[0]}!
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Center - Clock */}
        <div className="flex items-center space-x-2 text-sm font-mono">
          <Clock className="h-4 w-4" />
          <span>
            {currentTime.toLocaleTimeString("en-US", {
              hour12: true,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>

        {/* Right side - Status and User Actions */}
        <div className="flex items-center space-x-4">
          {/* Offline Indicator with Sync Status */}
          <OfflineIndicator />

          {/* Notifications */}
          <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount + unreadMessages > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount + unreadMessages}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications & Messages
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notifications" className="relative">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-4 w-4 rounded-full p-0 text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="relative">
                    Messages
                    {unreadMessages > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-4 w-4 rounded-full p-0 text-xs"
                      >
                        {unreadMessages}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="notifications"
                  className="max-h-[400px] overflow-y-auto space-y-2"
                >
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          notification.unread
                            ? "border-l-4 border-l-blue-500"
                            : ""
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div
                                className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}
                              >
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">
                                    {notification.title}
                                  </h4>
                                  {notification.unread && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      New
                                    </Badge>
                                  )}
                                  {notification.messageType === "Reply" && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-blue-600 border-blue-200"
                                    >
                                      Reply
                                    </Badge>
                                  )}
                                </div>
                                {notification.sender && notification.type === "message" && (
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    From: {notification.sender}
                                  </p>
                                )}
                                {notification.subject && (
                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                    {notification.subject}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                {notification.fullMessage && notification.fullMessage !== notification.message && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                                      View full message
                                    </summary>
                                    <div className="mt-1 p-2 bg-muted rounded text-sm">
                                      {notification.fullMessage}
                                    </div>
                                  </details>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {notification.time}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {notification.messageType && (
                                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {notification.messageType}
                                      </span>
                                    )}
                                    {notification.type === "message" && (
                                      <span className="text-xs text-green-600 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        Delivered
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {notification.type === "message" && notification.sender && (
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReplyingToNotification(notification);
                                        setShowReplyDialog(true);
                                      }}
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Reply
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent
                  value="messages"
                  className="max-h-[400px] overflow-y-auto space-y-2"
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No messages</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <Card
                        key={message.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          !message.read ? "border-l-4 border-l-green-500" : ""
                        }`}
                        onClick={() => {
                          markMessageAsRead(message.id);
                          setSelectedMessage(message);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                                <Mail className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">
                                    {message.subject}
                                  </h4>
                                  {!message.read && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Unread
                                    </Badge>
                                  )}
                                  {message.delivered && (
                                    <CheckCheck className="h-3 w-3 text-green-500" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {message.content}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    From: {message.from}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(message.timestamp)}
                                  </span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs mt-1"
                                >
                                  {message.category}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMessage(message);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-red-800 text-white">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <Badge variant="outline" className="w-fit text-xs mt-1">
                  {user.role}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {/* Only show Settings for Finance Officer and other authorized roles */}
              {(user.role === "finance" ||
                user.role === "admin" ||
                user.role === "hr" ||
                user?.permissions?.settings) && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog
          open={!!selectedMessage}
          onOpenChange={() => setSelectedMessage(null)}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {selectedMessage.subject}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">From:</span>
                  <p className="text-muted-foreground">
                    {selectedMessage.from}
                  </p>
                </div>
                <div>
                  <span className="font-medium">To:</span>
                  <p className="text-muted-foreground">{selectedMessage.to}</p>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedMessage.category}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Time:</span>
                  <p className="text-muted-foreground">
                    {formatTime(selectedMessage.timestamp)}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-medium">Message:</span>
                <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCheck className="h-4 w-4 text-green-500" />
                <span>Delivered</span>
                {selectedMessage.read && (
                  <>
                    <span>•</span>
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>Read</span>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Dialog */}
        <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reply to {replyingToNotification?.sender}
              </DialogTitle>
            </DialogHeader>

            {replyingToNotification && (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">Original Message:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {replyingToNotification.subject && (
                      <span className="font-medium">{replyingToNotification.subject}<br /></span>
                    )}
                    {replyingToNotification.fullMessage || replyingToNotification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    From: {replyingToNotification.sender} • {replyingToNotification.time}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reply-content">Your Reply:</Label>
                  <Textarea
                    id="reply-content"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    className="resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {replyContent.length}/500 characters
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReplyDialog(false);
                      setReplyingToNotification(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyContent.trim() || replyContent.length > 500}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </header>
  );
}
