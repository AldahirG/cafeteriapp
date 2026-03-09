/*
  Warnings:

  - You are about to drop the column `tiempoRestante` on the `orden` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `orden` DROP COLUMN `tiempoRestante`,
    ADD COLUMN `fechaEntregaEstimada` DATETIME(3) NULL,
    ADD COLUMN `fechaInicio` DATETIME(3) NULL;
