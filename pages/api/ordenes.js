import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const orden = await prisma.orden.create({
        data: {
          nombre: req.body.nombre,
          total: req.body.total,
          pedido: req.body.pedido,
          fecha: req.body.fecha,
        },
      });

      return res.status(201).json(orden);
    }

    if (req.method === "GET") {
      const ahora = new Date();

      await prisma.orden.updateMany({
        where: {
          estado: "preparando",
          fechaEntregaEstimada: {
            lte: ahora,
          },
        },
        data: {
          estado: "listo",
        },
      });

      const ordenes = await prisma.orden.findMany({
        orderBy: {
          id: "desc",
        },
      });

      return res.status(200).json(ordenes);
    }

    if (req.method === "PUT") {
      const { id, accion, tiempoPreparacion } = req.body;

      if (!id || !accion) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      if (accion === "iniciar") {
        const inicio = new Date();
        const entrega = new Date(inicio.getTime() + tiempoPreparacion * 60000);

        const ordenActualizada = await prisma.orden.update({
          where: {
            id: Number(id),
          },
          data: {
            estado: "preparando",
            tiempoPreparacion: Number(tiempoPreparacion),
            fechaInicio: inicio,
            fechaEntregaEstimada: entrega,
          },
        });

        return res.status(200).json(ordenActualizada);
      }

      if (accion === "listo") {
        const ordenActualizada = await prisma.orden.update({
          where: {
            id: Number(id),
          },
          data: {
            estado: "listo",
          },
        });

        return res.status(200).json(ordenActualizada);
      }

      if (accion === "entregado") {
        const ordenActualizada = await prisma.orden.delete({
          where: {
            id: Number(id),
          },
        });

        return res.status(200).json(ordenActualizada);
      }

      return res.status(400).json({ error: "Acción no válida" });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error("Error en /api/ordenes:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}