import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@^4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "re_cd6XYx2X_8oGe2Wst29M8WMiwZ8L1f6Dw");

Deno.serve(async (req) => {
  try {
    const { to, questionnaireUrl } = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: "L'adresse email 'to' est requise" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Template HTML de l'email
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>URAI - Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdfdfd; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fdfdfd;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e9f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="padding: 0;">
                            <img src="https://ibvmkhmjgpwwxkngllti.supabase.co/storage/v1/object/public/files/email-cover-urai.png" alt="URAI" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 48px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="padding-right: 12px; vertical-align: middle;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #cbd5e1; border-radius: 1px;">
                                                        <tr><td style="width: 20px; height: 12px; background-color: #3A7728; border: 0;"></td></tr>
                                                        <tr><td style="width: 20px; height: 12px; background-color: #FCD116; border: 0;"></td></tr>
                                                        <tr><td style="width: 20px; height: 12px; background-color: #36A1D4; border: 0;"></td></tr>
                                                    </table>
                                                </td>
                                                <td style="vertical-align: middle;">
                                                    <p style="margin: 0; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #0f172a; line-height: 1.2;">
                                                        URAI &bull; L'Union des représentants automobiles et industriels
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #0f172a; font-weight: 400;">
                                            Cher(e)s membres de notre syndicat des importateurs de véhicules,
                                        </p>
                                        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #0f172a; font-weight: 400;">
                                            Dans le cadre de notre démarche d'amélioration continue et de renforcement de la représentation de nos intérêts collectifs, nous vous invitons à bien vouloir renseigner le questionnaire stratégique à travers le lien ci-dessous :
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <a href="${questionnaireUrl || 'https://urai-questionnaire.netlify.app/'}" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; padding: 20px 40px; border-radius: 2px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                            Accéder au questionnaire
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b;">
                                            Anonymat & Confidentialité garantis
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 48px; border-top: 1px solid #e2e8f0; background-color: #ffffff;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b;">
                                            © Bureau Exécutif URAI &bull; 2026
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: "URAI <noreply@gesparc360.com>",
      to: [to],
      subject: "URAI - Invitation au questionnaire stratégique",
      html: htmlTemplate,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

