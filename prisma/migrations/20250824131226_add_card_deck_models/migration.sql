-- AlterTable
ALTER TABLE `user` ADD COLUMN `role` ENUM('HOST', 'PRODUCER', 'ADMIN') NOT NULL DEFAULT 'HOST';

-- AlterTable
ALTER TABLE `verificationtoken` MODIFY `my_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

-- CreateTable
CREATE TABLE `Season` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,

    INDEX `Season_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Card` (
    `id` VARCHAR(191) NOT NULL,
    `cardNumber` INTEGER NOT NULL,
    `question` TEXT NOT NULL,
    `correctAnswer` TEXT NOT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastUsed` DATETIME(3) NULL,
    `seasonId` VARCHAR(191) NOT NULL,

    INDEX `Card_seasonId_difficulty_idx`(`seasonId`, `difficulty`),
    INDEX `Card_usageCount_idx`(`usageCount`),
    UNIQUE INDEX `Card_seasonId_difficulty_cardNumber_key`(`seasonId`, `difficulty`, `cardNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attempt` (
    `id` VARCHAR(191) NOT NULL,
    `contestantName` VARCHAR(191) NOT NULL,
    `givenAnswer` TEXT NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cardId` VARCHAR(191) NOT NULL,
    `seasonId` VARCHAR(191) NOT NULL,
    `recordedById` VARCHAR(191) NOT NULL,

    INDEX `Attempt_attemptedAt_idx`(`attemptedAt`),
    INDEX `Attempt_seasonId_idx`(`seasonId`),
    INDEX `Attempt_contestantName_idx`(`contestantName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Season` ADD CONSTRAINT `Season_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_seasonId_fkey` FOREIGN KEY (`seasonId`) REFERENCES `Season`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
