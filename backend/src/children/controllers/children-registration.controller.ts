import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ChildrenRegistrationService } from '../services/children-registration.service';
import { RegisterChildDto } from '../dto/register-child.dto';
import { RegisterChildResponseDto } from '../dto/register-child-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Children Registration')
@ApiBearerAuth()
@Controller('children')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChildrenRegistrationController {
  constructor(
    private readonly childrenRegistrationService: ChildrenRegistrationService
  ) {}

  @Post('register')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new child in the Child Safety Management System',
    description:
      'Creates a new child welfare intake record, initializes attendance profile, records audit log, and notifies admin users.',
  })
  @ApiResponse({
    status: 201,
    description: 'Child registered successfully',
    type: RegisterChildResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or validation failure' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only Admin and Orphanage Staff can register children.' })
  @ApiResponse({ status: 409, description: 'Child already registered in this orphanage' })
  async register(
    @Body() registerChildDto: RegisterChildDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request
  ): Promise<RegisterChildResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.childrenRegistrationService.registerChild(
      registerChildDto,
      user.sub,
      user.role,
      ipAddress,
      userAgent
    );
  }
}
