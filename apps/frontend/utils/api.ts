import axios from "axios";

const apiClient = axios.create({
    baseURL: "https://fakestoreapi.com",
    timeout: 5000,
});

export interface Product {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
}

export const getProducts = async () => {
    try {
        const response = await apiClient.get("/products");
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        throw error;
    }
};

export const getProductById = async (id: number): Promise<Product> => {
    try {
        const response = await apiClient.get<Product>(`/products/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erreur lors de la récupération du produit ${id} :`, error);
        throw error;
    }
};