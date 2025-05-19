import { Body, Controller, Get, HttpCode, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { Public } from './auth/decorator/customize';
import { ApiBody, ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @HttpCode(200)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Hello, world!' },
        userId: { type: 'number', example: 123 },
      },
    },
  })
  testApi(@Req() req: Request, @Body() body: any, @Res() res: Response): any {
    res.redirect('exp://ymkqysy-anonymous-8081.exp.direct/--/auth?code=Test');
  }
}
