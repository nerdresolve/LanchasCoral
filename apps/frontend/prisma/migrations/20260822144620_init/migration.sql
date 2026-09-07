-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boat" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variant" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "familyId" TEXT,
    "lengthM" DECIMAL(5,2),
    "beamM" DECIMAL(5,2),
    "draftM" DECIMAL(5,2),
    "depthM" DECIMAL(5,2),
    "cabinHeightM" DECIMAL(5,2),
    "weightKg" INTEGER,
    "fuelL" INTEGER,
    "waterL" INTEGER,
    "powerMinHp" INTEGER,
    "powerMaxHp" INTEGER,
    "capInteriorDay" INTEGER,
    "capInteriorNight" INTEGER,
    "capOpenSeaDay" INTEGER,
    "capOpenSeaNight" INTEGER,
    "performance" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "heroImage" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoatImage" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BoatImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "panel" TEXT NOT NULL,
    "section" TEXT,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "boatSlug" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'CONTATO',
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_name_key" ON "Family"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Family_slug_key" ON "Family"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Boat_slug_key" ON "Boat"("slug");

-- CreateIndex
CREATE INDEX "Boat_published_order_idx" ON "Boat"("published", "order");

-- CreateIndex
CREATE INDEX "BoatImage_boatId_order_idx" ON "BoatImage"("boatId", "order");

-- CreateIndex
CREATE INDEX "Equipment_boatId_panel_order_idx" ON "Equipment"("boatId", "panel", "order");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Inquiry_handled_createdAt_idx" ON "Inquiry"("handled", "createdAt");

-- AddForeignKey
ALTER TABLE "Boat" ADD CONSTRAINT "Boat_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoatImage" ADD CONSTRAINT "BoatImage_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
