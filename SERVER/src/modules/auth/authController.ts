import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../../utils/generateToken';
import prisma from '../../prisma';
import { AppUser, LoginResponse, UserRole } from 'moveplus-shared';
import { sendSuccess, sendError, sendEmptySuccess } from '../../utils/apiResponse';
import { Caregiver, Elderly, Clinician, Programmer, InstitutionAdmin } from 'moveplus-shared';
import { RefreshTokenService } from '../../services/refreshTokenService';
import { InvitationStatus } from '@prisma/client';

// * Check username availability
export const checkUsername = async (req, res) => {
  const username = (req.query.username as string)?.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
      select: { username: true },
    });

    sendSuccess(res, { available: !user }, 'Username availability checked successfully');
  } catch (error) {
    console.error('Error while checking username availability:', error);
    sendError(res, 'Server error', 500);
  }
};

// * Check Email Availability
export const checkEmail = async (req, res) => {
  const email = (req.query.email as string)?.toLowerCase();

  if (!email) {
    return sendError(res, 'Email is required', 400);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true },
    });

    sendSuccess(res, { available: !user }, 'Email availability checked successfully');
  } catch (error) {
    console.error('Error while checking email availability:', error);
    sendError(res, 'Server error', 500);
  }
};

// * Login User
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return sendError(res, 'Username or password not found', 400);
  }

  try {
    const normalizedInput = username.trim().toLowerCase();
    
    // Check if input is email (contains @) or username
    const isEmail = normalizedInput.includes('@');
    
    const user = await prisma.user.findUnique({
      where: isEmail ? { email: normalizedInput } : { username: normalizedInput },
      omit: { password: false }
    })

    if (!user) {
      return sendError(res, 'Invalid username or password', 401, 'LOGIN_FAILED');
    }

    const storedHash = user.password;
    const isMatch = await bcrypt.compare(password, storedHash);

    if (!isMatch) {
      return sendError(res, 'Invalid username or password', 401, 'LOGIN_FAILED');
    }

    const roleData = await findRoleData(user.id, user.role as UserRole);

    if (!roleData) {
      const invitation = await prisma.invitation.findFirst({
        where: {
          email: user.email,
          role: user.role,
          status: 'PROFILE_INCOMPLETE'
        },
        include: { institution: true },
        orderBy: { acceptedAt: 'desc' }
      });

      if (!invitation) {
        return sendError(res, 'User profile not found. Please contact support.', 404, 'PROFILE_NOT_FOUND');
      }

      const response: LoginResponse = {
        profileIncomplete: true,
        profileData: {
          userId: user.id,
          role: user.role as UserRole,
          institutionId: invitation.institutionId,
          email: user.email,
          username: user.username,
        }
      };

      return sendSuccess(res, response, 'Profile incomplete');
    }

    const accessToken = generateAccessToken(user.id, user.role as UserRole, roleData?.institutionId);
    const refreshToken = await RefreshTokenService.createRefreshToken(user.id);

    delete user.password;
    (roleData as any).user = user;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 31 * 24 * 60 * 60 * 1000 // 31 days
    });

    const response: LoginResponse = {
      user: roleData,
      accessToken,
      config: {
        baseUrl: baseUrlForRole(user.role as UserRole),
      }
    }

    sendSuccess(res, response, 'Login successful');
  } catch (error) {
    console.error('Error during login:', error);
    sendError(res, 'Server error', 500);
  }
};

// * Refreshes accessToken
export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return sendError(res, 'Refresh token not found', 401);
  }

  try {
    const decoded = await RefreshTokenService.validateRefreshToken(refreshToken);

    if (!decoded) {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const roleData = await findRoleData(user.id, user.role as UserRole);
    const newAccessToken = generateAccessToken(user.id, user.role as UserRole, roleData?.institutionId);

    await RefreshTokenService.revokeRefreshToken(refreshToken);
    const newRefreshToken = await RefreshTokenService.createRefreshToken(user.id);

    res.header('Authorization', newAccessToken)
      .cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

    sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed successfully');
  } catch (error) {
    console.error('Error during token refresh:', error);
    sendError(res, 'Invalid refresh token', 403);
  }
};

// * User logout
export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await RefreshTokenService.revokeRefreshToken(refreshToken);
  }

  res.clearCookie('refreshToken');
  sendEmptySuccess(res, 'Logged out successfully');
};

// * Logout from all devices
export const logoutAll = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const decoded = await RefreshTokenService.validateRefreshToken(refreshToken);

      if (decoded) {
        await RefreshTokenService.revokeAllUserTokens(decoded.userId);
      }
    }

    res.clearCookie('refreshToken');
    sendEmptySuccess(res, 'Logged out from all devices successfully');
  } catch (error) {
    console.error('Error during logout all:', error);
    sendError(res, 'Error logging out from all devices', 500);
  }
};

type RoleDataWithInstitution = {
  id: number;
  userId: number;
  institutionId?: number;
  [key: string]: any;
};

const findRoleData = async (userId: number, userRole: UserRole): Promise<AppUser | null> => {
  switch (userRole) {
    case UserRole.CAREGIVER:
      return await prisma.caregiver.findFirst({
        where: { user: { id: userId } },
        include: { institution: true, user: true },
      }) as Caregiver;

    case UserRole.ELDERLY:
      return await prisma.elderly.findFirst({
        where: { user: { id: userId } },
        include: { institution: true, user: true },
      }) as any;

    case UserRole.CLINICIAN:
      return await prisma.clinician.findFirst({
        where: { user: { id: userId } },
        include: { institution: true, user: true },
      }) as Clinician;

    case UserRole.PROGRAMMER:
      return await prisma.programmer.findFirst({
        where: { user: { id: userId } },
        include: { user: true },
      }) as Programmer;

    case UserRole.INSTITUTION_ADMIN:
      return await prisma.institutionAdmin.findFirst({
        where: { user: { id: userId } },
        include: { institution: true, user: true }
      }) as InstitutionAdmin;

    default:
      return null
  }
};

const baseUrlForRole = (role: UserRole): string => {
  switch (role) {
    case UserRole.CAREGIVER:
      return 'caregivers';
    case UserRole.ELDERLY:
      return 'elderly';
    case UserRole.CLINICIAN:
      return 'clinicians';
    case UserRole.PROGRAMMER:
      return 'programmers';
    case UserRole.INSTITUTION_ADMIN:
      return 'institution-admins';
    default:
      return '';
  }
}

// * Complete Profile (for invitation-based registrations)
export const completeProfile = async (req, res) => {
  try {
    const { role, profileData } = req.body;

    if (!role || !profileData) {
      return sendError(res, 'Role and profile data are required', 400);
    }

    const { userId, institutionId, name, birthDate, gender, email, address, nif } = profileData;

    const isClinicianSelfReg = role === UserRole.CLINICIAN;
    if (!userId || (!isClinicianSelfReg && !institutionId) || !name || !birthDate || !gender) {
      return sendError(res, 'Missing required profile fields', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Update user email if provided (should match invitation email)
    if (email && email !== user.email) {
      await prisma.user.update({
        where: { id: userId },
        data: { email }
      });
    }

    let existingProfile = null;
    if (role === UserRole.ELDERLY) {
      existingProfile = await prisma.elderly.findUnique({ where: { userId } });
    } else if (role === UserRole.CAREGIVER) {
      existingProfile = await prisma.caregiver.findUnique({ where: { userId } });
    } else if (role === UserRole.INSTITUTION_ADMIN) {
      existingProfile = await prisma.institutionAdmin.findUnique({ where: { userId } });
    } else if (role === UserRole.CLINICIAN) {
      existingProfile = await prisma.clinician.findUnique({ where: { userId } });
    }

    if (existingProfile) {
      return sendError(res, 'Profile already completed', 400);
    }

    let createdProfile = null;

    if (role === UserRole.ELDERLY) {
      const { medicalId, phone, address } = profileData;

      if (!medicalId) {
        return sendError(res, 'Medical ID is required for elderly users', 400);
      }

      const existingMedicalId = await prisma.elderly.findFirst({
        where: { medicalId: parseInt(medicalId) }
      });

      if (existingMedicalId) {
        return sendError(res, 'Medical ID is already taken', 400);
      }

      createdProfile = await prisma.elderly.create({
        data: {
          userId,
          medicalId: parseInt(medicalId),
          name,
          institutionId,
          birthDate: new Date(birthDate),
          gender,
          phone: phone || null,
          address: address || null,
          nif: nif || null
        }
      });
    } else if (role === UserRole.CAREGIVER) {
      const { phone } = profileData;

      createdProfile = await prisma.caregiver.create({
        data: {
          userId,
          name,
          institutionId,
          birthDate: new Date(birthDate),
          gender,
          phone: phone || null,
          address: address || null,
          nif: nif || null
        }
      });
    } else if (role === UserRole.INSTITUTION_ADMIN) {
      const { phoneNumber } = profileData;

      createdProfile = await prisma.institutionAdmin.create({
        data: {
          userId,
          name,
          institutionId,
          birthDate: new Date(birthDate),
          gender,
          phoneNumber: phoneNumber || null,
          address: address || null,
          nif: nif || null
        }
      });
    } else if (role === UserRole.CLINICIAN) {
      const { phone } = profileData;

      createdProfile = await prisma.clinician.create({
        data: {
          userId,
          name,
          institutionId: institutionId || null,
          birthDate: new Date(birthDate),
          gender,
          phone: phone || null,
        }
      });
    } else {
      return sendError(res, 'Invalid role for profile completion', 400);
    }

    await prisma.invitation.updateMany({
      where: {
        email: user.email,
        status: InvitationStatus.PROFILE_INCOMPLETE
      },
      data: {
        status: InvitationStatus.ACCEPTED
      }
    });

    return sendSuccess(res, createdProfile, 'Profile completed successfully', 201);
  } catch (error) {
    console.error('Complete profile error:', error);
    return sendError(res, 'An error occurred while completing the profile', 500);
  }
};