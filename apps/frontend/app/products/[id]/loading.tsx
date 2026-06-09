import {
    Container,
    Grid,
    GridCol,
    Group,
    Paper,
    Skeleton,
    Stack,
} from '@mantine/core';

export default function ProductDetailLoading() {
    return (
        <Container size="lg" py="xl">
            <Skeleton height={36} width={160} mb="lg" />

            <Paper withBorder radius="md" p="xl">
                <Grid gutter="xl">
                    <GridCol span={{ base: 12, md: 5 }}>
                        <Skeleton height={420} radius="md" />
                    </GridCol>

                    <GridCol span={{ base: 12, md: 7 }}>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Skeleton height={28} width={140} radius="xl" />
                                <Skeleton height={32} width={90} />
                            </Group>

                            <Skeleton height={42} width="100%" />
                            <Skeleton height={42} width="80%" />

                            <Skeleton height={1} width="100%" />

                            <Skeleton height={28} width={160} />
                            <Skeleton height={18} width="100%" />
                            <Skeleton height={18} width="100%" />
                            <Skeleton height={18} width="75%" />

                            <Group mt="xl">
                                <Skeleton height={42} width={150} radius="md" />
                                <Skeleton height={42} width={170} radius="md" />
                            </Group>
                        </Stack>
                    </GridCol>
                </Grid>
            </Paper>
        </Container>
    );
}