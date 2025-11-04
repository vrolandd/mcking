import { createClient } from "~/utils/supabase.server";
import { createFrontClient } from "~/utils/client";
import type { Route } from "./+types/home";
import { useLoaderData, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Clock, Users, MapPin, CheckCircle, Utensils, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    if (!params.id) {
        throw new Error("Order ID is required");
    }

    const env = { SUPABASE_URL: process.env.VITE_SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_ANON_KEY!, }

    const client = createClient(request);
    const { data: { user } } = await client.supabase.auth.getUser();

    const order = await client.supabase.from("order_summary_view").select('*').eq('order_number', params.id || '').single();

    return { user, order, env };
}

const getOrderStatus = (status: string) => {
    switch (status) {
        case 'uj':
            return 'Függőben';
        case 'keszites_alatt':
            return 'Készítés alatt';
        case 'elkeszult':
            return 'Elkészült';
    }

    return status;
}

export default function Order() {
    const { order, env } = useLoaderData<typeof loader>();

    const [Order, setOrder] = useState(order);

    const client = createFrontClient({
        supabaseUrl: env.SUPABASE_URL,
        supabaseKey: env.SUPABASE_PUBLISHABLE_KEY,
    });

    const nav = useNavigate();

    useEffect(() => {
        client.channel(`order:${order.data?.order_number}:order_summary_view`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders',
            }, async payload => {
                const p = await client.from('order_summary_view').select('*').eq('order_number', order.data?.order_number || 0).single();
                p.data && setOrder({ ...Order, data: p.data } as typeof Order);
                console.log('Order update received:', payload.data, p.data);
            })
            .subscribe();
    }, []);

    const [ remainingMinutes, setRemainingMinutes ] = useState<number | null>(null);

    useEffect(() => {
        if (Order.data?.ready_by) {
            const deliveryTime = new Date(Order.data.ready_by);
            const interval = setInterval(() => {
                const now = new Date();
                const diff = deliveryTime.getTime() - now.getTime();
                const minutes = Math.floor(diff / 1000 / 60);
                setRemainingMinutes(minutes > 0 ? minutes : 0);
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [Order.data?.ready_by]);

    async function removeOrder() {
        const r = await client.from('orders').delete().eq('id', Order.data?.id);

        if (r.error) {
            toast.error("Hiba a rendelés törlése során: " + r.error.message);
            return;
        }

        toast.success("Rendelés sikeresen törölve.");
        nav('/')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "uj": return "bg-yellow-100 text-yellow-800";
            case "keszites_alatt": return "bg-blue-100 text-blue-800";
            case "elkeszult": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIllustration = (status: string) => {
        switch (status) {
            case 'uj':
                return <Clock className="h-16 w-16 text-yellow-600 mx-auto mb-4" />;
            case 'keszites_alatt':
                return <Utensils className="h-16 w-16 text-blue-600 mx-auto mb-4" />;
            case 'elkeszult':
                return <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />;
            default:
                return <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />;
        }
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case 'uj':
                return {
                    title: "Rendelés feldolgozása folyamatban...",
                    subtitle: "Kérjük, várjon türelemmel míg elfogadjuk rendelését."
                };
            case 'keszites_alatt':
                return {
                    title: "Rendelése készítés alatt!",
                    subtitle: remainingMinutes !== null ? `${remainingMinutes} perc van hátra` : "Számoljuk az időt..."
                };
            case 'elkeszult':
                return {
                    title: "Rendelése elkészült!",
                    subtitle: Order.data?.dine_in 
                        ? "Kérjük, várjon az asztalnál, kollégánk hamarosan átadja rendelését."
                        : "Kérjük, vegye át a pultnál."
                };
            default:
                return {
                    title: "Rendelés állapota ismeretlen",
                    subtitle: "Kérjük, vegye fel velünk a kapcsolatot."
                };
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("hu-HU", {
            style: "currency",
            currency: "HUF"
        }).format(amount);
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold">Rendelés #{Order.data?.order_number}</h1>
                    <Badge className={getStatusColor(Order.data?.status || '')}>
                        {getOrderStatus(Order.data?.status || '')}
                    </Badge>
                </div>
            </div>

            {/* Status Card */}
            <Card className="mb-8">
                <CardContent className="pt-8">
                    <div className="text-center">
                        {getStatusIllustration(Order.data?.status || '')}
                        <h2 className="text-2xl font-bold mb-2">
                            {getStatusMessage(Order.data?.status || '').title}
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            {getStatusMessage(Order.data?.status || '').subtitle}
                        </p>
                        {Order.data?.status === 'keszites_alatt' && remainingMinutes !== null && (
                            <div className="flex items-center justify-center gap-2 mt-4 text-orange-600 font-medium">
                                <Clock className="h-5 w-5" />
                                <span>{remainingMinutes} perc van hátra</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Order Details Card */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Rendelés részletei</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span><strong>Név:</strong> {Order.data?.customer_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {Order.data?.dine_in ? (
                                <>
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                    <span><strong>Helyben fogyasztás</strong></span>
                                    {Order.data?.table_number && (
                                        <span className="ml-2 text-blue-600 font-medium">
                                            - Asztal: {Order.data.table_number}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Package className="h-4 w-4 text-gray-600" />
                                    <span><strong>Elvitel</strong></span>
                                </>
                            )}
                        </div>

                        {Order.data?.notes && (
                            <div className="p-3 bg-muted rounded-lg">
                                <strong>Megjegyzés:</strong> {Order.data.notes}
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Tételek</h3>
                        <div className="space-y-2">
                            {Order.data?.items?.map((item) => (
                                <div key={item.product_id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                    <div>
                                        <span className="font-medium">{item.quantity}x {item.product_name}</span>
                                    </div>
                                    <span className="font-medium">{formatCurrency(item.total_price)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t pt-3 mt-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Összesen:</span>
                                <span>{formatCurrency(Order.data?.items?.reduce((total, item) => total + item.total_price, 0) || 0)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Button */}
            <div className="flex justify-end">
                <Button onClick={removeOrder} variant="destructive">
                    Rendelés törlése
                </Button>
            </div>
        </div>
    );
}