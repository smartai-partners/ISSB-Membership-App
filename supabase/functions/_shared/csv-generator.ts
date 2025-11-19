// CSV Generator
// Purpose: Convert data to CSV format

export interface CSVOptions {
  headers?: string[];
  delimiter?: string;
  includeHeaders?: boolean;
}

export class CSVGenerator {
  generate(data: any[], options: CSVOptions = {}): string {
    if (!data || data.length === 0) {
      return '';
    }

    const delimiter = options.delimiter || ',';
    const includeHeaders = options.includeHeaders !== false;

    // Get headers from first object if not provided
    const headers = options.headers || Object.keys(data[0]);

    const lines: string[] = [];

    // Add header row
    if (includeHeaders) {
      lines.push(this.escapeRow(headers, delimiter));
    }

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return this.formatValue(value);
      });
      lines.push(this.escapeRow(values, delimiter));
    }

    return lines.join('\n');
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private escapeRow(values: string[], delimiter: string): string {
    return values
      .map(value => {
        const stringValue = this.formatValue(value);

        // Check if escaping is needed
        if (
          stringValue.includes(delimiter) ||
          stringValue.includes('"') ||
          stringValue.includes('\n') ||
          stringValue.includes('\r')
        ) {
          // Escape quotes by doubling them
          const escaped = stringValue.replace(/"/g, '""');
          return `"${escaped}"`;
        }

        return stringValue;
      })
      .join(delimiter);
  }

  // Generate CSV for specific report types with custom formatting
  generateMembershipSummaryCSV(data: any): string {
    const details = data.details || [];

    // Flatten nested data
    const flatData = details.map((member: any) => ({
      Name: member.full_name || '',
      Email: member.email || '',
      'Member Since': member.created_at ? new Date(member.created_at).toLocaleDateString() : '',
      'Subscription Type': member.subscriptions?.[0]?.activation_method || 'N/A',
      'Subscription Date': member.subscriptions?.[0]?.created_at
        ? new Date(member.subscriptions[0].created_at).toLocaleDateString()
        : '',
    }));

    return this.generate(flatData);
  }

  generateVolunteerHoursCSV(data: any): string {
    const details = data.details || [];

    const flatData = details.map((record: any) => ({
      Date: record.date ? new Date(record.date).toLocaleDateString() : '',
      Volunteer: record.profiles?.full_name || '',
      Email: record.profiles?.email || '',
      Hours: record.hours || 0,
      Description: record.description || '',
      Status: record.status || '',
      'Approved By': record.approved_by || '',
      'Approved At': record.approved_at ? new Date(record.approved_at).toLocaleDateString() : '',
    }));

    return this.generate(flatData);
  }

  generateDonationsCSV(data: any): string {
    const details = data.details || [];

    const flatData = details.map((donation: any) => ({
      Date: donation.paid_at ? new Date(donation.paid_at).toLocaleDateString() : '',
      Donor: donation.profiles?.full_name || 'Anonymous',
      Email: donation.profiles?.email || '',
      Amount: `$${((donation.amount || 0) / 100).toFixed(2)}`,
      Currency: donation.currency?.toUpperCase() || 'USD',
      Status: donation.status || '',
      Description: donation.description || '',
      'Payment ID': donation.stripe_payment_intent_id || '',
    }));

    return this.generate(flatData);
  }

  generateEventAttendanceCSV(data: any): string {
    const details = data.details || [];

    const flatData = details.flatMap((event: any) => {
      if (!event.event_registrations || event.event_registrations.length === 0) {
        return [{
          Event: event.title || '',
          Date: event.event_date ? new Date(event.event_date).toLocaleDateString() : '',
          Location: event.location || '',
          Capacity: event.capacity || 'Unlimited',
          'Total Registrations': 0,
          Attendee: '',
          'Registration Status': '',
        }];
      }

      return event.event_registrations.map((registration: any) => ({
        Event: event.title || '',
        Date: event.event_date ? new Date(event.event_date).toLocaleDateString() : '',
        Location: event.location || '',
        Capacity: event.capacity || 'Unlimited',
        'Total Registrations': event.event_registrations.length,
        Attendee: registration.user_id || '',
        'Registration Status': registration.registration_status || '',
      }));
    });

    return this.generate(flatData);
  }

  generatePaymentTransactionsCSV(data: any): string {
    const details = data.details || [];

    const flatData = details.map((payment: any) => ({
      Date: payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '',
      'Payment ID': payment.stripe_payment_intent_id || '',
      User: payment.profiles?.full_name || '',
      Email: payment.profiles?.email || '',
      Amount: `$${((payment.amount || 0) / 100).toFixed(2)}`,
      Currency: payment.currency?.toUpperCase() || 'USD',
      Type: payment.payment_type || '',
      Status: payment.status || '',
      Description: payment.description || '',
      'Card Last 4': payment.card_last4 || '',
      'Card Brand': payment.card_brand || '',
    }));

    return this.generate(flatData);
  }

  generateGalleryActivityCSV(data: any): string {
    const details = data.details || [];

    const flatData = details.map((gallery: any) => ({
      Title: gallery.title || '',
      Type: gallery.gallery_type || '',
      Created: gallery.created_at ? new Date(gallery.created_at).toLocaleDateString() : '',
      Published: gallery.is_published ? 'Yes' : 'No',
      'Photo Count': gallery.photo_count || 0,
      Description: gallery.description || '',
      'External URL': gallery.external_url || '',
    }));

    return this.generate(flatData);
  }
}

export const getCSVGenerator = () => new CSVGenerator();
