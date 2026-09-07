/*
  Warnings:

  - You are about to drop the column `lengthM` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `powerHp` on the `Listing` table. All the data in the column will be lost.
  - Added the required column `title` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "lengthM",
DROP COLUMN "name",
DROP COLUMN "notes",
DROP COLUMN "powerHp",
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "capacity" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "engine" TEXT,
ADD COLUMN     "fuel" TEXT,
ADD COLUMN     "hullType" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'LANCHA',
ADD COLUMN     "sizeFt" INTEGER,
ADD COLUMN     "sold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "hours" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingAccessory" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListingAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingImage_listingId_order_idx" ON "ListingImage"("listingId", "order");

-- CreateIndex
CREATE INDEX "ListingAccessory_listingId_order_idx" ON "ListingAccessory"("listingId", "order");

-- CreateIndex
CREATE INDEX "Listing_kind_published_idx" ON "Listing"("kind", "published");

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAccessory" ADD CONSTRAINT "ListingAccessory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
