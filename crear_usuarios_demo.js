const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comercial_agricola_db');
        console.log('--- Creando Usuarios de Prueba ---');

        const usersData = [
            {
                Matricula_Usuario: 'ADM-PRIMARY',
                Nombre_completo: 'Administrador Principal',
                Usuario: 'admin',
                Clave: 'admin123',
                Rol: 'Administrador'
            },
            {
                Matricula_Usuario: 'JEF-001',
                Nombre_completo: 'Jefe de Operaciones y Ventas',
                Usuario: 'jefe',
                Clave: 'jefe123',
                Rol: 'Jefe'
            },
            {
                Matricula_Usuario: 'VEN-001',
                Nombre_completo: 'Vendedor de Mostrador',
                Usuario: 'vendedor',
                Clave: 'vendedor123',
                Rol: 'Vendedor'
            }
        ];

        for (const uData of usersData) {
            let u = await Usuario.findOne({ Usuario: uData.Usuario });
            if (u) {
                u.Clave = uData.Clave;
                u.Rol = uData.Rol;
                u.Nombre_completo = uData.Nombre_completo;
                await u.save();
                console.log(`[OK] Usuario "${uData.Usuario}" (${uData.Rol}) actualizado.`);
            } else {
                u = new Usuario(uData);
                await u.save();
                console.log(`[OK] Usuario "${uData.Usuario}" (${uData.Rol}) creado.`);
            }
        }

        console.log('\nTodos los usuarios de prueba creados exitosamente:');
        console.log(' - Admin:    admin    / admin123');
        console.log(' - Jefe:     jefe     / jefe123');
        console.log(' - Vendedor: vendedor / vendedor123\n');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    seedUsers();
}

module.exports = seedUsers;
