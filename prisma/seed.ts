import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Criar empresa
    console.log('🏢 Criando empresa...');
    const company = await prisma.company.create({
      data: {
        name: 'Empresa Demo',
      },
    });
    console.log('✅ Empresa criada:', company);

    // 2. Criar setor padrão
    console.log('\n📋 Criando setor...');
    const sector = await prisma.sector.create({
      data: {
        name: 'Atendimento Geral',
        description: 'Setor padrão para atendimentos',
        active: true,
      },
    });
    console.log('✅ Setor criado:', sector);

    // 3. Criar usuário administrador
    console.log('\n👤 Criando usuário admin...');
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@empresa.com',
        password: 'admin',
        phone: '5585999999999',
        active: true,
        sector: {
          connect: {
            id: sector.id,
          },
        },
        company: {
          connect: {
            id: company.id,
          },
        },
      },
    });
    console.log('✅ Admin criado:', admin);

    // 4. Criar template de mensagem padrão
    console.log('\n📝 Criando template de mensagem...');
    const template = await prisma.modelMetaMessage.create({
      data: {
        name: 'Mensagem de Boas-vindas',
        category: 'welcome',
        language: 'pt_BR',
        contentJson: {
          header: 'Bem-vindo ao Atendimento',
          body: 'Olá {{1}}, como posso ajudar?',
          footer: 'Atendimento Automático',
        },
        active: true,
        company: {
          connect: {
            id: company.id,
          },
        },
      },
    });
    console.log('✅ Template criado:', template);

    console.log('\n🎉 Seed executado com sucesso!');
    console.log('📊 Resumo:');
    console.log('- Empresa ID:', company.id);
    console.log('- Setor ID:', sector.id);
    console.log('- Admin ID:', admin.id);
    console.log('- Template ID:', template.id);
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
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
