import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskLevel } from '@prisma/client';
import {
  AdminStatsDto,
  AIInsightDto,
  StatCardDto,
  AdminChartsDto,
  RecentChildrenDto,
  RecentChildDto,
} from './dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Admin Dashboard Statistics
   * Aggregates data from Children, Orphanages, and system metrics
   */
  async getAdminStats(): Promise<AdminStatsDto> {
    // Get total children count
    const totalChildren = await this.prisma.child.count();

    // Get risk distribution (mocked since riskLevel is not a direct column on Child)
    const highRiskCount = Math.floor(totalChildren * 0.05);
    const riskPercentage =
      totalChildren > 0
        ? ((highRiskCount / totalChildren) * 100).toFixed(1)
        : '0.0';

    // Get average attendance (mock calculation - can be replaced with real data)
    const avgAttendance = '89.8';

    // Get active orphanages count
    const activeOrphanages = await this.prisma.orphanage.count({
      where: { isActive: true },
    });

    // Get critical alerts count (mock - replace with real alerts service)
    const criticalAlerts = 7;

    // AI Insights
    const aiInsights: AIInsightDto[] = [
      {
        label: 'AI Safety Score',
        value: '94%',
        up: true,
      },
      {
        label: 'Compliance Rate',
        value: '92%',
        up: true,
      },
      {
        label: 'Risk-flagged Children',
        value: `${riskPercentage}%`,
        up: false,
      },
      {
        label: 'Avg Attendance',
        value: `${avgAttendance}%`,
        up: true,
      },
    ];

    // Calculate trends (mock - can be replaced with real trend calculation)
    const childrenTrend = '+8.2%';
    const orphanagesTrend = `+${activeOrphanages > 15 ? '2' : '1'}`;
    const alertsTrend = '-4';

    // Stat Cards
    const stats: StatCardDto[] = [
      {
        label: 'Registered Children',
        value: totalChildren.toLocaleString(),
        trend: childrenTrend,
        tone: 'blue',
      },
      {
        label: 'Safe Zones Online',
        value: (activeOrphanages * 2 + 8).toString(), // Mock calculation
        trend: '+3',
        tone: 'green',
      },
      {
        label: 'Active Orphanages',
        value: activeOrphanages.toString(),
        trend: orphanagesTrend,
        tone: 'amber',
      },
      {
        label: 'Critical Alerts',
        value: criticalAlerts.toString(),
        trend: alertsTrend,
        tone: 'red',
      },
    ];

    return {
      aiInsights,
      stats,
      systemStatus: 'Operational',
      aiModelStatus: 'Active',
    };
  }

  /**
   * Get Admin Dashboard Charts Data
   * Returns monthly safety trends and risk distribution
   */
  async getAdminCharts(): Promise<AdminChartsDto> {
    // Get risk distribution for doughnut chart (mocked)
    const totalChildren = await this.prisma.child.count();
    const lowCount = Math.floor(totalChildren * 0.7);
    const mediumCount = Math.floor(totalChildren * 0.25);
    const highCount = totalChildren - lowCount - mediumCount;

    // Monthly safety chart (mock data - replace with real time-series data)
    // In production, this would query historical metrics from a time-series table
    const monthlySafety = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Safety Score',
          data: [88, 89, 91, 89, 92, 93],
          borderColor: '#3B82F6',
        },
        {
          label: 'Compliance Score',
          data: [85, 86, 87, 88, 89, 91],
          borderColor: '#10B981',
        },
        {
          label: 'Health Index',
          data: [90, 88, 89, 91, 90, 92],
          borderColor: '#F59E0B',
        },
      ],
    };

    // Risk distribution doughnut chart
    const riskDistribution = {
      labels: ['Low', 'Medium', 'High'],
      datasets: [
        {
          data: [lowCount, mediumCount, highCount],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        },
      ],
    };

    return {
      monthlySafety,
      riskDistribution,
    };
  }

  /**
   * Get Recent Children for Admin Dashboard
   * Returns the 5 most recently registered children
   */
  async getRecentChildren(): Promise<RecentChildrenDto> {
    const totalChildren = await this.prisma.child.count();

    const recentChildren = await this.prisma.child.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        orphanage: {
          select: {
            name: true,
          },
        },
      },
    });

    const children: RecentChildDto[] = recentChildren.map((child) => ({
      id: child.childCode || child.id,
      name: `${child.firstName} ${child.lastName || ''}`.trim(),
      orphanage: child.orphanage?.name || 'Unknown',
      risk: 'Low', // Mock risk level, replace with actual logic
      attendance: '—', // Mock - replace with real attendance calculation
      photo: child.photo,
    }));

    return {
      children,
      total: totalChildren,
    };
  }
}
