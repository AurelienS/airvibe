-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "rawIgc" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "durationSeconds" INTEGER,
    "distanceMeters" INTEGER,
    "altitudeMaxMeters" INTEGER,
    "faiDistanceMeters" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Flight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Flight_userId_idx" ON "Flight"("userId");
