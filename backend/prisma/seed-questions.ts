import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultQuestions = [
  // Ages 0 - 5 (Early Childhood Welfare)
  {
    minAge: 0,
    maxAge: 5,
    category: 'HEALTH_SAFETY',
    question: 'Does the child receive regular pediatrician check-ups and vaccinations?',
  },
  {
    minAge: 0,
    maxAge: 5,
    category: 'EMOTIONAL_BONDING',
    question: 'How does the child react when seeking comfort or reassurance from parents?',
  },
  {
    minAge: 0,
    maxAge: 5,
    category: 'NUTRITION_CARE',
    question: 'Are there any dietary issues or sleep disturbances observed?',
  },

  // Ages 6 - 10 (Primary School & Socialization)
  {
    minAge: 6,
    maxAge: 10,
    category: 'EDUCATION',
    question: 'How is the child adapting to school, teachers, and classmates?',
  },
  {
    minAge: 6,
    maxAge: 10,
    category: 'EMOTIONAL_BONDING',
    question: 'Do you feel comfortable and happy sharing your daily activities with your family?',
  },
  {
    minAge: 6,
    maxAge: 10,
    category: 'HEALTH_SAFETY',
    question: 'Do you feel safe, cared for, and supported at home?',
  },
  {
    minAge: 6,
    maxAge: 10,
    category: 'SOCIAL_INTERACTION',
    question: 'Does the child participate in extracurricular or community play activities?',
  },

  // Ages 11 - 16 (Adolescence & Development)
  {
    minAge: 11,
    maxAge: 16,
    category: 'EMOTIONAL_BONDING',
    question: 'How openly do you discuss personal challenges or concerns with your parents?',
  },
  {
    minAge: 11,
    maxAge: 16,
    category: 'SAFETY_WELLBEING',
    question: 'Do you feel respected, safe, and emotionally secure in your family environment?',
  },
  {
    minAge: 11,
    maxAge: 16,
    category: 'EDUCATION_GROWTH',
    question: 'What are your goals and interests, and does your family support your aspirations?',
  },
  {
    minAge: 11,
    maxAge: 16,
    category: 'HEALTH_SAFETY',
    question: 'Are there any signs of emotional stress, anxiety, or behavioral changes?',
  },
];

async function seed() {
  console.log('Seeding Post-Adoption Welfare Assessment Questions...');

  const count = await prisma.question.count();
  if (count === 0) {
    await prisma.question.createMany({
      data: defaultQuestions,
    });
    console.log(`Successfully seeded ${defaultQuestions.length} assessment questions.`);
  } else {
    console.log(`Questions table already populated with ${count} questions.`);
  }

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Error seeding questions:', e);
  prisma.$disconnect();
  process.exit(1);
});
