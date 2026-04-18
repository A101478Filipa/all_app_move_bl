import bcrypt from 'bcryptjs';
import prisma from '../../../prisma';
import { Response } from 'express';
import { UserRole } from 'moveplus-shared';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { sendSuccess, sendError } from '../../../utils/apiResponse';
import { TimelineService } from '../../../services/timelineService';
import { RegisterElderlyRequest, RegisterCaregiverRequest, RegisterClinicianRequest } from 'moveplus-shared';
import { send } from 'node:process';

// ? Send authentication tokens after register?
// MARK: Helpers
const registerUser = async (tx, username: string, email: string, password: string, role: UserRole) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await tx.user.create({
    data: {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role as PrismaUserRole
    }
  });

  return user.id;
};

const catchError = (error, res: Response) => {
  console.error('Error during registration:', error);

  if (error.code === 'P2002') {
    if (error.meta?.target?.includes('username')) {
      sendError(res, 'Username is already taken', 400);
      return
    }
    if (error.meta?.target?.includes('email')) {
      sendError(res, 'Email is already registered', 400);
      return;
    }
    if (error.meta?.target?.includes('medicalId')) {
      sendError(res, 'Medical ID is already in use', 400);
      return;
    }
    sendError(res, 'A user with this information already exists', 400);
    return;
  }

  if (error.code === 'P2003') {
    sendError(res, 'Invalid institution ID', 400);
    return;
  }

  sendError(res, 'Registration failed. Please try again.', 500);
}

// MARK: RegisterElderly
export const registerElderly = async (req, res) => {
  const requestData: RegisterElderlyRequest = req.body;
  const {
    username, password, medicalId,
    name, birthDate, gender,
    address, phone, email,
    emergencyContact
  } = requestData;

  if (!username || !password || !name || !birthDate || !gender || !medicalId) {
    return res.status(400).json({
      message: 'Username, password, name, birth date, gender, and medical ID are required'
    });
  }

  if (!email) {
    return res.status(400).json({
      message: 'Email is required'
    });
  }

  const institutionId = requestData.institutionId || req.user.institutionId;

  if (!institutionId) {
    return res.status(400).json({ message: 'Institution ID is required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const userId = await registerUser(tx, username, email, password, UserRole.ELDERLY);

      const elderly = await tx.elderly.create({
        data: {
          userId,
          medicalId: Number(medicalId),
          name,
          institutionId,
          birthDate: new Date(birthDate),
          gender,
          address,
          phone,
          emergencyContact,
        }
      });

      return { userId, elderly };
    });

    try {
      await TimelineService.createUserActivity(
        institutionId,
        { id: result.elderly.id, role: UserRole.ELDERLY },
        name,
        false
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    sendSuccess(res, {}, 'Elderly registered successfully!', 201);
  } catch (error) {
    catchError(error, res);
  }
};

// MARK: Register Caregiver
export const registerCaregiver = async (req, res) => {
  const requestData: RegisterCaregiverRequest = req.body;
  const {
    username, password, name,
    birthDate, gender, phone,
    email
  } = requestData;

  // Validate required fields
  if (!username || !password || !name || !birthDate || !gender || !email) {
    return res.status(400).json({
      message: 'Username, password, name, birth date, gender, and email are required'
    });
  }

  const institutionId = requestData.institutionId || req.user.institutionId;

  if (!institutionId) {
    return res.status(400).json({ message: 'Institution ID is required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const userId = await registerUser(tx, username, email, password, UserRole.CAREGIVER);

      const caregiver = await tx.caregiver.create({
        data: {
          userId, name, birthDate: new Date(birthDate),
          gender, phone, institutionId,
        }
      });

      return { userId, caregiver };
    });

    try {
      await TimelineService.createUserActivity(
        institutionId,
        { id: result.caregiver.id, role: UserRole.CAREGIVER },
        name,
        false
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    sendSuccess(res, {}, 'Caregiver registered successfully!', 201);
  } catch (error) {
    catchError(error, res);
  }
};

// MARK: Register Clinician (Self-registration — no auth required)
export const registerClinicianSelf = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return sendError(res, 'Username, email and password are required', 400);
  }

  try {
    const userId = await prisma.$transaction(async (tx) => {
      return registerUser(tx, username, email, password, UserRole.CLINICIAN);
    });

    sendSuccess(res, { userId }, 'Clinician user created', 201);
  } catch (error) {
    catchError(error, res);
  }
};

// MARK: Register Clinician (by Programmer)
export const registerClinician = async (req, res) => {
  const requestData: RegisterClinicianRequest = req.body;
  const {
    username, password, name,
    birthDate, gender, phone,
    email
  } = requestData;

  // Validate required fields
  if (!username || !password || !name || !birthDate || !gender || !email) {
    return res.status(400).json({
      message: 'Username, password, name, birth date, gender, and email are required'
    });
  }

  const institutionId = requestData.institutionId || req.user.institutionId;

  if (!institutionId) {
    return res.status(400).json({ message: 'Institution ID is required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const userId = await registerUser(tx, username, email, password, UserRole.CLINICIAN);

      const clinician = await tx.clinician.create({
        data: {
          userId, name, birthDate: new Date(birthDate),
          gender, phone, institutionId,
        }
      });

      return { userId, clinician };
    });

    // Create timeline activity for new user
    try {
      await TimelineService.createUserActivity(
        institutionId,
        { id: result.clinician.id, role: UserRole.CLINICIAN },
        name,
        false
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    sendSuccess(res, {}, 'Clinician registered successfully!', 201);
  } catch (error) {
    catchError(error, res);
  }
};