import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DonorsService } from './donors.service';
import { DonorRegisterDto } from './dto/donor-register.dto';
import { DonorLoginDto } from './dto/donor-login.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Donors')
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new donor' })
  async register(@Body() dto: DonorRegisterDto) {
    return this.donorsService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Donor login' })
  async login(@Body() dto: DonorLoginDto) {
    return this.donorsService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('profile')
  @ApiOperation({ summary: 'Get current donor profile' })
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.donorsService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('donations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new donation' })
  async createDonation(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDonationDto,
  ) {
    return this.donorsService.createDonation(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('donations')
  @ApiOperation({ summary: 'Get donor donation history' })
  async getDonations(@CurrentUser('userId') userId: string) {
    return this.donorsService.getDonations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('stats')
  @ApiOperation({ summary: 'Get donor impact stats' })
  async getStats(@CurrentUser('userId') userId: string) {
    return this.donorsService.getStats(userId);
  }
}
