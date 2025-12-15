// Supabase Edge Function to send invoice emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface InvoiceEmailRequest {
  to: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  items: { description: string; amount: number }[];
  fromName: string;
  fromEmail: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body: InvoiceEmailRequest = await req.json();
    const { to, clientName, invoiceNumber, amount, dueDate, items, fromName, fromEmail } = body;

    // Generate invoice email HTML
    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.amount.toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Invoice from ${fromName}</h1>
        </div>
        
        <!-- Invoice Card -->
        <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Invoice Header -->
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Invoice #${invoiceNumber}</p>
                <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #111827;">$${amount.toLocaleString()}</h2>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Due Date</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
          
          <!-- Client Info -->
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Billed To</p>
            <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827;">${clientName}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${to}</p>
          </div>
          
          <!-- Items -->
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 0 0 12px 0; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                  <th style="padding: 0 0 12px 0; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td style="padding: 16px 0 0 0; font-weight: 600; color: #111827;">Total</td>
                  <td style="padding: 16px 0 0 0; text-align: right; font-weight: 700; font-size: 18px; color: #10b981;">$${amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <!-- Pay Button -->
          <div style="padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <a href="#" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">Pay Invoice</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Questions? Reply to this email or contact ${fromEmail}</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Sent via s8vr - Smart Invoicing</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${fromName} via s8vr <invoices@resend.dev>`,
        to: [to],
        subject: `Invoice #${invoiceNumber} from ${fromName} - $${amount.toLocaleString()}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending invoice:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

