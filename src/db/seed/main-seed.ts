import "dotenv/config";

import { TodoStatus } from "generated/prisma/browser";
import { prisma } from "@/lib/prisma";

const sampleTodos = [
  {
    text: "Set up project structure",
    description:
      "Initialize the project with proper folder structure, dependencies, and configuration files",
    active: true,
    status: TodoStatus.COMPLETED,
  },
  {
    text: "Implement user authentication",
    description:
      "Add secure login/logout functionality with session management and password hashing",
    active: true,
    status: TodoStatus.IN_PROGRESS,
  },
  {
    text: "Create database schema",
    description:
      "Design and implement the database tables with proper relationships and constraints",
    active: true,
    status: TodoStatus.COMPLETED,
  },
  {
    text: "Build API endpoints",
    description:
      "Create RESTful API endpoints for all CRUD operations with proper validation",
    active: true,
    status: TodoStatus.IN_PROGRESS,
  },
  {
    text: "Design UI components",
    description:
      "Create reusable React components with consistent styling and responsive design",
    active: true,
    status: TodoStatus.NOT_STARTED,
  },
  {
    text: "Write unit tests",
    description:
      "Add comprehensive test coverage for all components and API endpoints",
    active: true,
    status: TodoStatus.NOT_STARTED,
  },
  {
    text: "Set up CI/CD pipeline",
    description:
      "Configure automated testing, building, and deployment processes",
    active: false,
    status: TodoStatus.NOT_STARTED,
  },
  {
    text: "Implement error handling",
    description:
      "Add proper error boundaries and user-friendly error messages throughout the app",
    active: true,
    status: TodoStatus.IN_PROGRESS,
  },
  {
    text: "Add logging and monitoring",
    description:
      "Set up application logging, error tracking, and performance monitoring",
    active: true,
    status: TodoStatus.NOT_STARTED,
  },
  {
    text: "Optimize database queries",
    description:
      "Review and optimize database queries for better performance and scalability",
    active: true,
    status: TodoStatus.NOT_STARTED,
  },
];

async function main() {
  console.log("Starting database seeding...");

  console.log("Clearing existing todos...");
  await prisma.todo.deleteMany();

  console.log("Inserting sample todos...");
  const result = await prisma.todo.createMany({
    data: sampleTodos,
  });

  console.log(`Successfully seeded ${result.count} todos`);

  const insertedTodos = await prisma.todo.findMany({
    orderBy: { createdAt: "desc" },
  });

  for (const [index, todoItem] of insertedTodos.entries()) {
    console.log(
      `  ${index + 1}. ${todoItem.text} - ${todoItem.status} (${todoItem.active ? "Active" : "Inactive"})`
    );
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
