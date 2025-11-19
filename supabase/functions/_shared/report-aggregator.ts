// Report Data Aggregator
// Purpose: Fetch and aggregate data for various report types

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ReportParameters {
  startDate?: string;
  endDate?: string;
  includeDetails?: boolean;
  userId?: string;
  eventId?: string;
  period?: 'LAST_MONTH' | 'LAST_QUARTER' | 'LAST_YEAR' | 'CUSTOM';
  [key: string]: any;
}

export interface AggregatedData {
  summary: Record<string, any>;
  details?: any[];
  metadata: {
    generatedAt: string;
    parameters: ReportParameters;
    rowCount: number;
  };
}

export class ReportAggregator {
  constructor(private supabase: SupabaseClient) {}

  async aggregateData(reportType: string, parameters: ReportParameters): Promise<AggregatedData> {
    switch (reportType) {
      case 'membershipSummary':
        return await this.aggregateMembershipSummary(parameters);

      case 'volunteerHours':
        return await this.aggregateVolunteerHours(parameters);

      case 'donationsOverview':
        return await this.aggregateDonationsOverview(parameters);

      case 'eventAttendance':
        return await this.aggregateEventAttendance(parameters);

      case 'paymentTransactions':
        return await this.aggregatePaymentTransactions(parameters);

      case 'galleryActivity':
        return await this.aggregateGalleryActivity(parameters);

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private async aggregateMembershipSummary(params: ReportParameters): Promise<AggregatedData> {
    const { startDate, endDate } = this.getDateRange(params);

    // Get total subscriptions
    const { count: totalSubscriptions } = await this.supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get new members in period
    const { count: newMembers } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Get members by type
    const { data: membersByType } = await this.supabase
      .from('subscriptions')
      .select('activation_method')
      .eq('status', 'active');

    const typeBreakdown = membersByType?.reduce((acc: any, sub) => {
      const method = sub.activation_method || 'payment';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // Get detailed member list if requested
    let details = null;
    if (params.includeDetails) {
      const { data } = await this.supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          created_at,
          subscriptions!inner(status, activation_method, created_at)
        `)
        .eq('subscriptions.status', 'active')
        .order('full_name');

      details = data;
    }

    return {
      summary: {
        totalSubscriptions: totalSubscriptions || 0,
        newMembers: newMembers || 0,
        membersByType: typeBreakdown || {},
        period: { startDate, endDate },
      },
      details,
      metadata: {
        generatedAt: new Date().toISOString(),
        parameters: params,
        rowCount: details?.length || 0,
      },
    };
  }

  private async aggregateVolunteerHours(params: ReportParameters): Promise<AggregatedData> {
    const { startDate, endDate } = this.getDateRange(params);

    // Get total hours
    const { data: hoursData } = await this.supabase
      .from('volunteer_hours')
      .select('hours, status')
      .gte('date', startDate)
      .lte('date', endDate);

    const totalHours = hoursData?.reduce((sum, record) => sum + (record.hours || 0), 0) || 0;
    const approvedHours = hoursData
      ?.filter(r => r.status === 'approved')
      ?.reduce((sum, record) => sum + (record.hours || 0), 0) || 0;
    const pendingHours = hoursData
      ?.filter(r => r.status === 'pending')
      ?.reduce((sum, record) => sum + (record.hours || 0), 0) || 0;

    // Get volunteer count
    const { data: volunteers } = await this.supabase
      .from('volunteer_hours')
      .select('user_id')
      .gte('date', startDate)
      .lte('date', endDate);

    const uniqueVolunteers = new Set(volunteers?.map(v => v.user_id)).size;

    // Get detailed hours if requested
    let details = null;
    if (params.includeDetails) {
      const { data } = await this.supabase
        .from('volunteer_hours')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      details = data;
    }

    return {
      summary: {
        totalHours,
        approvedHours,
        pendingHours,
        uniqueVolunteers,
        period: { startDate, endDate },
      },
      details,
      metadata: {
        generatedAt: new Date().toISOString(),
        parameters: params,
        rowCount: details?.length || 0,
      },
    };
  }

  private async aggregateDonationsOverview(params: ReportParameters): Promise<AggregatedData> {
    const { startDate, endDate } = this.getDateRange(params);

    // Get payment data
    const { data: payments } = await this.supabase
      .from('payments')
      .select('amount, currency, payment_type, status, paid_at, user_id')
      .eq('payment_type', 'donation')
      .eq('status', 'succeeded')
      .gte('paid_at', startDate)
      .lte('paid_at', endDate);

    const totalAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const donationCount = payments?.length || 0;
    const uniqueDonors = new Set(payments?.map(p => p.user_id)).size;
    const averageDonation = donationCount > 0 ? totalAmount / donationCount : 0;

    // Group by month
    const monthlyBreakdown = payments?.reduce((acc: any, payment) => {
      const month = payment.paid_at ? new Date(payment.paid_at).toISOString().substring(0, 7) : 'unknown';
      if (!acc[month]) {
        acc[month] = { amount: 0, count: 0 };
      }
      acc[month].amount += payment.amount || 0;
      acc[month].count += 1;
      return acc;
    }, {});

    // Get detailed donations if requested
    let details = null;
    if (params.includeDetails) {
      const { data } = await this.supabase
        .from('payments')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .eq('payment_type', 'donation')
        .eq('status', 'succeeded')
        .gte('paid_at', startDate)
        .lte('paid_at', endDate)
        .order('paid_at', { ascending: false });

      details = data;
    }

    return {
      summary: {
        totalAmount,
        donationCount,
        uniqueDonors,
        averageDonation,
        monthlyBreakdown,
        period: { startDate, endDate },
      },
      details,
      metadata: {
        generatedAt: new Date().toISOString(),
        parameters: params,
        rowCount: details?.length || 0,
      },
    };
  }

  private async aggregateEventAttendance(params: ReportParameters): Promise<AggregatedData> {
    const { startDate, endDate } = this.getDateRange(params);

    // Get events in period
    const { data: events } = await this.supabase
      .from('events')
      .select(`
        *,
        event_registrations(id, registration_status, user_id)
      `)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: false });

    const totalEvents = events?.length || 0;
    const totalRegistrations = events?.reduce((sum, event) => sum + (event.event_registrations?.length || 0), 0) || 0;
    const totalAttended = events?.reduce((sum, event) => {
      return sum + (event.event_registrations?.filter((r: any) => r.registration_status === 'attended')?.length || 0);
    }, 0) || 0;

    // Most popular events
    const eventsByRegistrations = events
      ?.map(event => ({
        title: event.title,
        date: event.event_date,
        registrations: event.event_registrations?.length || 0,
        attended: event.event_registrations?.filter((r: any) => r.registration_status === 'attended')?.length || 0,
      }))
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 10);

    return {
      summary: {
        totalEvents,
        totalRegistrations,
        totalAttended,
        attendanceRate: totalRegistrations > 0 ? (totalAttended / totalRegistrations) * 100 : 0,
        topEvents: eventsByRegistrations,
        period: { startDate, endDate },
      },
      details: params.includeDetails ? events : null,
      metadata: {
        generatedAt: new Date().toISOString(),
        parameters: params,
        rowCount: events?.length || 0,
      },
    };
  }

  private async aggregatePaymentTransactions(params: ReportParameters): Promise<AggregatedData> {
    const { startDate, endDate } = this.getDateRange(params);

    const { data: payments } = await this.supabase
      .from('payments')
      .select(`
        *,
        profiles:user_id(full_name, email)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    const totalAmount = payments?.reduce((sum, p) => sum + (p.status === 'succeeded' ? p.amount : 0), 0) || 0;
    const successfulPayments = payments?.filter(p => p.status === 'succeeded').length || 0;
    const failedPayments = payments?.filter(p => p.status === 'failed').length || 0;

    // Group by payment type
    const byType = payments?.reduce((acc: any, payment) => {
      const type = payment.payment_type || 'other';
      if (!acc[type]) {
        acc[type] = { amount: 0, count: 0 };
      }
      if (payment.status === 'succeeded') {
        acc[type].amount += payment.amount || 0;
        acc[type].count += 1;
      }
      return acc;
    }, {});

    return {
      summary: {
        totalAmount,
        successfulPayments,
        failedPayments,
        byType,
        period: { startDate, endDate },
      },
      details: params.includeDetails ? payments : null,
      metadata: {
        generatedAt: new Date().toISOString(),
        parameters: params,
        rowCount: payments?.length || 0,
      },
    };
  }

  private async aggregateGalleryActivity(params: ReportParameters): Promise<AggregatedData> {
    const { startDate, endDate } = this.getDateRange(params);

    const { data: galleries } = await this.supabase
      .from('galleries')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const totalGalleries = galleries?.length || 0;
    const publishedGalleries = galleries?.filter(g => g.is_published).length || 0;

    // Group by type
    const byType = galleries?.reduce((acc: any, gallery) => {
      const type = gallery.gallery_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalGalleries,
        publishedGalleries,
        byType,
        period: { startDate, endDate },
      },
      details: params.includeDetails ? galleries : null,
      metadata: {
        generatedAt: new Date().toISOString(),
        parameters: params,
        rowCount: galleries?.length || 0,
      },
    };
  }

  private getDateRange(params: ReportParameters): { startDate: string; endDate: string } {
    if (params.period === 'LAST_MONTH') {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: lastMonth.toISOString(),
        endDate: endOfLastMonth.toISOString(),
      };
    }

    if (params.period === 'LAST_QUARTER') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfLastQuarter = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      const endOfLastQuarter = new Date(now.getFullYear(), quarter * 3, 0);
      return {
        startDate: startOfLastQuarter.toISOString(),
        endDate: endOfLastQuarter.toISOString(),
      };
    }

    if (params.period === 'LAST_YEAR') {
      const lastYear = new Date().getFullYear() - 1;
      return {
        startDate: new Date(lastYear, 0, 1).toISOString(),
        endDate: new Date(lastYear, 11, 31).toISOString(),
      };
    }

    // Custom or default to last 30 days
    const endDate = params.endDate || new Date().toISOString();
    const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    return { startDate, endDate };
  }
}
