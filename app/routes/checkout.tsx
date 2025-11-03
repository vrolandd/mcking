import { createClient } from "~/utils/supabase.server";
import type { Route } from "./+types/home";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const client = createClient(request);
  const { data: { user } } = await client.supabase.auth.getUser();

  const products = await client.supabase.from("products").select('*');

  return { user, products };
}

export default function Checkout() {
  return (
    <main className="flex flex-col max-w-7xl w-full mx-auto">
      <h2 className="text-3xl mt-8 mb-4">Checkout</h2>
    </main>
  );
}