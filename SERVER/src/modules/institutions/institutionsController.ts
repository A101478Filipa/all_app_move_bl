import prisma from "../../prisma";
import { Prisma } from '@prisma/client';
import { sendSuccess, sendError, sendInputValidationError } from "../../utils/apiResponse";
import { CreateInstitutionRequest } from "moveplus-shared";

// TODO: Paginate requests
type EntitySearchInput = {
  where: {
    institutionId: number;
    name?: { contains: string; mode: string; };
  };
  include: {
    user: boolean;
    institution: boolean;
  };
}

export const indexInstitutionUsers = async (req, res) => {
  const name = req.query.name as string | undefined;
  const institutionId = req.params.institutionId
    ? Number(req.params.institutionId)
    : Number(req.user.institutionId);

  if (!institutionId) {
    return sendError(res, 'Institution id not found on the request', 400);
  }

  try {
    const searchParameters: EntitySearchInput = {
      where: { institutionId },
      include: { user: true, institution: true },
     };

    if (name) searchParameters.where.name = { contains: name, mode: 'insensitive' }

    const [elderly, admins, caregivers, clinicians] = await Promise.all([
      prisma.elderly.findMany(searchParameters as Prisma.ElderlyFindManyArgs),
      prisma.institutionAdmin.findMany(searchParameters as Prisma.InstitutionAdminFindManyArgs),
      prisma.caregiver.findMany(searchParameters as Prisma.CaregiverFindManyArgs),
      prisma.clinician.findMany(searchParameters as Prisma.ClinicianFindManyArgs),
    ]);

    const message = `Search results for users in institution ${institutionId}${name ? ` with name containing '${name}'` : ''}`;

    sendSuccess(res, {
      elderly: elderly,
      admins: admins,
      caregivers: caregivers,
      clinicians: clinicians,
    }, message);
  } catch (error) {
    console.error(`Error searching users by name in institution ${institutionId}`, error);
    sendError(res, 'An error occurred while searching for users', 500);
  }
};

export const indexInstitutions = async (req, res) => {
  const name = req.query.name as string | undefined;

  try {
    const searchParameters: Prisma.InstitutionFindManyArgs = {
      select: {
        id: true,
        name: true,
        nickname: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        createdAt: true,
        updatedAt: true
      }
    };

    if (name) {
      searchParameters.where = {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { nickname: { contains: name, mode: 'insensitive' } }
        ]
      };
    }

    const institutions = await prisma.institution.findMany(searchParameters);

    const message = name
      ? `Institutions matching '${name}' retrieved successfully`
      : 'All institutions retrieved successfully';

    sendSuccess(res, institutions, message);
  } catch (error) {
    console.error('Error fetching institutions:', error);
    sendError(res, 'An error occurred while fetching institutions', 500);
  }
};

export const createInstitution = async (req, res) => {
  try {
    const validationResult = CreateInstitutionRequest.safeParse(req.body);
    if (!validationResult.success) {
      return sendInputValidationError(res, 'Invalid request data', validationResult.error.errors);
    }

    const { name, nickname, address, phone, email, website } = validationResult.data;

    // Check for duplicate name or nickname (only if nickname is provided)
    const whereConditions: Array<{ name?: { equals: string; mode: Prisma.QueryMode }; nickname?: { equals: string; mode: Prisma.QueryMode } }> = [
      { name: { equals: name, mode: 'insensitive' as Prisma.QueryMode } }
    ];

    if (nickname) {
      whereConditions.push({ nickname: { equals: nickname, mode: 'insensitive' as Prisma.QueryMode } });
    }

    const existingInstitution = await prisma.institution.findFirst({
      where: {
        OR: whereConditions
      }
    });

    if (existingInstitution) {
      const duplicateField = existingInstitution.name.toLowerCase() === name.toLowerCase() ? 'name' : 'nickname';
      return sendError(res, `An institution with this ${duplicateField} already exists`, 409);
    }

    const institution = await prisma.institution.create({
      data: {
        name,
        nickname: nickname || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
      }
    });

    return sendSuccess(res, institution, 'Institution created successfully', 201);
  } catch (error) {
    console.error('Error creating institution:', error);
    return sendError(res, 'An error occurred while creating the institution', 500);
  }
};