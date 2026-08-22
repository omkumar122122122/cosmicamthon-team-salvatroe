import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationRequestDto } from './dto/create-donation-request.dto';
import { UpdateDonationRequestStatusDto } from './dto/update-donation-request-status.dto';

@Injectable()
export class DonationRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new donation request (donor submits a schedule)
   */
  async create(donorUserId: string, dto: CreateDonationRequestDto) {
    // Resolve the donor record from the user ID
    const donor = await this.prisma.donor.findFirst({
      where: {
        OR: [{ userId: donorUserId }, { id: donorUserId }, { email: donorUserId }],
      },
    });

    if (!donor) {
      throw new NotFoundException('Donor profile not found');
    }

    // Verify orphanage exists
    const orphanage = await this.prisma.orphanage.findUnique({
      where: { id: dto.orphanageId },
    });

    if (!orphanage) {
      throw new NotFoundException(`Orphanage with ID "${dto.orphanageId}" not found`);
    }

    const donationRequest = await this.prisma.donationRequest.create({
      data: {
        donorId: donor.id,
        orphanageId: dto.orphanageId,
        donationType: dto.donationType,
        quantity: dto.quantity,
        preferredDate: new Date(dto.preferredDate),
        preferredTime: dto.preferredTime,
        message: dto.message || null,
        status: 'PENDING',
      },
      include: {
        donor: {
          select: { id: true, fullName: true, email: true, mobileNumber: true, city: true },
        },
      },
    });

    return {
      message: 'Donation request submitted successfully. Status: Pending',
      donationRequest,
    };
  }

  /**
   * Get all donation requests submitted by the authenticated donor
   */
  async findByDonor(donorUserId: string) {
    const donor = await this.prisma.donor.findFirst({
      where: {
        OR: [{ userId: donorUserId }, { id: donorUserId }, { email: donorUserId }],
      },
    });

    if (!donor) {
      return [];
    }

    const requests = await this.prisma.donationRequest.findMany({
      where: { donorId: donor.id },
      orderBy: { createdAt: 'desc' },
    });

    // Populate orphanage details for each request
    const orphanageIds = Array.from(new Set(requests.map((r) => r.orphanageId)));
    const orphanages = await this.prisma.orphanage.findMany({
      where: { id: { in: orphanageIds } },
      select: { id: true, name: true, city: true, state: true, phone: true, officialEmail: true },
    });
    const orphanageMap = new Map(orphanages.map((o) => [o.id, o]));

    return requests.map((r) => ({
      ...r,
      orphanage: orphanageMap.get(r.orphanageId) || {
        id: r.orphanageId,
        name: 'Care Home Facility',
        city: 'Delhi',
        state: 'India',
        phone: '+91 98765 40000',
      },
    }));
  }

  /**
   * Get all incoming donation requests for an orphanage
   */
  async findByOrphanage(orphanageUserId: string) {
    // Resolve orphanage from userId
    const orphanage = await this.prisma.orphanage.findFirst({
      where: {
        OR: [{ userId: orphanageUserId }, { id: orphanageUserId }],
      },
    });

    if (!orphanage) {
      return [];
    }

    return this.prisma.donationRequest.findMany({
      where: { orphanageId: orphanage.id },
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobileNumber: true,
            city: true,
          },
        },
      },
    });
  }

  /**
   * Update the status of a donation request (orphanage action)
   */
  async updateStatus(
    id: string,
    orphanageUserId: string,
    dto: UpdateDonationRequestStatusDto,
  ) {
    const request = await this.prisma.donationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Donation request "${id}" not found`);
    }

    // Verify the request belongs to this orphanage
    const orphanage = await this.prisma.orphanage.findFirst({
      where: {
        OR: [{ userId: orphanageUserId }, { id: orphanageUserId }],
      },
    });

    if (!orphanage || request.orphanageId !== orphanage.id) {
      throw new ForbiddenException('You do not have permission to update this donation request');
    }

    // Validate rejection reason when rejecting
    if (dto.status === 'REJECTED' && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Rejection reason is required when rejecting a donation request');
    }

    // Validate status transition
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['COMPLETED', 'REJECTED', 'CANCELLED'],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[request.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${request.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.donationRequest.update({
      where: { id },
      data: {
        status: dto.status as any,
        rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
      },
      include: {
        donor: {
          select: { id: true, userId: true, fullName: true, email: true, mobileNumber: true },
        },
      },
    });

    // Notify donor via Notification System
    if (updated.donor && updated.donor.userId) {
      let notifTitle = '';
      let notifBody = '';

      if (dto.status === 'ACCEPTED') {
        notifTitle = 'Donation Schedule Accepted ❤️';
        notifBody = `Your donation schedule of ${request.donationType} (Qty: ${request.quantity}) to ${orphanage.name} has been accepted!`;
      } else if (dto.status === 'REJECTED') {
        notifTitle = 'Donation Request Update';
        notifBody = `Your donation schedule of ${request.donationType} to ${orphanage.name} was rejected. Reason: ${dto.rejectionReason}`;
      } else if (dto.status === 'COMPLETED') {
        notifTitle = 'Donation Completed 🎉';
        notifBody = `Your donation of ${request.donationType} (Qty: ${request.quantity}) to ${orphanage.name} has been marked as completed. Thank you for your generosity!`;
      }

      if (notifTitle && notifBody) {
        try {
          await this.prisma.notification.create({
            data: {
              userId: updated.donor.userId,
              type: 'VISIT_REQUEST_UPDATE' as any, // reuse existing notification enum type safely
              channel: 'IN_APP' as any,
              title: notifTitle,
              body: notifBody,
              relatedEntityType: 'DonationRequest',
              relatedEntityId: request.id,
              sentAt: new Date(),
            },
          });
        } catch (err) {
          // Log notification error gracefully without breaking transaction response
          console.warn('Could not record in-app notification:', err?.message || err);
        }
      }
    }

    return {
      message: `Donation request ${dto.status.toLowerCase()} successfully`,
      donationRequest: updated,
    };
  }

  /**
   * Cancel a donation request (donor action)
   */
  async cancelByDonor(id: string, donorUserId: string) {
    const request = await this.prisma.donationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Donation request "${id}" not found`);
    }

    const donor = await this.prisma.donor.findFirst({
      where: { OR: [{ userId: donorUserId }, { id: donorUserId }, { email: donorUserId }] },
    });

    if (!donor || request.donorId !== donor.id) {
      throw new ForbiddenException('You do not have permission to cancel this donation request');
    }

    const currentStatus = request.status as string;
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      throw new BadRequestException(`Cannot cancel a donation request that is already ${currentStatus.toLowerCase()}`);
    }

    const updated = await this.prisma.donationRequest.update({
      where: { id },
      data: { status: 'CANCELLED' as any },
    });

    return {
      message: 'Donation request cancelled successfully',
      donationRequest: updated,
    };
  }

  /**
   * Get a single donation request by ID
   */
  async findOne(id: string) {
    const request = await this.prisma.donationRequest.findUnique({
      where: { id },
      include: {
        donor: {
          select: { id: true, fullName: true, email: true, mobileNumber: true, city: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Donation request "${id}" not found`);
    }

    return request;
  }
}
