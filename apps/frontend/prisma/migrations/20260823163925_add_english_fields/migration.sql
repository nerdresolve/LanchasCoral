-- AlterTable
ALTER TABLE "Boat" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "taglineEn" TEXT,
ADD COLUMN     "variantEn" TEXT;

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "textEn" TEXT;

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "hours" INTEGER,
    "priceBrl" INTEGER,
    "place" TEXT,
    "tag" TEXT,
    "lengthM" DECIMAL(5,2),
    "powerHp" INTEGER,
    "notes" TEXT,
    "heroImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_published_order_idx" ON "Listing"("published", "order");
