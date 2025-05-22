import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Criar plano padrão
    const defaultPlan = await prisma.plan.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Plano Padrão',
        description: 'Plano inicial do sistema',
        price: 0,
        billingCycle: 'MONTHLY',
        maxUsers: 999999,
        maxDepartments: 999999,
        maxWhatsapp: 999999,
        active: true,
      },
    });

    console.log('Plano padrão criado:', defaultPlan);

    // Criar empresa padrão
    const defaultCompany = await prisma.company.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Empresa Padrão',
        planId: defaultPlan.id,
        active: true,
      },
    });

    console.log('Empresa padrão criada:', defaultCompany);

    // Criar departamento padrão
    const defaultDepartment = await prisma.department.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Geral',
        companyId: defaultCompany.id,
        active: true,
      },
    });

    console.log('Departamento padrão criado:', defaultDepartment);

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    const defaultUser = await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@admin.com',
        password: hashedPassword,
        companyId: defaultCompany.id,
        active: true,
      },
    });

    console.log('Usuário admin criado:', defaultUser);

    // Vincular usuário ao departamento
    const departmentUser = await prisma.departmentUser.create({
      data: {
        userId: defaultUser.id,
        departmentId: defaultDepartment.id,
      },
    });

    console.log('Vínculo usuário-departamento criado:', departmentUser);

    // Criar configuração de horário comercial
    const businessHours = await prisma.businessHours.create({
      data: {
        departmentId: defaultDepartment.id,
        dayOfWeek: 1, // Segunda-feira
        startTime: '09:00',
        endTime: '18:00',
        active: true,
      },
    });

    // Criar horários para os outros dias da semana
    const weekDays = [2, 3, 4, 5]; // Terça a Sexta
    for (const day of weekDays) {
      await prisma.businessHours.create({
        data: {
          departmentId: defaultDepartment.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          active: true,
        },
      });
    }

    // Sábado e Domingo (inativos)
    for (const day of [6, 7]) {
      await prisma.businessHours.create({
        data: {
          departmentId: defaultDepartment.id,
          dayOfWeek: day,
          startTime: '00:00',
          endTime: '00:00',
          active: false,
        },
      });
    }

    console.log('Horários comerciais criados:', businessHours);
  } catch (error) {
    console.error('Erro durante o seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
