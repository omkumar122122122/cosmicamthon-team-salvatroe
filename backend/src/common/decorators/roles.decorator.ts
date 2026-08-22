import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../constants/auth.constants';

/**
 * Restrict a route to one or more roles.
 *
 * @example
 * @Roles(Role.ADMIN, Role.ORPHANAGE)
 * @Get('children')
 * getChildren() {}
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
