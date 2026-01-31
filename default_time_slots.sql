-- Default Time Slots SQL for Monday to Friday
-- For Secondary schools: P9-P10 (15:30-16:50) are reserved for CPD
-- For Primary and TSS schools: P9-P10 are regular periods

-- Monday Time Slots
INSERT INTO time_slots (id, school_id, day, period, name, start_time, end_time, session, is_break, break_type, is_active, is_cpd, created_at, updated_at) VALUES
('ts-mon-1', 'school-gikomero-tss', 'MONDAY', 1, 'P1', '2024-01-01 08:00:00+00', '2024-01-01 08:40:00+00', 'MORNING', false, NULL, true, false, NOW(), NOW()),
('ts-mon-2', 'school-gikomero-tss', 'MONDAY', 2, 'P2', '2024-01-01 08:40:00+00', '2024-01-01 09:20:00+00', 'MORNING', false, NULL, true, false, NOW(), NOW()),
('ts-mon-3', 'school-gikomero-tss', 'MONDAY', 3, 'P3', '2024-01-01 09:20:00+00', '2024-01-01 10:00:00+00', 'MORNING', false, NULL, true, false, NOW(), NOW()),
('ts-mon-break1', 'school-gikomero-tss', 'MONDAY', -1, 'MORNING BREAK', '2024-01-01 10:00:00+00', '2024-01-01 10:20:00+00', 'MORNING', true, 'MORNING_BREAK', true, false, NOW(), NOW()),
('ts-mon-4', 'school-gikomero-tss', 'MONDAY', 4, 'P4', '2024-01-01 10:20:00+00', '2024-01-01 11:00:00+00', 'MORNING', false, NULL, true, false, NOW(), NOW()),
('ts-mon-5', 'school-gikomero-tss', 'MONDAY', 5, 'P5', '2024-01-01 11:00:00+00', '2024-01-01 11:40:00+00', 'MORNING', false, NULL, true, false, NOW(), NOW()),
('ts-mon-lunch', 'school-gikomero-tss', 'MONDAY', -2, 'LUNCH BREAK', '2024-01-01 11:40:00+00', '2024-01-01 13:10:00+00', 'AFTERNOON', true, 'LUNCH_BREAK', true, false, NOW(), NOW()),
('ts-mon-6', 'school-gikomero-tss', 'MONDAY', 6, 'P6', '2024-01-01 13:10:00+00', '2024-01-01 13:50:00+00', 'AFTERNOON', false, NULL, true, false, NOW(), NOW()),
('ts-mon-7', 'school-gikomero-tss', 'MONDAY', 7, 'P7', '2024-01-01 13:50:00+00', '2024-01-01 14:30:00+00', 'AFTERNOON', false, NULL, true, false, NOW(), NOW()),
('ts-mon-8', 'school-gikomero-tss', 'MONDAY', 8, 'P8', '2024-01-01 14:30:00+00', '2024-01-01 15:10:00+00', 'AFTERNOON', false, NULL, true, false, NOW(), NOW()),
('ts-mon-break2', 'school-gikomero-tss', 'MONDAY', -3, 'AFTERNOON BREAK', '2024-01-01 15:10:00+00', '2024-01-01 15:30:00+00', 'AFTERNOON', true, 'AFTERNOON_BREAK', true, false, NOW(), NOW()),
('ts-mon-9', 'school-gikomero-tss', 'MONDAY', 9, 'CPD', '2024-01-01 15:30:00+00', '2024-01-01 16:10:00+00', 'AFTERNOON', false, NULL, true, true, NOW(), NOW()),
('ts-mon-10', 'school-gikomero-tss', 'MONDAY', 10, 'CPD', '2024-01-01 16:10:00+00', '2024-01-01 16:50:00+00', 'AFTERNOON', false, NULL, true, true, NOW(), NOW()),
('ts-mon-end', 'school-gikomero-tss', 'MONDAY', -4, 'END OF DAY', '2024-01-01 16:50:00+00', '2024-01-01 16:55:00+00', 'AFTERNOON', true, 'END_OF_DAY', true, false, NOW(), NOW());

-- Tuesday Time Slots
INSERT INTO time_slots (id, school_id, day, period, name, start_time, end_time, session, is_break, break_type, is_active, created_at, updated_at) VALUES
('ts-tue-1', 'school-gikomero-tss', 'TUESDAY', 1, 'P1', '2024-01-01 08:00:00+00', '2024-01-01 08:40:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-tue-2', 'school-gikomero-tss', 'TUESDAY', 2, 'P2', '2024-01-01 08:40:00+00', '2024-01-01 09:20:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-tue-3', 'school-gikomero-tss', 'TUESDAY', 3, 'P3', '2024-01-01 09:20:00+00', '2024-01-01 10:00:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-tue-break1', 'school-gikomero-tss', 'TUESDAY', -1, 'MORNING BREAK', '2024-01-01 10:00:00+00', '2024-01-01 10:20:00+00', 'MORNING', true, 'MORNING_BREAK', true, NOW(), NOW()),
('ts-tue-4', 'school-gikomero-tss', 'TUESDAY', 4, 'P4', '2024-01-01 10:20:00+00', '2024-01-01 11:00:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-tue-5', 'school-gikomero-tss', 'TUESDAY', 5, 'P5', '2024-01-01 11:00:00+00', '2024-01-01 11:40:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-tue-lunch', 'school-gikomero-tss', 'TUESDAY', -2, 'LUNCH BREAK', '2024-01-01 11:40:00+00', '2024-01-01 13:10:00+00', 'AFTERNOON', true, 'LUNCH_BREAK', true, NOW(), NOW()),
('ts-tue-6', 'school-gikomero-tss', 'TUESDAY', 6, 'P6', '2024-01-01 13:10:00+00', '2024-01-01 13:50:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-tue-7', 'school-gikomero-tss', 'TUESDAY', 7, 'P7', '2024-01-01 13:50:00+00', '2024-01-01 14:30:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-tue-8', 'school-gikomero-tss', 'TUESDAY', 8, 'P8', '2024-01-01 14:30:00+00', '2024-01-01 15:10:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-tue-break2', 'school-gikomero-tss', 'TUESDAY', -3, 'AFTERNOON BREAK', '2024-01-01 15:10:00+00', '2024-01-01 15:30:00+00', 'AFTERNOON', true, 'AFTERNOON_BREAK', true, NOW(), NOW()),
('ts-tue-9', 'school-gikomero-tss', 'TUESDAY', 9, 'P9', '2024-01-01 15:30:00+00', '2024-01-01 16:10:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-tue-10', 'school-gikomero-tss', 'TUESDAY', 10, 'P10', '2024-01-01 16:10:00+00', '2024-01-01 16:50:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-tue-end', 'school-gikomero-tss', 'TUESDAY', -4, 'END OF DAY', '2024-01-01 16:50:00+00', '2024-01-01 16:55:00+00', 'AFTERNOON', true, 'END_OF_DAY', true, NOW(), NOW());

-- Wednesday Time Slots
INSERT INTO time_slots (id, school_id, day, period, name, start_time, end_time, session, is_break, break_type, is_active, created_at, updated_at) VALUES
('ts-wed-1', 'school-gikomero-tss', 'WEDNESDAY', 1, 'P1', '2024-01-01 08:00:00+00', '2024-01-01 08:40:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-wed-2', 'school-gikomero-tss', 'WEDNESDAY', 2, 'P2', '2024-01-01 08:40:00+00', '2024-01-01 09:20:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-wed-3', 'school-gikomero-tss', 'WEDNESDAY', 3, 'P3', '2024-01-01 09:20:00+00', '2024-01-01 10:00:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-wed-break1', 'school-gikomero-tss', 'WEDNESDAY', -1, 'MORNING BREAK', '2024-01-01 10:00:00+00', '2024-01-01 10:20:00+00', 'MORNING', true, 'MORNING_BREAK', true, NOW(), NOW()),
('ts-wed-4', 'school-gikomero-tss', 'WEDNESDAY', 4, 'P4', '2024-01-01 10:20:00+00', '2024-01-01 11:00:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-wed-5', 'school-gikomero-tss', 'WEDNESDAY', 5, 'P5', '2024-01-01 11:00:00+00', '2024-01-01 11:40:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-wed-lunch', 'school-gikomero-tss', 'WEDNESDAY', -2, 'LUNCH BREAK', '2024-01-01 11:40:00+00', '2024-01-01 13:10:00+00', 'AFTERNOON', true, 'LUNCH_BREAK', true, NOW(), NOW()),
('ts-wed-6', 'school-gikomero-tss', 'WEDNESDAY', 6, 'P6', '2024-01-01 13:10:00+00', '2024-01-01 13:50:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-wed-7', 'school-gikomero-tss', 'WEDNESDAY', 7, 'P7', '2024-01-01 13:50:00+00', '2024-01-01 14:30:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-wed-8', 'school-gikomero-tss', 'WEDNESDAY', 8, 'P8', '2024-01-01 14:30:00+00', '2024-01-01 15:10:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-wed-break2', 'school-gikomero-tss', 'WEDNESDAY', -3, 'AFTERNOON BREAK', '2024-01-01 15:10:00+00', '2024-01-01 15:30:00+00', 'AFTERNOON', true, 'AFTERNOON_BREAK', true, NOW(), NOW()),
('ts-wed-9', 'school-gikomero-tss', 'WEDNESDAY', 9, 'P9', '2024-01-01 15:30:00+00', '2024-01-01 16:10:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-wed-10', 'school-gikomero-tss', 'WEDNESDAY', 10, 'P10', '2024-01-01 16:10:00+00', '2024-01-01 16:50:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-wed-end', 'school-gikomero-tss', 'WEDNESDAY', -4, 'END OF DAY', '2024-01-01 16:50:00+00', '2024-01-01 16:55:00+00', 'AFTERNOON', true, 'END_OF_DAY', true, NOW(), NOW());

-- Thursday Time Slots
INSERT INTO time_slots (id, school_id, day, period, name, start_time, end_time, session, is_break, break_type, is_active, created_at, updated_at) VALUES
('ts-thu-1', 'school-gikomero-tss', 'THURSDAY', 1, 'P1', '2024-01-01 08:00:00+00', '2024-01-01 08:40:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-thu-2', 'school-gikomero-tss', 'THURSDAY', 2, 'P2', '2024-01-01 08:40:00+00', '2024-01-01 09:20:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-thu-3', 'school-gikomero-tss', 'THURSDAY', 3, 'P3', '2024-01-01 09:20:00+00', '2024-01-01 10:00:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-thu-break1', 'school-gikomero-tss', 'THURSDAY', -1, 'MORNING BREAK', '2024-01-01 10:00:00+00', '2024-01-01 10:20:00+00', 'MORNING', true, 'MORNING_BREAK', true, NOW(), NOW()),
('ts-thu-4', 'school-gikomero-tss', 'THURSDAY', 4, 'P4', '2024-01-01 10:20:00+00', '2024-01-01 11:00:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-thu-5', 'school-gikomero-tss', 'THURSDAY', 5, 'P5', '2024-01-01 11:00:00+00', '2024-01-01 11:40:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-thu-lunch', 'school-gikomero-tss', 'THURSDAY', -2, 'LUNCH BREAK', '2024-01-01 11:40:00+00', '2024-01-01 13:10:00+00', 'AFTERNOON', true, 'LUNCH_BREAK', true, NOW(), NOW()),
('ts-thu-6', 'school-gikomero-tss', 'THURSDAY', 6, 'P6', '2024-01-01 13:10:00+00', '2024-01-01 13:50:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-thu-7', 'school-gikomero-tss', 'THURSDAY', 7, 'P7', '2024-01-01 13:50:00+00', '2024-01-01 14:30:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-thu-8', 'school-gikomero-tss', 'THURSDAY', 8, 'P8', '2024-01-01 14:30:00+00', '2024-01-01 15:10:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-thu-break2', 'school-gikomero-tss', 'THURSDAY', -3, 'AFTERNOON BREAK', '2024-01-01 15:10:00+00', '2024-01-01 15:30:00+00', 'AFTERNOON', true, 'AFTERNOON_BREAK', true, NOW(), NOW()),
('ts-thu-9', 'school-gikomero-tss', 'THURSDAY', 9, 'P9', '2024-01-01 15:30:00+00', '2024-01-01 16:10:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-thu-10', 'school-gikomero-tss', 'THURSDAY', 10, 'P10', '2024-01-01 16:10:00+00', '2024-01-01 16:50:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-thu-end', 'school-gikomero-tss', 'THURSDAY', -4, 'END OF DAY', '2024-01-01 16:50:00+00', '2024-01-01 16:55:00+00', 'AFTERNOON', true, 'END_OF_DAY', true, NOW(), NOW());

-- Friday Time Slots
INSERT INTO time_slots (id, school_id, day, period, name, start_time, end_time, session, is_break, break_type, is_active, created_at, updated_at) VALUES
('ts-fri-1', 'school-gikomero-tss', 'FRIDAY', 1, 'P1', '2024-01-01 08:00:00+00', '2024-01-01 08:40:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-fri-2', 'school-gikomero-tss', 'FRIDAY', 2, 'P2', '2024-01-01 08:40:00+00', '2024-01-01 09:20:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-fri-3', 'school-gikomero-tss', 'FRIDAY', 3, 'P3', '2024-01-01 09:20:00+00', '2024-01-01 10:00:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-fri-break1', 'school-gikomero-tss', 'FRIDAY', -1, 'MORNING BREAK', '2024-01-01 10:00:00+00', '2024-01-01 10:20:00+00', 'MORNING', true, 'MORNING_BREAK', true, NOW(), NOW()),
('ts-fri-4', 'school-gikomero-tss', 'FRIDAY', 4, 'P4', '2024-01-01 10:20:00+00', '2024-01-01 11:00:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-fri-5', 'school-gikomero-tss', 'FRIDAY', 5, 'P5', '2024-01-01 11:00:00+00', '2024-01-01 11:40:00+00', 'MORNING', false, NULL, true, NOW(), NOW()),
('ts-fri-lunch', 'school-gikomero-tss', 'FRIDAY', -2, 'LUNCH BREAK', '2024-01-01 11:40:00+00', '2024-01-01 13:10:00+00', 'AFTERNOON', true, 'LUNCH_BREAK', true, NOW(), NOW()),
('ts-fri-6', 'school-gikomero-tss', 'FRIDAY', 6, 'P6', '2024-01-01 13:10:00+00', '2024-01-01 13:50:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-fri-7', 'school-gikomero-tss', 'FRIDAY', 7, 'P7', '2024-01-01 13:50:00+00', '2024-01-01 14:30:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-fri-8', 'school-gikomero-tss', 'FRIDAY', 8, 'P8', '2024-01-01 14:30:00+00', '2024-01-01 15:10:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-fri-break2', 'school-gikomero-tss', 'FRIDAY', -3, 'AFTERNOON BREAK', '2024-01-01 15:10:00+00', '2024-01-01 15:30:00+00', 'AFTERNOON', true, 'AFTERNOON_BREAK', true, NOW(), NOW()),
('ts-fri-9', 'school-gikomero-tss', 'FRIDAY', 9, 'P9', '2024-01-01 15:30:00+00', '2024-01-01 16:10:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-fri-10', 'school-gikomero-tss', 'FRIDAY', 10, 'P10', '2024-01-01 16:10:00+00', '2024-01-01 16:50:00+00', 'AFTERNOON', false, NULL, true, NOW(), NOW()),
('ts-fri-end', 'school-gikomero-tss', 'FRIDAY', -4, 'END OF DAY', '2024-01-01 16:50:00+00', '2024-01-01 16:55:00+00', 'AFTERNOON', true, 'END_OF_DAY', true, NOW(), NOW());
