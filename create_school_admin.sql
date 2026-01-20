-- SQL to create GS GIKOMERO TSS school and school admin user
-- Replace the IDs with actual cuids if needed

-- Insert the school
INSERT INTO schools (id, name, type, email, status, created_at, updated_at)
VALUES (
  'school-gikomero-tss',
  'GS GIKOMERO TSS',
  'TSS',
  'sergemanzi250@gmail.com',
  'APPROVED',
  NOW(),
  NOW()
);

-- Insert the school admin user
INSERT INTO users (id, email, name, password, role, school_id, is_active, created_at, updated_at)
VALUES (
  'user-gikomero-admin',
  'sergemanzi250@gmail.com',
  'GS Gikomero TSS Admin',
  '$2a$12$9FF99YLN.iiygrhV0H0CQOfBNY.u84ewA9..ihy8Kqzw33gW3tNve',
  'SCHOOL_ADMIN',
  'school-gikomero-tss',
  true,
  NOW(),
  NOW()
);