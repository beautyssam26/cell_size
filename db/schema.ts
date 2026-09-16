import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const submissions = sqliteTable(
  "submissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: text("student_id").notNull(),
    studentName: text("student_name").notNull(),
    cal10Ocular: real("cal_10_ocular").notNull(),
    cal10Stage: real("cal_10_stage").notNull(),
    cal10Unit: real("cal_10_unit").notNull(),
    cal40Ocular: real("cal_40_ocular").notNull(),
    cal40Stage: real("cal_40_stage").notNull(),
    cal40Unit: real("cal_40_unit").notNull(),
    observationCompleted: integer("observation_completed", { mode: "boolean" }).notNull(),
    onionDivisions: real("onion_divisions").notNull(),
    onionSize: real("onion_size").notNull(),
    cheekDivisions: real("cheek_divisions").notNull(),
    cheekSize: real("cheek_size").notNull(),
    yeastDivisions: real("yeast_divisions").notNull(),
    yeastSize: real("yeast_size").notNull(),
    calibrationScore: integer("calibration_score").notNull(),
    observationScore: integer("observation_score").notNull(),
    onionScore: integer("onion_score").notNull(),
    cheekScore: integer("cheek_score").notNull(),
    yeastScore: integer("yeast_score").notNull(),
    totalScore: integer("total_score").notNull(),
    submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("idx_submissions_student_id").on(table.studentId)],
);
