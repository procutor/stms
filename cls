[33mcommit 525daa30cf44972853fa89e49d0e2f0914784947[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m)[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Sat Jan 17 18:49:28 2026 +0200

    Update gitignore to exclude build and cache files

 .gitignore | 14 [32m++++++++++++++[m
 1 file changed, 14 insertions(+)

[33mcommit 7854f82173e1bc614b0ffe09e4296a2f9baed9d3[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Fri Jan 16 20:14:05 2026 +0200

    Initial commit: Automatic School Timetable Management System

 .env.example                                       |   8 [32m+[m[31m-[m
 .gitignore                                         |  48 [32m+[m[31m--[m
 ...RY_MODULES_FLEXIBLE_PLACEMENT_IMPLEMENTATION.md |  94 [32m++++++[m
 .../CONSECUTIVE_DOUBLE_PERIODS_IMPLEMENTATION.md   | 103 [32m++++++[m
 .../FINAL-RESOLUTION-SUMMARY.md                    | 118 [32m+++++++[m
 backup-development-files/IMPLEMENTATION_TEST.md    | 144 [32m++++++++[m
 .../LESSON_PREPARATION_UPDATES.md                  | 239 [32m+++++++++++++[m
 .../PER_CLASS_ASSIGNMENTS_IMPLEMENTATION.md        | 199 [32m+++++++++++[m
 .../PER_CLASS_TEACHER_ASSIGNMENT_README.md         | 144 [32m++++++++[m
 backup-development-files/SETUP.md                  | 119 [32m+++++++[m
 .../TEACHER_DASHBOARD_IMPLEMENTATION_COMPLETE.md   | 220 [32m++++++++++++[m
 .../TEACHER_SCOPE_ENHANCEMENT.md                   | 247 [32m++++++++++++++[m
 .../TEACHER_SCOPE_TEST_SCENARIOS.md                | 370 [32m+++++++++++++++++++++[m
 .../TIMETABLE-CONFLICT-RESOLUTION-SUMMARY.md       | 134 [32m++++++++[m
 .../TIMETABLE_GENERATION_UPDATES.md                | 224 [32m+++++++++++++[m
 backup-development-files/TROUBLESHOOTING.md        |  99 [32m++++++[m
 backup-development-files/add_trade_column.js       |  22 [32m++[m
 backup-development-files/add_trade_column.sql      |   4 [32m+[m
 backup-development-files/contact/page.tsx          | 302 [32m+++++++++++++++++[m
 .../demo-a4-timetable/page.tsx                     | 185 [32m+++++++++++[m
 backup-development-files/final-verification.js     | 213 [32m++++++++++++[m
 backup-development-files/fix-generation-issues.md  | 120 [32m+++++++[m
 .../manual-conflict-resolution.js                  | 321 [32m++++++++++++++++++[m
 .../regenerate-monday-friday.js                    |  56 [32m++++[m
 backup-development-files/regenerate-timetables.js  |  54 [32m+++[m
 backup-development-files/test-a4-print/page.tsx    | 183 [32m++++++++++[m
 backup-development-files/tsconfig.tsbuildinfo      |   1 [32m+[m
 .../update-time-slots-p1-p10.js                    | 238 [32m+++++++++++++[m
 backup-development-files/update_time_structure.js  |  97 [32m++++++[m
 package.json                                       |   2 [32m+[m[31m-[m
 src/app/api/generate/route.ts                      |   2 [32m+[m
 tsconfig.tsbuildinfo                               |   1 [32m+[m
 vercel.json                                        |   5 [31m-[m
 yarn.lock                                          |  52 [32m+[m[31m--[m
 34 files changed, 4297 insertions(+), 71 deletions(-)

[33mcommit 5e5ba97dad692449a3367cd38ff7aa1c2094d68d[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Fri Jan 16 20:08:32 2026 +0200

    Add required config and scheduling docs

 ADVANCED_SCHEDULING_SYSTEM.md      |  292 [32m++[m
 package-lock.json                  | 8576 [32m++++++++++++++++++++++++++++++++++++[m
 prisma/prisma.config.ts            |    9 [32m+[m
 railway.toml                       |   20 [32m+[m
 src/app/api/generate/bulk/route.ts |    2 [32m+[m
 5 files changed, 8899 insertions(+)

[33mcommit 60b257806f0601dedede6d61f6136185aa670d7c[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 11:15:14 2026 +0200

    Fix debug-auth build error: Add dynamic export to prevent static generation

 src/app/api/debug-auth/route.ts | 2 [32m++[m
 1 file changed, 2 insertions(+)

[33mcommit 96a8d7c23043ec9e049953052d095a25e5578df8[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 11:08:39 2026 +0200

    Fix classes build error: Add dynamic export to prevent static generation

 src/app/api/classes/route.ts | 2 [32m++[m
 1 file changed, 2 insertions(+)

[33mcommit d8c616b0b6e3100d6b2955ef4a78c49ed1f27df2[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 11:02:57 2026 +0200

    Fix class-assignments build error: Add dynamic export to prevent static generation

 src/app/api/class-assignments/route.ts | 2 [32m++[m
 1 file changed, 2 insertions(+)

[33mcommit 3ba4cb7b02f7fb796c7fd749798e9badabbe41f5[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:56:46 2026 +0200

    Fix bulk-upload templates build error: Add dynamic export to prevent static generation

 src/app/api/bulk-upload/templates/[type]/route.ts | 2 [32m++[m
 1 file changed, 2 insertions(+)

[33mcommit ceaeaa0f39b18eaf07fba3b6ff76c87d9d9868ee[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:50:45 2026 +0200

    Fix bulk-upload build error: Add dynamic export to prevent static generation

 src/app/api/bulk-upload/route.ts | 2 [32m++[m
 1 file changed, 2 insertions(+)

[33mcommit 22e1730811fcdbdf6a11f2bf31d0f88d7923774d[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:44:48 2026 +0200

    Update project name from stms to tms in .env.example

 .env.example | 4 [32m++[m[31m--[m
 1 file changed, 2 insertions(+), 2 deletions(-)

[33mcommit 15eb9164b38d0addd2b7e9870c03afb86640a72e[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:41:28 2026 +0200

    Update .env.example with Neon database connection string

 .env.example | 2 [32m+[m[31m-[m
 1 file changed, 1 insertion(+), 1 deletion(-)

[33mcommit b91e82d31c1f1cd9835ad4500518891a7bade168[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:37:27 2026 +0200

    Update .env.example with correct Vercel URLs for stms project

 .env.example | 4 [32m++[m[31m--[m
 1 file changed, 2 insertions(+), 2 deletions(-)

[33mcommit cdd04f0297ae62fa31e48b840b6c9fc6d93ec96d[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:32:43 2026 +0200

    Fix NextAuth build error: Add dynamic export to prevent static generation

 src/app/api/auth/[...nextauth]/route.ts | 2 [32m++[m
 1 file changed, 2 insertions(+)

[33mcommit 33b74a2c9f409b4b4ba6c5a083a067b8efa65519[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:27:22 2026 +0200

    Fix vercel.json: Correct runtime configuration for Next.js deployment

 vercel.json | 15 [32m++[m[31m-------------[m
 1 file changed, 2 insertions(+), 13 deletions(-)

[33mcommit abe8854c60eeb906faec78fd8717e087f673d0ee[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:24:32 2026 +0200

    Fix Vercel build error: Add vercel.json config and prevent static generation of API routes

 next.config.js                   |  3 [32m+++[m
 src/app/api/assignments/route.ts |  2 [32m++[m
 src/lib/db.ts                    |  8 [32m+++++[m[31m---[m
 vercel.json                      | 16 [32m++++++++++++++++[m
 4 files changed, 26 insertions(+), 3 deletions(-)

[33mcommit 858dad075e16f043532b1ae4f2f20561d338c88b[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:19:37 2026 +0200

    Fix Vercel build error: Configure Next.js for proper Prisma client handling and standalone output

 next.config.js | 4 [32m++++[m
 src/lib/db.ts  | 6 [32m+++++[m[31m-[m
 2 files changed, 9 insertions(+), 1 deletion(-)

[33mcommit a6ddd8b8dfe3b3604ba1155d6b182169ea3398f3[m
Author: sergemanzi250-lgtm <sergemanzi250@gmail.com>
Date:   Wed Jan 7 10:13:30 2026 +0200

    Fix TypeScript error: Ensure Upload icon is properly imported from lucide-react

 src/app/dashboard/school-admin/trainer-assignments/page.tsx | 13 [32m+++++++[m[31m------[m
 1 file changed, 7 insertions(+), 6 deletions(-)

[33mcommit a0e260b4b41ca5649f1fac3eaf118d0462b92b8d[m
Author: sergeman