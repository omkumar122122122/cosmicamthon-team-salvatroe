import { Injectable } from '@nestjs/common';
import { Orphanage, OrphanageLicense, LicenseStatus } from '@prisma/client';

@Injectable()
export class ComplianceCalculatorService {
  /**
   * Calculate compliance score based on orphanage data and licenses
   * Scoring breakdown:
   * - KYC Documents: 40%
   * - Staff Information: 20%
   * - Facilities: 15%
   * - AI Safety Features: 15%
   * - Bank Details: 10%
   */
  calculateComplianceScore(
    orphanage: Orphanage,
    licenses: OrphanageLicense[],
  ): number {
    let score = 0;

    // KYC Documents (40 points)
    score += this.calculateKycScore(licenses);

    // Staff Information (20 points)
    score += this.calculateStaffScore(orphanage);

    // Facilities (15 points)
    score += this.calculateFacilitiesScore(orphanage);

    // AI Safety Features (15 points)
    score += this.calculateAiSafetyScore(orphanage);

    // Bank Details (10 points)
    score += this.calculateBankDetailsScore(orphanage);

    return Math.round(score);
  }

  private calculateKycScore(licenses: OrphanageLicense[]): number {
    let kycScore = 0;
    const maxKycScore = 40;
    const requiredLicenses = [
      'REGISTRATION_CERTIFICATE',
      'NGO_CERTIFICATE',
      'GOVERNMENT_LICENSE',
    ];

    // FIX-9: Accept both VERIFIED and VALID status
    const verifiedLicenses = licenses.filter(
      (l) =>
        ((l.status as string) === 'VERIFIED' || l.status === LicenseStatus.VALID) &&
        requiredLicenses.includes(l.licenseType),
    );

    // Each verified license worth 13.33 points (40/3)
    kycScore = (verifiedLicenses.length / requiredLicenses.length) * maxKycScore;

    return kycScore;
  }

  private calculateStaffScore(orphanage: Orphanage): number {
    let staffScore = 0;
    const maxStaffScore = 20;

    // Check if basic capacity information is filled
    if (orphanage.totalCapacity > 0) {
      staffScore += 10;
    }

    // Check if current occupancy is tracked
    if (orphanage.currentOccupancy !== null && orphanage.currentOccupancy >= 0) {
      staffScore += 10;
    }

    return staffScore;
  }

  private calculateFacilitiesScore(orphanage: Orphanage): number {
    let facilitiesScore = 0;
    const maxFacilitiesScore = 15;

    // Address completeness (5 points)
    if (
      orphanage.addressLine1 &&
      orphanage.city &&
      orphanage.state &&
      orphanage.pincode
    ) {
      facilitiesScore += 5;
    }

    // Contact information (5 points)
    if (orphanage.phone && orphanage.officialEmail) {
      facilitiesScore += 5;
    }

    // Capacity planning (5 points)
    if (orphanage.totalCapacity > 0 && orphanage.currentOccupancy <= orphanage.totalCapacity) {
      facilitiesScore += 5;
    }

    return facilitiesScore;
  }

  private calculateAiSafetyScore(orphanage: Orphanage): number {
    let aiScore = 0;
    const maxAiScore = 15;
    let enabledFeatures = 0;
    const totalFeatures = 5;

    // Count enabled AI safety features
    if (orphanage.faceRecognitionEnabled) enabledFeatures++;
    if (orphanage.cctvInstalled && orphanage.numberOfCameras > 0) enabledFeatures++;
    if (orphanage.gpsTrackingAvailable) enabledFeatures++;
    if (orphanage.emergencyAlertEnabled) enabledFeatures++;
    if (orphanage.biometricAttendanceEnabled) enabledFeatures++;

    // Calculate proportional score
    aiScore = (enabledFeatures / totalFeatures) * maxAiScore;

    return aiScore;
  }

  private calculateBankDetailsScore(orphanage: Orphanage): number {
    let bankScore = 0;
    const maxBankScore = 10;

    // Check if all bank details are provided
    const hasBankName = !!orphanage.bankName;
    const hasAccountNumber = !!orphanage.bankAccountNumber;
    const hasIfscCode = !!orphanage.bankIfscCode;
    const hasAccountHolder = !!orphanage.bankAccountHolder;

    const filledFields = [
      hasBankName,
      hasAccountNumber,
      hasIfscCode,
      hasAccountHolder,
    ].filter(Boolean).length;

    // Each field worth 2.5 points (10/4)
    bankScore = (filledFields / 4) * maxBankScore;

    return bankScore;
  }

  /**
   * Get compliance status based on score
   */
  getComplianceStatus(score: number): 'CRITICAL' | 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 80) return 'HIGH';
    if (score >= 60) return 'MEDIUM';
    if (score >= 40) return 'LOW';
    return 'CRITICAL';
  }

  /**
   * Get compliance recommendations based on score
   */
  getComplianceRecommendations(
    orphanage: Orphanage,
    licenses: OrphanageLicense[],
  ): string[] {
    const recommendations: string[] = [];

    // KYC recommendations
    const requiredLicenses = [
      'REGISTRATION_CERTIFICATE',
      'NGO_CERTIFICATE',
      'GOVERNMENT_LICENSE',
    ];
    const verifiedLicenses = licenses.filter(
      (l) => (l.status as string) === 'VERIFIED' && requiredLicenses.includes(l.licenseType),
    );

    if (verifiedLicenses.length < requiredLicenses.length) {
      recommendations.push('Complete all KYC documents and get them verified');
    }

    // Staff recommendations
    if (orphanage.totalCapacity === 0) {
      recommendations.push('Update total capacity information');
    }

    // AI safety recommendations
    if (!orphanage.faceRecognitionEnabled) {
      recommendations.push('Enable face recognition for enhanced child safety');
    }

    if (!orphanage.cctvInstalled || orphanage.numberOfCameras === 0) {
      recommendations.push('Install CCTV cameras for monitoring');
    }

    if (!orphanage.emergencyAlertEnabled) {
      recommendations.push('Enable emergency alert system');
    }

    // Bank recommendations
    if (!orphanage.bankAccountNumber || !orphanage.bankIfscCode) {
      recommendations.push('Complete bank account details for fund transfers');
    }

    return recommendations;
  }
}
