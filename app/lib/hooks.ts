import { useEffect, useState } from "react";

export type CartItem = {
    Product: {
        id: string,
        name: string,
        description: string | null,
        price: number,
        image_url: string | null,
        created_at: string | null,
    },
    quantity: number;
}

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>(JSON.parse(typeof localStorage !== "undefined" ? localStorage.getItem("cart") || "[]" : "[]"));

    const addToCart = (product: CartItem["Product"], quantity: number) => {
        setCart((prevCart) => {
            const existingItemIndex = prevCart.findIndex(
                (item) => item.Product.id === product.id
            );

            if (existingItemIndex !== -1) {
                const updatedCart = [...prevCart];
                updatedCart[existingItemIndex].quantity += quantity;
                return updatedCart;
            } else {
                return [...prevCart, { Product: product, quantity }];
            }
        });
    }

    const removeFromCart = (productId: string) => {
        setCart((prevCart) =>
            prevCart.filter((item) => item.Product.id !== productId)
        );
    }

    const clearCart = () => {
        setCart([]);
    }

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    return {
        cart,
        addToCart,
        removeFromCart,
        clearCart,
    };
}