import {
    Controller,
    Post,
    Body,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WhatsappService } from './whatsapp.service';

class SendMessageDto {
    number: string;
    message: string;
}

@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

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
