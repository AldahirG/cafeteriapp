import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const formatearDinero = (cantidad) => {
  return cantidad.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
};

const calcularTiempoRestante = (fechaEntregaEstimada) => {
  if (!fechaEntregaEstimada) return null;

  const ahora = new Date().getTime();
  const entrega = new Date(fechaEntregaEstimada).getTime();
  const diferencia = entrega - ahora;

  if (diferencia <= 0) return "00:00";

  const minutos = Math.floor(diferencia / 1000 / 60);
  const segundos = Math.floor((diferencia / 1000) % 60);

  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
};

export default function Cocina() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const obtenerOrdenes = async () => {
    try {
      const { data } = await axios.get("/api/ordenes");
      setOrdenes(data);
    } catch (error) {
      console.error("Error al obtener órdenes:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerOrdenes();

    const intervaloConsulta = setInterval(() => {
      obtenerOrdenes();
    }, 5000);

    return () => clearInterval(intervaloConsulta);
  }, []);

  useEffect(() => {
    const intervaloSegundo = setInterval(() => {
      setOrdenes((prev) => [...prev]);
    }, 1000);

    return () => clearInterval(intervaloSegundo);
  }, []);

  const iniciarPreparacion = async (id, minutos) => {
    try {
      await axios.put("/api/ordenes", {
        id,
        accion: "iniciar",
        tiempoPreparacion: minutos,
      });

      await obtenerOrdenes();
    } catch (error) {
      console.error("Error al iniciar preparación:", error);
    }
  };

  const marcarListo = async (id) => {
    try {
      await axios.put("/api/ordenes", {
        id,
        accion: "listo",
      });

      await obtenerOrdenes();
    } catch (error) {
      console.error("Error al marcar listo:", error);
    }
  };

  const marcarEntregado = async (id) => {
    try {
      await axios.put("/api/ordenes", {
        id,
        accion: "entregado",
      });

      await obtenerOrdenes();
    } catch (error) {
      console.error("Error al marcar entregado:", error);
    }
  };

  const pendientes = useMemo(
    () => ordenes.filter((orden) => orden.estado === "pendiente"),
    [ordenes]
  );

  const preparando = useMemo(
    () => ordenes.filter((orden) => orden.estado === "preparando"),
    [ordenes]
  );

  const listos = useMemo(
    () => ordenes.filter((orden) => orden.estado === "listo"),
    [ordenes]
  );

  const renderOrden = (orden) => {
    const tiempoRestante = calcularTiempoRestante(orden.fechaEntregaEstimada);
    const pedido = Array.isArray(orden.pedido) ? orden.pedido : [];

    return (
      <div
        key={orden.id}
        className="rounded-xl border bg-white shadow-md p-5 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Pedido #{orden.id}
            </p>
            <h3 className="text-2xl font-bold">{orden.nombre}</h3>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-extrabold text-amber-600">
              {formatearDinero(orden.total)}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="font-bold text-lg mb-2">Productos</p>

          <div className="space-y-2">
            {pedido.map((producto) => (
              <div
                key={`${orden.id}-${producto.id}`}
                className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="font-semibold">{producto.nombre}</p>
                  <p className="text-sm text-gray-500">
                    Cantidad: {producto.cantidad}
                  </p>
                </div>

                <p className="font-bold text-gray-700">
                  {formatearDinero(producto.precio * producto.cantidad)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {orden.estado === "pendiente" && (
          <div className="pt-2">
            <p className="font-bold mb-3">Asignar tiempo de preparación</p>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20, 25, 30].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => iniciarPreparacion(orden.id, min)}
                  className="bg-indigo-600 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg font-bold"
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>
        )}

        {orden.estado === "preparando" && (
          <div className="pt-2 flex flex-col gap-3">
            <div className="rounded-lg bg-amber-50 border border-amber-300 p-4">
              <p className="text-sm uppercase text-amber-700 font-bold">
                En preparación
              </p>
              <p className="text-4xl font-extrabold text-amber-700 mt-1">
                {tiempoRestante}
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Tiempo asignado: {orden.tiempoPreparacion} min
              </p>
            </div>

            <button
              type="button"
              onClick={() => marcarListo(orden.id)}
              className="bg-green-600 hover:bg-green-800 text-white px-4 py-3 rounded-lg font-bold"
            >
              Marcar como listo
            </button>
          </div>
        )}

        {orden.estado === "listo" && (
          <div className="pt-2 flex flex-col gap-3">
            <div className="rounded-lg bg-green-50 border border-green-300 p-4">
              <p className="text-sm uppercase text-green-700 font-bold">
                Pedido listo
              </p>
              <p className="text-3xl font-extrabold text-green-700 mt-1">
                LISTO PARA ENTREGAR
              </p>
            </div>

            <button
              type="button"
              onClick={() => marcarEntregado(orden.id)}
              className="bg-slate-800 hover:bg-black text-white px-4 py-3 rounded-lg font-bold"
            >
              Marcar como entregado
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800">
            Panel de Cocina
          </h1>
          <p className="text-lg text-slate-600 mt-2">
            Revisa pedidos, asigna tiempo y controla la preparación.
          </p>
        </div>

        {cargando ? (
          <p className="text-xl">Cargando órdenes...</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Pendientes</h2>
                <span className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full font-bold">
                  {pendientes.length}
                </span>
              </div>

              <div className="space-y-4">
                {pendientes.length ? (
                  pendientes.map(renderOrden)
                ) : (
                  <div className="bg-white rounded-xl p-5 shadow">
                    No hay pedidos pendientes
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  Preparando
                </h2>
                <span className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full font-bold">
                  {preparando.length}
                </span>
              </div>

              <div className="space-y-4">
                {preparando.length ? (
                  preparando.map(renderOrden)
                ) : (
                  <div className="bg-white rounded-xl p-5 shadow">
                    No hay pedidos en preparación
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Listos</h2>
                <span className="bg-green-200 text-green-900 px-3 py-1 rounded-full font-bold">
                  {listos.length}
                </span>
              </div>

              <div className="space-y-4">
                {listos.length ? (
                  listos.map(renderOrden)
                ) : (
                  <div className="bg-white rounded-xl p-5 shadow">
                    No hay pedidos listos
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}