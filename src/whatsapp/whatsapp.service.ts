import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { executablePath } from 'puppeteer';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(WhatsappService.name);

  onModuleInit() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Useful for server environments
        executablePath: executablePath(),
      },
    });

    this.client.on('qr', (qr) => {
      this.logger.log('QR RECEIVED', qr);
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.logger.log('Client is ready!');
    });

    this.client.on('authenticated', () => {
      this.logger.log('Client is authenticated!');
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error('AUTHENTICATION FAILURE', msg);
    });

    this.client.initialize();
  }

  async sendMessage(to: string, message: string, file?: Express.Multer.File) {
    // Basic sanitization: remove +, spaces, dashes
    const sanitizedNumber = to.replace(/[^0-9]/g, '');
    const chatId = `${sanitizedNumber}@c.us`;

    // Check if the number is registered
    const isRegistered = await this.client.isRegisteredUser(chatId);
    if (!isRegistered) {
      this.logger.warn(`Number ${chatId} is not registered on WhatsApp`);
      // We might want to throw or return, but whatsapp-web.js sometimes says not registered falsely?
      // But usually it's correct. Let's proceed but warn, or just try sending.
      // Actually, safest is to try sending.
    }

    try {
      if (file) {
        const media = new MessageMedia(
          file.mimetype,
          file.buffer.toString('base64'),
          file.originalname,
        );
        return await this.client.sendMessage(chatId, media, { caption: message });
      } else {
        return await this.client.sendMessage(chatId, message);
      }
    } catch (error) {
      this.logger.error('Error sending message', error);
      throw error;
    }
  }
}
