import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ChildrenService } from './children.service';
import {
  CreateChildDto,
  UpdateChildDto,
  FilterChildrenDto,
  ChildrenListResponseDto,
  ChildProfileDto,
  ChildBasicDto,
  CreateChildResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

const childPhotoStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(process.cwd(), 'uploads', 'children');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

@ApiTags('Children')
@ApiBearerAuth()
@Controller('children')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new child' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        approximateAge: { type: 'number' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] },
        bloodGroup: { type: 'string' },
        admissionDate: { type: 'string', format: 'date' },
        orphanageId: { type: 'string' },
        foundCondition: { type: 'string' },
        foundLocation: { type: 'string' },
        medicalCondition: { type: 'string' },
        identificationMarks: { type: 'string' },
        notes: { type: 'string' },
        photo: { type: 'string', format: 'binary' },
      },
      required: ['firstName', 'approximateAge', 'gender', 'bloodGroup'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Child registered successfully',
    type: CreateChildResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  @UseInterceptors(FileInterceptor('photo', { storage: childPhotoStorage }))
  async create(
    @Body() createChildDto: CreateChildDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    photo: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateChildResponseDto> {
    const photoUrl = photo ? `/uploads/children/${photo.filename}` : null;
    return this.childrenService.create(createChildDto, photoUrl, user.sub, user.role);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get all children with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of children retrieved successfully',
    type: ChildrenListResponseDto,
  })
  async findAll(
    @Query() filterDto: FilterChildrenDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ChildrenListResponseDto> {
    return this.childrenService.findAll(filterDto, user.sub, user.role);
  }

  @Get('recent')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get recently registered children' })
  @ApiResponse({
    status: 200,
    description: 'Recent children retrieved successfully',
    type: [ChildBasicDto],
  })
  async getRecent(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ChildBasicDto[]> {
    return this.childrenService.getRecentChildren(limit, user.sub, user.role);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT)
  @ApiOperation({ summary: 'Get child profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Child profile retrieved successfully',
    type: ChildProfileDto,
  })
  @ApiResponse({ status: 404, description: 'Child not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ChildProfileDto> {
    return this.childrenService.findOne(id, user.sub, user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update child information' })
  @ApiResponse({ status: 204, description: 'Child updated successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async update(
    @Param('id') id: string,
    @Body() updateChildDto: UpdateChildDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.childrenService.update(id, updateChildDto, user.sub, user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a child record' })
  @ApiResponse({ status: 204, description: 'Child deleted successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.childrenService.remove(id, user.sub);
  }
}
