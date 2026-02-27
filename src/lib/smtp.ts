import { connect, TLSSocket } from "tls";

type SMTPConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  secure?: boolean;
};

function encodeBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function dotStuff(input: string): string {
  return input.replace(/\r?\n\./g, "\r\n..");
}

function normalizeCrlf(input: string): string {
  return input.replace(/\r?\n/g, "\r\n");
}

class SMTPConnection {
  private socket!: TLSSocket;
  private buffer = "";
  private lines: string[] = [];

  constructor(private readonly config: SMTPConfig) {
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = connect({
        host: this.config.host,
        port: this.config.port,
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
      });
      this.socket = socket;

      socket.setEncoding("utf8");
      socket.on("data", (chunk: string) => {
        this.buffer += chunk;
        let idx = this.buffer.indexOf("\r\n");
        while (idx >= 0) {
          const line = this.buffer.slice(0, idx);
          this.buffer = this.buffer.slice(idx + 2);
          this.lines.push(line);
          idx = this.buffer.indexOf("\r\n");
        }
      });

      socket.once("error", reject);
      socket.once("secureConnect", () => resolve());
    });
  }

  close() {
    this.socket.end();
    this.socket.destroy();
  }

  private async readReply(): Promise<{ code: number; lines: string[] }> {
    const startedAt = Date.now();
    while (true) {
      if (this.lines.length > 0) {
        const consumed: string[] = [];
        while (this.lines.length > 0) {
          const line = this.lines.shift()!;
          consumed.push(line);
          if (/^\d{3} /.test(line)) {
            const code = parseInt(line.slice(0, 3), 10);
            return { code, lines: consumed };
          }
        }
      }

      if (Date.now() - startedAt > 10000) {
        throw new Error("SMTP response timeout");
      }

      await new Promise((r) => setTimeout(r, 20));
    }
  }

  private async expectCode(expected: number[]): Promise<void> {
    const reply = await this.readReply();
    if (!expected.includes(reply.code)) {
      throw new Error(`SMTP unexpected reply ${reply.code}: ${reply.lines.join(" | ")}`);
    }
  }

  private async sendCommand(command: string, expected: number[]): Promise<void> {
    this.socket.write(`${command}\r\n`);
    await this.expectCode(expected);
  }

  async sendMail(params: { to: string; subject: string; text: string }): Promise<void> {
    await this.expectCode([220]);
    await this.sendCommand("EHLO localhost", [250]);
    await this.sendCommand("AUTH LOGIN", [334]);
    await this.sendCommand(encodeBase64(this.config.username), [334]);
    await this.sendCommand(encodeBase64(this.config.password), [235]);
    await this.sendCommand(`MAIL FROM:<${this.config.from}>`, [250]);
    await this.sendCommand(`RCPT TO:<${params.to}>`, [250, 251]);
    await this.sendCommand("DATA", [354]);

    const body = normalizeCrlf(params.text);
    const message =
      `From: ${this.config.from}\r\n` +
      `To: ${params.to}\r\n` +
      `Subject: ${params.subject}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n` +
      `Content-Transfer-Encoding: 8bit\r\n\r\n` +
      `${dotStuff(body)}\r\n.\r\n`;

    this.socket.write(message);
    await this.expectCode([250]);
    await this.sendCommand("QUIT", [221]);
  }
}

export async function sendSmtpMail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const username = process.env.SMTP_USER || "";
  const password = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || username;

  if (!host || !port || !username || !password || !from) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.");
  }

  const conn = new SMTPConnection({
    host,
    port,
    username,
    password,
    from,
  });

  try {
    await conn.connect();
    await conn.sendMail(params);
  } finally {
    conn.close();
  }
}
