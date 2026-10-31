const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
require("dotenv").config();

const ensureAdminUser = async () => {
  try {
    const admin = await Usuario.findOne({ Usuario: "admin" });
    if (!admin) {
      const newAdmin = new Usuario({
        Matricula_Usuario: "ADM-PRIMARY",
        Nombre_completo: "Administrador Principal",
        Usuario: "admin",
        Clave: "admin123",
        Rol: "Administrador"
      });
      await newAdmin.save();
      console.log("[Auth] Usuario administrador creado por defecto (Usuario: admin | Clave: admin123)");
    }
  } catch (err) {
    console.error("[Auth] Error al verificar/crear usuario admin:", err.message);
  }
};

const connectDB = async (retries = 8, delay = 2500) => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/comercial_agricola_db";
  const isCloud = uri.includes("mongodb+srv://") || (!uri.includes("127.0.0.1") && !uri.includes("localhost"));
  
  console.log(`[Base de Datos] Conectando a MongoDB (${isCloud ? "Nube / Remoto" : "Local"})...`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Base de Datos] OK - Conectado exitosamente.`);
      await ensureAdminUser();
      return;
    } catch (error) {
      console.error(`[Base de Datos] Intento ${attempt}/${retries} falló:`, error.message);
      if (attempt < retries) {
        console.log(`[Base de Datos] Reintentando conexión en ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error("\n[ERROR CRÍTICO] No se pudo conectar a la base de datos.");
        if (!isCloud) {
          console.error("  -> Asegúrate de que el servicio local de MongoDB esté iniciado.");
        } else {
          console.error("  -> Verifica tu conexión a Internet o el acceso de red (Network Access IP Whitelist) en MongoDB Atlas.");
        }
      }
    }
  }
};

module.exports = connectDB;
