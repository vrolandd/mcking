import { useState } from "react";

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
    const [cart, setCart] = useState<CartItem[]>([]);

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

    return {
        cart,
        addToCart,
        removeFromCart,
        clearCart,
    };
}