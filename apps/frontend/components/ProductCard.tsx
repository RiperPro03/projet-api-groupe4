import Link from 'next/link';
import {
    Badge,
    Button,
    Card,
    Group,
    Image,
    Text,
    Title,
} from '@mantine/core';

import { Product } from '@/utils/api';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <Card
            withBorder
            radius="md"
            shadow="sm"
            padding="lg"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Card.Section>
                <div
                    style={{
                        height: 220,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                        backgroundColor: 'var(--mantine-color-gray-0)',
                    }}
                >
                    <Image
                        src={product.image}
                        alt={product.title}
                        fit="contain"
                        style={{
                            maxHeight: 180,
                            maxWidth: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
                <Badge variant="light">{product.category}</Badge>

                <Text fw={700} c="blue">
                    {product.price.toFixed(2)} €
                </Text>
            </Group>

            <Title order={3} size="h4" lineClamp={2}>
                {product.title}
            </Title>

            <Text fz="sm" c="dimmed" mt="sm" lineClamp={4}>
                {product.description}
            </Text>

            <Button
                component={Link}
                href={`/products/${product.id}`}
                fullWidth
                mt="auto"
                radius="md"
            >
                Voir le produit
            </Button>
        </Card>
    );
}