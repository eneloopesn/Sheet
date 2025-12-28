-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "businessHours" TEXT NOT NULL,
    "parkingInfo" TEXT,
    "mapUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Contact" ("address", "businessHours", "createdAt", "email", "id", "mapUrl", "parkingInfo", "phone", "studioName", "updatedAt") SELECT "address", "businessHours", "createdAt", "email", "id", "mapUrl", "parkingInfo", "phone", "studioName", "updatedAt" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
