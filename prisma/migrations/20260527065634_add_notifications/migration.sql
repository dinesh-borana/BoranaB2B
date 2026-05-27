-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_PRODUCT', 'ORDER_STATUS', 'DISCOUNT');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_partyId_isRead_idx" ON "Notification"("partyId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_partyId_createdAt_idx" ON "Notification"("partyId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;
