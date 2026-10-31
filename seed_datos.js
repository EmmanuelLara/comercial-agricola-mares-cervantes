const mongoose = require("mongoose");
require("dotenv").config();

const Producto  = require("./models/Producto");
const Proveedor = require("./models/Proveedor");
const Cliente   = require("./models/Cliente");
const Venta     = require("./models/Venta");
const Compra    = require("./models/Compra");

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado a MongoDB");

    await Promise.all([
        Producto.deleteMany({}),
        Proveedor.deleteMany({}),
        Cliente.deleteMany({}),
        Venta.deleteMany({}),
        Compra.deleteMany({}),
    ]);
    console.log("Colecciones limpiadas");

    const proveedores = await Proveedor.insertMany([
        { Numero_Proveedor:"PROV-001", RazonSocial:"Refacciones y Filtros Agrícolas del Norte S.A. de C.V.", RFC:"RFA200301AB3", Contacto:"Ing. Roberto Fuentes", Correo:"ventas@refaccionesagricolas.mx", Telefono:"614-123-4567", Direccion:"Blvd. Agrario 450", Ciudad:"Chihuahua", Estado_Prov:"Chihuahua", CodigoPostal:"31000", Estado:"Activo" },
        { Numero_Proveedor:"PROV-002", RazonSocial:"Lubricantes y Aceites Tractor Hernandez", RFC:"LAH950812CD5", Contacto:"Lic. Maria Hernandez", Correo:"mhernandez@lubricantes.com", Telefono:"667-456-7890", Direccion:"Carretera Internacional km 12", Ciudad:"Culiacan", Estado_Prov:"Sinaloa", CodigoPostal:"80000", Estado:"Activo" },
        { Numero_Proveedor:"PROV-003", RazonSocial:"Distribuidora de Partes para Tractor Mares", RFC:"DPT180605EF7", Contacto:"Sr. Carlos Mares", Correo:"cmares@partestractor.mx", Telefono:"687-321-0987", Direccion:"Av. del Campo 88", Ciudad:"Los Mochis", Estado_Prov:"Sinaloa", CodigoPostal:"81200", Estado:"Activo" },
    ]);
    console.log(proveedores.length + " proveedores insertados");

    const productos = await Producto.insertMany([
        { Numero:"PROD-001", Numero_Origen:"REF-001", Nombre:"Filtro de Aceite para Tractor John Deere",     Descripcion:"Filtro blindado de aceite motor diésel agrícola", Stock:120, Precio_Compra:180, Precio_venta:280, Estado:"Activo" },
        { Numero:"PROD-002", Numero_Origen:"REF-002", Nombre:"Aceite Multigrado 15W-40 Diésel (Cubeta 19L)",  Descripcion:"Lubricante para motores diésel de alto rendimiento", Stock:85,  Precio_Compra:1150, Precio_venta:1490, Estado:"Activo" },
        { Numero:"PROD-003", Numero_Origen:"REF-003", Nombre:"Filtro de Combustible Primario / Secundario", Descripcion:"Separador de agua y trampas de impurezas diésel",  Stock:200, Precio_Compra:195, Precio_venta:295, Estado:"Activo" },
        { Numero:"PROD-004", Numero_Origen:"REF-004", Nombre:"Aceite Hidráulico y Transmisión Tractor (20L)", Descripcion:"Aceite THGF especializado para sistemas hidráulicos", Stock:150, Precio_Compra:1210, Precio_venta:1565, Estado:"Activo" },
        { Numero:"PROD-005", Numero_Origen:"REF-005", Nombre:"Bomba de Agua para Tractor New Holland",        Descripcion:"Ensamble completo de bomba con empacadura de sello", Stock:60,  Precio_Compra:1420, Precio_venta:1880, Estado:"Activo" },
        { Numero:"PROD-006", Numero_Origen:"REF-006", Nombre:"Banda de Alternador y Ventilador de Tractor",  Descripcion:"Banda automotriz reforzada para maquinaria agrícola", Stock:90,  Precio_Compra:175, Precio_venta:275, Estado:"Activo" },
        { Numero:"PROD-007", Numero_Origen:"REF-007", Nombre:"Juego de Baleros y Retenes de Flecha Trasera", Description:"Kit de rodamientos de alta resistencia para eje",      Stock:75,  Precio_Compra:640, Precio_venta:890, Estado:"Activo" },
        { Numero:"PROD-008", Numero_Origen:"REF-008", Nombre:"Filtro de Aire Primario Massey Ferguson",       Descripcion:"Cartucho de aire cilíndrico de alta eficiencia",     Stock:25,  Precio_Compra:450, Precio_venta:680, Estado:"Activo" },
    ]);
    console.log(productos.length + " productos insertados");

    const clientes = await Cliente.insertMany([
        { Numero_Cliente:"CLI-001", NombreCompleto:"Ejido El Progreso",                         Correo:"elprogreso@ejido.mx",      Telefono:"687-111-2233", Estado:"Activo" },
        { Numero_Cliente:"CLI-002", NombreCompleto:"Rancho Las Palmas S.P.R.",                  Correo:"laspalmas@rancho.com",     Telefono:"687-444-5566", Estado:"Activo" },
        { Numero_Cliente:"CLI-003", NombreCompleto:"Jorge Luis Valdez Moreno",                  Correo:"jvaldez@gmail.com",        Telefono:"687-777-8899", Estado:"Activo" },
        { Numero_Cliente:"CLI-004", NombreCompleto:"Sociedad de Produccion Agricola Rio Verde",  Correo:"rioverde.spa@hotmail.com", Telefono:"614-222-3344", Estado:"Activo" },
        { Numero_Cliente:"CLI-005", NombreCompleto:"Ana Maria Soto Guerrero",                   Correo:"asoto@correo.mx",          Telefono:"667-555-6677", Estado:"Activo" },
    ]);
    console.log(clientes.length + " clientes insertados");

    await Compra.insertMany([
        { Id_Proveedor:proveedores[0]._id, Tipodedocumento:"Factura",   Folio:"COMP-0001", MontoTotal:38000, FechaRegistro:new Date("2026-08-05"), Detalles:[{ Id_Producto:productos[0]._id, Precio_Compra:380, Precio_venta:520, Stock:100, MontoTotal:38000 }] },
        { Id_Proveedor:proveedores[1]._id, Tipodedocumento:"Factura",   Folio:"COMP-0002", MontoTotal:86750, FechaRegistro:new Date("2026-08-12"), Detalles:[{ Id_Producto:productos[1]._id, Precio_Compra:650, Precio_venta:890, Stock:85, MontoTotal:55250 },{ Id_Producto:productos[4]._id, Precio_Compra:420, Precio_venta:580, Stock:75, MontoTotal:31500 }] },
        { Id_Proveedor:proveedores[2]._id, Tipodedocumento:"Remision",  Folio:"COMP-0003", MontoTotal:49750, FechaRegistro:new Date("2026-08-20"), Detalles:[{ Id_Producto:productos[2]._id, Precio_Compra:95, Precio_venta:145, Stock:200, MontoTotal:19000 },{ Id_Producto:productos[3]._id, Precio_Compra:110, Precio_venta:165, Stock:150, MontoTotal:16500 },{ Id_Producto:productos[5]._id, Precio_Compra:75, Precio_venta:115, Stock:190, MontoTotal:14250 }] },
    ]);
    console.log("3 compras insertadas");

    await Venta.insertMany([
        { Nombre_Cliente:clientes[0].NombreCompleto, Numero_Cliente:clientes[0].Numero_Cliente, Tipodedocumento:"Factura",  Folio:"VTA-0001", MontoTotal:7300,  MontoPago:8000,  MontoCambio:700,  FechaRegistro:new Date("2026-08-10"), Detalles:[{ Id_Producto:productos[0]._id, Precio_Venta:520, Cantidad:10, MontoTotal:5200 },{ Id_Producto:productos[2]._id, Precio_Venta:145, Cantidad:14, MontoTotal:2030 }] },
        { Nombre_Cliente:clientes[1].NombreCompleto, Numero_Cliente:clientes[1].Numero_Cliente, Tipodedocumento:"Remision", Folio:"VTA-0002", MontoTotal:8020,  MontoPago:8020,  MontoCambio:0,    FechaRegistro:new Date("2026-08-15"), Detalles:[{ Id_Producto:productos[1]._id, Precio_Venta:890, Cantidad:5, MontoTotal:4450 },{ Id_Producto:productos[4]._id, Precio_Venta:580, Cantidad:6, MontoTotal:3480 }] },
        { Nombre_Cliente:clientes[2].NombreCompleto, Numero_Cliente:clientes[2].Numero_Cliente, Tipodedocumento:"Ticket",   Folio:"VTA-0003", MontoTotal:1160,  MontoPago:1200,  MontoCambio:40,   FechaRegistro:new Date("2026-08-18"), Detalles:[{ Id_Producto:productos[3]._id, Precio_Venta:165, Cantidad:4, MontoTotal:660 },{ Id_Producto:productos[5]._id, Precio_Venta:115, Cantidad:4, MontoTotal:460 }] },
        { Nombre_Cliente:clientes[3].NombreCompleto, Numero_Cliente:clientes[3].Numero_Cliente, Tipodedocumento:"Factura",  Folio:"VTA-0004", MontoTotal:15200, MontoPago:15200, MontoCambio:0,    FechaRegistro:new Date("2026-08-25"), Detalles:[{ Id_Producto:productos[0]._id, Precio_Venta:520, Cantidad:20, MontoTotal:10400 },{ Id_Producto:productos[6]._id, Precio_Venta:600, Cantidad:8, MontoTotal:4800 }] },
        { Nombre_Cliente:clientes[4].NombreCompleto, Numero_Cliente:clientes[4].Numero_Cliente, Tipodedocumento:"Ticket",   Folio:"VTA-0005", MontoTotal:1560,  MontoPago:2000,  MontoCambio:440,  FechaRegistro:new Date("2026-08-28"), Detalles:[{ Id_Producto:productos[7]._id, Precio_Venta:520, Cantidad:2, MontoTotal:1040 },{ Id_Producto:productos[2]._id, Precio_Venta:145, Cantidad:4, MontoTotal:580 }] },
    ]);
    console.log("5 ventas insertadas");

    console.log("\n SEED COMPLETO: 8 productos | 3 proveedores | 5 clientes | 3 compras | 5 ventas\n");
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => { console.error("ERROR:", err.message); process.exit(1); });
