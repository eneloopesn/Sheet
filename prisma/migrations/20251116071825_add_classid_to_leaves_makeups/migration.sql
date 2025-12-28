-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Leave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "classId" TEXT,
    "classDate" DATETIME NOT NULL,
    "className" TEXT NOT NULL,
    "instructor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cancelledAt" DATETIME,
    CONSTRAINT "Leave_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Leave_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Leave" ("cancelledAt", "classDate", "className", "createdAt", "id", "instructor", "memberId", "reason", "status", "updatedAt") SELECT "cancelledAt", "classDate", "className", "createdAt", "id", "instructor", "memberId", "reason", "status", "updatedAt" FROM "Leave";
DROP TABLE "Leave";
ALTER TABLE "new_Leave" RENAME TO "Leave";
CREATE TABLE "new_Makeup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "leaveId" TEXT,
    "classId" TEXT,
    "classDate" DATETIME NOT NULL,
    "className" TEXT NOT NULL,
    "instructor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cancelledAt" DATETIME,
    CONSTRAINT "Makeup_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "Leave" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Makeup_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Makeup_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Makeup" ("cancelledAt", "classDate", "className", "createdAt", "id", "instructor", "leaveId", "memberId", "status", "updatedAt") SELECT "cancelledAt", "classDate", "className", "createdAt", "id", "instructor", "leaveId", "memberId", "status", "updatedAt" FROM "Makeup";
DROP TABLE "Makeup";
ALTER TABLE "new_Makeup" RENAME TO "Makeup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
