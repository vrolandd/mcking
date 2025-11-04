import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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
import type { Route } from "../+types/root";
import { redirect, useLoaderData } from "react-router";

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

  return { orders: orders || [] };
}

export default function AdminPage() {
  const { orders } = useLoaderData<typeof loader>();
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Rendelés kezelés</CardTitle>
          <CardDescription>
            Vásárlói rendelések kezelése és követése
          </CardDescription>
        </CardHeader>
        <CardContent>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rendelés szám</TableHead>
                  <TableHead>Vásárló</TableHead>
                  <TableHead>Összeg</TableHead>
                  <TableHead>Státusz</TableHead>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        {order.customer_email && (
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        )}
                        {order.dine_in && order.table_number && (
                          <div className="text-sm text-blue-600">Asztal: {order.table_number}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(order.items?.reduce((total, item) => total + item.total_price, 0) || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Megtekint
                        </Button>
                        <Button variant="outline" size="sm">
                          Státusz frissítés
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nincs találat a keresési feltételeknek megfelelően.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
