import Link from 'next/link';
import {
    Badge,
    Button,
    Container,
    Divider,
    Grid,
    GridCol,
    Group,
    Image,
    Paper,
    Stack,
    Text,
    Title,
} from '@mantine/core';

import { getProductById } from '@/utils/api';

interface ProductDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProductDetailPage({
                                                    params,
                                                }: ProductDetailPageProps) {
    const { id } = await params;
    const productId = Number(id);

    const product = await getProductById(productId);

    return (
        <Container size="lg" py="xl">
            <Link href="/" style={{ textDecoration: 'none' }}>
                <Button variant="subtle" mb="lg">
                    Retour aux produits
                </Button>
            </Link>

            <Paper withBorder radius="md" p="xl">
                <Grid gutter="xl">
                    <GridCol span={{ base: 12, md: 5 }}>
                        <div
                            style={{
                                height: 420,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 24,
                                backgroundColor: 'var(--mantine-color-gray-0)',
                                borderRadius: 'var(--mantine-radius-md)',
                            }}
                        >
                            <Image
                                src={product.image}
                                alt={product.title}
                                fit="contain"
                                style={{
                                    maxHeight: 360,
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                }}
                            />
                        </div>
                    </GridCol>

                    <GridCol span={{ base: 12, md: 7 }}>
                        <Stack gap="md">
                            <Group justify="space-between" align="flex-start">
                                <Badge size="lg" variant="light">
                                    {product.category}
                                </Badge>

                                <Text fw={700} c="blue">
                                    {typeof product.price === 'number'
                                        ? `${product.price.toFixed(2)} €`
                                        : 'Prix indisponible'}
                                </Text>
                            </Group>

                            <Title order={1}>
                                {product.title}
                            </Title>

                            <Divider />

                            <div>
                                <Title order={2} size="h3" mb="xs">
                                    Description
                                </Title>

                                <Text c="dimmed" lh={1.7}>
                                    {product.description}
                                </Text>
                            </div>

                            <Group mt="xl">
                                <Button size="md">
                                    Ajouter au panier
                                </Button>

                                <Link href="/" style={{ textDecoration: 'none' }}>
                                    <Button variant="outline" size="md">
                                        Continuer mes achats
                                    </Button>
                                </Link>
                            </Group>
                        </Stack>
                    </GridCol>
                </Grid>
            </Paper>
        </Container>
    );
}