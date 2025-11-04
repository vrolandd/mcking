import { createClient } from "~/utils/supabase.server";
import type { Route } from "./+types/home";
import { useCart, type CartItem } from "~/lib/hooks";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Separator } from "~/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Form, redirect } from "react-router";

type CartProduct = {
    cart: CartItem[];
    customerName: string;
    dineIn: boolean;
    tableNumber?: string;
    notes?: string;
}

export const loader = async ({ request }: Route.LoaderArgs) => {
    const client = createClient(request);
    const { data: { user } } = await client.supabase.auth.getUser();

    const products = await client.supabase.from("products").select('*');

    return { user, products };
}

export const action = async ({ request }: Route.ActionArgs) => {
    const client = createClient(request);

    const reqBody = await request.formData();

    const productsInCart: CartProduct = JSON.parse(reqBody.get("cart") || "{}");

    console.log("Products in cart:", productsInCart);

    const productsInDbFromCart = await client.supabase
        .from("products")
        .select('*')
        .in('id', productsInCart.cart.map(item => item.Product.id));

    if (productsInDbFromCart.error) {
        return { error: productsInDbFromCart.error.message };
    }

    const orderItems = productsInCart.cart.map(item => {
        const product = productsInDbFromCart.data.find(p => p.id === item.Product.id);

        return {
            product_id: item.Product.id,
            quantity: item.quantity,
            price: product ? product.price : 0,
        };
    });

    console.log("Order items:", orderItems);

    const { error, data } = await client.supabase.from("orders").insert([
        {
            customer_name: productsInCart.customerName,
            dine_in: productsInCart.dineIn,
            table_number: productsInCart.tableNumber ? parseInt(productsInCart.tableNumber) : null,
            notes: productsInCart.notes,
        },
    ]).select().single();

    if (error) {
        return { error: error.message };
    }

    const { error: orderItemsError } = await client.supabase.from("order_items").insert(
        orderItems.map(item => ({
            order_id: data.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.price,
        }))
    );

    if (orderItemsError) {
        return { error: orderItemsError.message };
    }

    return redirect(`/order/${data.order_number}`);
}

export default function Checkout() {
    const { cart, addToCart, clearCart, removeFromCart } = useCart();
    const [customerName, setCustomerName] = useState("");
    const [dineIn, setDineIn] = useState(false);
    const [tableNumber, setTableNumber] = useState("");
    const [notes, setNotes] = useState("");

    const totalPrice = cart.reduce((total, item) => total + item.Product.price * item.quantity, 0);

    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity === 0) {
            removeFromCart(productId);
        } else {
            const product = cart.find(item => item.Product.id === productId)?.Product;
            if (product) {
                addToCart(product, newQuantity);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">Rendelés leadása</h1>
                    <p className="text-xl text-muted-foreground">Ellenőrizze kosarának tartalmát és adja meg adatait</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <ShoppingCart className="h-6 w-6" />
                                    Kosár tartalma ({cart.length} tétel)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {cart.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground text-lg">A kosár üres</p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">
                                            Térjen vissza a főoldalra termékek hozzáadásához
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map((item) => (
                                            <div key={item.Product.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                                                {item.Product.image_url && (
                                                    <img
                                                        src={item.Product.image_url}
                                                        alt={item.Product.name}
                                                        className="h-20 w-20 object-cover rounded-md bg-muted"
                                                    />
                                                )}
                                                
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg mb-1">{item.Product.name}</h3>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {item.Product.description}
                                                    </p>
                                                    <p className="font-bold text-primary">
                                                        {item.Product.price.toLocaleString()} Ft / db
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-background rounded-lg p-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.Product.id, item.quantity - 1)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.Product.id, item.quantity + 1)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="text-right min-w-20">
                                                        <p className="font-bold text-lg">
                                                            {(item.Product.price * item.quantity).toLocaleString()} Ft
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFromCart(item.Product.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <Separator />
                                        
                                        <div className="flex justify-between items-center text-xl font-bold pt-2">
                                            <span>Végösszeg:</span>
                                            <span className="text-2xl text-primary">
                                                {totalPrice.toLocaleString()} Ft
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Form */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-lg border-0 sticky top-6">
                            <CardHeader>
                                <CardTitle className="text-xl">Rendelési adatok</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form method="post" className="space-y-6">
                                    <input type="hidden" name="cart" value={JSON.stringify({
                                        cart,
                                        customerName,
                                        dineIn,
                                        tableNumber: tableNumber || undefined,
                                        notes: notes || undefined
                                    })} />

                                    <div className="space-y-2">
                                        <Label htmlFor="customerName">Név *</Label>
                                        <Input
                                            id="customerName"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Adja meg a nevét"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="dineIn"
                                                checked={dineIn}
                                                onCheckedChange={(checked) => setDineIn(checked as boolean)}
                                            />
                                            <Label htmlFor="dineIn" className="text-sm font-medium">
                                                Helyben fogyasztom
                                            </Label>
                                        </div>

                                        {dineIn && (
                                            <div className="space-y-2">
                                                <Label htmlFor="tableNumber">Asztalszám</Label>
                                                <Input
                                                    id="tableNumber"
                                                    type="number"
                                                    value={tableNumber}
                                                    onChange={(e) => setTableNumber(e.target.value)}
                                                    placeholder="Asztalszám"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Megjegyzés</Label>
                                        <Textarea
                                            id="notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Különleges kérések, allergiák..."
                                            rows={3}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={cart.length === 0 || !customerName.trim()}
                                    >
                                        Rendelés leadása ({totalPrice.toLocaleString()} Ft)
                                    </Button>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}