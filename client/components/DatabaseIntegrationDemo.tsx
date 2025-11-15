/**
 * TSOAM Church Management System - Database Integration Demo
 *
 * This component demonstrates the new database integration features
 * and can be used to test API connectivity and data operations
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ApiFinancialService, { FinancialTransaction } from '../services/ApiFinancialService';
import ApiMemberService, { Member } from '../services/ApiMemberService';
import ApiHRService, { Employee } from '../services/ApiHRService';
import ApiEventService, { Event } from '../services/ApiEventService';
import AuthService from '../services/AuthService';

export default function DatabaseIntegrationDemo() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [authStatus, setAuthStatus] = useState<string>('Checking...');

  useEffect(() => {
    checkConnection();
    checkAuthStatus();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      // Test API connectivity by trying to fetch data
      const testTransactions = await ApiFinancialService.getAllTransactions({ limit: 1 });
      setIsConnected(testTransactions.length >= 0); // Even empty array means connection works
    } catch (error) {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = () => {
    const user = AuthService.getCurrentUser();
    const token = AuthService.getToken();
    
    if (user && token) {
      setAuthStatus(`Authenticated as ${user?.name || "User"} (${user?.role || ""})`);
    } else {
      setAuthStatus('Not authenticated');
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await AuthService.login({
        email: 'admin@tsoam.org',
        password: 'admin123'
      });
      
      if (result.success) {
        setAuthStatus(`Authenticated as ${result.user?.name} (${result.user?.role})`);
        alert('Demo login successful!');
      } else {
        alert('Demo login failed: ' + result.error);
      }
    } catch (error) {
      alert('Login error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const data = await ApiFinancialService.getAllTransactions({ limit: 5 });
      setTransactions(data);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberData = async () => {
    setLoading(true);
    try {
      const data = await ApiMemberService.getAllMembers({ limit: 5 });
      setMembers(data);
    } catch (error) {
      console.error('Error loading member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHRData = async () => {
    setLoading(true);
    try {
      const data = await ApiHRService.getAllEmployees({ limit: 5 });
      setEmployees(data);
    } catch (error) {
      console.error('Error loading HR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventData = async () => {
    setLoading(true);
    try {
      const data = await ApiEventService.getAllEvents({ limit: 5 });
      setEvents(data);
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestTransaction = async () => {
    setLoading(true);
    try {
      const testTransaction = {
        date: new Date().toISOString().split('T')[0],
        type: 'Income' as const,
        category: 'Test',
        description: 'Test transaction from demo',
        amount: 1000,
        currency: 'KSh',
        payment_method: 'Cash' as const,
        reference: 'TEST-' + Date.now(),
        status: 'Completed' as const,
        created_by: 'Demo User',
        account_code: 'TEST-001',
      };

      const result = await ApiFinancialService.createTransaction(testTransaction);
      if (result) {
        alert('Test transaction created successfully!');
        loadFinancialData(); // Refresh data
      } else {
        alert('Failed to create test transaction');
      }
    } catch (error) {
      alert('Error creating test transaction: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Database Integration Demo
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Demo Mode"}
            </Badge>
          </CardTitle>
          <CardDescription>
            This demo showcases the new MySQL database integration with fallback to demo data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Database Connected" : "Demo Mode Active"}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{authStatus}</p>
                {!AuthService.isAuthenticated() && (
                  <Button 
                    size="sm" 
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="mt-2"
                  >
                    Demo Login
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Test Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  size="sm" 
                  onClick={createTestTransaction}
                  disabled={loading}
                >
                  Create Test Transaction
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial Data</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="hr">HR/Employees</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Financial Transactions
                <Button onClick={loadFinancialData} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{transaction.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            {transaction.transaction_id} • {transaction.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'Income' ? '+' : '-'}{transaction.currency} {transaction.amount.toLocaleString()}
                          </p>
                          <Badge variant="outline">{transaction.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No transactions loaded. Click Refresh to load data.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Church Members
                <Button onClick={loadMemberData} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{member.full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {member.member_id} • {member.tithe_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.email} • {member.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {member.department}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No members loaded. Click Refresh to load data.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Employees
                <Button onClick={loadHRData} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length > 0 ? (
                <div className="space-y-2">
                  {employees.map((employee) => (
                    <div key={employee.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{employee.first_name} {employee.last_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {employee.employee_id} • {employee.position}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.email} • {employee.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={employee.employment_status === 'Active' ? "default" : "secondary"}>
                            {employee.employment_status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            KSh {employee.salary.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No employees loaded. Click Refresh to load data.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Church Events
                <Button onClick={loadEventData} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.event_id} • {event.start_date} at {event.start_time}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {event.location} • Organized by {event.organizer}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{event.status}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No events loaded. Click Refresh to load data.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
