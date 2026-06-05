import { Container, Text, Title } from '@mantine/core';
import ProductGrid from '@/components/ProductGrid';

export default function Home() {
    return (
        <Container size="lg" py="xl">
            <Title order={1} mb="xs">
                Nos Produits
            </Title>

            <Text c="dimmed" mb="xl">
                Liste des produits récupérés depuis l’API.
            </Text>

            <ProductGrid />
        </Container>
    );
}