'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Gift, 
  CalendarDays,
  UtensilsCrossed,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CustomersPage() {
  const { isAdmin, isManager, isStaff } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin || isManager) {
      fetchCustomers();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, isManager]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=100');
      if (response.ok) {
        const data = await response.json();
        // ✅ Handle new paginated response format
        setCustomers(Array.isArray(data) ? data : (data.customers || []));
      }
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    (customer.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchQuery))
  );

  const toggleExpand = (customerId: string) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
    } else {
      setExpandedCustomer(customerId);
    }
  };

  if (!isAdmin && !isManager) {
    return (
      <div className="flex-1 h-screen p-8 flex flex-col items-center justify-center">
        <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground mt-2">Only Administrators can view customer data.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-hidden flex flex-col bg-background relative">
      {/* Background Decorators */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <header className="flex-shrink-0 px-8 py-6 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Customers Data</h1>
            <p className="text-sm text-muted-foreground font-medium">Manage and view customer history & rewards</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search phone or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px] bg-muted/50 border-border/50 h-10 rounded-xl"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar z-10">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Users className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No Customers Found</h3>
            <p className="text-sm mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map(customer => (
              <div 
                key={customer.id} 
                className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:border-primary/30 transition-colors"
              >
                {/* Customer Row */}
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(customer.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : customer.phone.substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{customer.name || 'Unknown Name'}</h3>
                      <p className="text-muted-foreground font-medium">{customer.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Total Visits</p>
                      <p className="font-black text-xl text-foreground">{customer.totalVisits}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Total Spent</p>
                      <p className="font-black text-xl text-green-500">₹{customer.totalSpend.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Reward Points</p>
                      <div className="flex items-center justify-center gap-1">
                        <Gift className="w-4 h-4 text-orange-500" />
                        <p className="font-black text-xl text-orange-500">{customer.pointsBalance}</p>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-muted">
                      {expandedCustomer === customer.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded History */}
                {expandedCustomer === customer.id && (
                  <div className="border-t border-border/50 bg-muted/20 p-6">
                    <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-primary" />
                      Order History
                    </h4>
                    
                    {(!customer.bills || customer.bills.length === 0) ? (
                      <p className="text-sm text-muted-foreground">No detailed order history available.</p>
                    ) : (
                      <div className="space-y-4">
                        {customer.bills.map((bill: any) => (
                          <div key={bill.id} className="bg-background rounded-xl p-4 border border-border/50 shadow-sm">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="w-4 h-4" />
                                {new Date(bill.createdAt).toLocaleString('en-IN', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit', hour12: true
                                })}
                              </div>
                              <div className="font-bold text-foreground text-sm">
                                Bill Total: ₹{bill.total.toFixed(2)}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {bill.order?.items?.map((item: any) => (
                                <div key={item.id} className="flex items-start justify-between text-sm bg-muted/30 p-2 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <span className="font-bold text-primary">{item.quantity}x</span>
                                    <div>
                                      <span className="font-medium text-foreground">
                                        {item.menuItem?.name || item.specialInstructions || 'Unknown Item'}
                                        {item.portionType && ` (${item.portionType})`}
                                      </span>
                                      {item.specialInstructions && item.menuItem?.name !== 'Custom Charge' && (
                                        <p className="text-[10px] text-muted-foreground line-clamp-1">Note: {item.specialInstructions.replace(/\[URGENT ADDITION\]/g, '').replace(/\[SERVED\]/g, '')}</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-medium text-muted-foreground">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                              {(!bill.order?.items || bill.order.items.length === 0) && (
                                <p className="text-xs text-muted-foreground italic">Items detail not recorded</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
