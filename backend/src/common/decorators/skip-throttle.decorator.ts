import { SetMetadata } from '@nestjs/common';
import { SKIP_THROTTLE_KEY } from '../constants/auth.constants';

/**
 * Skip rate limiting for a specific route.
 *
 * @example
 * @SkipThrottle()
 * @Get('health')
 * healthCheck() {}
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
