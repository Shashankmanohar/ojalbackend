import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import adminModel from '../Models/adminModel.js';

const SUPERADMIN_CREDENTIALS = {
    adminName: 'Super Admin',
    email: 'admin@ojal.com',
    password: 'admin123456', // Change this after first login!
    role: 'superadmin'
};

async function seedSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if superadmin already exists
        const existingAdmin = await adminModel.findOne({
            email: SUPERADMIN_CREDENTIALS.email
        });

        if (existingAdmin) {
            console.log('⚠️  Superadmin already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            console.log('\nIf you forgot your password, please reset it manually in the database.');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(SUPERADMIN_CREDENTIALS.password, 10);

        // Create superadmin
        const superadmin = await adminModel.create({
            adminName: SUPERADMIN_CREDENTIALS.adminName,
            email: SUPERADMIN_CREDENTIALS.email,
            password: hashedPassword,
            role: SUPERADMIN_CREDENTIALS.role
        });

        console.log('\n✅ Superadmin account created successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email:', SUPERADMIN_CREDENTIALS.email);
        console.log('🔑 Password:', SUPERADMIN_CREDENTIALS.password);
        console.log('👤 Role:', superadmin.role);
        console.log('═══════════════════════════════════════');
        console.log('\n⚠️  IMPORTANT: Please change this password after your first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding superadmin:', error);
        process.exit(1);
    }
}

seedSuperAdmin();
