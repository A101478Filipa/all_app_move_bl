import { Gender, MeasurementUnit, MeasurementType, UserRole, MedicationStatus, PathologyStatus } from '@prisma/client';
import prisma from '../src/prisma';
import bcrypt from 'bcryptjs';
import { roleDefaultAvatarUrl } from '../src/utils/defaultAvatarHelper';

async function main() {
  // Truncate all tables and reset identity sequences before re-seeding
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Institution", "Device", "Address" RESTART IDENTITY CASCADE`;

  const hashPassword = async (password: string) => bcrypt.hash(password, 10);

  const usersData = [
    ...Array.from({ length: 10 }, (_, i) => ({ username: `elderly${i + 1}`, email: `elderly${i + 1}@example.com`, password: '1234567a.', role: UserRole.ELDERLY })),
    ...Array.from({ length: 6 }, (_, i) => ({ username: `caregiver${i + 1}`, email: `caregiver${i + 1}@example.com`, password: '1234567a.', role: UserRole.CAREGIVER })),
  ];

  for (const user of usersData) {
    const hashedPassword = await hashPassword(user.password);
    await prisma.user.create({
      data: { username: user.username, email: user.email, password: hashedPassword, role: user.role, avatarUrl: roleDefaultAvatarUrl(user.role) },
    });
  }

  await prisma.institution.createMany({
    data: [
      { name: 'HealthCare Center', nickname: 'HCC', address: 'Barcelos', phone: '123-456-7890', email: 'contact@hcc.com', website: 'www.hcc.com' },
      { name: 'Senior Care Home', nickname: 'SCH', address: 'Braga', phone: '987-654-3210', email: 'info@sch.com', website: 'www.sch.com' },
    ],
  });

  await prisma.elderly.createMany({
    data: [
      { userId: 1, medicalId: 1001, name: 'John Doe', institutionId: 1, birthDate: new Date('1945-05-15'), gender: Gender.FEMALE, address: '123 Main St', phone: '123-555-7890', emergencyContact: '111-222-3333' },
      { userId: 2, medicalId: 1002, name: 'Jane Roe', institutionId: 2, birthDate: new Date('1938-10-21'), gender: Gender.FEMALE, address: '456 Oak St', phone: '987-555-4321', emergencyContact: '444-555-6666' },
      { userId: 3, medicalId: 1003, name: 'Michael Smith', institutionId: 1, birthDate: new Date('1943-07-08'), gender: Gender.MALE, address: '789 Pine St', phone: '222-555-6789', emergencyContact: '555-666-7777' },
      { userId: 4, medicalId: 1004, name: 'Susan Johnson', institutionId: 2, birthDate: new Date('1939-09-15'), gender: Gender.FEMALE, address: '123 Main St', phone: '333-555-8888', emergencyContact: '888-999-0000' },
      { userId: 5, medicalId: 1005, name: 'Robert Brown', institutionId: 1, birthDate: new Date('1947-11-22'), gender: Gender.MALE, address: '456 Oak St', phone: '444-555-9999', emergencyContact: '222-333-4444' },
      { userId: 6, medicalId: 1006, name: 'Linda Green', institutionId: 2, birthDate: new Date('1942-06-10'), gender: Gender.FEMALE, address: '789 Pine St', phone: '555-555-1010', emergencyContact: '777-888-9999' },
      { userId: 7, medicalId: 1007, name: 'David White', institutionId: 1, birthDate: new Date('1940-02-18'), gender: Gender.MALE, address: '123 Main St', phone: '666-555-1111', emergencyContact: '333-444-5555' },
      { userId: 8, medicalId: 1008, name: 'Barbara Adams', institutionId: 2, birthDate: new Date('1936-04-05'), gender: Gender.FEMALE, address: '456 Oak St', phone: '777-555-1212', emergencyContact: '111-222-3333' },
      { userId: 9, medicalId: 1009, name: 'James Wilson', institutionId: 1, birthDate: new Date('1949-08-25'), gender: Gender.MALE, address: '789 Pine St', phone: '888-555-1313', emergencyContact: '555-666-7777' },
      { userId: 10, medicalId: 1010, name: 'Patricia Clark', institutionId: 2, birthDate: new Date('1937-12-30'), gender: Gender.FEMALE, address: '123 Main St', phone: '999-555-1414', emergencyContact: '999-000-1111' },
    ],
  });

  await prisma.caregiver.createMany({
    data: [
      { userId: 11, name: 'Alice Thompson', gender: Gender.FEMALE, institutionId: 1, phone: '111-222-3333', birthDate: new Date('1940-02-18') },
      { userId: 12, name: 'Mark Evans', gender: Gender.MALE, institutionId: 1, phone: '222-333-4444', birthDate: new Date('1940-02-18') },
      { userId: 13, name: 'Nancy Lewis', gender: Gender.FEMALE, institutionId: 1, phone: '333-444-5555', birthDate: new Date('1940-02-18') },
      { userId: 14, name: 'Steven Martinez', gender: Gender.MALE, institutionId: 2, phone: '444-555-6666', birthDate: new Date('1940-02-18') },
      { userId: 15, name: 'Rachel Turner', gender: Gender.FEMALE, institutionId: 2, phone: '555-666-7777', birthDate: new Date('1940-02-18') },
      { userId: 16, name: 'Thomas Scott', gender: Gender.MALE, institutionId: 2, phone: '666-777-8888', birthDate: new Date('1940-02-18') },
    ],
  });

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin1',
      email: 'pedro.admin@example.com',
      password: await hashPassword('1234567a.'),
      role: UserRole.INSTITUTION_ADMIN,
      avatarUrl: roleDefaultAvatarUrl(UserRole.INSTITUTION_ADMIN)
    },
  });
  await prisma.institutionAdmin.create({
    data: {
      userId: adminUser.id,
      institutionId: 1,
      name: 'Pedro Lopes',
      gender: Gender.MALE,
      birthDate: new Date('1940-02-18'),
    }
  });

  await prisma.device.createMany({
    data: [
      { name: 'Heart Rate Monitor', type: 'Medical', serialNumber: 'HRM123456', status: 'Active', lastMaintenance: new Date('2024-01-15') },
      { name: 'Fall Detector', type: 'Safety', serialNumber: 'FD789101', status: 'Active', lastMaintenance: new Date('2024-02-10') },
    ],
  });

  await prisma.session.createMany({
    data: [
      { deviceId: 1, elderlyId: 1, initiatedById: 2, startTime: new Date('2024-03-01T08:00:00'), endTime: new Date('2024-03-01T09:00:00') },
      { deviceId: 2, elderlyId: 2, initiatedById: 3, startTime: new Date('2024-03-02T10:00:00'), endTime: new Date('2024-03-02T11:00:00') },
    ],
  });

  await prisma.assessment.createMany({
    data: [
      { elderlyId: 1, performedByUserId: 3, registeredByUserId: 4 },
      { elderlyId: 2, performedByUserId: 3, registeredByUserId: 4 },
    ],
  });

  await prisma.medication.createMany({
    data: [
      {
        elderlyId: 1,
        registeredById: 3,
        name: 'Aspirin',
        activeIngredient: 'Acetylsalicylic Acid',
        dosage: '75mg',
        frequency: 'Once daily',
        administration: 'Oral',
        startDate: new Date('2024-02-01'),
        endDate: null,
        status: MedicationStatus.ACTIVE,
        notes: 'For blood thinning',
      },
      {
        elderlyId: 2,
        registeredById: 3,
        name: 'Metformin',
        activeIngredient: 'Metformin Hydrochloride',
        dosage: '500mg',
        frequency: 'Twice daily',
        administration: 'Oral',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-07-15'),
        status: MedicationStatus.COMPLETED,
        notes: 'For diabetes control',
      },
      {
        elderlyId: 3,
        registeredById: 11,
        name: 'Lisinopril',
        activeIngredient: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        administration: 'Oral',
        startDate: new Date('2024-03-01'),
        endDate: null,
        status: MedicationStatus.ACTIVE,
        notes: 'For blood pressure control',
      },
      {
        elderlyId: 4,
        registeredById: 12,
        name: 'Atorvastatin',
        activeIngredient: 'Atorvastatin Calcium',
        dosage: '20mg',
        frequency: 'Once daily',
        administration: 'Oral',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-01'),
        status: MedicationStatus.DISCONTINUED,
        notes: 'Discontinued due to side effects',
      },
      {
        elderlyId: 5,
        registeredById: 13,
        name: 'Omeprazole',
        activeIngredient: 'Omeprazole',
        dosage: '20mg',
        frequency: 'Once daily',
        administration: 'Oral',
        startDate: new Date('2024-02-15'),
        endDate: null,
        status: MedicationStatus.PAUSED,
        notes: 'Temporarily paused for evaluation',
      },
      {
        elderlyId: 6,
        registeredById: 14,
        name: 'Warfarin',
        activeIngredient: 'Warfarin Sodium',
        dosage: '5mg',
        frequency: 'Once daily',
        administration: 'Oral',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-03-01'),
        status: MedicationStatus.INACTIVE,
        notes: 'Switched to different anticoagulant',
      },
    ],
  });

  await prisma.measurement.createMany({
    data: [
      { elderlyId: 1, type: MeasurementType.WEIGHT, value: 72.5, unit: MeasurementUnit.KILOGRAMS, notes: 'Normal range' },
      { elderlyId: 1, type: MeasurementType.WEIGHT, value: 75.5, unit: MeasurementUnit.KILOGRAMS, notes: 'Normal range' },
      { elderlyId: 1, type: MeasurementType.WEIGHT, value: 73.5, unit: MeasurementUnit.KILOGRAMS, notes: 'Normal range' },
      { elderlyId: 1, type: MeasurementType.HEIGHT, value: 165, unit: MeasurementUnit.CENTIMETERS, notes: 'Slightly decreased since last year' },
      { elderlyId: 1, type: MeasurementType.BALANCE_SCORE, value: 25.7, unit: MeasurementUnit.POINTS, notes: 'Weak balance score' },
      { elderlyId: 1, type: MeasurementType.COGNITIVE_SCORE, value: 1.8, unit: MeasurementUnit.POINTS, notes: 'Cognitive assessment score' },
      { elderlyId: 2, type: MeasurementType.BLOOD_PRESSURE_SYSTOLIC, value: 140, unit: MeasurementUnit.MMHG, notes: 'Elevated systolic pressure' },
      { elderlyId: 2, type: MeasurementType.BLOOD_PRESSURE_DIASTOLIC, value: 90, unit: MeasurementUnit.MMHG, notes: 'Elevated diastolic pressure' },
      { elderlyId: 2, type: MeasurementType.HEART_RATE, value: 78, unit: MeasurementUnit.BPM, notes: 'Normal resting heart rate' },
      { elderlyId: 2, type: MeasurementType.BLOOD_GLUCOSE, value: 145, unit: MeasurementUnit.POINTS, notes: 'Slightly elevated glucose levels' },
      { elderlyId: 3, type: MeasurementType.WEIGHT, value: 68.2, unit: MeasurementUnit.KILOGRAMS, notes: 'Weight loss noted' },
      { elderlyId: 3, type: MeasurementType.HEIGHT, value: 172, unit: MeasurementUnit.CENTIMETERS, notes: 'Stable height measurement' },
      { elderlyId: 3, type: MeasurementType.OXYGEN_SATURATION, value: 96, unit: MeasurementUnit.PERCENTAGE, notes: 'Good oxygen saturation' },
      { elderlyId: 3, type: MeasurementType.BODY_TEMPERATURE, value: 36.8, unit: MeasurementUnit.POINTS, notes: 'Normal body temperature' },
      { elderlyId: 4, type: MeasurementType.MOBILITY_SCORE, value: 8, unit: MeasurementUnit.POINTS, notes: 'Good mobility for age' },
      { elderlyId: 4, type: MeasurementType.BALANCE_SCORE, value: 12, unit: MeasurementUnit.POINTS, notes: 'Moderate balance issues' },
      { elderlyId: 4, type: MeasurementType.HEART_RATE, value: 85, unit: MeasurementUnit.BPM, notes: 'Slightly elevated resting HR' },
      { elderlyId: 5, type: MeasurementType.BLOOD_PRESSURE_SYSTOLIC, value: 120, unit: MeasurementUnit.MMHG, notes: 'Normal systolic pressure' },
      { elderlyId: 5, type: MeasurementType.BLOOD_PRESSURE_DIASTOLIC, value: 80, unit: MeasurementUnit.MMHG, notes: 'Normal diastolic pressure' },
      { elderlyId: 5, type: MeasurementType.WEIGHT, value: 82.1, unit: MeasurementUnit.KILOGRAMS, notes: 'Stable weight' },
    ],
  });

  await prisma.pathology.createMany({
    data: [
      {
        elderlyId: 1,
        registeredById: 11,
        name: 'Hypertension',
        description: 'High blood pressure',
        diagnosisSite: 'HealthCare Center Cardiology',
        diagnosisDate: new Date('2023-06-15'),
        status: PathologyStatus.ACTIVE,
        notes: 'Patient is on medication for blood pressure control',
      },
      {
        elderlyId: 2,
        registeredById: 12,
        name: 'Diabetes Type 2',
        description: 'Type 2 diabetes mellitus',
        diagnosisSite: 'Senior Care Home Medical Unit',
        diagnosisDate: new Date('2022-08-20'),
        status: PathologyStatus.UNDER_TREATMENT,
        notes: 'Blood sugar levels being monitored daily',
      },
      {
        elderlyId: 3,
        registeredById: 13,
        name: 'Osteoarthritis',
        description: 'Degenerative joint disease affecting knees',
        diagnosisSite: 'Orthopedic Clinic Braga',
        diagnosisDate: new Date('2021-11-10'),
        status: PathologyStatus.CHRONIC,
        notes: 'Patient manages pain with physical therapy',
      },
      {
        elderlyId: 4,
        registeredById: 14,
        name: 'Cataracts',
        description: 'Bilateral cataracts affecting vision',
        diagnosisSite: 'Eye Clinic Barcelos',
        diagnosisDate: new Date('2023-03-05'),
        status: PathologyStatus.RESOLVED,
        notes: 'Successfully treated with surgery in both eyes',
      },
      {
        elderlyId: 5,
        registeredById: 15,
        name: 'Depression',
        description: 'Major depressive disorder',
        diagnosisSite: 'Mental Health Unit',
        diagnosisDate: new Date('2023-09-12'),
        status: PathologyStatus.MONITORING,
        notes: 'Patient responding well to therapy and medication',
      },
      {
        elderlyId: 6,
        registeredById: 16,
        name: 'Atrial Fibrillation',
        description: 'Irregular heart rhythm',
        diagnosisSite: 'Cardiology Department',
        diagnosisDate: new Date('2022-12-03'),
        status: PathologyStatus.INACTIVE,
        notes: 'Condition stabilized with medication adjustments',
      },
    ],
  });

  await prisma.fallOccurrence.createMany({
    data: [
      {
        elderlyId: 1,
        date: new Date('2024-10-27T14:30:00'),
        description: 'Patient fell while walking to the bathroom',
        preActivity: 'Walking unassisted',
        direction: 'Forward',
        environment: 'Bathroom hallway',
        injured: false,
        handlerUserId: null,
      },
      {
        elderlyId: 3,
        date: new Date('2024-10-27T09:15:00'),
        description: 'Slip on wet floor in dining area',
        preActivity: 'Walking to breakfast table',
        direction: 'Sideways',
        environment: 'Dining room',
        injured: true,
        injuryDescription: 'Minor bruise on left arm',
        handlerUserId: null,
      },
      {
        elderlyId: 5,
        date: new Date('2024-10-26T20:45:00'),
        description: 'Lost balance getting out of bed',
        preActivity: 'Standing up from bed',
        direction: 'Backward',
        environment: 'Bedroom',
        injured: false,
        handlerUserId: null,
      },
      {
        elderlyId: 2,
        date: new Date('2024-10-25T16:20:00'),
        description: 'Tripped over wheelchair footrest',
        recovery: 'Assisted by caregiver, helped to chair',
        preActivity: 'Transferring from wheelchair',
        postActivity: 'Rested in chair for 30 minutes',
        direction: 'Forward',
        environment: 'Physical therapy room',
        injured: true,
        injuryDescription: 'Small cut on knee, bandaged',
        measuresTaken: 'Wound cleaned and bandaged, incident reported, family notified',
        handlerUserId: 11,
      },
      {
        elderlyId: 4,
        date: new Date('2024-10-24T11:30:00'),
        description: 'Fainted and fell during morning exercises',
        recovery: 'Regained consciousness within 2 minutes, vitals checked',
        preActivity: 'Light exercise routine',
        postActivity: 'Bed rest for remainder of day',
        direction: 'Backward',
        environment: 'Exercise room',
        injured: false,
        measuresTaken: 'Vitals monitored, doctor consulted, exercise routine adjusted',
        handlerUserId: 12,
      },
      {
        elderlyId: 6,
        date: new Date('2024-10-23T13:45:00'),
        description: 'Stumbled while using walker',
        recovery: 'Caregiver helped patient up immediately',
        preActivity: 'Walking with walker assistance',
        postActivity: 'Continued activities with increased supervision',
        direction: 'Forward',
        environment: 'Main corridor',
        injured: false,
        measuresTaken: 'Walker height adjusted, mobility assessment scheduled',
        handlerUserId: 13,
      },
      {
        elderlyId: 7,
        date: new Date('2024-10-22T08:10:00'),
        description: 'Slipped getting out of shower',
        recovery: 'Staff assisted immediately, no injuries sustained',
        preActivity: 'Exiting shower',
        postActivity: 'Dried off and dressed with assistance',
        direction: 'Sideways',
        environment: 'Bathroom shower',
        injured: false,
        measuresTaken: 'Non-slip mats installed, shower schedule adjusted for safer times',
        handlerUserId: 14,
      },
      {
        elderlyId: 8,
        date: new Date('2024-10-21T19:00:00'),
        description: 'Lost balance reaching for item on high shelf',
        recovery: 'Helped to sitting position, checked for injuries',
        preActivity: 'Reaching for personal item',
        postActivity: 'Items reorganized to accessible height',
        direction: 'Backward',
        environment: 'Personal room',
        injured: true,
        injuryDescription: 'Minor back strain',
        measuresTaken: 'Pain medication administered, physiotherapy consultation arranged',
        handlerUserId: 15,
      },
    ],
  });

  const clinicianUser = await prisma.user.create({
    data: {
      username: 'clinician1',
      email: 'maria.santos@example.com',
      password: await hashPassword('1234567a.'),
      role: UserRole.CLINICIAN,
      avatarUrl: roleDefaultAvatarUrl(UserRole.CLINICIAN)
    },
  });

  const clinician = await prisma.clinician.create({
    data: {
      userId: clinicianUser.id,
      name: 'Dr. Maria Santos',
      phone: '912-345-678',
      gender: Gender.FEMALE,
      birthDate: new Date('1980-03-15'),
      institutionId: 1
    },
  });

  const programmerUser = await prisma.user.create({
    data: {
      username: 'filipacosta',
      email: 'filipacosta1108@gmail.com',
      password: await hashPassword('1234567a.'),
      role: UserRole.PROGRAMMER,
      avatarUrl: roleDefaultAvatarUrl(UserRole.PROGRAMMER)
    },
  });

  await prisma.programmer.create({
    data: {
      userId: programmerUser.id,
      name: 'Filipa Costa',
      gender: Gender.FEMALE,
      phoneNumber: '+351938238187',
      createdAt: new Date(),
    },
  });

  await prisma.dataAccessRequest.create({
    data: {
      clinicianId: clinician.id,
      elderlyId: 1,
      status: 'APPROVED',
      notes: 'Requesting access to patient medical records for ongoing treatment',
      requestedAt: new Date('2024-10-20T10:00:00'),
      respondedAt: new Date('2024-10-20T14:30:00'),
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    (globalThis as any).process?.exit?.(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
