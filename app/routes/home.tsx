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

  return (
    <main className="flex flex-col max-w-7xl w-full mx-auto">
      <h2 className="text-3xl mt-8 mb-4">Üdv!</h2>

      <div className="flex gap-5 flex-1 max-md:flex-col">
        <div className="flex-1 flex flex-col">
          <h3 className="text-2xl mb-4">Termékek</h3>
          {
            products.error ? (
              <p className="text-red-500">Error loading products: {products.error.message}</p>
            ) : (
              <section className="flex flex-wrap gap-4 max-md:justify-center">
                {products.data?.map(product => (
                  <Card className="max-w-xs w-full pt-0 overflow-hidden" key={product.id}>
                    {
                      product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-48 w-full object-cover bg-muted"
                        />
                      )
                    }
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {product.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-muted-foreground">{product.description}</p>
                      <p className="mt-4 font-bold">{product.price} Ft</p>
                    </CardContent>

                    <CardFooter>
                      <Button
                        onClick={() => addToCart(product, 1)}
                      >
                        Kosárba
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </section>
            )
          }
        </div>


        <Card className="w-xs sticky top-20 h-full max-md:w-full">
          <CardHeader>
            <CardTitle>Kosár</CardTitle>
          </CardHeader>

          <CardContent>
            {
              cart.length === 0 ? (
                <p>A kosár üres.</p>
              ) : (
                <ul>
                  {cart.map(item => (
                    <li key={item.Product.id} className="mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold">{item.Product.name}</p>
                          <p>Mennyiség: {item.quantity}</p>
                          <p>Ár: {item.Product.price * item.quantity} Ft</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(item.Product.id)}
                        >
                          Eltávolít
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            }
          </CardContent>

          <CardFooter>
            {cart.length > 0 && (
              <Link to="/checkout">
                <Button
                  className="mt-4 w-full"
                >
                  Rendelés leadása
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
