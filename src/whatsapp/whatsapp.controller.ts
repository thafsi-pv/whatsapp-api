import {
    Controller,
    Post,
    Get,
    Body,
    UseInterceptors,
    UploadedFile,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as qrcode from 'qrcode';
import { WhatsappService } from './whatsapp.service';

class SendMessageDto {
    number: string;
    message: string;
}

@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    @Get('qr')
    async getQr(@Res() res: Response) {
        const qr = this.whatsappService.getQr();
        if (!qr) {
            return res.status(404).send('QR code not found. Client might be ready or starting up.');
        }

        const buffer = await qrcode.toBuffer(qr);
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    }

    @Post('send')
    @UseInterceptors(FileInterceptor('attachment'))
    async sendMessage(
        @Body() body: SendMessageDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const { number, message } = body;
        return this.whatsappService.sendMessage(number, message, file);
    }
}
