import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { join } from 'path';
import { OtpVerificationService } from './opt-verifications.service';
import { OtpVerificationRepository } from './otp-verifications.repository';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpVerification, OtpVerificationSchema } from './otp-verifications.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OtpVerification.name, schema: OtpVerificationSchema }]),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '"OptiVerse" <noreply@optiverse.com>',
      },
      template: {
        dir: join(__dirname, '../../templates/'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
  ],
  providers: [OtpVerificationService, OtpVerificationRepository],
  exports: [OtpVerificationService],
})
export class OtpVerificationModule {}
