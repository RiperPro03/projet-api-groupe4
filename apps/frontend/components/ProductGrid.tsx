'use client';

import { useEffect, useState } from 'react';
import { Alert, Card, Group, SimpleGrid, Skeleton } from '@mantine/core';

import ProductCard from '@/components/ProductCard';
import { getProducts, Product } from '@/utils/api';

function ProductCardSkeleton() {
    return (
        <Card withBorder radius="md" shadow="sm" padding="lg">
            <Skeleton height={220} radius="md" mb="md" />

            <Group justify="space-between" mb="md">
                <Skeleton height={24} width={90} radius="xl" />
                <Skeleton height={20} width={60} />
            </Group>

            <Skeleton height={22} width="100%" mb="xs" />
            <Skeleton height={22} width="75%" mb="md" />

            <Skeleton height={14} width="100%" mb="xs" />
            <Skeleton height={14} width="100%" mb="xs" />
            <Skeleton height={14} width="65%" mb="xl" />

            <Skeleton height={36} radius="md" />
        </Card>
    );
}

export default function ProductGrid() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch {
                setError('Impossible de charger les produits.');
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {Array.from({ length: 6 }).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                ))}
            </SimpleGrid>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Erreur">
                {error}
            </Alert>
        );
    }

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </SimpleGrid>
    );
}