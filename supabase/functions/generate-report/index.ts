// Generate Report Edge Function
// Purpose: Generate reports on-demand or via schedule

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ReportAggregator, ReportParameters } from '../_shared/report-aggregator.ts';
import { getCSVGenerator } from '../_shared/csv-generator.ts';
import { getEmailService } from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateReportRequest {
  reportType: 'membershipSummary' | 'volunteerHours' | 'donationsOverview' | 'eventAttendance' | 'paymentTransactions' | 'galleryActivity';
  format: 'CSV' | 'PDF' | 'GOOGLE_SLIDES';
  parameters?: ReportParameters;
  brandingOptions?: Record<string, any>;
  sendEmail?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is admin or board member
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'board'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request
    const body: GenerateReportRequest = await req.json();

    // Validate request
    if (!body.reportType || !body.format) {
      return new Response(
        JSON.stringify({ error: 'reportType and format are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create report record
    const { data: report, error: reportError } = await supabaseServiceClient
      .from('reports')
      .insert({
        report_type: body.reportType,
        format: body.format,
        parameters: body.parameters || {},
        branding_options: body.brandingOptions || {},
        status: 'IN_PROGRESS',
        created_by: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reportError || !report) {
      console.error('Error creating report record:', reportError);
      return new Response(
        JSON.stringify({ error: 'Failed to create report' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Step 1: Aggregate data
      const aggregator = new ReportAggregator(supabaseServiceClient);
      const aggregatedData = await aggregator.aggregateData(body.reportType, body.parameters || {});

      // Update progress
      await supabaseServiceClient
        .from('reports')
        .update({ progress: 50 })
        .eq('id', report.id);

      // Step 2: Generate file based on format
      let fileContent: string;
      let contentType: string;
      let fileExtension: string;

      if (body.format === 'CSV') {
        const csvGenerator = getCSVGenerator();

        // Use specific CSV generator based on report type
        switch (body.reportType) {
          case 'membershipSummary':
            fileContent = csvGenerator.generateMembershipSummaryCSV(aggregatedData);
            break;
          case 'volunteerHours':
            fileContent = csvGenerator.generateVolunteerHoursCSV(aggregatedData);
            break;
          case 'donationsOverview':
            fileContent = csvGenerator.generateDonationsCSV(aggregatedData);
            break;
          case 'eventAttendance':
            fileContent = csvGenerator.generateEventAttendanceCSV(aggregatedData);
            break;
          case 'paymentTransactions':
            fileContent = csvGenerator.generatePaymentTransactionsCSV(aggregatedData);
            break;
          case 'galleryActivity':
            fileContent = csvGenerator.generateGalleryActivityCSV(aggregatedData);
            break;
          default:
            throw new Error('Unsupported report type for CSV');
        }

        contentType = 'text/csv';
        fileExtension = 'csv';
      } else {
        // PDF and Google Slides not implemented in this version
        throw new Error(`Format ${body.format} not yet implemented`);
      }

      // Step 3: Upload to storage
      const fileName = `${body.reportType}-${Date.now()}.${fileExtension}`;
      const filePath = `reports/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

      const { error: uploadError } = await supabaseServiceClient.storage
        .from('reports')
        .upload(filePath, fileContent, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading report:', uploadError);
        throw new Error('Failed to upload report file');
      }

      // Step 4: Generate signed URL (valid for 7 days)
      const { data: urlData } = await supabaseServiceClient.storage
        .from('reports')
        .createSignedUrl(filePath, 7 * 24 * 60 * 60); // 7 days

      if (!urlData) {
        throw new Error('Failed to generate download URL');
      }

      // Step 5: Update report record
      await supabaseServiceClient
        .from('reports')
        .update({
          status: 'COMPLETED',
          progress: 100,
          file_path: filePath,
          file_size: new Blob([fileContent]).size,
          download_url: urlData.signedUrl,
          download_url_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          row_count: aggregatedData.metadata.rowCount,
          summary_data: aggregatedData.summary,
          completed_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      // Step 6: Send email notification if requested
      if (body.sendEmail && profile.email) {
        try {
          const emailService = getEmailService();
          const template = emailService.reportReadyEmail(
            profile.full_name || 'Member',
            body.reportType,
            urlData.signedUrl
          );

          await emailService.sendEmail({
            to: profile.email,
            subject: template.subject,
            html: template.html,
          });
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Don't fail the report if email fails
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          reportId: report.id,
          downloadUrl: urlData.signedUrl,
          summary: aggregatedData.summary,
          rowCount: aggregatedData.metadata.rowCount,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      // Update report status to failed
      await supabaseServiceClient
        .from('reports')
        .update({
          status: 'FAILED',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failed_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      throw error;
    }

  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
