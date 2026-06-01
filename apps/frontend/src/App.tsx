import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core"
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Lock,
  Rocket,
  Server,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

import { RippleButton } from "@/components/ui/ripple-button"

const features = [
  {
    icon: Users,
    title: "Social features",
    description:
        "Profils, abonnements, publications et interactions entre utilisateurs.",
  },
  {
    icon: Lock,
    title: "Auth sécurisée",
    description:
        "JWT, rôles, permissions et séparation claire du service d’authentification.",
  },
  {
    icon: Server,
    title: "Architecture API",
    description:
        "Frontend découplé, API Gateway et services indépendants pour apprendre proprement.",
  },
  {
    icon: Database,
    title: "Base de données",
    description:
        "Modèles propres, relations maîtrisées et données centralisées côté backend.",
  },
]

const stack = ["React", "Vite", "TypeScript", "Mantine", "Magic UI", "API Gateway"]

const nextSteps = [
  "Créer la page Login",
  "Ajouter React Router",
  "Brancher l’API Gateway",
]

function App() {
  return (
      <Box
          mih="100vh"
          c="white"
          bg="dark.9"
          style={{
            position: "relative",
            overflow: "hidden",
          }}
      >
        <BackgroundDecorations />

        <Container size="xl" py={80} style={{ position: "relative", zIndex: 1 }}>
          <Grid align="center" gutter={48}>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="xl">
                <Badge
                    size="lg"
                    radius="xl"
                    variant="light"
                    color="blue"
                    leftSection={<Sparkles size={14} />}
                >
                  Frontend moderne avec Mantine et Magic UI
                </Badge>

                <Stack gap="md">
                  <Title
                      order={1}
                      fw={900}
                      style={{
                        fontSize: "clamp(2.7rem, 7vw, 5.5rem)",
                        lineHeight: 1,
                        letterSpacing: "-0.06em",
                      }}
                  >
                    Construis une interface{" "}
                    <Text
                        span
                        inherit
                        variant="gradient"
                        gradient={{ from: "blue.3", to: "violet.3", deg: 90 }}
                    >
                      propre, rapide et animée
                    </Text>
                    .
                  </Title>

                  <Text size="xl" c="dimmed" maw={680} lh={1.7}>
                    Une base frontend moderne pour Breezy, avec des composants
                    réutilisables, une architecture claire et une interface prête
                    pour les futures pages de ton application.
                  </Text>
                </Stack>

                <Group>
                  <RippleButton
                      type="button"
                      className="h-12 rounded-xl bg-white px-6 text-base font-semibold text-slate-950 shadow-xl shadow-blue-500/20"
                  >
                    Commencer
                    <ArrowRight className="ml-2 inline h-4 w-4" />
                  </RippleButton>

                  <Button
                      component="a"
                      href="#"
                      target="_blank"
                      rel="noreferrer"
                      variant="outline"
                      color="gray"
                      radius="md"
                      size="md"
                  >
                    Documentation
                  </Button>
                </Group>

                <Group gap="xs">
                  {stack.map((item) => (
                      <Badge key={item} variant="outline" color="gray" radius="xl">
                        {item}
                      </Badge>
                  ))}
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <DashboardPreview />
            </Grid.Col>
          </Grid>

          <Box mt={80}>
            <Grid gutter="lg">
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                    <Grid.Col key={feature.title} span={{ base: 12, sm: 6, md: 3 }}>
                      <Card
                          h="100%"
                          padding="lg"
                          radius="xl"
                          withBorder
                          bg="rgba(15, 23, 42, 0.72)"
                          style={{
                            borderColor: "rgba(255,255,255,0.08)",
                            backdropFilter: "blur(12px)",
                          }}
                      >
                        <Stack gap="sm">
                          <ThemeIcon
                              size="lg"
                              radius="xl"
                              variant="light"
                              color="blue"
                          >
                            <Icon size={20} />
                          </ThemeIcon>

                          <Text fw={700}>{feature.title}</Text>

                          <Text size="sm" c="dimmed" lh={1.6}>
                            {feature.description}
                          </Text>
                        </Stack>
                      </Card>
                    </Grid.Col>
                )
              })}
            </Grid>
          </Box>
        </Container>
      </Box>
  )
}

function DashboardPreview() {
  return (
      <Box pos="relative">
        <Box
            pos="absolute"
            inset={-16}
            style={{
              borderRadius: "2rem",
              background:
                  "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(168,85,247,0.28))",
              filter: "blur(32px)",
            }}
        />

        <Card
            pos="relative"
            padding="xl"
            radius={32}
            withBorder
            shadow="xl"
            bg="rgba(255,255,255,0.06)"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(18px)",
            }}
        >
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" c="dimmed">
                  Dashboard preview
                </Text>
                <Title order={2}>Breezy App</Title>
              </div>

              <Badge color="green" variant="light" radius="xl">
                Online
              </Badge>
            </Group>

            <Card
                radius="xl"
                padding="lg"
                withBorder
                bg="rgba(15,23,42,0.78)"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <Stack gap="md">
                <Group>
                  <ThemeIcon radius="xl" size="lg" color="blue" variant="light">
                    <Users size={20} />
                  </ThemeIcon>

                  <div>
                    <Text fw={700}>Social API</Text>
                    <Text size="sm" c="dimmed">
                      Users, posts, follows
                    </Text>
                  </div>
                </Group>

                <Progress value={75} radius="xl" color="blue" />
              </Stack>
            </Card>

            <Grid>
              <Grid.Col span={6}>
                <StatCard label="Services" value="4" />
              </Grid.Col>

              <Grid.Col span={6}>
                <StatCard label="Stack" value="6" />
              </Grid.Col>
            </Grid>

            <Card
                radius="xl"
                padding="lg"
                withBorder
                bg="rgba(15,23,42,0.78)"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <Stack gap="md">
                <Group gap="xs">
                  <Zap size={16} color="#fde047" />
                  <Text size="sm" fw={700} c="dimmed">
                    Prochaines étapes
                  </Text>
                </Group>

                <Stack gap="sm">
                  {nextSteps.map((task) => (
                      <Group key={task} gap="sm">
                        <CheckCircle2 size={16} color="#6ee7b7" />
                        <Text size="sm" c="dimmed">
                          {task}
                        </Text>
                      </Group>
                  ))}
                </Stack>
              </Stack>
            </Card>

            <Button
                fullWidth
                radius="md"
                variant="light"
                color="blue"
                leftSection={<Rocket size={16} />}
            >
              Préparer les pages de l’app
            </Button>
          </Stack>
        </Card>
      </Box>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
      <Card
          radius="xl"
          padding="lg"
          withBorder
          bg="rgba(15,23,42,0.78)"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Text size="sm" c="dimmed">
          {label}
        </Text>

        <Text mt={4} size="xl" fw={800}>
          {value}
        </Text>
      </Card>
  )
}

function BackgroundDecorations() {
  return (
      <>
        <Box
            pos="absolute"
            inset={0}
            style={{
              background:
                  "radial-gradient(circle at top left, rgba(59,130,246,0.35), transparent 35%), radial-gradient(circle at bottom right, rgba(168,85,247,0.26), transparent 35%)",
              zIndex: 0,
            }}
        />

        <Box
            pos="absolute"
            inset={0}
            style={{
              backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(circle, black, transparent 75%)",
              zIndex: 0,
            }}
        />
      </>
  )
}

export default App