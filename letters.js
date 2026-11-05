// HTML email templates for ASC debt recovery reminders. Demonstration only: fictitious data, [DEMO] drafts.
const NAVY = "#003c69", BLUE = "#005eb8", PALE = "#e8f1fa", GREY = "#5a6572";
const LINKS = {
  pay: "https://payments.eastsussex.gov.uk/onlinepayments/PayInput.aspx?paytype=County%20Council%20Invoice",
  howto: "https://www.eastsussex.gov.uk/social-care/paying-for-care/how-to-pay",
  dd: "https://www.eastsussex.gov.uk/media/enzla0ql/escc-direct-debit-mandate.pdf",
  advice: "https://www.eastsussex.gov.uk/social-care/paying-for-care/money-advice",
  benefits: "https://www.eastsussex.gov.uk/social-care/benefits/help",
  contact: "https://www.eastsussex.gov.uk/social-care/getting-help-from-us/contact-adult-social-care",
  affairs: "https://www.eastsussex.gov.uk/social-care/paying-for-care/managing-affairs",
  ca: "http://www.citizensadviceeastsussex.org.uk/",
  mh: "https://www.moneyhelper.org.uk/en/money-troubles/dealing-with-debt",
  site: "https://www.eastsussex.gov.uk/social-care/paying-for-care",
};
const LOGO = "https://www.eastsussex.gov.uk/media/mepbxm1y/decoupled-escc-logo-for-website-test-version-large.png?width=600&format=png";
const HEADER = "https://raw.githubusercontent.com/harryfisher99-ux/escc-debt-demo/main/app/assets/escc-email-header.png";
const SIGLOGO = "https://raw.githubusercontent.com/harryfisher99-ux/escc-debt-demo/main/app/assets/escc-signature-logo.png";
const A = (u, t, extra = "") => `<a href="${u}" style="color:${BLUE};text-decoration:underline;${extra}">${t}</a>`;

const STAGES = {
  first: {
    name: "First reminder",
    subject: "[DEMO] Your care and support account is overdue: client reference {{CLIENT_REF}}",
    heading: "Your care and support account is overdue: please pay {{AMOUNT}} by {{PAY_BY}}",
    extraFacts: [],
    amountLabel: "Amount to pay by {{PAY_BY}}",
    opening: `Our records show that some of your invoices for care and support from East Sussex County Council have not been paid. The amount overdue is <b>{{AMOUNT}}</b>. To bring your account up to date, please pay <b>{{AMOUNT}}</b> by <b>{{PAY_BY}}</b>.`,
    thanks: `If you have already paid, thank you. Your payment may not have reached us when we checked, so please ignore this message.`,
    next: `If your account is not brought up to date, we will send you a second reminder. If it is still not up to date after that, we will send a final reminder and may refer your account to our Financial Services Revenue team.`,
    supportLead: `If you are finding it hard to pay, or you think the amount is wrong, please contact us as soon as you can. We can often agree a payment date or plan that suits you.`,
  },
  second: {
    name: "Second reminder",
    subject: "[DEMO] Second reminder: care and support account, client reference {{CLIENT_REF}}",
    heading: "This is your second reminder: please pay {{AMOUNT}} by {{PAY_BY}}",
    extraFacts: [["Date of first reminder", "{{PREV_DATE}}"]],
    amountLabel: "Amount to pay by {{PAY_BY}}",
    opening: `We wrote to you on <b>{{PREV_DATE}}</b> about your overdue care and support charges and our records show your account is still behind. The amount overdue is <b>{{AMOUNT}}</b>. Please pay <b>{{AMOUNT}}</b> by <b>{{PAY_BY}}</b>.`,
    thanks: `If you have already paid, thank you. Your payment may not have reached us when we checked, so please ignore this message.`,
    next: `If your account is not brought up to date by {{PAY_BY}}, we will send you a final reminder. After that, we may refer your account to our Financial Services Revenue team to consider further recovery action.`,
    supportLead: `If you cannot pay in full, please contact us <b>before</b> {{PAY_BY}} so that we can agree an affordable payment plan. If you think the amount is wrong, tell us and we will look into it. Free, independent money advice is available.`,
  },
  final: {
    name: "Final reminder",
    subject: "[DEMO] FINAL REMINDER: care and support account, client reference {{CLIENT_REF}}",
    heading: "FINAL REMINDER: please pay {{AMOUNT}} by {{PAY_BY}}",
    extraFacts: [["Date of last reminder", "{{PREV_DATE}}"]],
    amountLabel: "Amount to pay by {{PAY_BY}}",
    opening: `We have written to you twice about overdue care and support charges, most recently on <b>{{PREV_DATE}}</b>, and your account is still not up to date. The amount overdue is <b>{{AMOUNT}}</b>. Please pay <b>{{AMOUNT}}</b> by <b>{{PAY_BY}}</b>, or contact us before that date to agree a payment plan.`,
    thanks: `If you have already paid, thank you. Your payment may not have reached us when we checked, so please let us know if you have.`,
    next: `If we do not hear from you by {{PAY_BY}}, we will refer your account to our Financial Services Revenue team. They may contact you to discuss recovery options, which can include court action. We would much rather talk to you than take further action.`,
    supportLead: `If you are struggling to pay, or something has changed in your circumstances, please phone us <b>now</b> on 01273 481 280. We want to help you find a way forward. Free, independent money advice is available.`,
  },
};

function letterHTML(stage, master) {
  const s = master ? { name: "Reminder", heading: "{{HEADING}}", opening: "{{OPENING}}", thanks: "{{THANKS}}", next: "{{NEXT}}", supportLead: "{{SUPPORT_LEAD}}", extraFacts: [["{{PREV_LABEL}}", "{{PREV_DATE}}"]] } : STAGES[stage];
  const facts = [
    ["Client reference", "{{CLIENT_REF}}"], ["Account holder", "{{CLIENT_NAME}}"], ["Address", "{{ADDRESS}}"],
    ["Amount overdue as at 6 November 2026", "{{AMOUNT}}"], ["Oldest unpaid invoice was due", "{{OLDEST_DUE}}"], ...s.extraFacts, ["Pay by", "<b>{{PAY_BY}}</b>"],
  ];
  const factRows = facts.map(([k, v], i) => `${master && k === "{{PREV_LABEL}}" ? "<!--PREV_ROW_START-->" : ""}<tr><td width="42%" style="padding:8px 12px;border-bottom:1px solid #d5dde6;background:${i % 2 ? "#ffffff" : "#f4f7fa"};font-weight:600;color:${NAVY};font-size:13px;">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #d5dde6;background:${i % 2 ? "#ffffff" : "#f4f7fa"};font-size:13px;color:#222;">${v}</td></tr>${master && k === "{{PREV_LABEL}}" ? "<!--PREV_ROW_END-->" : ""}`).join("");
  const btn = `<p style="margin:8px 0 16px 0;"><a href="${LINKS.pay}" target="_blank" style="background-color:#005eb8;border-top:13px solid #005eb8;border-bottom:13px solid #005eb8;border-left:28px solid #005eb8;border-right:28px solid #005eb8;color:#ffffff;display:inline-block;font-family:Segoe UI,Arial,sans-serif;font-size:15px;font-weight:bold;line-height:1;text-decoration:none;mso-padding-alt:0;"><span style="color:#ffffff;"><font color="#ffffff">Pay your invoice online</font></span></a></p>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${s.name}</title></head>
<body style="margin:0;padding:0;background:#eef1f4;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f4"><tr><td align="center" style="padding:14px 8px;">
<table width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:100%;background:#ffffff;border:1px solid #d5dde6;font-family:Segoe UI,Arial,sans-serif;color:#222222;">
<!-- DEMO BANNER -->
<tr><td style="background:#fff4cc;border-bottom:1px solid #e6c94d;padding:8px 14px;font-size:12px;color:#5c4400;"><b>ILLUSTRATIVE DEMONSTRATION.</b> Synthetic data. Not an East Sussex County Council notice and not the Council's approved wording.</td></tr>
<!-- HEADER -->
<tr><td style="padding:0;line-height:0;font-size:0;"><img src="${HEADER}" width="640" alt="East Sussex County Council | Adult Social Care and Health | Charging and Recovery" style="display:block;width:100%;max-width:640px;height:auto;border:0;"></td></tr>
<!-- BODY -->
<tr><td style="padding:22px 24px 6px 24px;">
<h1 style="margin:0 0 14px 0;font-size:21px;line-height:1.3;color:${NAVY};font-weight:700;">${s.heading}</h1>
<p style="margin:0 0 12px 0;font-size:14px;line-height:1.55;">{{SALUTATION}}</p>
<!--ATTORNEY_START--><p style="margin:0 0 14px 0;padding:10px 12px;background:${PALE};border-left:4px solid ${BLUE};font-size:13.5px;line-height:1.5;">This letter is about the account of <b>{{CLIENT_NAME}}</b>, on whose behalf you act as attorney under a Lasting Power of Attorney.</p><!--ATTORNEY_END-->
<p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;">${s.opening}</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d5dde6;border-top:3px solid ${NAVY};margin:0 0 16px 0;">${factRows}</table>
<p style="margin:0 0 16px 0;font-size:14px;line-height:1.55;">${s.thanks}</p>
<h2 style="margin:18px 0 6px 0;font-size:16px;color:${NAVY};">How to pay</h2>
${btn}
<ul style="margin:0 0 14px 18px;padding:0;font-size:14px;line-height:1.6;">
<li><b>Direct Debit</b> (our preferred way). ${A(LINKS.dd, "Download a Direct Debit form")} and send it back by email or post. Details are on the form.</li>
<li><b>By phone</b> with a debit card: <b>01273 481 280</b> (9am to 5pm Monday to Thursday, 9am to 4.30pm Friday). Please have your client reference and invoice number ready.</li>
<li><b>Bank transfer</b>: use the bank details on your invoice and quote your client reference and invoice number.</li>
</ul>
<p style="margin:0 0 6px 0;font-size:13px;color:${GREY};">We do not accept cash or cheques. More about ${A(LINKS.howto, "how to pay our invoices")}.</p>
<!-- SUPPORT BOX -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background:${PALE};border:1px solid #b9d3ec;border-radius:4px;"><tr><td style="padding:14px 16px;">
<h2 style="margin:0 0 6px 0;font-size:16px;color:${NAVY};">If you are finding it hard to pay</h2>
<p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;">${s.supportLead}</p>
<ul style="margin:0 0 8px 18px;padding:0;font-size:13.5px;line-height:1.6;">
<li>${A(LINKS.contact, "Contact Adult Social Care and Health")}</li>
<li>${A(LINKS.advice, "Get advice about money")} (East Sussex County Council)</li>
<li>${A(LINKS.benefits, "Welfare benefits helpline")}</li>
<li>${A(LINKS.ca, "Citizens Advice East Sussex")}</li>
<li>${A(LINKS.mh, "MoneyHelper: free help with debt")}</li>
</ul>
<p style="margin:0;font-size:13px;color:${GREY};">If someone else looks after your money, see ${A(LINKS.affairs, "managing someone's affairs")}.</p>
</td></tr></table>
<h2 style="margin:18px 0 6px 0;font-size:16px;color:${NAVY};">What happens next</h2>
<p style="margin:0 0 16px 0;font-size:14px;line-height:1.55;">${s.next}</p>
<p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;">Yours sincerely,</p>
</td></tr>
<!-- SIGNATURE -->
<tr><td style="padding:0 24px 22px 24px;font-family:Segoe UI,Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
<td width="4" style="width:4px;background-color:#005eb8;border-left:4px solid #005eb8;font-size:1px;line-height:1px;">&nbsp;</td>
<td style="padding:2px 0 2px 14px;font-family:Segoe UI,Arial,sans-serif;font-size:13px;line-height:1.5;color:#222222;">
<div style="font-size:15px;font-weight:bold;color:#003c69;">Harry Fisher</div>
<div style="color:#5a6572;">Recovery Officer</div>
<div style="color:#222222;">Adult Social Care Charging and Recovery</div>
<div style="color:#222222;margin-bottom:6px;">East Sussex County Council</div>
<div><span style="color:#5a6572;">T</span>&nbsp; 01273 481 280</div>
<div><span style="color:#5a6572;">E</span>&nbsp; <a href="mailto:asc.recovery@eastsussex.gov.uk" style="color:#005eb8;text-decoration:none;">asc.recovery@eastsussex.gov.uk</a></div>
<div><span style="color:#5a6572;">W</span>&nbsp; <a href="${LINKS.site}" style="color:#005eb8;text-decoration:none;">www.eastsussex.gov.uk</a></div>
<div style="color:#5a6572;margin-top:6px;font-size:12px;">County Hall, St Anne's Crescent, Lewes, East Sussex BN7 1UE<br>Phone lines open 9am to 5pm Monday to Thursday, 9am to 4.30pm Friday</div>
<div style="margin-top:10px;"><img src="${SIGLOGO}" width="190" alt="East Sussex County Council" style="display:block;width:190px;height:auto;border:0;"></div>
</td></tr></table>
</td></tr>
<!-- FOOTER -->
<tr><td bgcolor="#f4f7fa" style="background:#f4f7fa;border-top:1px solid #d5dde6;padding:12px 24px;font-size:11px;line-height:1.5;color:${GREY};">This message is intended for the use of the addressee only and may contain confidential or privileged information. If you have received it in error please notify the sender and destroy it. All communications sent to or from the County Council may be subject to recording and/or monitoring in accordance with relevant legislation. East Sussex County Council will only ever ask you to pay using the ways shown on our website. DEMONSTRATION: fictitious data.</td></tr>
</table></td></tr></table>
</body></html>`;
}

const SAMPLE = {
  SALUTATION: "Dear Mrs Pemberton,", CLIENT_REF: "CC-70211", CLIENT_NAME: "Mrs Dorothy Pemberton", ADDRESS: "12 Cavendish Place, Eastbourne, BN21 4AD",
  AMOUNT: "£1,248.60", OLDEST_DUE: "14 August 2026", PREV_DATE: "21 September 2026", PAY_BY: "23 November 2026",
};
const stripAttorney = h => h.replace(/<!--ATTORNEY_START-->[\s\S]*?<!--ATTORNEY_END-->/, "");
function fill(html, vars) { let h = html; Object.entries(vars).forEach(([k, v]) => { h = h.split("{{" + k + "}}").join(v); }); return h; }
module.exports = { STAGES, LINKS, LOGO, SIGLOGO, HEADER, letterHTML, SAMPLE, fill, stripAttorney };



