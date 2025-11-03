import { createClient } from "~/utils/supabase.server";
import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
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

      {
        products.error ? (
          <p className="text-red-500">Error loading products: {products.error.message}</p>
        ) : (
          <section className="flex flex-wrap gap-4">
            {products.data?.map(product => (
              <Card className="max-w-xs w-full" key={product.id}>
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
    </main>
  );
}
