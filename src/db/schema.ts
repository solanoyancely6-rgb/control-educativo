import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Core entities for an educational control app (MVP)

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "inactive",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
]);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    nameIdx: index("students_name_idx").on(t.lastName, t.firstName),
  })
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    startsOn: date("starts_on"),
    endsOn: date("ends_on"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    nameIdx: index("courses_name_idx").on(t.name),
  })
);

export const enrollments = pgTable(
  "enrollments",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.courseId, t.studentId] }),
    courseIdx: index("enrollments_course_idx").on(t.courseId),
    studentIdx: index("enrollments_student_idx").on(t.studentId),
  })
);

export const classSessions = pgTable(
  "class_sessions",
  {
    id: uuid("id").primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    sessionDate: date("session_date").notNull(),
    topic: text("topic"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    courseIdx: index("class_sessions_course_idx").on(t.courseId),
    dateIdx: index("class_sessions_date_idx").on(t.courseId, t.sessionDate),
  })
);

export const attendance = pgTable(
  "attendance",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => classSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.sessionId, t.studentId] }),
    sessionIdx: index("attendance_session_idx").on(t.sessionId),
    studentIdx: index("attendance_student_idx").on(t.studentId),
  })
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueOn: date("due_on"),
    maxPoints: integer("max_points").notNull().default(100),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    courseIdx: index("assignments_course_idx").on(t.courseId),
  })
);

export const grades = pgTable(
  "grades",
  {
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    points: integer("points"),
    feedback: text("feedback"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.assignmentId, t.studentId] }),
    assignmentIdx: index("grades_assignment_idx").on(t.assignmentId),
    studentIdx: index("grades_student_idx").on(t.studentId),
  })
);

// Vibecoding helper: store prompts/iterations in DB
export const vibePrompts = pgTable(
  "vibe_prompts",
  {
    id: uuid("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    createdAtIdx: index("vibe_prompts_created_at_idx").on(t.createdAt),
  })
);

