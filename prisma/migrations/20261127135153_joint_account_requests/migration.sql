-- CreateTable
CREATE TABLE "JointAccountRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "tagOwner" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JointAccountRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JointAccountRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "JointAccountRequest_accountId_status_idx" ON "JointAccountRequest"("accountId", "status");

-- CreateIndex
CREATE INDEX "JointAccountRequest_inviteeEmail_status_idx" ON "JointAccountRequest"("inviteeEmail", "status");

-- CreateIndex
CREATE INDEX "JointAccountRequest_requesterId_idx" ON "JointAccountRequest"("requesterId");
