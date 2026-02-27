-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('VISITOR', 'REGULAR_ATTENDEE', 'MEMBER', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('HEAD', 'SPOUSE', 'CHILD', 'OTHER_ADULT', 'DEPENDENT');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('SMALL_GROUP', 'SERVING_TEAM', 'MINISTRY', 'CLASS', 'ADMINISTRATIVE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('LEADER', 'CO_LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'DATE', 'DROPDOWN', 'MULTI_SELECT', 'CHECKBOX', 'NUMBER', 'URL', 'FILE');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('GENERAL', 'PASTORAL', 'COUNSELING', 'FOLLOW_UP', 'PRAYER');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'SMS', 'PHONE', 'MAIL');

-- CreateTable
CREATE TABLE "Person" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "gender" "Gender",
    "maritalStatus" "MaritalStatus",
    "dateOfBirth" DATE,
    "email" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "homePhone" TEXT,
    "address" JSONB,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "photoUrl" TEXT,
    "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'VISITOR',
    "membershipDate" DATE,
    "baptismDate" DATE,
    "salvationDate" DATE,
    "notes" TEXT,
    "source" TEXT,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" JSONB,
    "primaryContactId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'OTHER_ADULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonGroup" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "groupType" "GroupType" NOT NULL DEFAULT 'SMALL_GROUP',
    "parentGroupId" UUID,
    "meetingSchedule" TEXT,
    "meetingLocation" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER,
    "photoUrl" TEXT,
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PersonGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonGroupMember" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fieldType" "CustomFieldType" NOT NULL,
    "options" JSONB,
    "section" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "fieldDefinitionId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonNote" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "noteType" "NoteType" NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationPreference" (
    "id" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "category" TEXT NOT NULL,
    "isOptedIn" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonTag" (
    "id" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "tagName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Person_churchId_idx" ON "Person"("churchId");

-- CreateIndex
CREATE INDEX "Person_churchId_membershipStatus_idx" ON "Person"("churchId", "membershipStatus");

-- CreateIndex
CREATE INDEX "Person_churchId_lastName_firstName_idx" ON "Person"("churchId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "Person_churchId_email_idx" ON "Person"("churchId", "email");

-- CreateIndex
CREATE INDEX "Person_churchId_deletedAt_idx" ON "Person"("churchId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Person_churchId_slug_key" ON "Person"("churchId", "slug");

-- CreateIndex
CREATE INDEX "Household_churchId_idx" ON "Household"("churchId");

-- CreateIndex
CREATE INDEX "Household_churchId_name_idx" ON "Household"("churchId", "name");

-- CreateIndex
CREATE INDEX "HouseholdMember_householdId_idx" ON "HouseholdMember"("householdId");

-- CreateIndex
CREATE INDEX "HouseholdMember_personId_idx" ON "HouseholdMember"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMember_householdId_personId_key" ON "HouseholdMember"("householdId", "personId");

-- CreateIndex
CREATE INDEX "PersonGroup_churchId_idx" ON "PersonGroup"("churchId");

-- CreateIndex
CREATE INDEX "PersonGroup_churchId_groupType_idx" ON "PersonGroup"("churchId", "groupType");

-- CreateIndex
CREATE INDEX "PersonGroup_churchId_status_idx" ON "PersonGroup"("churchId", "status");

-- CreateIndex
CREATE INDEX "PersonGroup_churchId_parentGroupId_idx" ON "PersonGroup"("churchId", "parentGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonGroup_churchId_slug_key" ON "PersonGroup"("churchId", "slug");

-- CreateIndex
CREATE INDEX "PersonGroupMember_groupId_idx" ON "PersonGroupMember"("groupId");

-- CreateIndex
CREATE INDEX "PersonGroupMember_personId_idx" ON "PersonGroupMember"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonGroupMember_groupId_personId_key" ON "PersonGroupMember"("groupId", "personId");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_churchId_idx" ON "CustomFieldDefinition"("churchId");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_churchId_section_idx" ON "CustomFieldDefinition"("churchId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_churchId_slug_key" ON "CustomFieldDefinition"("churchId", "slug");

-- CreateIndex
CREATE INDEX "CustomFieldValue_personId_idx" ON "CustomFieldValue"("personId");

-- CreateIndex
CREATE INDEX "CustomFieldValue_fieldDefinitionId_idx" ON "CustomFieldValue"("fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_personId_fieldDefinitionId_key" ON "CustomFieldValue"("personId", "fieldDefinitionId");

-- CreateIndex
CREATE INDEX "PersonNote_churchId_idx" ON "PersonNote"("churchId");

-- CreateIndex
CREATE INDEX "PersonNote_personId_createdAt_idx" ON "PersonNote"("personId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PersonNote_personId_noteType_idx" ON "PersonNote"("personId", "noteType");

-- CreateIndex
CREATE INDEX "PersonNote_authorId_idx" ON "PersonNote"("authorId");

-- CreateIndex
CREATE INDEX "CommunicationPreference_personId_idx" ON "CommunicationPreference"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationPreference_personId_channel_category_key" ON "CommunicationPreference"("personId", "channel", "category");

-- CreateIndex
CREATE INDEX "PersonTag_personId_idx" ON "PersonTag"("personId");

-- CreateIndex
CREATE INDEX "PersonTag_tagName_idx" ON "PersonTag"("tagName");

-- CreateIndex
CREATE UNIQUE INDEX "PersonTag_personId_tagName_key" ON "PersonTag"("personId", "tagName");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonGroup" ADD CONSTRAINT "PersonGroup_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "PersonGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonGroup" ADD CONSTRAINT "PersonGroup_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonGroupMember" ADD CONSTRAINT "PersonGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PersonGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonGroupMember" ADD CONSTRAINT "PersonGroupMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonNote" ADD CONSTRAINT "PersonNote_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonNote" ADD CONSTRAINT "PersonNote_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonNote" ADD CONSTRAINT "PersonNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPreference" ADD CONSTRAINT "CommunicationPreference_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonTag" ADD CONSTRAINT "PersonTag_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
