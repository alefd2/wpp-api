-- CreateTable
CREATE TABLE "contact_observations" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "contactId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_observations_companyId_idx" ON "contact_observations"("companyId");

-- CreateIndex
CREATE INDEX "contact_observations_contactId_idx" ON "contact_observations"("contactId");

-- CreateIndex
CREATE INDEX "contact_observations_userId_idx" ON "contact_observations"("userId");

-- AddForeignKey
ALTER TABLE "contact_observations" ADD CONSTRAINT "contact_observations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_observations" ADD CONSTRAINT "contact_observations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_observations" ADD CONSTRAINT "contact_observations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
