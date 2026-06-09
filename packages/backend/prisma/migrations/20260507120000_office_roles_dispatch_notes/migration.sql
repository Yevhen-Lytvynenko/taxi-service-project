-- CreateTable
CREATE TABLE "office_roles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "legacyRole" "Role" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "office_roles_slug_key" ON "office_roles"("slug");

-- AlterTable
ALTER TABLE "users" ADD COLUMN "officeRoleId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "dispatcherNotes" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_officeRoleId_fkey" FOREIGN KEY ("officeRoleId") REFERENCES "office_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_officeRoleId_idx" ON "users"("officeRoleId");
