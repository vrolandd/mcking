
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { createClient } from "~/utils/supabase.server";
import { Form, redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import type { Route } from "../+types/root";
import { useEffect } from "react";
import { toast } from "sonner";


export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);

    const {
        data: { user },
    } = await supabase.supabase.auth.getUser();

    if (user) {
        return redirect("/", { headers: supabase.headers });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: supabase.headers });
};

export const action = async ({ request }: Route.ActionArgs) => {
    const supabase = createClient(request);

    const formData = await request.formData();
    const intent = String(formData.get("intent") || "sign-in");
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const response = new Response();

    if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password are required." }), { status: 400, headers: response.headers });
    }

    if (intent === "sign-up") {
        const { error } = await supabase.supabase.auth.signUp({ email, password });
        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: response.headers });
        }
        return new Response(JSON.stringify({ message: "Check your email to confirm your account." }), { headers: response.headers });
    }

    // default to sign-in
    const { error, data } = await supabase.supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    console.log("Signed in user:", data);

    return redirect("/admin", { headers: supabase.headers });
};

export default function AuthPage() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const [params] = useSearchParams();
    const defaultTab = params.get("mode") === "sign-up" ? "sign-up" : "sign-in";
    const isSubmitting = navigation.state === "submitting";

    useEffect(() => {
        if (actionData?.message) {
            toast.success(actionData.message);
        } else if (actionData?.error) {
            toast.error(actionData.error);
        }
    }, [actionData]);

    return (
        <div className="mx-auto flex min-h-[80dvh] max-w-md items-center justify-center p-4">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Üdv!</CardTitle>
                    <CardDescription>Jelentkezz be, vagy hozz létre egy fiókot e-mail és jelszó használatával.</CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="sign-in">Bejelentkezés</TabsTrigger>
                            <TabsTrigger value="sign-up">Regisztráció</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sign-in" className="mt-6">
                            <Form method="post" replace>
                                <input type="hidden" name="intent" value="sign-in" />
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email-signin">Email</Label>
                                        <Input id="email-signin" name="email" type="email" placeholder="john.doe@example.com" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password-signin">Jelszó</Label>
                                        <Input id="password-signin" name="password" type="password" placeholder="********" required />
                                    </div>
                                    {actionData?.error && (
                                        <p className="text-sm text-red-600" role="alert">
                                            {actionData.error}
                                        </p>
                                    )}
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Bejelentkezés..." : "Bejelentkezés"}
                                    </Button>
                                </div>
                            </Form>
                        </TabsContent>

                        <TabsContent value="sign-up" className="mt-6">
                            <Form method="post" replace>
                                <input type="hidden" name="intent" value="sign-up" />
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email-signup">Email</Label>
                                        <Input id="email-signup" name="email" type="email" placeholder="john.doe@example.com" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password-signup">Jelszó</Label>
                                        <Input id="password-signup" name="password" type="password" placeholder="********" required />
                                    </div>
                                    {actionData?.error && (
                                        <p className="text-sm text-red-600" role="alert">
                                            {actionData.error}
                                        </p>
                                    )}
                                    {actionData?.message && (
                                        <p className="text-sm text-green-600" role="status">
                                            {actionData.message}
                                        </p>
                                    )}
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Fiók létrehozása..." : "Fiók létrehozása"}
                                    </Button>
                                </div>
                            </Form>
                        </TabsContent>
                    </Tabs>
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-xs text-muted-foreground">
                        A folytatással elfogadja a Felhasználási feltételeinket és Adatvédelmi irányelveinket.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}