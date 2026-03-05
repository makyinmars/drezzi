import type { MockPrisma } from "./prisma";

type MockContextOptions = {
  userId?: string;
  authenticated?: boolean;
  userName?: string;
  userEmail?: string;
};

export function createMockContext(
  prisma: MockPrisma,
  options: MockContextOptions = {}
) {
  const userId = options.userId ?? "test-user-id";
  const authenticated = options.authenticated ?? true;
  const userName = options.userName ?? "Test User";
  const userEmail = options.userEmail ?? "test@example.com";

  return {
    db: null,
    prisma,
    i18n: undefined,
    session: authenticated
      ? {
          user: {
            id: userId,
            name: userName,
            email: userEmail,
            emailVerified: true,
            role: "GUEST" as const,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }
      : null,
  };
}
