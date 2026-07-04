import type { RequestStatus, RequestType } from "@prisma/client";
import nodemailer from "nodemailer";

import { formatDisplayDate } from "@/lib/dates";
import { requestDaysLabel, requestTypeLabels } from "@/lib/leave-requests";
import { prisma } from "@/lib/prisma";

type EmailPayload = {
  to: string[];
  subject: string;
  html: string;
};

type RequestEmailData = {
  id: string;
  startDate: string;
  endDate: string;
  type: RequestType;
  comment: string | null;
  decisionNote?: string | null;
  status?: RequestStatus;
  businessDays: number;
  employee: {
    fullName: string;
    area: string;
    position: string | null;
    email: string | null;
  };
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function getMailFrom() {
  return process.env.MAIL_FROM ?? "Gestion de equipo DJ <no-reply@example.com>";
}

function getAppUrl(path: string) {
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;
  return `${baseUrl}${path}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail({ to, subject, html }: EmailPayload) {
  const recipients = Array.from(new Set(to.map((email) => email.trim()).filter(Boolean)));

  if (recipients.length === 0) {
    return;
  }

  if (process.env.MAIL_PROVIDER === "gmail") {
    await sendWithGmail({ to: recipients, subject, html });
    return;
  }

  await sendWithResend({ to: recipients, subject, html });
}

async function sendWithGmail({ to, subject, html }: EmailPayload) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Gmail SMTP is missing GMAIL_USER or GMAIL_APP_PASSWORD.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject,
    html,
  });
}

async function sendWithResend({ to, subject, html }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getMailFrom(),
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${body}`);
  }
}

function requestSummaryHtml(data: RequestEmailData, intro: string, actionUrl: string | null) {
  const comment = data.comment ? escapeHtml(data.comment) : "Sin comentario";
  const note = data.decisionNote ? escapeHtml(data.decisionNote) : null;
  const typeLabel = requestTypeLabels[data.type];

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 20px; margin: 0 0 12px;">Vacaciones DJ</h1>
      <p style="margin: 0 0 16px;">${intro}</p>
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
        <p><strong>Empleado:</strong> ${escapeHtml(data.employee.fullName)}</p>
        <p><strong>Area:</strong> ${escapeHtml(data.employee.area)}</p>
        <p><strong>Cargo:</strong> ${escapeHtml(data.employee.position ?? "Sin cargo")}</p>
        <p><strong>Tipo:</strong> ${typeLabel}</p>
        <p><strong>Fechas:</strong> ${formatDisplayDate(data.startDate)} - ${formatDisplayDate(data.endDate)}</p>
        <p><strong>Dias:</strong> ${requestDaysLabel(data.type, data.businessDays)}</p>
        ${data.status ? `<p><strong>Estado:</strong> ${statusLabel(data.status)}</p>` : ""}
        <p><strong>Comentario:</strong> ${comment}</p>
        ${note ? `<p><strong>Nota HR:</strong> ${note}</p>` : ""}
      </div>
      ${
        actionUrl
          ? `<p style="margin-top: 18px;"><a href="${actionUrl}" style="color: #2563eb;">Ver en la plataforma</a></p>`
          : ""
      }
    </div>
  `;
}

function statusLabel(status: RequestStatus) {
  switch (status) {
    case "APPROVED":
      return "Aprobada";
    case "REJECTED":
      return "Rechazada";
    case "PENDING":
      return "Pendiente";
    case "CANCELED":
      return "Cancelada";
    default:
      return status;
  }
}

async function findHrRecipients() {
  const configured = process.env.HR_NOTIFICATION_EMAILS?.split(",") ?? [];
  const configuredRecipients = configured.map((email) => email.trim()).filter(Boolean);

  if (configuredRecipients.length > 0) {
    return configuredRecipients;
  }

  const hrUsers = await prisma.user.findMany({
    where: { role: "HR" },
    select: { email: true },
  });

  return hrUsers.map((user) => user.email);
}

export async function notifyHrNewLeaveRequest(data: RequestEmailData) {
  try {
    const recipients = await findHrRecipients();
    await sendEmail({
      to: recipients,
      subject: `Nueva solicitud de ${requestTypeLabels[data.type].toLowerCase()}: ${data.employee.fullName}`,
      html: requestSummaryHtml(
        data,
        `Se registro una nueva solicitud de ${requestTypeLabels[data.type].toLowerCase()} pendiente de revision.`,
        getAppUrl(`/requests/${data.id}`),
      ),
    });
  } catch (error) {
    console.error("[MAIL] No se pudo notificar a HR:", error);
  }
}

export async function notifyEmployeeLeaveDecision(data: RequestEmailData) {
  try {
    if (!data.employee.email || !data.status) {
      return { ok: false, error: "El empleado no tiene correo para notificaciones." };
    }

    await sendEmail({
      to: [data.employee.email],
      subject: `Tu solicitud fue ${statusLabel(data.status).toLowerCase()}`,
      html: requestSummaryHtml(
        data,
        `Tu solicitud de ${requestTypeLabels[data.type].toLowerCase()} fue ${statusLabel(data.status).toLowerCase()}.`,
        getAppUrl("/my-requests"),
      ),
    });

    return { ok: true };
  } catch (error) {
    console.error("[MAIL] No se pudo notificar al empleado:", error);
    return {
      ok: false,
      error: getMailErrorMessage(error),
    };
  }
}

function getMailErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("You can only send testing emails")) {
    return "La solicitud se resolvio, pero Resend esta en modo prueba. Verifica el dominio y cambia MAIL_FROM para enviar a correos de empleados.";
  }

  return "La solicitud se resolvio, pero no se pudo enviar el correo al empleado.";
}
