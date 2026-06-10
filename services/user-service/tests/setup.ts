process.env.NODE_ENV = "test";
process.env.SERVICE_NAME = "user-service-test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/user_service_test";
