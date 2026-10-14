import { db } from "@/db";
import {
  assignments,
  classSessions,
  courses,
  enrollments,
  students,
} from "@/db/schema";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(students);

  if (Number(count) > 0) {
    return Response.json({ ok: true, skipped: true, reason: "already_seeded" });
  }

  const courseId = randomUUID();
  const sessionId = randomUUID();
  const assignmentId = randomUUID();

  const sampleStudents = [
    { id: randomUUID(), firstName: "Ana", lastName: "García", email: "ana@example.com" },
    { id: randomUUID(), firstName: "Luis", lastName: "Pérez", email: "luis@example.com" },
    { id: randomUUID(), firstName: "Sofía", lastName: "López", email: "sofia@example.com" },
  ];

  await db.insert(students).values(sampleStudents);

  await db.insert(courses).values({
    id: courseId,
    name: "Matemáticas 1",
    description: "Curso demo para probar asistencia y calificaciones",
    startsOn: "2026-01-10",
    endsOn: "2026-06-30",
  });

  await db.insert(enrollments).values(
    sampleStudents.map((s) => ({
      courseId,
      studentId: s.id,
      status: "active" as const,
    }))
  );

  await db.insert(classSessions).values({
    id: sessionId,
    courseId,
    sessionDate: "2026-02-01",
    topic: "Introducción",
  });

  await db.insert(assignments).values({
    id: assignmentId,
    courseId,
    title: "Tarea 1",
    dueOn: "2026-02-10",
    maxPoints: 100,
  });

  return Response.json({
    ok: true,
    created: {
      courseId,
      sessionId,
      assignmentId,
      students: sampleStudents.map((s) => s.id),
    },
  });
}
