import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AdoptionsService } from './adoptions.service';
import { CreateAdoptionDto, QueryAdoptionDto, UpdateAdoptionStatusDto } from './dto';

@ApiTags('Adoption Records')
@ApiBearerAuth()
@Controller('adoptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdoptionsController {
  constructor(private readonly adoptions: AdoptionsService) {}

  @Get('verify')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Verify parent-child eligibility for adoption' })
  verify(@Query('parentId') parentId: string, @Query('childId') childId: string, @CurrentUser() user: JwtPayload) {
    if (!parentId || !childId) throw new BadRequestException('parentId and childId are required');
    return this.adoptions.verifyEligibility(parentId, childId, user.sub, user.role);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT)
  @ApiOperation({ summary: 'List adoption records scoped to the authenticated role' })
  findAll(@Query() query: QueryAdoptionDto, @CurrentUser() user: JwtPayload) { return this.adoptions.findAll(query, user.sub, user.role); }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT)
  @ApiOperation({ summary: 'Get an adoption record' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) { return this.adoptions.findOne(id, user.sub, user.role); }

  @Post()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Submit an eligible adoption for final admin review' })
  @ApiResponse({ status: 201, description: 'Adoption submitted for legal review' })
  create(@Body() dto: CreateAdoptionDto, @CurrentUser() user: JwtPayload) { return this.adoptions.create(dto, user.sub, user.role); }

  @Post(':id/documents')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['documentType', 'file'], properties: { documentType: { type: 'string' }, file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload a required adoption document' })
  async upload(@Param('id') id: string, @Body('documentType') documentType: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: JwtPayload) {
    if (!file || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype) || file.size > 10 * 1024 * 1024) throw new BadRequestException('Upload a PDF, JPEG, or PNG no larger than 10 MB');
    const folder = path.resolve(process.cwd(), 'uploads', 'adoption-documents', id);
    await fs.promises.mkdir(folder, { recursive: true });
    const fileName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
    const storagePath = path.join('uploads', 'adoption-documents', id, fileName);
    await fs.promises.writeFile(path.join(folder, fileName), file.buffer);
    return this.adoptions.uploadDocument(id, documentType, file, user.sub, user.role, { fileName, storagePath, storageUrl: `/uploads/adoption-documents/${id}/${fileName}` });
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve or cancel an adoption record' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAdoptionStatusDto, @CurrentUser('sub') userId: string) { return this.adoptions.updateStatus(id, dto, userId); }
}
