import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?authSource=admin&ssl=false`;
        mongoose.connection.once('open', () => {
          console.log('✅ Successfully connected to MongoDB:', process.env.DATABASE_NAME);
        });
        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err);
        });

        return { uri };
      },
    }),
  ],
})
export class DatabaseModule {}
