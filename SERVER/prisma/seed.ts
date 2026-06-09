import {
  Gender, MeasurementUnit, MeasurementType, UserRole, MedicationStatus,
  PathologyStatus, ActivityType, CalendarEventType, TimeOffType, TimelineActivityType,
  MeasurementStatus,
} from '@prisma/client';
import prisma from '../src/prisma';
import bcrypt from 'bcryptjs';
import { roleDefaultAvatarUrl } from '../src/utils/defaultAvatarHelper';

// ─── helpers ────────────────────────────────────────────────────────────────
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const futureDate = (n: number) => new Date(Date.now() + n * 86_400_000);
const timeOnDate = (d: Date, hh: number, mm: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm);

async function main() {
  // ── wipe & reset ──────────────────────────────────────────────────────────
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Institution", "Device", "Address" RESTART IDENTITY CASCADE`;
  const hp = (pw: string) => bcrypt.hash(pw, 10);

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTITUTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.institution.createMany({
    data: [
      { name: 'HealthCare Center Barcelos', nickname: 'HCC', address: 'Rua das Oliveiras 12, Barcelos', phone: '253-456-789', email: 'geral@hcc.pt', website: 'www.hcc.pt' },
      { name: 'Lar Sénior Braga',           nickname: 'LSB', address: 'Avenida Central 45, Braga',     phone: '253-987-654', email: 'info@lsb.pt',  website: 'www.lsb.pt' },
      { name: 'Centro de Saúde Guimarães',  nickname: 'CSG', address: 'Praça do Município 3, Guimarães', phone: '253-123-456', email: 'csg@sns.pt', website: 'www.csg.pt' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS – Programmer
  // ═══════════════════════════════════════════════════════════════════════════
  const progUser = await prisma.user.create({
    data: { username: 'filipacosta', email: 'filipacosta1108@gmail.com', password: await hp('1234567a.'), role: UserRole.PROGRAMMER, avatarUrl: roleDefaultAvatarUrl(UserRole.PROGRAMMER) },
  });
  await prisma.programmer.create({ data: { userId: progUser.id, name: 'Filipa Costa', gender: Gender.FEMALE, phoneNumber: '+351938238187' } });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS – Institution Admins
  // ═══════════════════════════════════════════════════════════════════════════
  const adminsData = [
    { username: 'admin_hcc',  email: 'pedro.admin@hcc.pt',   name: 'Pedro Lopes',   institutionId: 1, gender: Gender.MALE,   birth: '1978-04-12' },
    { username: 'admin_lsb',  email: 'ana.admin@lsb.pt',     name: 'Ana Ferreira',  institutionId: 2, gender: Gender.FEMALE, birth: '1982-09-30' },
    { username: 'admin_csg',  email: 'joao.admin@csg.pt',    name: 'João Martins',  institutionId: 3, gender: Gender.MALE,   birth: '1975-07-21' },
  ];
  const adminUsers: { id: number; institutionId: number }[] = [];
  for (const a of adminsData) {
    const u = await prisma.user.create({
      data: { username: a.username, email: a.email, password: await hp('1234567a.'), role: UserRole.INSTITUTION_ADMIN, avatarUrl: roleDefaultAvatarUrl(UserRole.INSTITUTION_ADMIN) },
    });
    await prisma.institutionAdmin.create({ data: { userId: u.id, institutionId: a.institutionId, name: a.name, gender: a.gender, birthDate: new Date(a.birth) } });
    adminUsers.push({ id: u.id, institutionId: a.institutionId });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS – Clinicians (3)
  // ═══════════════════════════════════════════════════════════════════════════
  const cliniciansData = [
    { username: 'clinician1', email: 'maria.santos@hcc.pt',  name: 'Dr. Maria Santos',   gender: Gender.FEMALE, birth: '1980-03-15', institutionId: 1, phone: '912-345-678' },
    { username: 'clinician2', email: 'rui.monteiro@lsb.pt',  name: 'Dr. Rui Monteiro',   gender: Gender.MALE,   birth: '1975-11-22', institutionId: 2, phone: '913-456-789' },
    { username: 'clinician3', email: 'sofia.andrade@csg.pt', name: 'Dra. Sofia Andrade', gender: Gender.FEMALE, birth: '1985-06-08', institutionId: 3, phone: '914-567-890' },
  ];
  const clinicianProfiles: { id: number; userId: number; institutionId: number }[] = [];
  for (const c of cliniciansData) {
    const u = await prisma.user.create({
      data: { username: c.username, email: c.email, password: await hp('1234567a.'), role: UserRole.CLINICIAN, avatarUrl: roleDefaultAvatarUrl(UserRole.CLINICIAN) },
    });
    const cl = await prisma.clinician.create({ data: { userId: u.id, name: c.name, gender: c.gender, birthDate: new Date(c.birth), institutionId: c.institutionId, phone: c.phone } });
    clinicianProfiles.push({ id: cl.id, userId: u.id, institutionId: c.institutionId });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS – Caregivers (9 – 3 per institution)
  // ═══════════════════════════════════════════════════════════════════════════
  const caregiversRaw = [
    { username: 'caregiver1', email: 'alice.thompson@hcc.pt',  name: 'Alice Thompson',  gender: Gender.FEMALE, birth: '1988-02-14', institutionId: 1, phone: '919-111-111' },
    { username: 'caregiver2', email: 'mark.evans@hcc.pt',      name: 'Mark Evans',      gender: Gender.MALE,   birth: '1985-07-07', institutionId: 1, phone: '919-222-222' },
    { username: 'caregiver3', email: 'nancy.lewis@hcc.pt',     name: 'Nancy Lewis',     gender: Gender.FEMALE, birth: '1990-11-25', institutionId: 1, phone: '919-333-333' },
    { username: 'caregiver4', email: 'steven.martinez@lsb.pt', name: 'Steven Martinez', gender: Gender.MALE,   birth: '1983-04-19', institutionId: 2, phone: '919-444-444' },
    { username: 'caregiver5', email: 'rachel.turner@lsb.pt',   name: 'Rachel Turner',   gender: Gender.FEMALE, birth: '1991-08-30', institutionId: 2, phone: '919-555-555' },
    { username: 'caregiver6', email: 'thomas.scott@lsb.pt',    name: 'Thomas Scott',    gender: Gender.MALE,   birth: '1987-01-03', institutionId: 2, phone: '919-666-666' },
    { username: 'caregiver7', email: 'laura.reis@csg.pt',      name: 'Laura Reis',      gender: Gender.FEMALE, birth: '1992-06-17', institutionId: 3, phone: '919-777-777' },
    { username: 'caregiver8', email: 'paulo.costa@csg.pt',     name: 'Paulo Costa',     gender: Gender.MALE,   birth: '1986-09-12', institutionId: 3, phone: '919-888-888' },
    { username: 'caregiver9', email: 'ines.carvalho@csg.pt',   name: 'Ines Carvalho',   gender: Gender.FEMALE, birth: '1993-03-28', institutionId: 3, phone: '919-999-999' },
  ];
  const caregiverUsers: { id: number; caregiverId: number; institutionId: number }[] = [];
  for (const c of caregiversRaw) {
    const u = await prisma.user.create({
      data: { username: c.username, email: c.email, password: await hp('1234567a.'), role: UserRole.CAREGIVER, avatarUrl: roleDefaultAvatarUrl(UserRole.CAREGIVER) },
    });
    const cg = await prisma.caregiver.create({ data: { userId: u.id, name: c.name, gender: c.gender, institutionId: c.institutionId, phone: c.phone, birthDate: new Date(c.birth) } });
    caregiverUsers.push({ id: u.id, caregiverId: cg.id, institutionId: c.institutionId });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS – Elderly (15 – 5 per institution)
  // ═══════════════════════════════════════════════════════════════════════════
  const elderlyRaw = [
    { username: 'elderly1',  email: 'john.doe@hcc-res.pt',        name: 'John Doe',       institutionId: 1, birth: '1945-05-15', gender: Gender.MALE,   medId: 1001, phone: '253-100-001', emergency: '253-200-001', floor: 1 },
    { username: 'elderly2',  email: 'jane.roe@hcc-res.pt',        name: 'Jane Roe',       institutionId: 1, birth: '1938-10-21', gender: Gender.FEMALE, medId: 1002, phone: '253-100-002', emergency: '253-200-002', floor: 1 },
    { username: 'elderly3',  email: 'michael.smith@hcc-res.pt',   name: 'Michael Smith',  institutionId: 1, birth: '1943-07-08', gender: Gender.MALE,   medId: 1003, phone: '253-100-003', emergency: '253-200-003', floor: 2 },
    { username: 'elderly4',  email: 'susan.johnson@hcc-res.pt',   name: 'Susan Johnson',  institutionId: 1, birth: '1939-09-15', gender: Gender.FEMALE, medId: 1004, phone: '253-100-004', emergency: '253-200-004', floor: 2 },
    { username: 'elderly5',  email: 'robert.brown@hcc-res.pt',    name: 'Robert Brown',   institutionId: 1, birth: '1947-11-22', gender: Gender.MALE,   medId: 1005, phone: '253-100-005', emergency: '253-200-005', floor: 3 },
    { username: 'elderly6',  email: 'linda.green@lsb-res.pt',     name: 'Linda Green',    institutionId: 2, birth: '1942-06-10', gender: Gender.FEMALE, medId: 1006, phone: '253-100-006', emergency: '253-200-006', floor: 1 },
    { username: 'elderly7',  email: 'david.white@lsb-res.pt',     name: 'David White',    institutionId: 2, birth: '1940-02-18', gender: Gender.MALE,   medId: 1007, phone: '253-100-007', emergency: '253-200-007', floor: 1 },
    { username: 'elderly8',  email: 'barbara.adams@lsb-res.pt',   name: 'Barbara Adams',  institutionId: 2, birth: '1936-04-05', gender: Gender.FEMALE, medId: 1008, phone: '253-100-008', emergency: '253-200-008', floor: 2 },
    { username: 'elderly9',  email: 'james.wilson@lsb-res.pt',    name: 'James Wilson',   institutionId: 2, birth: '1949-08-25', gender: Gender.MALE,   medId: 1009, phone: '253-100-009', emergency: '253-200-009', floor: 2 },
    { username: 'elderly10', email: 'patricia.clark@lsb-res.pt',  name: 'Patricia Clark', institutionId: 2, birth: '1937-12-30', gender: Gender.FEMALE, medId: 1010, phone: '253-100-010', emergency: '253-200-010', floor: 3 },
    { username: 'elderly11', email: 'carlos.sousa@csg-res.pt',    name: 'Carlos Sousa',   institutionId: 3, birth: '1935-03-22', gender: Gender.MALE,   medId: 1011, phone: '253-100-011', emergency: '253-200-011', floor: 1 },
    { username: 'elderly12', email: 'maria.oliveira@csg-res.pt',  name: 'Maria Oliveira', institutionId: 3, birth: '1941-07-14', gender: Gender.FEMALE, medId: 1012, phone: '253-100-012', emergency: '253-200-012', floor: 1 },
    { username: 'elderly13', email: 'antonio.silva@csg-res.pt',   name: 'Antonio Silva',  institutionId: 3, birth: '1933-11-09', gender: Gender.MALE,   medId: 1013, phone: '253-100-013', emergency: '253-200-013', floor: 2 },
    { username: 'elderly14', email: 'rosa.pereira@csg-res.pt',    name: 'Rosa Pereira',   institutionId: 3, birth: '1946-02-28', gender: Gender.FEMALE, medId: 1014, phone: '253-100-014', emergency: '253-200-014', floor: 2 },
    { username: 'elderly15', email: 'manuel.gomes@csg-res.pt',    name: 'Manuel Gomes',   institutionId: 3, birth: '1944-09-03', gender: Gender.MALE,   medId: 1015, phone: '253-100-015', emergency: '253-200-015', floor: 3 },
  ];
  const elderlyProfiles: { id: number; userId: number; institutionId: number }[] = [];
  for (const e of elderlyRaw) {
    const u = await prisma.user.create({
      data: { username: e.username, email: e.email, password: await hp('1234567a.'), role: UserRole.ELDERLY, avatarUrl: roleDefaultAvatarUrl(UserRole.ELDERLY) },
    });
    const el = await prisma.elderly.create({
      data: { userId: u.id, medicalId: e.medId, name: e.name, institutionId: e.institutionId, birthDate: new Date(e.birth), gender: e.gender, phone: e.phone, emergencyContact: e.emergency, floor: e.floor },
    });
    elderlyProfiles.push({ id: el.id, userId: u.id, institutionId: e.institutionId });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEVICES (6)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.device.createMany({
    data: [
      { name: 'Heart Rate Monitor A', type: 'Medical',  serialNumber: 'HRM-001', status: 'Active',   lastMaintenance: daysAgo(60) },
      { name: 'Heart Rate Monitor B', type: 'Medical',  serialNumber: 'HRM-002', status: 'Active',   lastMaintenance: daysAgo(45) },
      { name: 'Fall Detector Alpha',  type: 'Safety',   serialNumber: 'FD-001',  status: 'Active',   lastMaintenance: daysAgo(30) },
      { name: 'Fall Detector Beta',   type: 'Safety',   serialNumber: 'FD-002',  status: 'Active',   lastMaintenance: daysAgo(20) },
      { name: 'Fall Detector Gamma',  type: 'Safety',   serialNumber: 'FD-003',  status: 'Inactive', lastMaintenance: daysAgo(90) },
      { name: 'Smart Scale Omega',    type: 'Wellness', serialNumber: 'SS-001',  status: 'Active',   lastMaintenance: daysAgo(15) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSIONS (10)
  // ═══════════════════════════════════════════════════════════════════════════
  const sessionPairs = [
    { deviceId: 1, elderlyId: 1,  initiatedById: caregiverUsers[0].id, start: daysAgo(10), end: daysAgo(10) },
    { deviceId: 2, elderlyId: 2,  initiatedById: caregiverUsers[1].id, start: daysAgo(9),  end: daysAgo(9)  },
    { deviceId: 3, elderlyId: 3,  initiatedById: caregiverUsers[2].id, start: daysAgo(8),  end: daysAgo(8)  },
    { deviceId: 4, elderlyId: 4,  initiatedById: caregiverUsers[0].id, start: daysAgo(7),  end: daysAgo(7)  },
    { deviceId: 3, elderlyId: 5,  initiatedById: caregiverUsers[1].id, start: daysAgo(6),  end: daysAgo(6)  },
    { deviceId: 1, elderlyId: 6,  initiatedById: caregiverUsers[3].id, start: daysAgo(5),  end: daysAgo(5)  },
    { deviceId: 2, elderlyId: 7,  initiatedById: caregiverUsers[4].id, start: daysAgo(4),  end: daysAgo(4)  },
    { deviceId: 4, elderlyId: 8,  initiatedById: caregiverUsers[5].id, start: daysAgo(3),  end: daysAgo(3)  },
    { deviceId: 3, elderlyId: 9,  initiatedById: caregiverUsers[3].id, start: daysAgo(2),  end: daysAgo(2)  },
    { deviceId: 1, elderlyId: 10, initiatedById: caregiverUsers[4].id, start: daysAgo(1),  end: null        },
  ];
  for (const s of sessionPairs) {
    const startWithTime = timeOnDate(s.start, 9, 0);
    const endWithTime   = s.end ? timeOnDate(s.end, 10, 30) : null;
    await prisma.session.create({ data: { deviceId: s.deviceId, elderlyId: s.elderlyId, initiatedById: s.initiatedById, startTime: startWithTime, endTime: endWithTime } });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEVICE MAINTENANCE (4)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.deviceMaintenance.createMany({
    data: [
      { performedById: adminUsers[0].id, deviceId: 1, performedAt: daysAgo(60), reason: 'Routine calibration' },
      { performedById: adminUsers[0].id, deviceId: 2, performedAt: daysAgo(45), reason: 'Battery replacement' },
      { performedById: adminUsers[1].id, deviceId: 3, performedAt: daysAgo(30), reason: 'Sensor cleaning' },
      { performedById: adminUsers[1].id, deviceId: 5, performedAt: daysAgo(90), reason: 'Software update - device deactivated after update failed' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FALL DETECTIONS (5 – linked to sessions)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.fallDetection.createMany({
    data: [
      { elderlyId: 1, sessionId: 1, time: daysAgo(10), location: 'Corridor A',  severity: 'Low',    notes: 'Auto-detected by accelerometer spike' },
      { elderlyId: 3, sessionId: 3, time: daysAgo(8),  location: 'Bathroom 2',  severity: 'Medium', notes: 'Confirmed by staff' },
      { elderlyId: 5, sessionId: 5, time: daysAgo(6),  location: 'Bedroom 3',   severity: 'Low',    notes: 'False alarm - patient sat down quickly' },
      { elderlyId: 7, sessionId: 7, time: daysAgo(4),  location: 'Dining Room', severity: 'High',   notes: 'Patient unresponsive for 30s' },
      { elderlyId: 9, sessionId: 9, time: daysAgo(2),  location: 'Garden',      severity: 'Medium', notes: 'Slipped on wet grass' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FALL OCCURRENCES (18)
  // ═══════════════════════════════════════════════════════════════════════════
  const fallOccurrencesData = [
    { elderlyId: 1,  detectionId: 1, handlerUserId: caregiverUsers[0].id, date: daysAgo(10), description: 'Patient fell while walking to bathroom', preActivity: 'Walking unassisted', direction: 'Forward',  environment: 'Corridor', injured: false, isFalseAlarm: false },
    { elderlyId: 2,  detectionId: null, handlerUserId: caregiverUsers[1].id, date: daysAgo(40), description: 'Tripped on carpet edge', preActivity: 'Walking to chair', direction: 'Forward', environment: 'Living room', injured: true, injuryDescription: 'Bruised left hip', injuryBodyLocations: ['HIP_LEFT'], measuresTaken: 'Ice pack applied, nurse notified', isFalseAlarm: false },
    { elderlyId: 3,  detectionId: 2, handlerUserId: caregiverUsers[2].id, date: daysAgo(8),  description: 'Slip on wet floor in dining area', preActivity: 'Walking to breakfast', direction: 'Sideways', environment: 'Dining room', injured: true, injuryDescription: 'Minor bruise on left arm', injuryBodyLocations: ['ARM_UPPER_LEFT'], measuresTaken: 'Cleaned floor, family notified', isFalseAlarm: false },
    { elderlyId: 4,  detectionId: null, handlerUserId: caregiverUsers[0].id, date: daysAgo(50), description: 'Lost balance during physiotherapy', preActivity: 'Stretching exercises', direction: 'Backward', environment: 'Therapy room', injured: false, isFalseAlarm: false },
    { elderlyId: 5,  detectionId: 3, handlerUserId: null, date: daysAgo(6),  description: 'Lost balance getting out of bed', preActivity: 'Standing from bed', direction: 'Backward', environment: 'Bedroom', injured: false, isFalseAlarm: true },
    { elderlyId: 6,  detectionId: null, handlerUserId: caregiverUsers[3].id, date: daysAgo(55), description: 'Stumbled using walker in corridor', preActivity: 'Walking with walker', direction: 'Forward', environment: 'Main corridor', injured: false, measuresTaken: 'Walker height adjusted', isFalseAlarm: false },
    { elderlyId: 7,  detectionId: 4, handlerUserId: caregiverUsers[4].id, date: daysAgo(4),  description: 'Fainted and fell in dining room', preActivity: 'Eating lunch', direction: 'Backward', environment: 'Dining room', injured: true, injuryDescription: 'Head laceration, 3 stitches', injuryBodyLocations: ['HEAD'], measuresTaken: 'Emergency called, wound sutured', isFalseAlarm: false },
    { elderlyId: 8,  detectionId: null, handlerUserId: caregiverUsers[5].id, date: daysAgo(70), description: 'Reached for item on high shelf', preActivity: 'Reaching overhead', direction: 'Backward', environment: 'Personal room', injured: true, injuryDescription: 'Minor back strain', injuryBodyLocations: ['BACK'], measuresTaken: 'Physiotherapy consultation', isFalseAlarm: false },
    { elderlyId: 9,  detectionId: 5, handlerUserId: caregiverUsers[3].id, date: daysAgo(2),  description: 'Slipped on wet grass in garden', preActivity: 'Walking outdoors', direction: 'Sideways', environment: 'Garden', injured: true, injuryDescription: 'Scrapped right hand', injuryBodyLocations: ['HAND_RIGHT'], measuresTaken: 'Wound cleaned and bandaged', isFalseAlarm: false },
    { elderlyId: 10, detectionId: null, handlerUserId: caregiverUsers[4].id, date: daysAgo(30), description: 'Slipped getting out of shower', preActivity: 'Exiting shower', direction: 'Sideways', environment: 'Bathroom', injured: false, measuresTaken: 'Non-slip mats installed', isFalseAlarm: false },
    { elderlyId: 11, detectionId: null, handlerUserId: caregiverUsers[6].id, date: daysAgo(15), description: 'Tripped on door threshold', preActivity: 'Walking into room', direction: 'Forward', environment: 'Room entrance', injured: false, isFalseAlarm: false },
    { elderlyId: 12, detectionId: null, handlerUserId: caregiverUsers[7].id, date: daysAgo(22), description: 'Fell from wheelchair', preActivity: 'Transferring to bed', direction: 'Sideways', environment: 'Bedroom', injured: true, injuryDescription: 'Contusion on right shoulder', injuryBodyLocations: ['SHOULDER_RIGHT'], measuresTaken: 'X-ray ordered, no fracture', isFalseAlarm: false },
    { elderlyId: 13, detectionId: null, handlerUserId: null, date: daysAgo(90), description: 'Unobserved fall - found on floor', preActivity: 'Unknown', direction: null, environment: 'Corridor', injured: true, injuryDescription: 'Knee abrasion', injuryBodyLocations: ['KNEE_LEFT'], isFalseAlarm: false },
    { elderlyId: 14, detectionId: null, handlerUserId: caregiverUsers[8].id, date: daysAgo(12), description: 'Slipped on spilled liquid', preActivity: 'Walking to activity room', direction: 'Forward', environment: 'Hallway', injured: false, isFalseAlarm: false },
    { elderlyId: 15, detectionId: null, handlerUserId: caregiverUsers[6].id, date: daysAgo(5),  description: 'Lost balance during morning walk', preActivity: 'Outdoor walk', direction: 'Backward', environment: 'Garden path', injured: false, isFalseAlarm: false },
    { elderlyId: 1,  detectionId: null, handlerUserId: caregiverUsers[0].id, date: daysAgo(80), description: 'Night-time fall near bed', preActivity: 'Getting up for bathroom', direction: 'Sideways', environment: 'Bedroom', injured: false, isFalseAlarm: false },
    { elderlyId: 1,  detectionId: null, handlerUserId: caregiverUsers[0].id, date: daysAgo(45), description: 'Slipped on stairs', preActivity: 'Descending stairs', direction: 'Forward', environment: 'Stairway', injured: true, injuryDescription: 'Bruised right knee', injuryBodyLocations: ['KNEE_RIGHT'], measuresTaken: 'Knee brace applied', isFalseAlarm: false },
    { elderlyId: 3,  detectionId: null, handlerUserId: caregiverUsers[2].id, date: daysAgo(35), description: 'Lost footing on ramp', preActivity: 'Using wheelchair ramp', direction: 'Forward', environment: 'Entrance ramp', injured: false, isFalseAlarm: false },
  ];

  const fallOccurrenceIds: number[] = [];
  for (const f of fallOccurrencesData) {
    const fo = await prisma.fallOccurrence.create({ data: f as any });
    fallOccurrenceIds.push(fo.id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOS OCCURRENCES (10)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.sosOccurrence.createMany({
    data: [
      { elderlyId: 2,  handlerUserId: caregiverUsers[1].id, date: daysAgo(38), wasActualFall: true,  notes: 'Patient pressed SOS after minor fall', injured: true,  injuryDescription: 'Wrist bruise', injuryBodyLocations: ['WRIST_RIGHT'], isFalseAlarm: false, measuresTaken: 'Ice applied, family notified' },
      { elderlyId: 4,  handlerUserId: caregiverUsers[0].id, date: daysAgo(25), wasActualFall: false, notes: 'Pressed accidentally during bathing', injured: false, isFalseAlarm: true },
      { elderlyId: 6,  handlerUserId: caregiverUsers[3].id, date: daysAgo(18), wasActualFall: true,  notes: 'Fall in bathroom - alerted staff via SOS', injured: false, isFalseAlarm: false, environment: 'Bathroom', preActivity: 'Showering' },
      { elderlyId: 8,  handlerUserId: caregiverUsers[5].id, date: daysAgo(60), wasActualFall: false, notes: 'Chest pain - not a fall', injured: false, isFalseAlarm: false, measuresTaken: 'Doctor called, ECG run, normal' },
      { elderlyId: 10, handlerUserId: caregiverUsers[4].id, date: daysAgo(14), wasActualFall: true,  notes: 'Tripped on rug, fell forward', injured: true, injuryDescription: 'Forearm bruise', injuryBodyLocations: ['FOREARM_LEFT'], isFalseAlarm: false },
      { elderlyId: 11, handlerUserId: caregiverUsers[6].id, date: daysAgo(10), wasActualFall: false, notes: 'Dizziness - felt unwell, did not fall', injured: false, isFalseAlarm: false },
      { elderlyId: 13, handlerUserId: caregiverUsers[7].id, date: daysAgo(7),  wasActualFall: true,  notes: 'Night fall in corridor', injured: true, injuryDescription: 'Minor head bump', injuryBodyLocations: ['HEAD'], isFalseAlarm: false },
      { elderlyId: 14, handlerUserId: null,                  date: daysAgo(3),  wasActualFall: null,  notes: 'Unattended SOS - staff arrived but patient seemed ok', injured: null, isFalseAlarm: false },
      { elderlyId: 1,  handlerUserId: caregiverUsers[0].id, date: daysAgo(20), wasActualFall: false, notes: 'Patient pressed SOS out of anxiety', injured: false, isFalseAlarm: true },
      { elderlyId: 5,  handlerUserId: caregiverUsers[1].id, date: daysAgo(1),  wasActualFall: true,  notes: 'Fall in garden walk', injured: false, isFalseAlarm: false, environment: 'Garden' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WOUND TRACKINGS (8)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.woundTracking.createMany({
    data: [
      { fallOccurrenceId: fallOccurrenceIds[1], elderlyId: 2, createdByUserId: caregiverUsers[1].id, notes: 'Bruised hip - applying cold compress daily', bodyLocations: ['HIP_LEFT'], isResolved: true  },
      { fallOccurrenceId: fallOccurrenceIds[2], elderlyId: 3, createdByUserId: caregiverUsers[2].id, notes: 'Arm bruise monitored, healing well', bodyLocations: ['ARM_UPPER_LEFT'], isResolved: true  },
      { fallOccurrenceId: fallOccurrenceIds[6], elderlyId: 7, createdByUserId: caregiverUsers[4].id, notes: 'Head wound sutured, daily dressing changes', bodyLocations: ['HEAD'], isResolved: false },
      { fallOccurrenceId: fallOccurrenceIds[7], elderlyId: 8, createdByUserId: caregiverUsers[5].id, notes: 'Back strain - physiotherapy ongoing', bodyLocations: ['BACK_UPPER'], isResolved: false },
      { fallOccurrenceId: fallOccurrenceIds[8], elderlyId: 9, createdByUserId: caregiverUsers[3].id, notes: 'Hand wound healing, bandage changed daily', bodyLocations: ['HAND_RIGHT'], isResolved: false },
      { fallOccurrenceId: fallOccurrenceIds[11], elderlyId: 12, createdByUserId: caregiverUsers[7].id, notes: 'Shoulder contusion, no fracture confirmed', bodyLocations: ['SHOULDER_RIGHT'], isResolved: false },
      { elderlyId: 5, createdByUserId: caregiverUsers[1].id, notes: 'Pressure ulcer stage 1 on heel, preventive care', bodyLocations: ['HEEL_LEFT'], isResolved: false },
      { elderlyId: 13, createdByUserId: caregiverUsers[6].id, notes: 'Knee abrasion from historical fall - monitoring', bodyLocations: ['KNEE_LEFT'], isResolved: true },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FALL RISKS (4 dates × 10 elderly = 40 records)
  // ═══════════════════════════════════════════════════════════════════════════
  const fallRiskData: { elderlyId: number; date: Date; score: number }[] = [];
  for (const ep of elderlyProfiles.slice(0, 10)) {
    for (const w of [12, 8, 4, 0]) {
      fallRiskData.push({ elderlyId: ep.id, date: daysAgo(w * 7), score: parseFloat((Math.random() * 4 + 1).toFixed(2)) });
    }
  }
  await prisma.fallRisk.createMany({ data: fallRiskData, skipDuplicates: true });

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSESSMENTS (10)
  // ═══════════════════════════════════════════════════════════════════════════
  const assessmentsCreated: { id: number; elderlyId: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const ep  = elderlyProfiles[i];
    const cg  = caregiverUsers[i % caregiverUsers.length];
    const adm = adminUsers[i % adminUsers.length];
    const a   = await prisma.assessment.create({ data: { elderlyId: ep.id, performedByUserId: cg.id, registeredByUserId: adm.id } });
    assessmentsCreated.push({ id: a.id, elderlyId: ep.id });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEASUREMENTS (rich – all types)
  // ═══════════════════════════════════════════════════════════════════════════
  type MeasData = {
    elderlyId: number; assessmentId?: number; measuredById?: number;
    type: MeasurementType; value: number; unit: MeasurementUnit;
    status?: MeasurementStatus; notes?: string;
  };
  const measurementsData: MeasData[] = [];

  const addM = (elderlyId: number, type: MeasurementType, value: number, unit: MeasurementUnit, status: MeasurementStatus, notes: string, assessmentId?: number, measuredById?: number) =>
    measurementsData.push({ elderlyId, type, value, unit, status, notes, ...(assessmentId ? { assessmentId } : {}), ...(measuredById ? { measuredById } : {}) });

  for (let i = 0; i < 6; i++) addM(1, MeasurementType.BLOOD_PRESSURE_SYSTOLIC,  140 + i * 2, MeasurementUnit.MMHG,       MeasurementStatus.YELLOW, `Week ${i+1}`);
  for (let i = 0; i < 6; i++) addM(1, MeasurementType.BLOOD_PRESSURE_DIASTOLIC, 88  + i,     MeasurementUnit.MMHG,       MeasurementStatus.YELLOW, `Week ${i+1}`);
  addM(1, MeasurementType.WEIGHT,          72.5, MeasurementUnit.KILOGRAMS,  MeasurementStatus.GREEN,  'Stable weight');
  addM(1, MeasurementType.HEIGHT,         165,   MeasurementUnit.CENTIMETERS,MeasurementStatus.GREEN,  'Annual measurement');
  addM(1, MeasurementType.HEART_RATE,      82,   MeasurementUnit.BPM,         MeasurementStatus.GREEN,  'Resting heart rate', assessmentsCreated[0].id, clinicianProfiles[0].userId);
  addM(1, MeasurementType.BALANCE_SCORE,   32,   MeasurementUnit.POINTS,      MeasurementStatus.YELLOW, 'Berg Balance Scale');
  addM(1, MeasurementType.COGNITIVE_SCORE, 22,   MeasurementUnit.POINTS,      MeasurementStatus.YELLOW, 'MMSE score - mild decline');

  addM(2, MeasurementType.BLOOD_GLUCOSE,           162, MeasurementUnit.POINTS,      MeasurementStatus.ORANGE, 'Fasting glucose elevated');
  addM(2, MeasurementType.BLOOD_GLUCOSE,           145, MeasurementUnit.POINTS,      MeasurementStatus.YELLOW, 'Post-meal glucose');
  addM(2, MeasurementType.WEIGHT,                   78.2, MeasurementUnit.KILOGRAMS, MeasurementStatus.YELLOW, 'Slight overweight');
  addM(2, MeasurementType.BLOOD_PRESSURE_SYSTOLIC, 138,  MeasurementUnit.MMHG,       MeasurementStatus.YELLOW, 'Pre-hypertensive');
  addM(2, MeasurementType.OXYGEN_SATURATION,        97,  MeasurementUnit.PERCENTAGE, MeasurementStatus.GREEN, 'Normal SpO2');

  addM(3, MeasurementType.WEIGHT,          67.8, MeasurementUnit.KILOGRAMS,  MeasurementStatus.YELLOW, 'Weight loss noted');
  addM(3, MeasurementType.WEIGHT,          68.2, MeasurementUnit.KILOGRAMS,  MeasurementStatus.GREEN,  'Stable this week');
  addM(3, MeasurementType.HEIGHT,         172,   MeasurementUnit.CENTIMETERS,MeasurementStatus.GREEN,  'No change');
  addM(3, MeasurementType.MOBILITY_SCORE,  6,   MeasurementUnit.POINTS,      MeasurementStatus.ORANGE, 'Timed Up & Go test');
  addM(3, MeasurementType.BALANCE_SCORE,  28,   MeasurementUnit.POINTS,      MeasurementStatus.YELLOW, 'Berg scale - moderate risk');
  addM(3, MeasurementType.BODY_TEMPERATURE,36.8, MeasurementUnit.POINTS,     MeasurementStatus.GREEN,  'Normal');

  const simpleM: [number, MeasurementType, number, MeasurementUnit, MeasurementStatus, string][] = [
    [4,  MeasurementType.MOBILITY_SCORE,             4,    MeasurementUnit.POINTS,     MeasurementStatus.RED,    'Severely limited mobility'],
    [4,  MeasurementType.BALANCE_SCORE,             10,    MeasurementUnit.POINTS,     MeasurementStatus.RED,    'Very high fall risk'],
    [4,  MeasurementType.HEART_RATE,                85,    MeasurementUnit.BPM,        MeasurementStatus.GREEN,  'Slightly elevated'],
    [5,  MeasurementType.BLOOD_PRESSURE_SYSTOLIC,  118,    MeasurementUnit.MMHG,       MeasurementStatus.GREEN,  'Normal'],
    [5,  MeasurementType.BLOOD_PRESSURE_DIASTOLIC,  76,    MeasurementUnit.MMHG,       MeasurementStatus.GREEN,  'Normal'],
    [5,  MeasurementType.WEIGHT,                    82.1,  MeasurementUnit.KILOGRAMS,  MeasurementStatus.GREEN,  'Stable'],
    [5,  MeasurementType.COGNITIVE_SCORE,           28,    MeasurementUnit.POINTS,     MeasurementStatus.GREEN,  'Normal MMSE'],
    [6,  MeasurementType.HEART_RATE,                91,    MeasurementUnit.BPM,        MeasurementStatus.YELLOW, 'AFib patient'],
    [6,  MeasurementType.OXYGEN_SATURATION,         95,    MeasurementUnit.PERCENTAGE, MeasurementStatus.YELLOW, 'Low-normal SpO2'],
    [6,  MeasurementType.WEIGHT,                    61.3,  MeasurementUnit.KILOGRAMS,  MeasurementStatus.GREEN,  'Stable'],
    [7,  MeasurementType.BLOOD_GLUCOSE,             110,    MeasurementUnit.POINTS,     MeasurementStatus.GREEN,  'Normal fasting'],
    [7,  MeasurementType.BLOOD_PRESSURE_SYSTOLIC,  132,    MeasurementUnit.MMHG,       MeasurementStatus.YELLOW, 'Borderline high'],
    [7,  MeasurementType.BALANCE_SCORE,             38,    MeasurementUnit.POINTS,     MeasurementStatus.GREEN,  'Good balance'],
    [8,  MeasurementType.BODY_TEMPERATURE,          37.4,  MeasurementUnit.POINTS,     MeasurementStatus.YELLOW, 'Slight fever'],
    [8,  MeasurementType.OXYGEN_SATURATION,         93,    MeasurementUnit.PERCENTAGE, MeasurementStatus.ORANGE, 'Low SpO2 - monitored'],
    [8,  MeasurementType.HEART_RATE,                98,    MeasurementUnit.BPM,        MeasurementStatus.ORANGE, 'Tachycardia - under review'],
    [9,  MeasurementType.WEIGHT,                    74.0,  MeasurementUnit.KILOGRAMS,  MeasurementStatus.GREEN,  'Normal BMI'],
    [9,  MeasurementType.HEIGHT,                   168,    MeasurementUnit.CENTIMETERS,MeasurementStatus.GREEN,  'Annual'],
    [9,  MeasurementType.COGNITIVE_SCORE,           25,    MeasurementUnit.POINTS,     MeasurementStatus.GREEN,  'Mild aging changes'],
    [10, MeasurementType.BLOOD_PRESSURE_SYSTOLIC,  155,    MeasurementUnit.MMHG,       MeasurementStatus.ORANGE, 'Stage 2 hypertension'],
    [10, MeasurementType.BLOOD_PRESSURE_DIASTOLIC,  98,    MeasurementUnit.MMHG,       MeasurementStatus.ORANGE, 'Elevated'],
    [11, MeasurementType.MOBILITY_SCORE,             4,    MeasurementUnit.POINTS,     MeasurementStatus.RED,    'Severely limited mobility'],
    [11, MeasurementType.BALANCE_SCORE,             10,    MeasurementUnit.POINTS,     MeasurementStatus.RED,    'Very high fall risk'],
    [12, MeasurementType.BLOOD_GLUCOSE,             130,    MeasurementUnit.POINTS,     MeasurementStatus.YELLOW, 'Pre-diabetic range'],
    [12, MeasurementType.WEIGHT,                    69.5,  MeasurementUnit.KILOGRAMS,  MeasurementStatus.GREEN,  'Normal'],
    [13, MeasurementType.OXYGEN_SATURATION,         94,    MeasurementUnit.PERCENTAGE, MeasurementStatus.YELLOW, 'Moderate COPD'],
    [13, MeasurementType.BODY_TEMPERATURE,          36.5,  MeasurementUnit.POINTS,     MeasurementStatus.GREEN,  'Normal'],
    [14, MeasurementType.HEART_RATE,                72,    MeasurementUnit.BPM,        MeasurementStatus.GREEN,  'Normal sinus'],
    [14, MeasurementType.COGNITIVE_SCORE,           24,    MeasurementUnit.POINTS,     MeasurementStatus.GREEN,  'MCI suspect'],
    [15, MeasurementType.BLOOD_PRESSURE_SYSTOLIC,  126,    MeasurementUnit.MMHG,       MeasurementStatus.GREEN,  'Normal'],
    [15, MeasurementType.WEIGHT,                    79.0,  MeasurementUnit.KILOGRAMS,  MeasurementStatus.GREEN,  'Stable'],
  ];
  for (const [eid, type, value, unit, status, notes] of simpleM) addM(eid, type, value, unit, status, notes);

  await prisma.measurement.createMany({ data: measurementsData });

  // ═══════════════════════════════════════════════════════════════════════════
  // PATHOLOGIES (24)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.pathology.createMany({
    data: [
      { elderlyId: 1,  registeredById: caregiverUsers[0].id,          name: 'Hypertension',              description: 'Essential hypertension stage 2',        diagnosisSite: 'HCC Cardiology',        diagnosisDate: daysAgo(730), status: PathologyStatus.ACTIVE,         notes: 'On Lisinopril 10mg' },
      { elderlyId: 1,  registeredById: clinicianProfiles[0].userId,   name: 'Osteoporosis',              description: 'Lumbar osteoporosis',                   diagnosisSite: 'HCC Radiology',         diagnosisDate: daysAgo(400), status: PathologyStatus.CHRONIC,         notes: 'Calcium+VitD supplementation' },
      { elderlyId: 2,  registeredById: caregiverUsers[1].id,          name: 'Diabetes Type 2',           description: 'T2DM poorly controlled',                diagnosisSite: 'LSB Medical Unit',      diagnosisDate: daysAgo(900), status: PathologyStatus.UNDER_TREATMENT, notes: 'Metformin 850mg BD' },
      { elderlyId: 2,  registeredById: caregiverUsers[1].id,          name: 'Peripheral Neuropathy',     description: 'Diabetic peripheral neuropathy',        diagnosisSite: 'LSB Neurology',         diagnosisDate: daysAgo(200), status: PathologyStatus.ACTIVE,         notes: 'Pregabalin 75mg' },
      { elderlyId: 3,  registeredById: caregiverUsers[2].id,          name: 'Osteoarthritis',            description: 'Bilateral knee osteoarthritis',         diagnosisSite: 'Orthopedic Clinic Braga',diagnosisDate: daysAgo(1200),status: PathologyStatus.CHRONIC,         notes: 'Physiotherapy 2x/week' },
      { elderlyId: 3,  registeredById: caregiverUsers[2].id,          name: 'GERD',                      description: 'Gastroesophageal reflux disease',       diagnosisSite: 'HCC Gastroenterology',  diagnosisDate: daysAgo(600), status: PathologyStatus.ACTIVE,         notes: 'Omeprazole 20mg daily' },
      { elderlyId: 4,  registeredById: caregiverUsers[0].id,          name: 'Cataracts',                  description: 'Bilateral cataracts - post-surgery',    diagnosisSite: 'Eye Clinic Barcelos',   diagnosisDate: daysAgo(540), status: PathologyStatus.RESOLVED,       notes: 'Phacoemulsification both eyes' },
      { elderlyId: 4,  registeredById: caregiverUsers[0].id,          name: 'Mild Cognitive Impairment', description: 'Amnestic MCI',                          diagnosisSite: 'HCC Neurology',         diagnosisDate: daysAgo(180), status: PathologyStatus.MONITORING,     notes: 'MMSE 24, annual review' },
      { elderlyId: 5,  registeredById: caregiverUsers[1].id,          name: 'Depression',                description: 'Major depressive disorder, moderate',   diagnosisSite: 'Mental Health Unit',    diagnosisDate: daysAgo(360), status: PathologyStatus.UNDER_TREATMENT, notes: 'Sertraline 50mg, CBT sessions' },
      { elderlyId: 5,  registeredById: caregiverUsers[1].id,          name: 'Chronic Low Back Pain',     description: 'L4-L5 disc degeneration',               diagnosisSite: 'HCC Orthopaedics',      diagnosisDate: daysAgo(800), status: PathologyStatus.CHRONIC,         notes: 'Physiotherapy, occasional NSAIDs' },
      { elderlyId: 6,  registeredById: caregiverUsers[3].id,          name: 'Atrial Fibrillation',       description: 'Paroxysmal AFib',                       diagnosisSite: 'Cardiology Dept',       diagnosisDate: daysAgo(730), status: PathologyStatus.INACTIVE,       notes: 'Stabilised on Bisoprolol' },
      { elderlyId: 6,  registeredById: caregiverUsers[3].id,          name: 'Heart Failure',              description: 'HFpEF',                                 diagnosisSite: 'LSB Cardiology',        diagnosisDate: daysAgo(300), status: PathologyStatus.UNDER_TREATMENT, notes: 'Furosemide 40mg, fluid restriction' },
      { elderlyId: 7,  registeredById: caregiverUsers[4].id,          name: "Parkinson's Disease",       description: 'Early stage PD',                        diagnosisSite: 'LSB Neurology',         diagnosisDate: daysAgo(500), status: PathologyStatus.ACTIVE,         notes: 'Levodopa/Carbidopa 25/100 TDS' },
      { elderlyId: 8,  registeredById: caregiverUsers[5].id,          name: 'COPD',                      description: 'Moderate COPD (GOLD stage 2)',           diagnosisSite: 'Pulmonology Clinic',    diagnosisDate: daysAgo(1000),status: PathologyStatus.CHRONIC,         notes: 'Salbutamol PRN, Tiotropium daily' },
      { elderlyId: 8,  registeredById: caregiverUsers[5].id,          name: 'Anaemia',                    description: 'Iron deficiency anaemia',               diagnosisSite: 'LSB Laboratory',        diagnosisDate: daysAgo(90),  status: PathologyStatus.UNDER_TREATMENT, notes: 'Ferrous sulphate 200mg TDS' },
      { elderlyId: 9,  registeredById: caregiverUsers[3].id,          name: 'Type 2 Diabetes',           description: 'Well-controlled T2DM',                  diagnosisSite: 'CSG Primary Care',      diagnosisDate: daysAgo(600), status: PathologyStatus.MONITORING,     notes: 'HbA1c 6.8%, diet controlled' },
      { elderlyId: 10, registeredById: caregiverUsers[4].id,          name: 'Hypertension',              description: 'Stage 2 hypertension',                  diagnosisSite: 'LSB Cardiology',        diagnosisDate: daysAgo(850), status: PathologyStatus.ACTIVE,         notes: 'Amlodipine 10mg' },
      { elderlyId: 10, registeredById: caregiverUsers[4].id,          name: 'Chronic Kidney Disease',    description: 'CKD stage 3a',                          diagnosisSite: 'LSB Nephrology',        diagnosisDate: daysAgo(400), status: PathologyStatus.MONITORING,     notes: 'eGFR 45, low protein diet' },
      { elderlyId: 11, registeredById: caregiverUsers[6].id,          name: 'Advanced Dementia',         description: "Alzheimer's type dementia stage 2",     diagnosisSite: 'CSG Neurology',         diagnosisDate: daysAgo(700), status: PathologyStatus.ACTIVE,         notes: 'Donepezil 10mg, high supervision' },
      { elderlyId: 12, registeredById: caregiverUsers[7].id,          name: 'Hypothyroidism',            description: 'Autoimmune hypothyroidism',              diagnosisSite: 'CSG Endocrinology',     diagnosisDate: daysAgo(1100),status: PathologyStatus.ACTIVE,         notes: 'Levothyroxine 75mcg daily' },
      { elderlyId: 13, registeredById: caregiverUsers[8].id,          name: 'COPD',                      description: 'Severe COPD (GOLD stage 3)',             diagnosisSite: 'Pulmonology Clinic',    diagnosisDate: daysAgo(1500),status: PathologyStatus.CHRONIC,         notes: 'Home oxygen 16h/day' },
      { elderlyId: 14, registeredById: caregiverUsers[6].id,          name: 'Osteoporosis',              description: 'Post-menopausal osteoporosis',           diagnosisSite: 'CSG Rheumatology',      diagnosisDate: daysAgo(600), status: PathologyStatus.UNDER_TREATMENT, notes: 'Alendronate weekly, Ca+D3' },
      { elderlyId: 15, registeredById: caregiverUsers[7].id,          name: 'Benign Prostatic Hyperplasia', description: 'BPH with urinary retention',         diagnosisSite: 'CSG Urology',           diagnosisDate: daysAgo(450), status: PathologyStatus.ACTIVE,         notes: 'Tamsulosin 0.4mg' },
      { elderlyId: 15, registeredById: caregiverUsers[7].id,          name: 'Gout',                      description: 'Recurrent gout, right great toe',       diagnosisSite: 'CSG Primary Care',      diagnosisDate: daysAgo(300), status: PathologyStatus.MONITORING,     notes: 'Allopurinol 100mg, low purine diet' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDICATIONS (26)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.medication.createMany({
    data: [
      { elderlyId: 1,  registeredById: clinicianProfiles[0].userId, name: 'Lisinopril',          activeIngredient: 'Lisinopril',             dosage: '10mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(730), status: MedicationStatus.ACTIVE,        notes: 'For hypertension' },
      { elderlyId: 1,  registeredById: clinicianProfiles[0].userId, name: 'Calcium + Vit D3',    activeIngredient: 'Calcium carbonate + D3',  dosage: '500mg/400IU',  frequency: 'Twice daily',         administration: 'Oral',    startDate: daysAgo(400), status: MedicationStatus.ACTIVE,        notes: 'Osteoporosis prevention' },
      { elderlyId: 2,  registeredById: clinicianProfiles[1].userId, name: 'Metformin',            activeIngredient: 'Metformin HCl',           dosage: '850mg',        frequency: 'Twice daily',         administration: 'Oral',    startDate: daysAgo(900), status: MedicationStatus.ACTIVE,        notes: 'Diabetes control' },
      { elderlyId: 2,  registeredById: clinicianProfiles[1].userId, name: 'Pregabalin',           activeIngredient: 'Pregabalin',              dosage: '75mg',          frequency: 'Twice daily',         administration: 'Oral',    startDate: daysAgo(200), status: MedicationStatus.ACTIVE,        notes: 'Neuropathic pain' },
      { elderlyId: 2,  registeredById: clinicianProfiles[1].userId, name: 'Aspirin',              activeIngredient: 'Acetylsalicylic acid',    dosage: '100mg',        frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(900), endDate: daysAgo(300), status: MedicationStatus.DISCONTINUED, notes: 'Switched to clopidogrel' },
      { elderlyId: 3,  registeredById: clinicianProfiles[0].userId, name: 'Omeprazole',           activeIngredient: 'Omeprazole',              dosage: '20mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(600), status: MedicationStatus.ACTIVE,        notes: 'GERD' },
      { elderlyId: 3,  registeredById: clinicianProfiles[0].userId, name: 'Ibuprofen PRN',        activeIngredient: 'Ibuprofen',               dosage: '400mg',        frequency: 'When needed',         administration: 'Oral',    startDate: daysAgo(1200), status: MedicationStatus.PAUSED,        notes: 'Paused due to GI concerns' },
      { elderlyId: 4,  registeredById: clinicianProfiles[0].userId, name: 'Memantine',            activeIngredient: 'Memantine HCl',           dosage: '10mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(180), status: MedicationStatus.ACTIVE,        notes: 'MCI neuroprotection' },
      { elderlyId: 5,  registeredById: clinicianProfiles[0].userId, name: 'Sertraline',           activeIngredient: 'Sertraline HCl',          dosage: '50mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(360), status: MedicationStatus.ACTIVE,        notes: 'Depression' },
      { elderlyId: 5,  registeredById: clinicianProfiles[0].userId, name: 'Diclofenac',           activeIngredient: 'Diclofenac sodium',       dosage: '50mg',          frequency: 'Twice daily',         administration: 'Oral',    startDate: daysAgo(800), endDate: daysAgo(600), status: MedicationStatus.COMPLETED, notes: 'Back pain course completed' },
      { elderlyId: 6,  registeredById: clinicianProfiles[1].userId, name: 'Bisoprolol',           activeIngredient: 'Bisoprolol fumarate',     dosage: '5mg',           frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(730), status: MedicationStatus.ACTIVE,        notes: 'AFib rate control' },
      { elderlyId: 6,  registeredById: clinicianProfiles[1].userId, name: 'Furosemide',           activeIngredient: 'Furosemide',              dosage: '40mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(300), status: MedicationStatus.ACTIVE,        notes: 'Heart failure fluid control' },
      { elderlyId: 6,  registeredById: clinicianProfiles[1].userId, name: 'Warfarin',             activeIngredient: 'Warfarin sodium',         dosage: '5mg',           frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(730), endDate: daysAgo(200), status: MedicationStatus.DISCONTINUED, notes: 'Replaced by Apixaban' },
      { elderlyId: 7,  registeredById: clinicianProfiles[1].userId, name: 'Levodopa/Carbidopa',   activeIngredient: 'Levodopa + Carbidopa',    dosage: '25/100mg',     frequency: 'Three times daily',  administration: 'Oral',    startDate: daysAgo(500), status: MedicationStatus.ACTIVE,        notes: "Parkinson's" },
      { elderlyId: 8,  registeredById: clinicianProfiles[1].userId, name: 'Tiotropium inhaler',   activeIngredient: 'Tiotropium bromide',      dosage: '18mcg',         frequency: 'Once daily',          administration: 'Inhaled', startDate: daysAgo(1000), status: MedicationStatus.ACTIVE,       notes: 'COPD maintenance' },
      { elderlyId: 8,  registeredById: clinicianProfiles[1].userId, name: 'Ferrous Sulphate',     activeIngredient: 'Ferrous sulphate',        dosage: '200mg',        frequency: 'Three times daily',  administration: 'Oral',    startDate: daysAgo(90),  status: MedicationStatus.ACTIVE,        notes: 'Iron deficiency anaemia' },
      { elderlyId: 9,  registeredById: clinicianProfiles[2].userId, name: 'Gliclazide',           activeIngredient: 'Gliclazide',              dosage: '60mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(600), status: MedicationStatus.ACTIVE,        notes: 'T2DM' },
      { elderlyId: 10, registeredById: clinicianProfiles[1].userId, name: 'Amlodipine',           activeIngredient: 'Amlodipine besilate',     dosage: '10mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(850), status: MedicationStatus.ACTIVE,        notes: 'Hypertension' },
      { elderlyId: 10, registeredById: clinicianProfiles[1].userId, name: 'Atorvastatin',         activeIngredient: 'Atorvastatin calcium',    dosage: '40mg',          frequency: 'Once at night',       administration: 'Oral',    startDate: daysAgo(850), status: MedicationStatus.ACTIVE,        notes: 'Dyslipidaemia + CKD protection' },
      { elderlyId: 11, registeredById: clinicianProfiles[2].userId, name: 'Donepezil',            activeIngredient: 'Donepezil HCl',           dosage: '10mg',          frequency: 'Once at night',       administration: 'Oral',    startDate: daysAgo(700), status: MedicationStatus.ACTIVE,        notes: "Alzheimer's dementia" },
      { elderlyId: 12, registeredById: clinicianProfiles[2].userId, name: 'Levothyroxine',        activeIngredient: 'Levothyroxine sodium',    dosage: '75mcg',        frequency: 'Once daily fasting', administration: 'Oral',    startDate: daysAgo(1100), status: MedicationStatus.ACTIVE,       notes: 'Hypothyroidism' },
      { elderlyId: 13, registeredById: clinicianProfiles[2].userId, name: 'Salbutamol inhaler',   activeIngredient: 'Salbutamol sulphate',     dosage: '100mcg/puff',  frequency: 'PRN',                 administration: 'Inhaled', startDate: daysAgo(1500), status: MedicationStatus.ACTIVE,       notes: 'COPD rescue' },
      { elderlyId: 13, registeredById: clinicianProfiles[2].userId, name: 'Prednisolone',         activeIngredient: 'Prednisolone',            dosage: '30mg',          frequency: 'Once daily 5 days',  administration: 'Oral',    startDate: daysAgo(30),  endDate: daysAgo(25), status: MedicationStatus.COMPLETED, notes: 'Exacerbation course' },
      { elderlyId: 14, registeredById: clinicianProfiles[2].userId, name: 'Alendronate',          activeIngredient: 'Alendronate sodium',      dosage: '70mg',          frequency: 'Once weekly',        administration: 'Oral',    startDate: daysAgo(600), status: MedicationStatus.ACTIVE,        notes: 'Osteoporosis' },
      { elderlyId: 15, registeredById: clinicianProfiles[2].userId, name: 'Tamsulosin',           activeIngredient: 'Tamsulosin HCl',          dosage: '0.4mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(450), status: MedicationStatus.ACTIVE,        notes: 'BPH' },
      { elderlyId: 15, registeredById: clinicianProfiles[2].userId, name: 'Allopurinol',          activeIngredient: 'Allopurinol',             dosage: '100mg',          frequency: 'Once daily',          administration: 'Oral',    startDate: daysAgo(300), status: MedicationStatus.ACTIVE,        notes: 'Gout prevention' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTERNAL PROFESSIONALS (6)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.externalProfessional.createMany({
    data: [
      { institutionId: 1, name: 'Dr. Carlos Menezes',   specialty: 'Cardiologist',       phone: '253-300-001', email: 'c.menezes@cardio.pt'    },
      { institutionId: 1, name: 'Dra. Rita Figueiredo', specialty: 'Neurologist',          phone: '253-300-002', email: 'r.figueiredo@neuro.pt'   },
      { institutionId: 2, name: 'Dr. Nuno Araujo',      specialty: 'Pulmonologist',       phone: '253-300-003', email: 'n.araujo@pulmo.pt'       },
      { institutionId: 2, name: 'Dra. Ines Ribeiro',    specialty: 'Endocrinologist',     phone: '253-300-004', email: 'i.ribeiro@endo.pt'       },
      { institutionId: 3, name: 'Dr. Tiago Pinheiro',   specialty: 'Orthopaedic Surgeon', phone: '253-300-005', email: 't.pinheiro@ortho.pt'     },
      { institutionId: 3, name: 'Dra. Catarina Vaz',    specialty: 'Geriatrician',         phone: '253-300-006', email: 'c.vaz@geriatrics.pt'     },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDAR EVENTS (20)
  // ═══════════════════════════════════════════════════════════════════════════
  const calendarEventsData = [
    { elderlyId: 1,  createdById: adminUsers[0].id, assignedToId: caregiverUsers[0].id, externalProfessionalId: 1, type: CalendarEventType.APPOINTMENT,    title: 'Cardiology Consultation',    startDate: futureDate(7),  allDay: false, location: 'HCC Cardiology Unit' },
    { elderlyId: 1,  createdById: adminUsers[0].id, assignedToId: caregiverUsers[0].id, type: CalendarEventType.PHYSIOTHERAPY,  title: 'Physiotherapy Session',       startDate: futureDate(2),  allDay: false, location: 'HCC Physiotherapy' },
    { elderlyId: 2,  createdById: adminUsers[0].id, assignedToId: caregiverUsers[1].id, externalProfessionalId: 2, type: CalendarEventType.APPOINTMENT,    title: 'Neurology Follow-up',        startDate: futureDate(14), allDay: false, location: 'HCC Neurology' },
    { elderlyId: 2,  createdById: adminUsers[0].id, assignedToId: caregiverUsers[1].id, type: CalendarEventType.BATH,           title: 'Morning Bath',               startDate: futureDate(1),  allDay: false },
    { elderlyId: 3,  createdById: adminUsers[0].id, assignedToId: caregiverUsers[2].id, type: CalendarEventType.PHYSIOTHERAPY,  title: 'Knee Rehab Session',         startDate: futureDate(3),  allDay: false, location: 'HCC Physiotherapy' },
    { elderlyId: 4,  createdById: adminUsers[0].id, assignedToId: caregiverUsers[2].id, type: CalendarEventType.APPOINTMENT,    title: 'Cognitive Assessment Review', startDate: futureDate(10), allDay: false, location: 'HCC Neurology' },
    { elderlyId: 5,  createdById: adminUsers[0].id, assignedToId: caregiverUsers[0].id, type: CalendarEventType.NURSING_CARE,   title: 'Wound Dressing Change',      startDate: futureDate(1),  allDay: false },
    { elderlyId: 6,  createdById: adminUsers[1].id, assignedToId: caregiverUsers[3].id, externalProfessionalId: 3, type: CalendarEventType.APPOINTMENT,    title: 'Pulmonology Consultation',   startDate: futureDate(5),  allDay: false, location: 'LSB Clinic' },
    { elderlyId: 6,  createdById: adminUsers[1].id, assignedToId: caregiverUsers[3].id, type: CalendarEventType.MEAL,           title: 'Special Diet Meal',          startDate: futureDate(1),  allDay: true },
    { elderlyId: 7,  createdById: adminUsers[1].id, assignedToId: caregiverUsers[4].id, type: CalendarEventType.PHYSIOTHERAPY,  title: "Parkinson's Physio",          startDate: futureDate(4),  allDay: false, location: 'LSB Physiotherapy' },
    { elderlyId: 8,  createdById: adminUsers[1].id, assignedToId: caregiverUsers[5].id, type: CalendarEventType.APPOINTMENT,    title: 'Pulmonology Review',          startDate: futureDate(8),  allDay: false, location: 'Pulmonology Clinic' },
    { elderlyId: 8,  createdById: adminUsers[1].id, assignedToId: caregiverUsers[5].id, type: CalendarEventType.NURSING_CARE,   title: 'Oxygen Therapy Session',      startDate: futureDate(2),  allDay: false },
    { elderlyId: 9,  createdById: adminUsers[1].id, assignedToId: caregiverUsers[3].id, externalProfessionalId: 4, type: CalendarEventType.APPOINTMENT,    title: 'Endocrinology Check',        startDate: futureDate(21), allDay: false, location: 'CSG Endocrinology' },
    { elderlyId: 10, createdById: adminUsers[1].id, assignedToId: caregiverUsers[4].id, type: CalendarEventType.ACTIVITY,       title: 'Group Painting Activity',    startDate: futureDate(3),  allDay: false, location: 'Activity Room B' },
    { elderlyId: 11, createdById: adminUsers[2].id, assignedToId: caregiverUsers[6].id, externalProfessionalId: 6, type: CalendarEventType.APPOINTMENT,    title: 'Geriatrics Review',          startDate: futureDate(12), allDay: false, location: 'CSG Geriatrics' },
    { elderlyId: 12, createdById: adminUsers[2].id, assignedToId: caregiverUsers[7].id, externalProfessionalId: 4, type: CalendarEventType.APPOINTMENT,    title: 'Thyroid Function Review',    startDate: futureDate(6),  allDay: false },
    { elderlyId: 13, createdById: adminUsers[2].id, assignedToId: caregiverUsers[8].id, type: CalendarEventType.NURSING_CARE,   title: 'Oxygen Tubing Change',       startDate: futureDate(1),  allDay: false },
    { elderlyId: 14, createdById: adminUsers[2].id, assignedToId: caregiverUsers[6].id, externalProfessionalId: 5, type: CalendarEventType.APPOINTMENT,    title: 'DEXA Scan Follow-up',        startDate: futureDate(30), allDay: false, location: 'CSG Radiology' },
    { elderlyId: 15, createdById: adminUsers[2].id, assignedToId: caregiverUsers[7].id, type: CalendarEventType.ACTIVITY,       title: 'Music Therapy Session',      startDate: futureDate(2),  allDay: false, location: 'Activity Room A' },
    { elderlyId: 3,  createdById: adminUsers[0].id, assignedToId: caregiverUsers[2].id, type: CalendarEventType.OTHER,           title: 'Family Visit Coordination',  startDate: futureDate(5),  allDay: true,  description: 'Son visiting from Porto' },
  ];
  for (const ev of calendarEventsData) {
    await prisma.calendarEvent.create({ data: ev as any });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔥 CORREÇÃO: STAFF WORK SCHEDULES (REESCRITO COM CRIAÇÃO EM CASCATA DE SLOTS DOS 7 DIAS)
  // ═══════════════════════════════════════════════════════════════════════════

  // Cuidadores – 9 entradas (Mapeamento flexível por dia)
  const caregiverSchedules = [
    { workDays: [1,2,3,4,5,6,7], startTime: '07:00', endTime: '15:00' },
    { workDays: [1,2,3,4,5,6,7], startTime: '15:00', endTime: '23:00' },
    { workDays: [1,2,3,4,5],     startTime: '07:00', endTime: '15:00' },
    { workDays: [1,2,3,4,5,6,7], startTime: '23:00', endTime: '07:00' },
    { workDays: [1,2,3,4,5],     startTime: '15:00', endTime: '23:00' },
    { workDays: [1,2,3,4,5,6,7], startTime: '07:00', endTime: '15:00' },
    { workDays: [1,2,3,4,5,6,7], startTime: '15:00', endTime: '23:00' },
    { workDays: [1,2,6,7],       startTime: '23:00', endTime: '07:00' },
    { workDays: [1,2,3,4,5],     startTime: '07:00', endTime: '15:00' },
  ];
  for (let i = 0; i < caregiverUsers.length; i++) {
    const rawSched = caregiverSchedules[i];
    // Cria automaticamente os 7 dias úteis com o seu estado correspondente
    const slotsData = [1, 2, 3, 4, 5, 6, 7].map(dayIso => ({
      dayIso,
      startTime: rawSched.startTime,
      endTime: rawSched.endTime,
      isActive: rawSched.workDays.includes(dayIso)
    }));

    await prisma.staffWorkSchedule.upsert({
      where:  { userId: caregiverUsers[i].id },
      update: {
        slots: {
          deleteMany: {},
          create: slotsData
        }
      },
      create: {
        userId: caregiverUsers[i].id,
        slots: {
          create: slotsData
        }
      },
    });
  }

  // Clínicos – 3 entradas, dias de semana normais
  const clinicianSchedules = [
    { workDays: [1,2,3,4,5], startTime: '09:00', endTime: '17:00' },
    { workDays: [1,2,3,4,5], startTime: '08:00', endTime: '16:00' },
    { workDays: [1,2,3,4,5], startTime: '09:00', endTime: '17:00' },
  ];
  for (let i = 0; i < clinicianProfiles.length; i++) {
    const rawSched = clinicianSchedules[i];
    const slotsData = [1, 2, 3, 4, 5, 6, 7].map(dayIso => ({
      dayIso,
      startTime: rawSched.startTime,
      endTime: rawSched.endTime,
      isActive: rawSched.workDays.includes(dayIso)
    }));

    await prisma.staffWorkSchedule.upsert({
      where:  { userId: clinicianProfiles[i].userId },
      update: {
        slots: {
          deleteMany: {},
          create: slotsData
        }
      },
      create: {
        userId: clinicianProfiles[i].userId,
        slots: {
          create: slotsData
        }
      },
    });
  }

  // Administradores – Segunda a Sexta, horário padrão
  for (const au of adminUsers) {
    const slotsData = [1, 2, 3, 4, 5, 6, 7].map(dayIso => ({
      dayIso,
      startTime: '09:00',
      endTime: '17:00',
      isActive: dayIso <= 5
    }));

    await prisma.staffWorkSchedule.upsert({
      where:  { userId: au.id },
      update: {
        slots: {
          deleteMany: {},
          create: slotsData
        }
      },
      create: {
        userId: au.id,
        slots: {
          create: slotsData
        }
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF TIME OFFS (8)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.staffTimeOff.createMany({
    data: [
      { userId: caregiverUsers[0].id, createdById: adminUsers[0].id, type: TimeOffType.VACATION,   startDate: futureDate(14), endDate: futureDate(21), note: 'Summer holiday' },
      { userId: caregiverUsers[1].id, createdById: adminUsers[0].id, type: TimeOffType.SICK_LEAVE,  startDate: daysAgo(5),    endDate: daysAgo(3),    note: 'Flu' },
      { userId: caregiverUsers[2].id, createdById: adminUsers[0].id, type: TimeOffType.DAY_OFF,     startDate: futureDate(3), endDate: futureDate(3), note: 'Personal day' },
      { userId: caregiverUsers[3].id, createdById: adminUsers[1].id, type: TimeOffType.VACATION,   startDate: futureDate(30), endDate: futureDate(44), note: 'Annual leave' },
      { userId: caregiverUsers[4].id, createdById: adminUsers[1].id, type: TimeOffType.SICK_LEAVE,  startDate: daysAgo(2),    endDate: daysAgo(1),    note: 'Medical appointment' },
      { userId: caregiverUsers[6].id, createdById: adminUsers[2].id, type: TimeOffType.DAY_OFF,     startDate: futureDate(7), endDate: futureDate(7), note: 'Wedding attendance' },
      { userId: caregiverUsers[7].id, createdById: adminUsers[2].id, type: TimeOffType.VACATION,   startDate: futureDate(60), endDate: futureDate(74), note: 'Summer leave' },
      { userId: caregiverUsers[8].id, createdById: adminUsers[2].id, type: TimeOffType.SICK_LEAVE,  startDate: daysAgo(10),   endDate: daysAgo(8),   note: 'Back injury' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ELDERLY ABSENCES (6)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.elderlyAbsence.createMany({
    data: [
      { elderlyId: 2,  createdById: adminUsers[0].id, startDate: futureDate(10), endDate: futureDate(14), reason: 'Family holiday with son' },
      { elderlyId: 5,  createdById: adminUsers[0].id, startDate: daysAgo(20),   endDate: daysAgo(15),   reason: 'Hospitalisation - pneumonia' },
      { elderlyId: 7,  createdById: adminUsers[1].id, startDate: futureDate(5), endDate: futureDate(7), reason: 'Short family stay' },
      { elderlyId: 9,  createdById: adminUsers[1].id, startDate: daysAgo(30),   endDate: daysAgo(25),   reason: 'Hospital - scheduled surgery' },
      { elderlyId: 12, createdById: adminUsers[2].id, startDate: futureDate(20), endDate: futureDate(25), reason: 'Family visit - grandchildren' },
      { elderlyId: 14, createdById: adminUsers[2].id, startDate: daysAgo(7),    endDate: daysAgo(5),    reason: 'Diagnostic clinic visit' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVITY LOGS (20)
  // ═══════════════════════════════════════════════════════════════════════════
  const allStaffIds = [
    ...caregiverUsers.map(c => c.id),
    ...adminUsers.map(a => a.id),
    ...clinicianProfiles.map(c => c.userId),
  ];
  const activityTypes = [ActivityType.LOGIN, ActivityType.LOGOUT, ActivityType.DATA_ENTRY, ActivityType.DATA_VIEW, ActivityType.OTHER];
  const activityLogData = Array.from({ length: 20 }, (_, i) => ({
    userId: allStaffIds[i % allStaffIds.length],
    type: activityTypes[i % activityTypes.length],
    time: daysAgo(rnd(0, 30)),
  }));
  await prisma.activityLog.createMany({ data: activityLogData });

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMELINE ACTIVITIES (10)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.timelineActivity.createMany({
    data: [
      { institutionId: 1, type: TimelineActivityType.FALL_OCCURRENCE,    elderlyId: 1, userId: caregiverUsers[0].id, relatedId: fallOccurrenceIds[0],  metadata: { description: 'Fall in corridor' } },
      { institutionId: 1, type: TimelineActivityType.FALL_OCCURRENCE,    elderlyId: 3, userId: caregiverUsers[2].id, relatedId: fallOccurrenceIds[2],  metadata: { description: 'Slip on wet floor' } },
      { institutionId: 1, type: TimelineActivityType.MEASUREMENT_ADDED,  elderlyId: 1, userId: caregiverUsers[0].id,                                   metadata: { measurementType: 'BLOOD_PRESSURE_SYSTOLIC' } },
      { institutionId: 1, type: TimelineActivityType.MEDICATION_ADDED,   elderlyId: 1, userId: clinicianProfiles[0].userId,                            metadata: { medicationName: 'Lisinopril' } },
      { institutionId: 1, type: TimelineActivityType.PATHOLOGY_ADDED,    elderlyId: 2, userId: caregiverUsers[1].id,                                   metadata: { pathologyName: 'Diabetes Type 2' } },
      { institutionId: 2, type: TimelineActivityType.FALL_OCCURRENCE,    elderlyId: 7, userId: caregiverUsers[4].id, relatedId: fallOccurrenceIds[6],  metadata: { description: 'Fainted in dining room' } },
      { institutionId: 2, type: TimelineActivityType.MEDICATION_UPDATED, elderlyId: 6, userId: clinicianProfiles[1].userId,                            metadata: { medicationName: 'Warfarin', action: 'discontinued' } },
      { institutionId: 2, type: TimelineActivityType.USER_ADDED,                       userId: caregiverUsers[3].id,                                   metadata: { role: 'CAREGIVER', name: 'Steven Martinez' } },
      { institutionId: 3, type: TimelineActivityType.FALL_OCCURRENCE,    elderlyId: 9, userId: caregiverUsers[3].id, relatedId: fallOccurrenceIds[8],  metadata: { description: 'Garden slip' } },
      { institutionId: 3, type: TimelineActivityType.USER_UPDATED,                       userId: clinicianProfiles[2].userId,                            metadata: { name: 'Dra. Sofia Andrade', field: 'phone' } },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS (10)
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.notification.createMany({
    data: [
      { userId: caregiverUsers[0].id,        type: 'fall_occurrence',     title: 'Fall Detected',          body: 'John Doe had a fall in Corridor A',                      data: { elderlyId: 1 },                               read: true,  readAt: daysAgo(9) },
      { userId: caregiverUsers[1].id,        type: 'fall_occurrence',     title: 'Fall Occurrence Logged', body: 'Jane Roe - fall registered',                             data: { elderlyId: 2 },                               read: true,  readAt: daysAgo(39) },
      { userId: caregiverUsers[4].id,        type: 'fall_occurrence',     title: 'Serious Fall',           body: 'David White fell in dining room - injured',              data: { elderlyId: 7 },                               read: false },
      { userId: adminUsers[0].id,            type: 'data_access_request', title: 'Access Request Pending', body: 'Dr. Maria Santos requests access to patient records',    data: { clinicianId: clinicianProfiles[0].id },     read: false },
      { userId: adminUsers[1].id,            type: 'data_access_request', title: 'New Access Request',     body: 'Dr. Rui Monteiro requests COPD data',                    data: { clinicianId: clinicianProfiles[1].id },     read: false },
      { userId: caregiverUsers[3].id,        type: 'sos_occurrence',      title: 'SOS Alert',              body: 'Linda Green pressed SOS button',                         data: { elderlyId: 6 },                               read: true,  readAt: daysAgo(17) },
      { userId: caregiverUsers[6].id,        type: 'sos_occurrence',      title: 'SOS Alert',              body: 'Carlos Sousa pressed SOS',                               data: { elderlyId: 11 },                              read: false },
      { userId: adminUsers[2].id,            type: 'data_access_request', title: 'Access Request',         body: 'Dra. Sofia Andrade requests dementia records',            data: { clinicianId: clinicianProfiles[2].id },     read: true,  readAt: daysAgo(19) },
      { userId: caregiverUsers[2].id,        type: 'fall_occurrence',     title: 'Fall in Garden',         body: 'Michael Smith - follow-up wound care needed',             data: { elderlyId: 3 },                               read: false },
      { userId: clinicianProfiles[0].userId, type: 'data_access_request', title: 'Access Approved',        body: 'Your request to access patient records was approved',     data: { elderlyId: 1 },                               read: true,  readAt: daysAgo(58) },
    ],
  });

  console.log('');
  console.log('✅  Seed complete!');
  console.log('──────────────────────────────────────────────');
  console.log(`  Institutions      : 3`);
  const userCount = 1 + adminsData.length + cliniciansData.length + caregiversRaw.length + elderlyRaw.length;
  console.log(`  Users             : ${userCount}  (1 programmer + 3 admins + 3 clinicians + 9 caregivers + 15 elderly)`);
  console.log(`  Elderly profiles  : 15  (5 per institution)`);
  console.log(`  Devices           : 6`);
  console.log(`  Sessions          : 10`);
  console.log(`  Fall detections   : 5`);
  console.log(`  Fall occurrences  : ${fallOccurrencesData.length}`);
  console.log(`  SOS occurrences   : 10`);
  console.log(`  Wound trackings   : 8`);
  console.log(`  Fall risk records : 40`);
  console.log(`  Assessments       : 10`);
  console.log(`  Measurements      : ${measurementsData.length}`);
  console.log(`  Pathologies       : 24`);
  console.log(`  Medications       : 26`);
  console.log(`  External profs    : 6`);
  console.log(`  Calendar events   : 20`);
  console.log(`  Work schedules    : ${caregiverUsers.length + adminUsers.length}`);
  console.log(`  Time offs         : 8`);
  console.log(`  Elderly absences  : 6`);
  console.log(`  Activity logs     : 20`);
  console.log(`  Timeline events   : 10`);
  console.log(`  Notifications     : 10`);
  console.log('──────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    (globalThis as any).process?.exit?.(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });