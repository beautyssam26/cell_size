CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` text NOT NULL,
	`student_name` text NOT NULL,
	`cal_10_ocular` real NOT NULL,
	`cal_10_stage` real NOT NULL,
	`cal_10_unit` real NOT NULL,
	`cal_40_ocular` real NOT NULL,
	`cal_40_stage` real NOT NULL,
	`cal_40_unit` real NOT NULL,
	`observation_completed` integer NOT NULL,
	`onion_divisions` real NOT NULL,
	`onion_size` real NOT NULL,
	`cheek_divisions` real NOT NULL,
	`cheek_size` real NOT NULL,
	`yeast_divisions` real NOT NULL,
	`yeast_size` real NOT NULL,
	`calibration_score` integer NOT NULL,
	`observation_score` integer NOT NULL,
	`onion_score` integer NOT NULL,
	`cheek_score` integer NOT NULL,
	`yeast_score` integer NOT NULL,
	`total_score` integer NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_submissions_student_id` ON `submissions` (`student_id`);