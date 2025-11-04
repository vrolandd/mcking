import { createClient } from "~/utils/supabase.server";
import type { Route } from "./+types/home";
import { Link, useLoaderData } from "react-router";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { useCart } from "~/lib/hooks";
import { Button } from "~/components/ui/button";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const client = createClient(request);
  const { data: { user } } = await client.supabase.auth.getUser();

  const products = await client.supabase.from("products").select('*');

  return { user, products };
}

export default function Home() {
  const { user, products } = useLoaderData<typeof loader>();

  const { cart, addToCart, removeFromCart, clearCart } = useCart();

  const totalPrice = cart.reduce((total, item) => total + (item.Product.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl w-full" >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Üdvözöljük!</h1>
          <p className="text-xl text-muted-foreground">Válasszon kedvenc termékeinkből</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Termékeink</h2>
              <div className="h-1 w-20 bg-primary rounded-full mt-2"></div>
            </div>
            
            {products.error ? (
              <Card className="p-8">
                <div className="text-center">
                  <p className="text-destructive text-lg">Hiba a termékek betöltése során</p>
                  <p className="text-muted-foreground mt-2">{products.error.message}</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.data?.map(product => (
                  <Card key={product.id} className="pt-0 group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-md">
                    {product.image_url && (
                      <div className="relative overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                      </div>
                    )}
                    
                    <CardHeader >
                      <CardTitle className="text-lg font-semibold line-clamp-1">
                        {product.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pb-4 -mt-4">
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {product.price.toLocaleString()} Ft
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        onClick={() => addToCart(product, 1)}
                        className="w-full group-hover:bg-primary/90 transition-colors"
                        size="lg"
                      >
                        Kosárba helyezés
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>Kosár</span>
                    {cart.length > 0 && (
                      <span className="bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full">
                        {cart.length}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground mb-2">🛒</div>
                      <p className="text-muted-foreground">A kosár üres</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Válasszon termékeket a hozzáadáshoz
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.Product.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1 mb-1">
                              {item.Product.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{item.quantity}x</span>
                              <span>{item.Product.price} Ft</span>
                            </div>
                            <p className="text-sm font-semibold mt-1">
                              {(item.Product.price * item.quantity).toLocaleString()} Ft
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.Product.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      
                      {cart.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Összesen:</span>
                            <span className="text-xl font-bold text-primary">
                              {totalPrice.toLocaleString()} Ft
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                {cart.length > 0 && (
                  <CardFooter className="pt-0">
                    <Link to="/checkout" className="w-full">
                      <Button className="w-full" size="lg">
                        Rendelés leadása
                      </Button>
                    </Link>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
