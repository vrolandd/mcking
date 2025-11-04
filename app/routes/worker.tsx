import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { createClient } from "~/utils/supabase.server";
import { createFrontClient } from "~/utils/client";
import type { Route } from "../+types/root";
import { redirect, useLoaderData } from "react-router";
import { Clock, Users, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email?: string;
  status: string;
  created_at: string;
  dine_in: boolean;
  table_number?: number;
  notes?: string;
  ready_by?: string;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    total_price: number;
  }>;
}

export async function loader({ request }: Route.LoaderArgs) {
  const client = createClient(request);

  const user = await client.supabase.auth.getUser();
  console.log("Auth user:", user);
  if (user.error || !user.data.user) {
    throw redirect("/auth");
  }
  
  // Fetch orders from Supabase
  const { data: orders, error } = await client.supabase
    .from("order_summary_view")
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { orders: [] };
  }

  const env = {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL!, 
    SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_ANON_KEY! 
  };

  return { orders: orders || [], env };
}

export default function AdminPage() {
  const { orders, env } = useLoaderData<typeof loader>();
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  console.log("Loaded orders:", env);

  const client = createFrontClient({
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_PUBLISHABLE_KEY,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uj": return "bg-yellow-100 text-yellow-800";
      case "keszites_alatt": return "bg-blue-100 text-blue-800";
      case "elkeszult": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "uj": return "Új";
      case "keszites_alatt": return "Készítés alatt";
      case "elkeszult": return "Elkészült";
      default: return status;
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterOrders(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterOrders(searchTerm, status);
  };

  const filterOrders = (search: string, status: string) => {
    let filtered = orders;

    if (search) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
        order.order_number.toString().includes(search.toLowerCase())
      );
    }

    if (status !== "all") {
      filtered = filtered.filter(order => order.status === status);
    }

    setFilteredOrders(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency: "HUF"
    }).format(amount);
  };

  const calculateRemainingTime = (readyBy: string) => {
    const deliveryTime = new Date(readyBy);
    const now = new Date();
    const diff = deliveryTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    return minutes > 0 ? minutes : 0;
  };

  const timeOptions = [3, 5, 7, 10, 12, 15, 17];

  const handleAcceptOrder = async (orderId: string, minutes: number) => {
    const readyBy = new Date();
    readyBy.setMinutes(readyBy.getMinutes() + minutes);

    const { error } = await client
      .from('orders')
      .update({ 
        status: 'keszites_alatt',
        ready_by: readyBy.toISOString()
      })
      .eq('id', orderId);

    if (error) {
      toast.error("Hiba a rendelés elfogadása során: " + error.message);
      return;
    }

    toast.success(`Rendelés elfogadva ${minutes} perc elkészülési idővel`);
    
    // Update local state
    setFilteredOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'keszites_alatt', ready_by: readyBy.toISOString() }
        : order
    ));
  };

  const handleReadyOrder = async (orderId: string) => {
    const { error } = await client
      .from('orders')
      .update({ status: 'elkeszult' })
      .eq('id', orderId);

    if (error) {
      toast.error("Hiba a rendelés készre jelölése során: " + error.message);
      return;
    }

    toast.success("Rendelés készre jelölve");
    
    // Update local state
    setFilteredOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'elkeszult' }
        : order
    ));
  };

  const handleRejectOrder = async (orderId: string) => {
    const { error } = await client
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      toast.error("Hiba a rendelés elutasítása során: " + error.message);
      return;
    }

    toast.success("Rendelés elutasítva és törölve");
    
    // Update local state
    setFilteredOrders(prev => prev.filter(order => order.id !== orderId));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rendelés kezelés</h1>
        <p className="text-muted-foreground">Vásárlói rendelések kezelése és követése</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Keresés vásárló neve, email vagy rendelés száma alapján..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Szűrés státusz szerint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden státusz</SelectItem>
            <SelectItem value="uj">Új</SelectItem>
            <SelectItem value="keszites_alatt">Készítés alatt</SelectItem>
            <SelectItem value="elkeszult">Elkészült</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{order.customer_name}</span>
              </div>
              {order.dine_in && order.table_number && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <MapPin className="h-4 w-4" />
                  <span>Asztal: {order.table_number}</span>
                </div>
              )}
              {order.ready_by && order.status === "keszites_alatt" && (
                <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>{calculateRemainingTime(order.ready_by)} perc van hátra</span>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1">
                <div className="space-y-2 mb-4">
                  {order.items?.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span className="font-medium">{item.total_price} Ft</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2 mb-4">
                  <div className="flex justify-between font-medium">
                    <span>Összesen:</span>
                    <span>{formatCurrency(order.items?.reduce((total, item) => total + item.total_price, 0) || 0)}</span>
                  </div>
                </div>

                {order.notes && (
                  <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted rounded">
                    <strong>Megjegyzés:</strong> {order.notes}
                  </div>
                )}
              </div>

              <div className="mt-auto">
                {order.status === "uj" && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Elfogadás idővel:</div>
                    <div className="grid grid-cols-4 gap-1">
                      {timeOptions.map((minutes) => (
                        <Button
                          key={order.id + minutes}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcceptOrder(order.id, minutes)}
                          className="text-xs"
                        >
                          {minutes}p
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={() => handleRejectOrder(order.id)}
                      className="w-full mt-2"
                      variant="destructive"
                      size="sm"
                    >
                      Rendelés elutasítása
                    </Button>
                  </div>
                )}
                
                {order.status === "keszites_alatt" && (
                  <Button
                    onClick={() => handleReadyOrder(order.id)}
                    className="w-full"
                    variant="default"
                  >
                    Készen van
                  </Button>
                )}
                
                {order.status === "elkeszult" && (
                  <Button
                    disabled
                    className="w-full"
                    variant="secondary"
                  >
                    Elkészült
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            Nincs találat a keresési feltételeknek megfelelően.
          </div>
        </div>
      )}
    </div>
  );
}
