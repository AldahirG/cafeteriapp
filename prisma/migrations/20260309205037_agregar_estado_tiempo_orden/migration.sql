-- AlterTable
ALTER TABLE `orden` ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'pendiente',
    ADD COLUMN `tiempoPreparacion` INTEGER NULL,
    ADD COLUMN `tiempoRestante` INTEGER NULL;
