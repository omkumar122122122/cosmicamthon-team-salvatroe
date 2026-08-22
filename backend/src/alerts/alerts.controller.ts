import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AlertsService } from './alerts.service';
import { QueryAlertDto } from './dto/query-alert.dto';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  // ─────────────────────────────────────────────────────────
  // GET /alerts
  // Returns all alerts visible to the authenticated user with
  // role-based scoping + aggregate stats for the dashboard.
  //
  // ADMIN      — sees every alert across all orphanages
  // ORPHANAGE  — sees only alerts linked to their orphanage
  // PARENT     — sees only alerts linked to their profile
  //              or to their adopted child
  // ─────────────────────────────────────────────────────────
  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT)
  @ApiOperation({
    summary: 'List alerts visible to the authenticated user',
    description:
      'Returns role-scoped alerts with aggregate stats (total, high-severity count, pending count). ' +
      'Admin sees all alerts. Orphanage staff see their orphanage alerts. ' +
      'Parents see alerts on their profile or their adopted child.',
  })
  @ApiOkResponse({
    description: 'Alert list with stats',
    schema: {
      example: {
        success: true,
        data: {
          data: [
            {
              id: 'uuid',
              type: 'HEALTH_CRITICAL',
              title: 'Critical health condition: Sara Ali',
              detail: 'Recurring health flags require immediate review.',
              severity: 'CRITICAL',
              status: 'OPEN',
              child: 'Sara Ali',
              orphanage: 'Sunrise Care Home',
              createdAt: '2026-07-15T10:00:00.000Z',
            },
          ],
          stats: { total: 5, high: 2, pending: 4 },
        },
      },
    },
  })
  findAll(
    @Query() query: QueryAlertDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.alertsService.findAll(user.sub, user.role, query);
  }

  // ─────────────────────────────────────────────────────────
  // PATCH /alerts/:id/resolve
  // Marks an alert as RESOLVED.
  // Restricted to ADMIN and ORPHANAGE — parents cannot resolve.
  // ─────────────────────────────────────────────────────────
  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({
    summary: 'Resolve an alert',
    description:
      'Marks the specified alert as RESOLVED and records the resolving officer. ' +
      'The alert must be within the caller\'s role scope. Parents cannot resolve alerts.',
  })
  @ApiOkResponse({
    description: 'Alert resolved',
    schema: {
      example: { success: true, message: 'Alert resolved successfully' },
    },
  })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.alertsService.resolve(id, user.sub, user.role);
  }
}
